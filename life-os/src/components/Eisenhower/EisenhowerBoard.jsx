import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { db, nextId, openTasks } from '../../db'
import { todayStr } from '../../utils/dateUtils'

const QUADRANTS = [
  {
    id:       'Q1',
    label:    'Urgent & Important',
    sublabel: 'Do now',
    color:    '#f87171',
    bg:       '#f8717110',
    bgHover:  '#f8717122',
    border:   '#f8717130',
    borderHover: '#f8717155',
  },
  {
    id:       'Q2',
    label:    'Important',
    sublabel: 'Schedule it',
    color:    '#fbbf24',
    bg:       '#fbbf2410',
    bgHover:  '#fbbf2422',
    border:   '#fbbf2430',
    borderHover: '#fbbf2455',
  },
  {
    id:       'Q3',
    label:    'Urgent',
    sublabel: 'Delegate',
    color:    '#fb923c',
    bg:       '#fb923c10',
    bgHover:  '#fb923c22',
    border:   '#fb923c30',
    borderHover: '#fb923c55',
  },
  {
    id:       'Q4',
    label:    'Low priority',
    sublabel: 'Do later',
    color:    '#4ade80',
    bg:       '#4ade8010',
    bgHover:  '#4ade8022',
    border:   '#4ade8030',
    borderHover: '#4ade8055',
  },
]

function toQuadrant(urgent, important) {
  if (urgent  && important)  return 'Q1'
  if (!urgent && important)  return 'Q2'
  if (urgent  && !important) return 'Q3'
  return 'Q4'
}

function flagsFromQuadrant(qId) {
  return {
    urgent:    qId === 'Q1' || qId === 'Q3',
    important: qId === 'Q1' || qId === 'Q2',
  }
}

export function EisenhowerBoard() {
  const tasks = useLiveQuery(() => openTasks(), []) ?? []
  const [activeTask, setActiveTask] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor,   { activationConstraint: { delay: 250, tolerance: 5 } }),
  )

  const byQ = {}
  QUADRANTS.forEach(q => { byQ[q.id] = [] })
  tasks.forEach(t => { if (byQ[t.quadrant]) byQ[t.quadrant].push(t) })

  const totalOpen = tasks.length

  function handleDragStart({ active }) {
    setActiveTask(tasks.find(t => t.id === active.id) ?? null)
  }

  function handleDragEnd({ active, over }) {
    setActiveTask(null)
    if (!over) return
    const newQ = over.id
    if (!QUADRANTS.find(q => q.id === newQ)) return
    const task = tasks.find(t => t.id === active.id)
    if (!task || task.quadrant === newQ) return
    db.todos.update(task.id, { quadrant: newQ, ...flagsFromQuadrant(newQ) })
  }

  const activeQ = activeTask ? QUADRANTS.find(q => q.id === activeTask.quadrant) : null

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="h-full flex flex-col bg-[#0a0a0a]">
        {/* Header */}
        <div className="px-4 py-3 border-b border-[#1a1a1a] shrink-0 flex items-center justify-between">
          <div>
            <h1 className="text-[#f0f0f0] text-sm font-medium">Tasks</h1>
            <p className="text-[#666] text-xs mt-0.5">
              {totalOpen === 0 ? 'All clear' : `${totalOpen} open · propagates daily until closed`}
            </p>
          </div>
          <AddTaskButton />
        </div>

        {/* Quadrant grid */}
        <div className="flex-1 overflow-y-auto no-scrollbar">
          <div className="grid grid-cols-2 gap-2 p-3 pb-6">
            {QUADRANTS.map(q => (
              <QuadrantColumn
                key={q.id}
                quadrant={q}
                tasks={byQ[q.id]}
              />
            ))}
          </div>

          {totalOpen === 0 && (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <span className="text-2xl">✓</span>
              <p className="text-[#666] text-sm">No open tasks</p>
              <p className="text-[#555] text-xs">Create one above or from any day</p>
            </div>
          )}
        </div>
      </div>

      {/* Floating drag overlay — renders above everything via portal */}
      <DragOverlay dropAnimation={null}>
        {activeTask && activeQ ? (
          <BoardTaskRow task={activeTask} accentColor={activeQ.color} isOverlay />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

/* ── Quadrant column ── */
function QuadrantColumn({ quadrant, tasks }) {
  const { id, label, sublabel, color, bg, bgHover, border, borderHover } = quadrant
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div
      ref={setNodeRef}
      className="rounded-2xl flex flex-col"
      style={{
        background:    isOver ? bgHover : bg,
        border:        `1px solid ${isOver ? borderHover : border}`,
        transition:    'background 0.12s, border-color 0.12s',
        overflow:      'visible',
      }}
    >
      {/* Column header */}
      <div className="px-3 pt-3 pb-2 shrink-0">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold" style={{ color }}>{label}</span>
          {tasks.length > 0 && (
            <span
              className="text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center"
              style={{ background: color + '22', color }}
            >{tasks.length}</span>
          )}
        </div>
        <p className="text-[9px] uppercase tracking-widest mt-0.5" style={{ color: color + '88' }}>
          {sublabel}
        </p>
      </div>

      <div className="h-px mx-3" style={{ background: border }} />

      {/* Task list */}
      <div className="flex flex-col gap-1.5 p-2 flex-1">
        <AnimatePresence initial={false}>
          {tasks.map(task => (
            <BoardTaskRow key={task.id} task={task} accentColor={color} />
          ))}
        </AnimatePresence>
        {tasks.length === 0 && (
          <p className="text-[9px] text-center py-3" style={{ color: color + '44' }}>
            {isOver ? 'Drop here' : 'Empty'}
          </p>
        )}
      </div>
    </div>
  )
}

/* ── Task row on board ── */
function BoardTaskRow({ task, accentColor, isOverlay }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    disabled: isOverlay,
  })

  async function markDone() {
    await db.todos.update(task.id, {
      done:          true,
      completedDate: todayStr(),
    })
  }

  async function del() {
    await db.todos.delete(task.id)
  }

  return (
    <motion.div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      layout={!isOverlay}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: isDragging ? 0 : 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, height: 0 }}
      transition={{ duration: 0.15 }}
      className="bg-[#0e0e0e] rounded-xl px-2.5 py-2.5 group flex items-start gap-2"
      style={{
        border:   `1px solid ${accentColor}18`,
        cursor:   isOverlay ? 'grabbing' : 'grab',
        transform: CSS.Translate.toString(transform),
        boxShadow: isOverlay ? '0 8px 24px rgba(0,0,0,0.5)' : undefined,
        opacity:   isOverlay ? 1 : undefined,
        touchAction: 'none',
      }}
    >
      {/* Check — disabled during drag overlay */}
      {!isOverlay && (
        <button
          onClick={markDone}
          onPointerDown={e => e.stopPropagation()}
          className="w-4 h-4 rounded-full border mt-0.5 shrink-0 flex items-center justify-center active:scale-90 transition-transform"
          style={{ borderColor: accentColor + '55' }}
        />
      )}
      {isOverlay && (
        <div className="w-4 h-4 rounded-full border mt-0.5 shrink-0" style={{ borderColor: accentColor + '55' }} />
      )}

      {/* Title */}
      <span className="flex-1 text-[12px] text-[#ccc] leading-snug">{task.title}</span>

      {/* TID badge + delete */}
      <div className="flex flex-col items-end gap-1 shrink-0">
        <span className="text-[9px] font-mono" style={{ color: accentColor + '66' }}>
          {task.tid}
        </span>
        {!isOverlay && (
          <button
            onClick={del}
            onPointerDown={e => e.stopPropagation()}
            className="opacity-0 group-hover:opacity-100 text-[#333] hover:text-[#f87171] transition-all text-xs leading-none"
          >×</button>
        )}
      </div>
    </motion.div>
  )
}

