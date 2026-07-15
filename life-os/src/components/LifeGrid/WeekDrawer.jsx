import { motion } from 'framer-motion'
import { weekDates, todayStr } from '../../utils/dateUtils'
import { scoreToColor, overallScore } from '../../utils/scoreUtils'

const DAY_ABBR    = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export function WeekDrawer({ weekIndex, dob, dayMap, onClose, onDayClick }) {
  const dates = weekDates(dob, weekIndex)
  const today = todayStr()

  const d0    = new Date(dates[0] + 'T00:00:00')
  const d6    = new Date(dates[6] + 'T00:00:00')
  const fmt   = (d) => `${MONTH_SHORT[d.getMonth()]} ${d.getDate()}`
  const sameY = d0.getFullYear() === d6.getFullYear()
  const range = sameY
    ? `${fmt(d0)} – ${fmt(d6)}, ${d6.getFullYear()}`
    : `${fmt(d0)}, ${d0.getFullYear()} – ${fmt(d6)}, ${d6.getFullYear()}`

  const logged     = dates.map(d => dayMap[d]).filter(Boolean)
  const daysLogged = logged.length

  const avgScore = (() => {
    const sc = logged
      .map(d => overallScore(d.physical, d.mental, d.work))
      .filter(s => s != null)
    return sc.length ? Math.round(sc.reduce((a, b) => a + b) / sc.length) : null
  })()
  const avgColor    = avgScore !== null ? scoreToColor(avgScore) : null
  const hasLifeEvt  = dates.some(d => dayMap[d]?.lifeEvent)

  return (
    <motion.div
      className="absolute left-0 right-0 bottom-0 flex flex-col"
      style={{
        height:          '50%',
        background:      'rgba(8,8,12,0.97)',
        backdropFilter:  'blur(28px) saturate(160%)',
        WebkitBackdropFilter: 'blur(28px) saturate(160%)',
        borderTop:       '1px solid rgba(167,139,250,0.12)',
        zIndex:          30,
      }}
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', stiffness: 400, damping: 42, mass: 0.8 }}
      drag="y"
      dragConstraints={{ top: 0 }}
      dragElastic={{ top: 0.04, bottom: 0.22 }}
      onDragEnd={(_, info) => {
        if (info.offset.y > 70 || info.velocity.y > 380) onClose()
      }}
      onPointerDown={e => e.stopPropagation()}
    >
      {/* Drag handle */}
      <div className="flex justify-center pt-2.5 pb-1.5 shrink-0">
        <div className="w-8 h-[3px] rounded-full" style={{ background: 'rgba(167,139,250,0.22)' }} />
      </div>

      {/* Header */}
      <div className="px-4 pb-2 flex items-start justify-between shrink-0">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <p className="text-[13px] font-semibold tracking-tight" style={{ color: '#e8e0ff' }}>
              {range}
            </p>
            {hasLifeEvt && (
              <span style={{ fontSize: 11, color: '#60a5fa', textShadow: '0 0 8px #60a5fa66' }}>★</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {avgColor && (
              <div className="flex items-center gap-1.5">
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: avgColor, boxShadow: `0 0 5px ${avgColor}88` }}
                />
                <span
                  className="text-[10px] font-semibold uppercase tracking-widest"
                  style={{ color: avgColor }}
                >
                  {avgScore}% avg
                </span>
              </div>
            )}
            <span className="text-[10px] uppercase tracking-widest" style={{ color: '#606070' }}>
              {daysLogged === 0 ? 'no logs this week' : `${daysLogged}/7 days logged`}
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 active:scale-90"
          style={{
            background: 'rgba(255,255,255,0.05)',
            border:     '1px solid rgba(255,255,255,0.08)',
            transition: 'background 0.12s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.09)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
        >
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
            <path d="M2 2l8 8M10 2l-8 8" stroke="#888" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {/* 7 day cards */}
      <div className="flex-1 px-3 pb-3 min-h-0">
        <div className="grid grid-cols-7 gap-1.5 h-full">
          {dates.map((date, di) => {
            const day      = dayMap[date]
            const score    = day ? overallScore(day.physical, day.mental, day.work) : null
            const color    = score !== null ? scoreToColor(score) : null
            const isToday  = date === today
            const isFuture = date > today
            const dateNum  = new Date(date + 'T00:00:00').getDate()

            // Card background — every day is visible regardless of logging status
            const cardBg = isToday
              ? 'rgba(167,139,250,0.12)'
              : color
                ? `${color}18`
                : isFuture
                  ? 'rgba(255,255,255,0.025)'
                  : 'rgba(180,200,230,0.05)'

            const cardBorder = isToday
              ? 'rgba(167,139,250,0.35)'
              : color
                ? `${color}45`
                : isFuture
                  ? 'rgba(255,255,255,0.07)'
                  : 'rgba(180,200,230,0.12)'   // past empty: cool subtle border

            return (
              <motion.button
                key={date}
                onClick={() => onDayClick(date)}
                whileTap={{ scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 440, damping: 22 }}
                className="flex flex-col items-center justify-between rounded-2xl"
                style={{
                  paddingTop:    8,
                  paddingBottom: 8,
                  background:    cardBg,
                  border:        `1px solid ${cardBorder}`,
                  opacity:       isFuture ? 0.45 : 1,
                  transition:    'background 0.15s, border-color 0.15s',
                }}
                onMouseEnter={e => {
                  if (!isFuture) e.currentTarget.style.background = color
                    ? `${color}28`
                    : isToday ? 'rgba(167,139,250,0.18)' : 'rgba(180,200,230,0.09)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = cardBg
                }}
              >
                {/* Day abbr */}
                <span style={{
                  fontSize:      7.5,
                  fontWeight:    700,
                  color:         isToday ? '#a78bfa' : '#7a7a8a',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  lineHeight:    1,
                }}>
                  {DAY_ABBR[di]}
                </span>

                {/* Score circle */}
                <div
                  className="flex items-center justify-center rounded-full"
                  style={{
                    width:      26,
                    height:     26,
                    background: color
                      ? `${color}20`
                      : isToday
                        ? 'rgba(167,139,250,0.1)'
                        : 'rgba(255,255,255,0.04)',
                    border: `1.5px solid ${
                      color ?? (isToday ? 'rgba(167,139,250,0.35)' : 'rgba(255,255,255,0.1)')
                    }`,
                    boxShadow: color ? `0 0 7px ${color}30` : 'none',
                  }}
                >
                  {color ? (
                    <div
                      className="rounded-full"
                      style={{
                        width:     8,
                        height:    8,
                        background: color,
                        boxShadow:  `0 0 5px ${color}88`,
                      }}
                    />
                  ) : (
                    <div
                      className="rounded-full"
                      style={{
                        width:      5,
                        height:     5,
                        background: isFuture ? '#2a2a35' : '#505060',
                      }}
                    />
                  )}
                </div>

                {/* Date number */}
                <span style={{
                  fontSize:  11,
                  fontWeight: isToday ? 700 : color ? 600 : 400,
                  color:      isToday
                    ? '#c4b5fd'
                    : color
                      ? '#d8d8e8'
                      : isFuture
                        ? '#383845'
                        : '#686878',   // past empty: visibly dim but readable
                  lineHeight: 1,
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  {dateNum}
                </span>
              </motion.button>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}
