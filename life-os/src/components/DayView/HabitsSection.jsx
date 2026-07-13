import { motion, AnimatePresence } from 'framer-motion'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, getHabits, habitsDoneOnDate, setHabitDone } from '../../db'

const PILLAR_COLOR = {
  physical: '#4ade80',
  mental:   '#60a5fa',
  work:     '#fbbf24',
}

export function HabitsSection({ date, readOnly = false }) {
  const habits = useLiveQuery(() => getHabits(), []) ?? []
  const done   = useLiveQuery(() => habitsDoneOnDate(date), [date]) ?? new Set()

  const active = habits.filter(h => h.active !== false)
  if (!active.length) return null

  async function toggle(habitId) {
    if (readOnly) return
    await setHabitDone(date, habitId, !done.has(habitId))
  }

  const doneCount = active.filter(h => done.has(h.id)).length

  return (
    <div>
      {/* Section header with count */}
      <div className="flex items-center gap-2 mb-2">
        <p className="text-[#777] text-[10px] uppercase tracking-widest font-medium flex-1">Habits</p>
        {doneCount > 0 && (
          <span className="text-[9px] font-semibold tabular-nums" style={{ color: '#a78bfa' }}>
            {doneCount}/{active.length}
          </span>
        )}
      </div>

      {/* Habit chips */}
      <div className="flex flex-wrap gap-2">
        <AnimatePresence initial={false}>
          {active.map(habit => {
            const isDone  = done.has(habit.id)
            const color   = PILLAR_COLOR[habit.pillar] ?? '#a78bfa'

            return (
              <motion.button
                key={habit.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.15 }}
                onClick={() => toggle(habit.id)}
                disabled={readOnly}
                className="flex items-center gap-1.5 rounded-full px-3 py-2 transition-all active:scale-95"
                style={{
                  background:  isDone ? color + '18' : '#111',
                  border:      `1px solid ${isDone ? color + '50' : '#222'}`,
                  cursor:      readOnly ? 'default' : 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <span className="text-[13px] leading-none">{habit.emoji}</span>
                <span
                  className="text-[11px] font-medium leading-none"
                  style={{ color: isDone ? color : '#555' }}
                >
                  {habit.name}
                </span>
                {isDone && (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ flexShrink: 0 }}>
                    <path d="M2 5l2 2 4-4" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                )}
              </motion.button>
            )
          })}
        </AnimatePresence>
      </div>

      {/* Progress bar */}
      {active.length > 0 && (
        <div className="mt-3 h-1 rounded-full bg-[#1a1a1a] overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #a78bfa, #60a5fa)' }}
            initial={{ width: 0 }}
            animate={{ width: `${(doneCount / active.length) * 100}%` }}
            transition={{ type: 'spring', stiffness: 200, damping: 28 }}
          />
        </div>
      )}
    </div>
  )
}
