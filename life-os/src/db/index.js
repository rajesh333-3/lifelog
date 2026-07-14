import Dexie from 'dexie'

export const db = new Dexie('LifeOS')

// v3 → v4: habits system
// habits list stored in settings key 'habits': [{ id, name, emoji, pillar, active }]
// habitLogs: absence = not done; presence = done for that [date, habitId]
db.version(4).stores({
  days:      'date, weekId',
  weeks:     'weekId',
  todos:     '++id, quadrant, type, createdDate, completedDate, dueDate',
  hobbies:   '++id, priority',
  settings:  'key',
  chatLogs:  'date',
  habitLogs: '[date+habitId], date, habitId',
})

// v2 → v3: todos gain createdDate + completedDate indexes (date kept for compat)
db.version(3).stores({
  days:     'date, weekId',
  weeks:    'weekId',
  todos:    '++id, quadrant, type, createdDate, completedDate, dueDate',
  hobbies:  '++id, priority',
  settings: 'key',
  chatLogs: 'date',
}).upgrade(tx => {
  // Migrate old todos: copy date → createdDate if missing
  return tx.table('todos').toCollection().modify(t => {
    if (!t.createdDate && t.date) t.createdDate = t.date
  })
})

db.version(2).stores({
  days:     'date, weekId',
  weeks:    'weekId',
  todos:    '++id, quadrant, dueDate, type, date',
  hobbies:  '++id, priority',
  settings: 'key',
  chatLogs: 'date',
})

// todos row shape:
// { id, tid (T-001), type:'task',
//   title, quadrant:'Q1'|'Q2'|'Q3'|'Q4', urgent, important,
//   createdDate (YYYY-MM-DD — day it was created/assigned),
//   dueDate     (YYYY-MM-DD — optional deadline),
//   completedDate (YYYY-MM-DD — day it was marked done, null if open),
//   done (bool) }
//
// Visibility rule:  show on date D  iff  createdDate <= D  AND  (done===false OR completedDate===D)
// This gives free "propagate until closed" behaviour with no record duplication.

export async function getSetting(key) {
  const row = await db.settings.get(key)
  return row?.value ?? null
}

export async function setSetting(key, value) {
  await db.settings.put({ key, value })
}

export async function nextId(type) {
  const prefix = type === 'task' ? 'T' : type === 'hobby' ? 'H' : 'R'
  const all    = await db.todos.where('type').equals(type).toArray()
  const num    = String(all.length + 1).padStart(3, '0')
  return `${prefix}-${num}`
}

// Returns tasks visible on a given date (float-forward logic)
export async function tasksForDate(date) {
  const all = await db.todos.where('type').equals('task').toArray()
  return all.filter(t => {
    const created = t.createdDate ?? t.date   // backward compat
    if (!created || created > date) return false
    if (!t.done) return true
    return t.completedDate === date            // show completion on the day it was closed
  })
}

// Returns all open non-commitment tasks (for Eisenhower board)
export async function openTasks() {
  return db.todos.where('type').equals('task')
    .filter(t => !t.done && t.source !== 'commitment').toArray()
}

let _seeding = false

// Seeds commitment tasks from pillars. Idempotent — skips titles that already exist.
// Lock prevents concurrent calls (e.g. App.jsx effect + Onboarding.finish racing).
export async function seedCommitmentTasks(pillars) {
  if (_seeding || !pillars) return
  _seeding = true
  try {
    // First clean up any duplicates created by a prior race
    await deduplicateCommitments()

    const today = new Date().toISOString().split('T')[0]
    const existing = await db.todos.where('type').equals('task')
      .filter(t => t.source === 'commitment').toArray()
    const existingTitles = new Set(existing.map(t => t.title.trim()))

    for (const [pillar, goals] of Object.entries(pillars)) {
      for (const goal of (goals ?? [])) {
        if (!goal?.trim() || existingTitles.has(goal.trim())) continue
        const all = await db.todos.where('type').equals('task').toArray()
        const num = String(all.length + 1).padStart(3, '0')
        await db.todos.add({
          type:        'task',
          title:       goal.trim(),
          quadrant:    'Q2',
          urgent:      false,
          important:   true,
          createdDate: today,
          dueDate:     null,
          done:        false,
          tid:         `T-${num}`,
          source:      'commitment',
          pillar,
        })
        existingTitles.add(goal.trim())
      }
    }
  } finally {
    _seeding = false
  }
}

// Removes duplicate commitment tasks (same title), keeping the oldest entry.
async function deduplicateCommitments() {
  const all = await db.todos.where('type').equals('task')
    .filter(t => t.source === 'commitment').toArray()
  const seen = new Map()
  for (const t of all) {
    const key = t.title.trim()
    if (seen.has(key)) {
      await db.todos.delete(t.id)
    } else {
      seen.set(key, t.id)
    }
  }
}

// ── Habit helpers ──────────────────────────────────────────────────────────

export async function getHabits() {
  const row = await db.settings.get('habits')
  return row?.value ?? []
}

export async function saveHabits(habits) {
  await db.settings.put({ key: 'habits', value: habits })
}

// Returns Set of habitIds that are done on a given date
export async function habitsDoneOnDate(date) {
  const logs = await db.habitLogs.where('date').equals(date).toArray()
  return new Set(logs.map(l => l.habitId))
}

export async function setHabitDone(date, habitId, done) {
  if (done) {
    await db.habitLogs.put({ date, habitId })
  } else {
    await db.habitLogs.delete([date, habitId])
  }
}
