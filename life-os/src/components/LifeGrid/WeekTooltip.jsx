import { motion } from 'framer-motion'
import { FloatingPortal } from '@floating-ui/react'
import { weekDates, todayStr } from '../../utils/dateUtils'
import { overallScore, scoreToColor } from '../../utils/scoreUtils'

const MONTH = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const DAY3  = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']

function weekLabel(dates) {
  const s = new Date(dates[0] + 'T00:00:00')
  const e = new Date(dates[6] + 'T00:00:00')
  const sm = MONTH[s.getMonth()], em = MONTH[e.getMonth()]
  if (s.getMonth() === e.getMonth())
    return `${sm} ${s.getDate()}–${e.getDate()}, ${s.getFullYear()}`
  return `${sm} ${s.getDate()} – ${em} ${e.getDate()}, ${s.getFullYear()}`
}

// Fixed bottom-right, just above the bottom nav.
// Width is fixed so nothing shifts when single↔double digit dates change.
const TOOLTIP_WIDTH = 264

export function WeekTooltip({
  weekIndex, dob, dayMap,
  onMouseEnter, onMouseLeave,
  onDayClick, locked = false, onClose,
}) {
  const dates   = weekDates(dob, weekIndex)
  const today   = todayStr()
  const age     = Math.floor(weekIndex / 52)
  const weekNum = weekIndex % 52 + 1

  const loggedDays = dates.map(d => dayMap[d]).filter(Boolean)
  const scores     = loggedDays.map(d => overallScore(d.physical, d.mental, d.work)).filter(s => s != null)
  const avgScore   = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null
  const weekColor  = avgScore ? scoreToColor(avgScore) : null

  return (
    <FloatingPortal>
      <motion.div
        // Fixed position — bottom-right, above nav bar
        style={{
          position: 'fixed',
          bottom: 'calc(56px + env(safe-area-inset-bottom) + 10px)',
          right: 12,
          width: TOOLTIP_WIDTH,
          zIndex: 90,
        }}
        initial={{ opacity: 0, y: 10, scale: 0.96 }}
        animate={{ opacity: 1, y: 0,  scale: 1 }}
        exit={{ opacity: 0, y: 6, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 500, damping: 32, mass: 0.45 }}
        className="glass rounded-2xl overflow-hidden"
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {/* Header */}
        <div className="px-4 pt-3 pb-2.5 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[#f0f0f0] text-[13px] font-medium">Age {age}</span>
              <span className="text-[#444]">·</span>
              <span className="text-[#888] text-[11px]">Week {weekNum}</span>
            </div>
            <p className="text-[#666] text-[10px] mt-0.5">{weekLabel(dates)}</p>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <Stat label="logged" value={`${loggedDays.length}/7`} />
            {avgScore != null && <Stat label="avg" value={avgScore} color={weekColor} />}
            {locked && (
              <button onClick={onClose}
                className="w-6 h-6 rounded-full bg-[#1a1a1a] flex items-center justify-center active:opacity-60 shrink-0"
              >
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                  <path d="M1 1l6 6M7 1L1 7" stroke="#555" strokeWidth="1.4" strokeLinecap="round"/>
                </svg>
              </button>
            )}
          </div>
        </div>

        <div className="h-px bg-white/[0.04] mx-4" />

        {/* Day rows — fixed-width label column so single↔double digit dates never shift */}
        <div className="px-4 pt-2.5 pb-2.5" style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {dates.map((date, i) => {
            const data     = dayMap[date] ?? null
            const logged   = !!data
            const isToday  = date === today
            const d        = new Date(date + 'T00:00:00')
            const physical = data?.physical ?? 0
            const mental   = data?.mental   ?? 0
            const work     = data?.work     ?? 0
            const overall  = logged ? overallScore(physical, mental, work) : null

            return (
              <button
                key={date}
                onClick={() => onDayClick?.(date)}
                className="flex items-center w-full text-left focus:outline-none rounded-lg transition-colors duration-100"
                style={{
                  gap: 8,
                  padding: '3px 6px',
                  margin: '0 -6px',
                  cursor: 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
              >
                {/* Fixed-width label: "Wed" + "Nov 27" — sized for the widest possible value */}
                <div style={{ width: 66, flexShrink: 0, display: 'flex', alignItems: 'baseline', gap: 4 }}>
                  <span style={{
                    width: 24, flexShrink: 0,
                    fontSize: 10,
                    fontWeight: isToday ? 600 : 400,
                    color: isToday ? '#a78bfa' : '#888',
                    userSelect: 'none',
                  }}>
                    {DAY3[i]}
                  </span>
                  {/* Month + day in fixed-width container — tabular-nums keeps digit widths stable */}
                  <span style={{
                    width: 38, flexShrink: 0,
                    fontSize: 9,
                    color: isToday ? '#a78bfaaa' : '#666',
                    userSelect: 'none',
                    fontVariantNumeric: 'tabular-nums',
                    whiteSpace: 'nowrap',
                  }}>
                    {MONTH[d.getMonth()]} {String(d.getDate()).padStart(2, ' ')}
                  </span>
                </div>

                {/* Bar */}
                <div style={{
                  flex: 1,
                  height: 4,
                  background: '#161616',
                  borderRadius: 2,
                  overflow: 'hidden',
                  display: 'flex',
                  gap: 1,
                }}>
                  {logged ? (
                    <>
                      <div style={{ width: `${(physical / 100) * 33.3}%`, background: '#4ade80', opacity: 0.85, flexShrink: 0 }} />
                      <div style={{ width: `${(mental   / 100) * 33.3}%`, background: '#60a5fa', opacity: 0.85, flexShrink: 0 }} />
                      <div style={{ width: `${(work     / 100) * 33.3}%`, background: '#fbbf24', opacity: 0.85, flexShrink: 0 }} />
                    </>
                  ) : (
                    <div style={{ width: '12%', background: '#1e1e1e' }} />
                  )}
                </div>

                {/* Score — fixed width */}
                <span style={{
                  width: 22, flexShrink: 0,
                  fontSize: 10,
                  fontVariantNumeric: 'tabular-nums',
                  color: overall != null ? scoreToColor(overall) : '#444',
                  textAlign: 'right',
                  userSelect: 'none',
                }}>
                  {overall ?? '—'}
                </span>
              </button>
            )
          })}
        </div>

        {/* Pillar legend */}
        <div className="flex items-center gap-3 px-4 pb-3">
          {[['#4ade80','Physical'],['#60a5fa','Mental'],['#fbbf24','Work']].map(([color, label]) => (
            <div key={label} className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
              <span className="text-[9px] text-[#666] uppercase tracking-widest">{label}</span>
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
      <span className="text-[13px] font-semibold tabular-nums leading-none" style={{ color: color ?? '#f0f0f0' }}>
        {value}
      </span>
      <span className="text-[9px] text-[#666] uppercase tracking-widest mt-0.5">{label}</span>
    </div>
  )
}
