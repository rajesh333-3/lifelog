import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { motion, AnimatePresence } from 'framer-motion'
import { db, nextId, tasksForDate } from '../../db'
import { isFuture, todayStr } from '../../utils/dateUtils'

// Single combined priority badge — red (most critical) → green (least critical)
const PRIORITY = {
  Q1: { label: 'Urgent & Important', color: '#f87171', bg: '#f8717115', dot: '🔴' },
  Q2: { label: 'Important',          color: '#fbbf24', bg: '#fbbf2415', dot: '🟡' },
  Q3: { label: 'Urgent',             color: '#fb923c', bg: '#fb923c15', dot: '🟠' },
  Q4: { label: 'Low priority',       color: '#4ade80', bg: '#4ade8015', dot: '🟢' },
}

// For the add-form toggles (input axis labels)
const URGENCY = {
  true:  { label: 'Urgent',     color: '#f87171', bg: '#f8717115' },
  false: { label: 'Not Urgent', color: '#4ade80', bg: '#4ade8015' },
}
const IMPORTANCE = {
  true:  { label: 'Important',     color: '#a78bfa', bg: '#a78bfa15' },
  false: { label: 'Not Important', color: '#555',    bg: '#55555515' },
}

function toQuadrant(urgent, important) {
  if (urgent  && important)  return 'Q1'
  if (!urgent && important)  return 'Q2'
  if (urgent  && !important) return 'Q3'
  return 'Q4'
}