/* ── Floating add-task button + inline form ── */
function AddTaskButton() {
  const [open,      setOpen]      = useState(false)
  const [input,     setInput]     = useState('')
  const [urgent,    setUrgent]    = useState(false)
  const [important, setImportant] = useState(false)

  async function add() {
    if (!input.trim()) return
    const tid = await nextId('task')
    await db.todos.add({
      type:        'task',
      title:       input.trim(),
      quadrant:    toQuadrant(urgent, important),
      urgent,
      important,
      createdDate: todayStr(),
      done:        false,
      tid,
    })
    setInput('')
    setUrgent(false)
    setImportant(false)
    setOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-8 h-8 rounded-full bg-[#a78bfa] flex items-center justify-center active:scale-95 transition-transform"
      >
        <motion.span
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="text-[#0a0a0a] text-xl leading-none font-light"
        >+</motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -4 }}
            animate={{ opacity: 1, scale: 1,   y: 0  }}
            exit={{ opacity: 0, scale: 0.9, y: -4 }}
            transition={{ type: 'spring', stiffness: 500, damping: 32 }}
            className="absolute right-0 top-10 w-72 glass rounded-2xl p-3 flex flex-col gap-2.5 z-50"
          >
            <input
              autoFocus
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && add()}
              placeholder="What needs to be done?"
              className="bg-transparent text-[#f0f0f0] text-sm placeholder:text-[#333] focus:outline-none w-full"
            />

            {/* Toggles */}
            <div className="flex gap-2">
              <TogglePill active={urgent} onClick={() => setUrgent(u => !u)}
                onLabel="Urgent" offLabel="Not Urgent"
                onColor="#f87171" offColor="#4ade80" />
              <TogglePill active={important} onClick={() => setImportant(i => !i)}
                onLabel="Important" offLabel="Not Important"
                onColor="#a78bfa" offColor="#555" />
            </div>

            {/* Preview badge */}
            {input && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-[#555]">Will go to</span>
                <QuadrantBadge quadrant={toQuadrant(urgent, important)} />
              </div>
            )}

            <div className="flex gap-2">
              <button onClick={add} disabled={!input.trim()}
                className="flex-1 bg-[#a78bfa] text-[#0a0a0a] text-xs font-semibold rounded-lg py-2.5 disabled:opacity-30 active:opacity-80 min-h-[40px]">
                Add task
              </button>
              <button onClick={() => { setOpen(false); setInput('') }}
                className="px-3 border border-[#2a2a2a] rounded-lg text-[#555] text-xs min-h-[40px]">
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function TogglePill({ active, onClick, onLabel, offLabel, onColor, offColor }) {
  const color = active ? onColor : offColor
  return (
    <button onClick={onClick}
      className="flex-1 text-[10px] font-medium rounded-full py-1.5 transition-all active:scale-95 min-h-[32px]"
      style={{ color, background: color + '15', border: `1px solid ${color}33` }}>
      {active ? onLabel : offLabel}
    </button>
  )
}

function QuadrantBadge({ quadrant }) {
  const q = QUADRANTS.find(x => x.id === quadrant) ?? QUADRANTS[3]
  return (
    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
      style={{ color: q.color, background: q.color + '18', border: `1px solid ${q.color}33` }}>
      {q.label}
    </span>
  )
}
