import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { motion, AnimatePresence } from 'framer-motion'
import { db, nextId } from '../../db'
import { isFuture } from '../../utils/dateUtils'

const QUADRANT_META = {
  Q1: { label: 'Urgent & Important',     color: '#f87171', short: 'Q1' },
  Q2: { label: 'Important, Not Urgent',  color: '#4ade80', short: 'Q2' },
  Q3: { label: 'Urgent, Not Important',  color: '#fbbf24', short: 'Q3' },
  Q4: { label: 'Neither',               color: '#555',    short: 'Q4' },
}

export function TaskSection({ date, futureOnly }) {
  const [input,    setInput]    = useState('')
  const [dueDate,  setDueDate]  = useState(date)
  const [adding,   setAdding]   = useState(false)
  const [classifying, setClassifying] = useState(false)

  const tasks = useLiveQuery(
    () => db.todos.where('date').equals(date).toArray(),
    [date]
  ) ?? []

  async function addTask() {
    if (!input.trim()) return
    setClassifying(true)
    // Placeholder classification — replaced by AI in Phase 3
    const quadrant = guessQuadrant(input)
    const id       = await nextId('task')
    await db.todos.add({
      type:       'task',
      title:      input.trim(),
      quadrant,
      date,
      dueDate:    dueDate || date,
      done:       false,
      aiReason:   'AI classification coming in Phase 3',
      tid:        id,
    })
    setInput('')
    setAdding(false)
    setClassifying(false)
  }

  async function toggleDone(id, done) {
    await db.todos.update(id, { done: !done })
  }

  async function deleteTask(id) {
    await db.todos.delete(id)
  }

  const open = tasks.filter(t => !t.done)
  const done = tasks.filter(t => t.done)

  return (
    <div className="flex flex-col gap-2">
      {/* Task list */}
      <AnimatePresence initial={false}>
        {open.map(task => (
          <TaskRow key={task.id} task={task} onToggle={toggleDone} onDelete={deleteTask} />
        ))}
      </AnimatePresence>

      {done.length > 0 && (
        <details className="group">
          <summary className="text-[10px] text-[#333] uppercase tracking-widest cursor-pointer select-none list-none flex items-center gap-1.5 py-1">
            <span className="group-open:rotate-90 transition-transform inline-block">▶</span>
            {done.length} completed
          </summary>
          <div className="mt-1 flex flex-col gap-1.5">
            {done.map(task => (
              <TaskRow key={task.id} task={task} onToggle={toggleDone} onDelete={deleteTask} faded />
            ))}
          </div>
        </details>
      )}

      {/* Add task */}
      <AnimatePresence>
        {adding ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-[#111] border border-[#1e1e1e] rounded-xl p-3 flex flex-col gap-2.5 overflow-hidden"
          >
            <input
              autoFocus
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addTask()}
              placeholder="What needs to be done?"
              className="bg-transparent text-[#f0f0f0] text-sm placeholder:text-[#2a2a2a] focus:outline-none"
            />
            {isFuture(date) && (
              <div className="flex items-center gap-2">
                <span className="text-[#444] text-xs">Due</span>
                <input
                  type="date"
                  value={dueDate}
                  min={date}
                  onChange={e => setDueDate(e.target.value)}
                  className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-2 py-1 text-xs text-[#888] focus:outline-none [color-scheme:dark]"
                />
              </div>
            )}
            <div className="flex gap-2 pt-0.5">
              <button
                onClick={addTask}
                disabled={!input.trim() || classifying}
                className="flex-1 bg-[#a78bfa] text-[#0a0a0a] text-xs font-semibold rounded-lg py-2.5 disabled:opacity-30 active:opacity-80 min-h-[40px]"
              >{classifying ? 'Classifying…' : 'Add task'}</button>
              <button
                onClick={() => { setAdding(false); setInput('') }}
                className="px-4 border border-[#2a2a2a] rounded-lg text-[#555] text-xs min-h-[40px]"
              >Cancel</button>
            </div>
          </motion.div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-2 text-[#444] text-sm py-2 active:text-[#a78bfa] transition-colors min-h-[40px]"
          >
            <span className="text-lg leading-none">+</span>
            <span>Add task</span>
          </button>
        )}
      </AnimatePresence>
    </div>
  )
}

function TaskRow({ task, onToggle, onDelete, faded }) {
  const q = QUADRANT_META[task.quadrant] ?? QUADRANT_META.Q4
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: faded ? 0.4 : 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.18 }}
      className="flex items-center gap-3 bg-[#111] border border-[#1e1e1e] rounded-xl px-3 py-3 group"
    >
      {/* Checkbox */}
      <button
        onClick={() => onToggle(task.id, task.done)}
        className="w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all active:scale-90"
        style={{ borderColor: task.done ? q.color : '#2a2a2a', background: task.done ? `${q.color}22` : 'transparent' }}
      >
        {task.done && (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M2 5l2 2 4-4" stroke={q.color} strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        )}
      </button>

      {/* Title */}
      <span className={`flex-1 text-sm leading-snug ${task.done ? 'line-through text-[#333]' : 'text-[#e0e0e0]'}`}>
        {task.title}
      </span>

      {/* Quadrant badge */}
      <span
        className="text-[9px] font-bold px-1.5 py-0.5 rounded-md shrink-0"
        style={{ color: q.color, background: `${q.color}18` }}
      >{q.short}</span>

      {/* Delete */}
      <button
        onClick={() => onDelete(task.id)}
        className="opacity-0 group-hover:opacity-100 text-[#333] hover:text-[#f87171] transition-all w-6 h-6 flex items-center justify-center rounded"
      >×</button>
    </motion.div>
  )
}

// Heuristic pre-classification until AI is wired in Phase 3
function guessQuadrant(text) {
  const t = text.toLowerCase()
  const urgentWords    = ['urgent', 'asap', 'today', 'now', 'deadline', 'due', 'fix', 'critical', 'emergency']
  const importantWords = ['important', 'goal', 'strategy', 'plan', 'learn', 'build', 'create', 'health', 'exercise']
  const isUrgent    = urgentWords.some(w => t.includes(w))
  const isImportant = importantWords.some(w => t.includes(w))
  if (isUrgent && isImportant) return 'Q1'
  if (!isUrgent && isImportant) return 'Q2'
  if (isUrgent && !isImportant) return 'Q3'
  return 'Q4'
}