export function TaskSection({ date, futureOnly, readOnly }) {
  const [input,     setInput]     = useState('')
  const [dueDate,   setDueDate]   = useState(date)
  const [urgent,    setUrgent]    = useState(false)
  const [important, setImportant] = useState(false)
  const [adding,    setAdding]    = useState(false)

  // Float-forward: show tasks created on/before this date that are still open,
  // plus anything completed on exactly this date (for history)
  const tasks = useLiveQuery(() => tasksForDate(date), [date]) ?? []

  async function addTask() {
    if (!input.trim()) return
    const id = await nextId('task')
    await db.todos.add({
      type:        'task',
      title:       input.trim(),
      quadrant:    toQuadrant(urgent, important),
      urgent,
      important,
      createdDate: date,
      dueDate:     dueDate || null,
      done:        false,
      tid:         id,
    })
    setInput('')
    setUrgent(false)
    setImportant(false)
    setAdding(false)
  }

  async function toggleDone(id, done) {
    // Mark done: stamp completedDate so it stays visible on the day it was closed
    await db.todos.update(id, {
      done:          !done,
      completedDate: !done ? todayStr() : null,
    })
  }

  async function deleteTask(id) {
    await db.todos.delete(id)
  }

  const open = tasks.filter(t => !t.done)
  const done = tasks.filter(t => t.done)

  return (
    <div className="flex flex-col gap-2">
      {/* Open tasks */}
      <AnimatePresence initial={false}>
        {open.map(task => (
          <TaskRow key={task.id} task={task}
            onToggle={readOnly ? null : toggleDone}
            onDelete={readOnly ? null : deleteTask} />
        ))}
      </AnimatePresence>

      {/* Completed tasks */}
      {done.length > 0 && (
        <details className="group">
          <summary className="text-[10px] text-[#555] uppercase tracking-widest cursor-pointer select-none list-none flex items-center gap-1.5 py-1 min-h-[36px]">
            <span className="group-open:rotate-90 transition-transform inline-block text-[8px]">▶</span>
            {done.length} completed
          </summary>
          <div className="mt-1 flex flex-col gap-1.5">
            {done.map(task => (
              <TaskRow key={task.id} task={task}
                onToggle={readOnly ? null : toggleDone}
                onDelete={readOnly ? null : deleteTask}
                faded />
            ))}
          </div>
        </details>
      )}

      {tasks.length === 0 && readOnly && (
        <p className="text-[#555] text-sm py-1">No tasks logged.</p>
      )}

      {/* Add task form */}
      {!readOnly && (
        <AnimatePresence>
          {adding ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-[#111] border border-[#1e1e1e] rounded-xl overflow-hidden"
            >
              <div className="p-3 flex flex-col gap-3">
                {/* Text input */}
                <input
                  autoFocus
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addTask()}
                  placeholder="What needs to be done?"
                  className="bg-transparent text-[#f0f0f0] text-sm placeholder:text-[#333] focus:outline-none w-full"
                />

                {/* Urgency × Importance toggles */}
                <div className="flex gap-2">
                  <TagToggle
                    active={urgent}
                    onColor={URGENCY.true.color}
                    onBg={URGENCY.true.bg}
                    offColor={URGENCY.false.color}
                    offBg={URGENCY.false.bg}
                    onLabel="Urgent"
                    offLabel="Not Urgent"
                    onToggle={() => setUrgent(u => !u)}
                  />
                  <TagToggle
                    active={important}
                    onColor={IMPORTANCE.true.color}
                    onBg={IMPORTANCE.true.bg}
                    offColor={IMPORTANCE.false.color}
                    offBg={IMPORTANCE.false.bg}
                    onLabel="Important"
                    offLabel="Not Important"
                    onToggle={() => setImportant(i => !i)}
                  />
                </div>

                {/* Due date (future days only) */}
                {isFuture(date) && (
                  <div className="flex items-center gap-2">
                    <span className="text-[#444] text-xs shrink-0">Due date</span>
                    <input
                      type="date"
                      value={dueDate}
                      min={date}
                      onChange={e => setDueDate(e.target.value)}
                      className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-2 py-1 text-xs text-[#888] focus:outline-none [color-scheme:dark]"
                    />
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={addTask}
                    disabled={!input.trim()}
                    className="flex-1 bg-[#a78bfa] text-[#0a0a0a] text-xs font-semibold rounded-lg py-2.5 disabled:opacity-30 active:opacity-80 min-h-[40px]"
                  >Add task</button>
                  <button
                    onClick={() => { setAdding(false); setInput('') }}
                    className="px-4 border border-[#2a2a2a] rounded-lg text-[#555] text-xs min-h-[40px] active:opacity-70"
                  >Cancel</button>
                </div>
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
      )}
    </div>
  )
}

/* ── Task row ── */
function TaskRow({ task, onToggle, onDelete, faded }) {
  const quadrant = task.quadrant ?? toQuadrant(
    task.urgent    ?? false,
    task.important ?? false,
  )
  const priority = PRIORITY[quadrant] ?? PRIORITY.Q4
  const checkColor = task.done ? '#4ade80' : priority.color

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: faded ? 0.35 : 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.18 }}
      className="flex items-center gap-3 bg-[#111] border border-[#1e1e1e] rounded-xl px-3 py-3 group"
      style={{ borderLeftColor: priority.color, borderLeftWidth: 2 }}
    >
      {/* Checkbox */}
      {onToggle ? (
        <button
          onClick={() => onToggle(task.id, task.done)}
          className="w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all active:scale-90"
          style={{ borderColor: task.done ? '#4ade80' : priority.color + '66', background: task.done ? '#4ade8022' : 'transparent' }}
        >
          {task.done && (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M2 5l2 2 4-4" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          )}
        </button>
      ) : (
        <div className="w-5 h-5 rounded-full border shrink-0 flex items-center justify-center"
          style={{ borderColor: task.done ? '#4ade80' : '#2a2a2a' }}>
          {task.done && (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M2 5l2 2 4-4" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          )}
        </div>
      )}

      {/* Title */}
      <span className={`flex-1 text-sm leading-snug ${task.done ? 'line-through text-[#333]' : 'text-[#e0e0e0]'}`}>
        {task.title}
      </span>

      {/* Single combined priority badge */}
      <span
        className="text-[10px] font-semibold px-2.5 py-1 rounded-full shrink-0 whitespace-nowrap"
        style={{ color: priority.color, background: priority.bg, border: `1px solid ${priority.color}33` }}
      >
        {priority.label}
      </span>

      {/* Delete */}
      {onDelete && (
        <button
          onClick={() => onDelete(task.id)}
          className="opacity-0 group-hover:opacity-100 text-[#2a2a2a] hover:text-[#f87171] transition-all w-6 h-6 flex items-center justify-center rounded shrink-0 text-lg leading-none"
        >×</button>
      )}
    </motion.div>
  )
}

/* ── Toggle pill for urgency / importance ── */
function TagToggle({ active, onColor, onBg, offColor, offBg, onLabel, offLabel, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex-1 text-[11px] font-medium rounded-full py-2 transition-all active:scale-95 min-h-[36px]"
      style={{
        color:      active ? onColor  : offColor,
        background: active ? onBg    : offBg,
        border:     `1px solid ${active ? onColor + '44' : offColor + '22'}`,
      }}
    >
      {active ? onLabel : offLabel}
    </button>
  )
}
