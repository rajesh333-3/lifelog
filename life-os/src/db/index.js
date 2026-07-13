import Dexie from 'dexie'

export const db = new Dexie('LifeOS')

db.version(2).stores({
  days:     'date, weekId',
  weeks:    'weekId',
  todos:    '++id, quadrant, dueDate, type, date',   // type: 'task'|'hobby'|'reminder'
  hobbies:  '++id, priority',                         // global hobby definitions
  settings: 'key',
  chatLogs: 'date',
})

// days row shape:
// { date, weekId, physical, mental, work (0–100),
//   physicalNote, mentalNote, workNote,
//   physicalSummary, mentalSummary, workSummary,
//   wentWell, couldBeBetter, tags[], aiNote,
//   checklistState {goalId: bool}, overallScore, color,
//   taskIds[], hobbyLogs: [{ hobbyId, minutes, note }] }

// todos row shape (tasks):
// { id, type:'task', title, quadrant:'Q1'|'Q2'|'Q3'|'Q4', urgency, importance,
//   date (YYYY-MM-DD, the day it belongs to), dueDate, done, aiReason }

// hobbies row shape:
// { id, name, description, color, priority (0=top), icon }

// settings rows (singleton by key):
// { key:'profile',   value: { name, dob, lifeExpectancy, timezone } }
// { key:'pillars',   value: { physical:[], mental:[], work:[] } }
// { key:'llm',       value: { provider:'ollama'|'gemini', apiKey, ollamaUrl } }
// { key:'reminders', value: { morning:'07:30', midday:'13:00', evening:'21:00' } }

export async function getSetting(key) {
  const row = await db.settings.get(key)
  return row?.value ?? null
}

export async function setSetting(key, value) {
  await db.settings.put({ key, value })
}

// Generates a prefixed human-readable ID like T-001, H-004
export async function nextId(type) {
  const prefix = type === 'task' ? 'T' : type === 'hobby' ? 'H' : 'R'
  const all    = await db.todos.where('type').equals(type).toArray()
  const num    = String(all.length + 1).padStart(3, '0')
  return `${prefix}-${num}`
}
