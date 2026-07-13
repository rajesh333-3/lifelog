import Dexie from 'dexie'

export const db = new Dexie('LifeOS')

db.version(1).stores({
  days:     'date, weekId',
  weeks:    'weekId',
  todos:    '++id, quadrant, dueDate',
  settings: 'key',
  chatLogs: 'date',
})

// days row shape:
// { date (YYYY-MM-DD), weekId (YYYY-WW),
//   physical, mental, work (0-100),
//   physicalNote, mentalNote, workNote,
//   physicalSummary, mentalSummary, workSummary,
//   wentWell, couldBeBetter, tags[], aiNote,
//   checklistState {goalId: bool}, overallScore, color }

// weeks row shape:
// { weekId, color, intention, isMilestone, milestoneNote, finalised }

// settings rows (singleton by key):
// { key:'profile',   value: { name, dob, lifeExpectancy, timezone } }
// { key:'pillars',   value: { physical:[...goals], mental:[...goals], work:[...goals] } }
// { key:'llm',       value: { provider:'ollama'|'gemini', apiKey, ollamaUrl } }
// { key:'reminders', value: { morning:'07:30', midday:'13:00', evening:'21:00' } }

export async function getSetting(key) {
  const row = await db.settings.get(key)
  return row?.value ?? null
}

export async function setSetting(key, value) {
  await db.settings.put({ key, value })
}
