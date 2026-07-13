import { useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  useFloating,
  offset,
  flip,
  shift,
  autoUpdate,
  FloatingPortal,
} from '@floating-ui/react'
import { DayBarStack } from '../DayBar/DayBarStack'
import { weekDates, todayStr } from '../../utils/dateUtils'
import { overallScore, scoreToColor } from '../../utils/scoreUtils'

const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function fmt(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return `${MONTH_SHORT[d.getMonth()]} ${d.getDate()}`
}

function weekLabel(dates) {
  const s = new Date(dates[0] + 'T00:00:00')
  const e = new Date(dates[6] + 'T00:00:00')
  if (s.getMonth() === e.getMonth())
    return `${MONTH_SHORT[s.getMonth()]} ${s.getDate()}–${e.getDate()}, ${s.getFullYear()}`
  return `${fmt(dates[0])} – ${fmt(dates[6])}, ${s.getFullYear()}`
}

export function WeekTooltip({ weekIndex, dob, dayMap, anchorEl, onMouseEnter, onMouseLeave }) {
  const { refs, floatingStyles } = useFloating({
    placement: 'top',
    middleware: [offset(14), flip({ padding: 16 }), shift({ padding: 16 })],
    whileElementsMounted: autoUpdate,
  })

  useEffect(() => {
    if (anchorEl) refs.setReference(anchorEl)
  }, [anchorEl, refs])

  const dates   = weekDates(dob, weekIndex)
  const today   = todayStr()
  const age     = Math.floor(weekIndex / 52)
  const weekNum = weekIndex % 52 + 1

  // Aggregate stats
  const loggedDays = dates.map(d => dayMap[d]).filter(Boolean)
  const scores = loggedDays
    .map(d => overallScore(d.physical, d.mental, d.work))
    .filter(s => s != null)
  const avgScore = scores.length
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : null
  const weekColor = avgScore ? scoreToColor(avgScore) : null

  return (
    <FloatingPortal>
      <motion.div
        ref={refs.setFloating}
        style={{ ...floatingStyles, zIndex: 90 }}
        initial={{ opacity: 0, scale: 0.93, y: 6 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.88, y: 8 }}
        transition={{ type: 'spring', stiffness: 480, damping: 34, mass: 0.55 }}
        className="glass rounded-2xl overflow-hidden"
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {/* ── Header ── */}
        <div className="px-4 pt-3.5 pb-3 flex items-start justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[#f0f0f0] text-[13px] font-medium tracking-tight">
                Age {age}
              </span>
              <span className="text-[#333] text-[11px]">·</span>
              <span className="text-[#555] text-[11px]">Week {weekNum}</span>
            </div>
            <p className="text-[#444] text-[10px] mt-0.5 tracking-wide">{weekLabel(dates)}</p>
          </div>

          {/* Stats cluster */}
          <div className="flex items-center gap-3 shrink-0">
            <Stat label="logged" value={`${loggedDays.length}/7`} />
            {avgScore != null && (
              <Stat label="avg" value={avgScore} color={weekColor} />
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-white/[0.04] mx-4" />

        {/* ── Day bars ── */}
        <div className="flex gap-2 px-4 pt-3.5 pb-4">
          {dates.map(date => (
            <DayBarStack
              key={date}
              date={date}
              dayData={dayMap[date] ?? null}
              isToday={date === today}
            />
          ))}
        </div>

        {/* ── Legend ── */}
        <div className="flex items-center gap-3 px-4 pb-3.5">
          {[
            { color: '#4ade80', label: 'Physical' },
            { color: '#60a5fa', label: 'Mental'   },
            { color: '#fbbf24', label: 'Work'     },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
              <span className="text-[9px] text-[#444] uppercase tracking-widest">{label}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </FloatingPortal>
  )
}

function Stat({ label, value, color }) {
  return (
    <div className="flex flex-col items-end">
      <span
        className="text-[13px] font-semibold tabular-nums leading-none"
        style={{ color: color ?? '#f0f0f0' }}
      >{value}</span>
      <span className="text-[9px] text-[#444] uppercase tracking-widest mt-0.5">{label}</span>
    </div>
  )
}
