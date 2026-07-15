/**
 * Hybrid search: BM25 (text relevance) + synonym expansion (semantic layer).
 *
 * BM25 is the algorithm behind Elasticsearch/Lucene — proper TF-IDF with
 * document-length normalisation. No vector DB, no ML, no dependencies.
 *
 * Semantic layer: a curated life-tracking synonym map expands the query
 * before scoring, so "gym" finds "workout/exercise/yoga" etc.
 */

import { db } from '../db'

// ── BM25 hyperparameters ──────────────────────────────────────────────────────
const K1 = 1.5   // term frequency saturation (1.2–2.0 typical)
const B  = 0.75  // length normalisation (0 = off, 1 = full)

// ── Stop words ────────────────────────────────────────────────────────────────
const STOPWORDS = new Set([
  'the','a','an','and','or','but','in','on','at','to','for','of','with',
  'by','from','is','was','are','were','be','been','has','had','have','do',
  'did','my','i','me','it','its','this','that','so','up','out','as','into',
  'not','no','he','she','they','we','you','about','when','just','really',
  'very','quite','some','any','all','got','get','went','day','one','two',
])

// ── Synonym / concept map (the semantic layer) ────────────────────────────────
// A search for any key also searches all its values, and vice versa.
const CONCEPTS = {
  run:       ['running', 'ran', 'jog', 'jogging', 'sprint', 'sprinting'],
  walk:      ['walking', 'walked', 'stroll', 'hike', 'hiking'],
  gym:       ['workout', 'exercise', 'training', 'weights', 'fitness', 'yoga', 'swim', 'cycling'],
  workout:   ['gym', 'exercise', 'training', 'fitness', 'yoga', 'swim', 'cycling', 'weights'],
  sleep:     ['slept', 'sleeping', 'nap', 'rest', 'tired', 'insomnia', 'woke', 'awake', 'fatigue'],
  eat:       ['ate', 'eating', 'food', 'meal', 'breakfast', 'lunch', 'dinner', 'cook', 'cooked', 'diet'],
  happy:     ['joy', 'great', 'amazing', 'excited', 'positive', 'wonderful', 'fantastic', 'thrilled'],
  sad:       ['unhappy', 'down', 'low', 'depressed', 'blue', 'rough', 'struggle', 'struggling'],
  bad:       ['terrible', 'awful', 'rough', 'hard', 'difficult', 'sad', 'unhappy'],
  good:      ['great', 'amazing', 'wonderful', 'excellent', 'productive', 'positive'],
  stress:    ['stressed', 'anxious', 'anxiety', 'overwhelmed', 'pressure', 'tense', 'worried'],
  calm:      ['peaceful', 'relaxed', 'mindful', 'meditation', 'meditate', 'serene', 'quiet'],
  meet:      ['met', 'meeting', 'catch', 'hangout', 'hang', 'visit', 'visited', 'saw'],
  friend:    ['friends', 'buddy', 'mate', 'pal', 'colleague', 'colleagues'],
  family:    ['mom', 'dad', 'mother', 'father', 'sister', 'brother', 'parent', 'parents', 'sibling'],
  work:      ['job', 'office', 'project', 'deadline', 'professional', 'career', 'client'],
  sick:      ['ill', 'unwell', 'pain', 'hurt', 'ache', 'headache', 'fever', 'cold', 'flu', 'nausea'],
  doctor:    ['hospital', 'clinic', 'medical', 'checkup', 'medicine', 'treatment'],
  travel:    ['trip', 'flight', 'flew', 'fly', 'journey', 'vacation', 'holiday', 'tour', 'explore'],
  read:      ['reading', 'book', 'books', 'novel', 'article', 'study', 'studying', 'learn', 'learning'],
  money:     ['finance', 'financial', 'budget', 'spend', 'spent', 'invest', 'savings', 'salary'],
  event:     ['special', 'memorable', 'milestone', 'birthday', 'anniversary', 'celebration', 'party'],
  productive:['focused', 'accomplished', 'efficient', 'completed', 'finished', 'achieved'],
  music:     ['guitar', 'piano', 'drums', 'sing', 'singing', 'song', 'practice', 'instrument'],
  creative:  ['draw', 'drawing', 'paint', 'painting', 'write', 'writing', 'art', 'design', 'craft'],
}

