import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { motion, AnimatePresence } from 'framer-motion'
import { db, nextId, tasksForDate } from '../../db'
import { isFuture, todayStr } from '../../utils/dateUtils'

const PRIORITY = {
  Q1: { label: 'Urgent & Important', color: '#f87171', bg: '#f8717115', dot: '🔴' },
  Q2: { label: 'Important',          color: '#fbbf24', bg: '#fbbf2415', dot: '🟡' },
  Q3: { label: 'Urgent',             color: '#fb923c', bg: '#fb923c15', dot: '🟠' },
  Q4: { label: 'Low priority',       color: '#4ade80', bg: '#4ade8015', dot: '🟢' },
}

const URGENCY = {
  true:  { label: 'Urgent',     color: '#f87171', bg: '#f8717115' },
  false: { label: 'Not Urgent', color: '#4ade80', bg: '#4ade8015' },
}
const IMPORTANCE = {
  true:  { label: 'Important',     color: '#a78bfa', bg: '#a78bfa15' },
  false: { label: 'Not Important', color: '#555',    bg: '#55555515' },
}

const PILLAR_CONFIG = {
  physical: { label: 'Physical', icon: '💪', color: '#4ade80', bg: '#4ade8018' },
  mental:   { label: 'Mental',   icon: '🧠', color: '#60a5fa', bg: '#60a5fa18' },
  work:     { label: 'Work',     icon: '💼', color: '#a78bfa', bg: '#a78bfa18' },
}
const PILLARS = ['physical', 'mental', 'work']

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
  const [important, setImportant] = useState(true)
  const [pillar,    setPillar]    = useState('work')
  const [adding,    setAdding]    = useState(false)

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
      pillar,
      createdDate: date,
      dueDate:     dueDate || null,
      done:        false,
      tid:         id,
    })
    setInput('')
    setUrgent(false)
    setImportant(true)
    setPillar('work')
    setAdding(false)
  }

  async function toggleDone(id, done) {
    await db.todos.update(id, {
      done:          !done,
      completedDate: !done ? todayStr() : null,
    })
  }

  async function updateTask(id, patch) {
    await db.todos.update(id, patch)
  }

  async function deleteTask(id) {
    await db.todos.delete(id)
  }

  // Group all tasks by pillar; tasks without a pillar go to work
  const byPillar = {}
  for (const p of PILLARS) byPillar[p] = []
  for (const t of tasks) {
    const p = PILLARS.includes(t.pillar) ? t.pillar : 'work'
    byPillar[p].push(t)
  }

  const anyTasks = tasks.length > 0

  return (
    <div className="flex flex-col gap-3">
      {/* Per-pillar sections */}
      {PILLARS.map(p => {
        const cfg       = PILLAR_CONFIG[p]
        const all       = byPillar[p]
        const doneCount = all.filter(t => t.done).length
        const total     = all.length
        if (total === 0 && readOnly) return null
        if (total === 0) return null
        const pct       = total === 0 ? 0 : Math.round((doneCount / total) * 100)
        const complete  = total > 0 && doneCount === total
        const open      = all.filter(t => !t.done)
        const done      = all.filter(t => t.done)

        return (
          <div key={p} className="flex flex-col gap-1.5">
            {/* Pillar header + progress bar */}
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[10px] uppercase tracking-widest flex items-center gap-1.5"
                style={{ color: cfg.color }}>
                <span>{cfg.icon}</span>
                {cfg.label}
              </span>
              <span className="text-[10px] font-semibold tabular-nums"
                style={{ color: complete ? '#4ade80' : cfg.color }}>
                {doneCount}/{total}
              </span>
            </div>

            {/* Progress bar */}
            <div className="h-1 rounded-full overflow-hidden" style={{ background: '#1e1e1e' }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: complete ? '#4ade80' : cfg.color }}
                initial={false}
                animate={{ width: `${pct}%` }}
                transition={{ type: 'spring', stiffness: 200, damping: 28 }}
              />
            </div>

            {/* Open tasks */}
            <AnimatePresence initial={false}>
              {open.map(task => (
                <TaskRow key={task.id} task={task}
                  onToggle={readOnly ? null : toggleDone}
                  onUpdate={task.source === 'commitment' ? null : (readOnly ? null : updateTask)}
                  onDelete={task.source === 'commitment' ? null : (readOnly ? null : deleteTask)} />
              ))}
            </AnimatePresence>

            {/* Completed tasks (collapsible) */}
            {done.length > 0 && (
              <details className="group">
                <summary className="text-[10px] text-[#555] uppercase tracking-widest cursor-pointer select-none list-none flex items-center gap-1.5 py-1 min-h-[32px]">
                  <span className="group-open:rotate-90 transition-transform inline-block text-[8px]">▶</span>
                  {done.length} done
                </summary>
                <div className="mt-1 flex flex-col gap-1.5">
                  <AnimatePresence initial={false}>
                    {done.map(task => (
                      <TaskRow key={task.id} task={task}
                        onToggle={readOnly ? null : toggleDone}
                        onUpdate={task.source === 'commitment' ? null : (readOnly ? null : updateTask)}
                        onDelete={task.source === 'commitment' ? null : (readOnly ? null : deleteTask)}
                        faded />
                    ))}
                  </AnimatePresence>
                </div>
              </details>
            )}
          </div>
        )
      })}

      {!anyTasks && readOnly && (
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

                {/* Pillar picker */}
                <div className="flex gap-1.5">
                  {PILLARS.map(p => {
                    const cfg = PILLAR_CONFIG[p]
                    const active = pillar === p
                    return (
                      <button key={p} type="button" onClick={() => setPillar(p)}
                        className="flex-1 text-[11px] font-medium rounded-full py-1.5 transition-all active:scale-95 min-h-[32px] flex items-center justify-center gap-1"
                        style={{
                          color:      active ? cfg.color : '#444',
                          background: active ? cfg.bg    : 'transparent',
                          border:     `1px solid ${active ? cfg.color + '55' : '#2a2a2a'}`,
                        }}>
                        <span>{cfg.icon}</span>
                        <span>{cfg.label}</span>
                      </button>
                    )
                  })}
                </div>

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
function TaskRow({ task, onToggle, onUpdate, onDelete, faded }) {
  const [editing,   setEditing]   = useState(false)
  const [editTitle, setEditTitle] = useState(task.title)
  const [editUrg,   setEditUrg]   = useState(task.urgent    ?? false)
  const [editImp,   setEditImp]   = useState(task.important ?? false)

  const quadrant = task.quadrant ?? toQuadrant(task.urgent ?? false, task.important ?? false)
  const priority = PRIORITY[quadrant] ?? PRIORITY.Q4

  function startEdit() {
    setEditTitle(task.title)
    setEditUrg(task.urgent ?? false)
    setEditImp(task.important ?? false)
    setEditing(true)
  }

  async function saveEdit() {
    if (!editTitle.trim()) { setEditing(false); return }
    const newQ = toQuadrant(editUrg, editImp)
    await onUpdate(task.id, {
      title:     editTitle.trim(),
      urgent:    editUrg,
      important: editImp,
      quadrant:  newQ,
    })
    setEditing(false)
  }

  if (editing) {
    return (
      <motion.div
        layout
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-[#111] border border-[#a78bfa44] rounded-xl px-3 py-3 flex flex-col gap-2.5"
      >
        <input
          autoFocus
          value={editTitle}
          onChange={e => setEditTitle(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditing(false) }}
          className="bg-transparent text-[#f0f0f0] text-sm focus:outline-none w-full"
        />
        <div className="flex gap-2">
          <TagToggle active={editUrg} onColor={URGENCY.true.color} onBg={URGENCY.true.bg}
            offColor={URGENCY.false.color} offBg={URGENCY.false.bg}
            onLabel="Urgent" offLabel="Not Urgent" onToggle={() => setEditUrg(u => !u)} />
          <TagToggle active={editImp} onColor={IMPORTANCE.true.color} onBg={IMPORTANCE.true.bg}
            offColor={IMPORTANCE.false.color} offBg={IMPORTANCE.false.bg}
            onLabel="Important" offLabel="Not Important" onToggle={() => setEditImp(i => !i)} />
        </div>
        <div className="flex gap-2">
          <button onClick={saveEdit}
            className="flex-1 bg-[#a78bfa] text-[#0a0a0a] text-xs font-semibold rounded-lg py-2 min-h-[36px]">
            Save
          </button>
          <button onClick={() => setEditing(false)}
            className="px-4 border border-[#2a2a2a] rounded-lg text-[#555] text-xs min-h-[36px]">
            Cancel
          </button>
        </div>
      </motion.div>
    )
  }

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
        {task.source === 'commitment' && (
          <span className="text-[10px] text-[#444] mr-1.5 font-medium uppercase tracking-wider">commitment</span>
        )}
        {task.title}
      </span>

      {/* Priority badge */}
      <span
        className="text-[10px] font-semibold px-2.5 py-1 rounded-full shrink-0 whitespace-nowrap"
        style={{ color: priority.color, background: priority.bg, border: `1px solid ${priority.color}33` }}
      >
        {priority.label}
      </span>

      {/* Edit */}
      {onUpdate && !task.done && (
        <button
          onClick={startEdit}
          className="opacity-0 group-hover:opacity-100 text-[#2a2a2a] hover:text-[#a78bfa] transition-all w-6 h-6 flex items-center justify-center rounded shrink-0"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M8.5 1.5l2 2L4 10H2v-2L8.5 1.5z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}

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

/* ── Toggle pill ── */
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