// Build reverse map so "running" → "run" → all run variants
const REVERSE = {}
for (const [canonical, variants] of Object.entries(CONCEPTS)) {
  for (const v of variants) {
    if (!REVERSE[v]) REVERSE[v] = []
    if (!REVERSE[v].includes(canonical)) REVERSE[v].push(canonical)
  }
}

// ── Text helpers ──────────────────────────────────────────────────────────────

function tokenize(text) {
  if (!text) return []
  return text.toLowerCase()
    .replace(/['".,!?;:()\[\]{}/\\@#$%^&*+=|<>~`]/g, ' ')
    .split(/\s+/)
    .map(w => w.trim())
    .filter(w => w.length > 2 && !STOPWORDS.has(w))
}

// Light suffix stripping — handles the most common English inflections
function stem(w) {
  if (w.length < 5) return w
  return w
    .replace(/ings?$/, '').replace(/tions?$/, 't').replace(/ness$/, '')
    .replace(/ments?$/, '').replace(/ful$/, '').replace(/less$/, '')
    .replace(/ers?$/, '').replace(/eds?$/, '').replace(/ly$/, '')
    .replace(/ies$/, 'y').replace(/s$/, '')
}

// Expand a query token set with synonyms + stemmed forms
function expandQuery(tokens) {
  const set = new Set(tokens)
  tokens.forEach(t => {
    set.add(stem(t))
    const expand = (key) => {
      if (CONCEPTS[key]) CONCEPTS[key].forEach(v => set.add(v))
      if (REVERSE[key])  REVERSE[key].forEach(c => { set.add(c); if (CONCEPTS[c]) CONCEPTS[c].forEach(v => set.add(v)) })
    }
    expand(t)
    expand(stem(t))
  })
  return [...set]
}

// ── Document builder ──────────────────────────────────────────────────────────
// Field weights are expressed as repetition count in the token bag.
// voiceNote × 3, reflections × 2, life events × 3, tasks × 2, habits × 1.
// BM25's IDF will still penalise terms that appear in many documents.

const REPEAT = { voice: 3, reflect: 2, lifeEvent: 3, task: 2, habit: 1 }

function buildTokenBag(day, tasks, habits) {
  const bag = []
  const add = (text, n) => { if (!text?.trim()) return; const t = tokenize(text); for (let i = 0; i < n; i++) bag.push(...t) }
  add(day.voiceNote,     REPEAT.voice)
  add(day.wentWell,      REPEAT.reflect)
  add(day.couldBeBetter, REPEAT.reflect)
  add(day.lifeEventNote, REPEAT.lifeEvent)
  tasks.forEach(t  => add(t.title, REPEAT.task))
  habits.forEach(h => add(h,       REPEAT.habit))
  return bag
}

// ── BM25 index ────────────────────────────────────────────────────────────────

function buildIndex(docs) {
  const N  = docs.length
  const df = {}              // document frequency per term
  const tfs = docs.map(doc => {
    const freq = {}
    for (const t of doc.bag) freq[t] = (freq[t] ?? 0) + 1
    for (const t of Object.keys(freq)) df[t] = (df[t] ?? 0) + 1
    return freq
  })
  const lengths = docs.map(d => d.bag.length)
  const avgdl   = lengths.reduce((s, l) => s + l, 0) / Math.max(N, 1)

  // Robertson–Spärck Jones IDF: log((N − n + 0.5)/(n + 0.5) + 1)
  const idf = {}
  for (const [term, n] of Object.entries(df)) {
    idf[term] = Math.log((N - n + 0.5) / (n + 0.5) + 1)
  }

  return { tfs, idf, lengths, avgdl }
}

function bm25(docIdx, queryTerms, index) {
  const { tfs, idf, lengths, avgdl } = index
  const tf  = tfs[docIdx]
  const len = lengths[docIdx]
  let score = 0
  for (const term of queryTerms) {
    const termIdf = idf[term]
    if (!termIdf) continue
    const termTf = tf[term] ?? 0
    if (!termTf)  continue
    score += termIdf * (termTf * (K1 + 1)) / (termTf + K1 * (1 - B + B * len / avgdl))
  }
  return score
}

// ── Snippet extraction ────────────────────────────────────────────────────────

function snippet(text, queryTokens) {
  if (!text) return ''
  const lower = text.toLowerCase()
  let pos = -1
  for (const t of queryTokens) {
    pos = lower.indexOf(t)
    if (pos !== -1) break
  }
  if (pos === -1) return text.slice(0, 100) + (text.length > 100 ? '…' : '')
  const s = Math.max(0, pos - 25)
  const e = Math.min(text.length, pos + 90)
  return (s > 0 ? '…' : '') + text.slice(s, e) + (e < text.length ? '…' : '')
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function searchDays(query) {
  if (!query.trim()) return []
  const tokens = tokenize(query)
  if (!tokens.length) return []
  const queryTerms = expandQuery(tokens)

  // Load everything in one round-trip
  const [allDays, allTodos, habitRow, habitLogs] = await Promise.all([
    db.days.toArray(),
    db.todos.where('type').equals('task').toArray(),
    db.settings.get('habits'),
    db.habitLogs.toArray(),
  ])

  const habitById = Object.fromEntries((habitRow?.value ?? []).map(h => [h.id, h.name]))

  // Group tasks and habits by date
  const tasksByDate = {}
  for (const t of allTodos) {
    const push = (d) => { if (!d) return; (tasksByDate[d] = tasksByDate[d] ?? []).push(t) }
    push(t.createdDate)
    if (t.done && t.completedDate && t.completedDate !== t.createdDate) push(t.completedDate)
  }
  const habitsByDate = {}
  for (const log of habitLogs) {
    const name = habitById[log.habitId]
    if (name) (habitsByDate[log.date] = habitsByDate[log.date] ?? []).push(name)
  }

  // Collect all dates that have any content
  const dates = [...new Set([
    ...allDays.map(d => d.date),
    ...Object.keys(tasksByDate),
    ...Object.keys(habitsByDate),
  ])]
  const dayMap = Object.fromEntries(allDays.map(d => [d.date, d]))

  // Build one document per date
  const docs = dates.map(date => {
    const day    = dayMap[date] ?? {}
    const tasks  = tasksByDate[date]  ?? []
    const habits = habitsByDate[date] ?? []
    return {
      date,
      bag:        buildTokenBag(day, tasks, habits),
      raw:        { voiceNote: day.voiceNote, wentWell: day.wentWell, couldBeBetter: day.couldBeBetter, lifeEventNote: day.lifeEventNote },
      tasks:      tasks.map(t => t.title),
      habits,
      isLifeEvent: !!day.lifeEvent,
      color:      day.color ?? null,
    }
  }).filter(d => d.bag.length > 0)

  if (!docs.length) return []

  const index = buildIndex(docs)

  // Score every document
  const isEventQuery = queryTerms.some(t =>
    ['event','special','memorable','milestone','birthday','anniversary','celebration','party'].includes(t)
  )

  const results = docs
    .map((doc, i) => {
      let score = bm25(i, queryTerms, index)
      if (score === 0) return null
      // Bonus for life-event days when the query is event-oriented
      if (doc.isLifeEvent && isEventQuery) score += 5
      return { doc, score }
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score || b.doc.date.localeCompare(a.doc.date))
    .slice(0, 25)

  return results.map(({ doc, score }) => {
    // Best snippet: pick the raw field with the most query tokens present
    const fields = [
      doc.raw.voiceNote, doc.raw.wentWell,
      doc.raw.couldBeBetter, doc.raw.lifeEventNote,
    ].filter(Boolean)

    const best = fields.sort((a, b) => {
      const al = a.toLowerCase(), bl = b.toLowerCase()
      return tokens.filter(t => bl.includes(t)).length - tokens.filter(t => al.includes(t)).length
    })[0]

    const snip = best
      ? snippet(best, tokens)
      : doc.tasks.find(t => tokens.some(q => t.toLowerCase().includes(q)))
          ? `Task: ${doc.tasks.find(t => tokens.some(q => t.toLowerCase().includes(q)))}`
          : doc.habits.length ? `Habit: ${doc.habits.slice(0, 3).join(', ')}` : ''

    return {
      date:        doc.date,
      score,
      snippet:     snip,
      isLifeEvent: doc.isLifeEvent,
      color:       doc.color,
    }
  })
}
