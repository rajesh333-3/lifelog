import { useRef, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { DayHoverCard } from './DayHoverCard'
import { overallScore } from '../../utils/scoreUtils'

const PILLAR_COLOR = {
  physical: '#4ade80',
  mental:   '#60a5fa',
  work:     '#fbbf24',
}

const SEG_MAX = 28   // px per segment at score=100
const BAR_TOTAL = SEG_MAX * 3 + 4  // 88px total

export function DayBarStack({ date, dayData, isToday, onOuterMouseLeave }) {
  const barRef  = useRef(null)
  const hideRef = useRef(null)
  const [cardVisible, setCardVisible] = useState(false)

  const dayLabel = new Date(date + 'T00:00:00')
    .toLocaleDateString('en-US', { weekday: 'short' })
    .slice(0, 1)

  const logged   = !!dayData
  const segments = ['physical', 'mental', 'work'].map(k => ({
    key:   k,
    color: PILLAR_COLOR[k],
    score: dayData?.[k] ?? 0,
    height: logged ? Math.max(2, ((dayData?.[k] ?? 0) / 100) * SEG_MAX) : 0,
  }))

  const overall = logged
    ? overallScore(dayData.physical, dayData.mental, dayData.work)
    : null

  function showCard()  {
    clearTimeout(hideRef.current)
    setCardVisible(true)
  }
  function hideCard() {
    hideRef.current = setTimeout(() => setCardVisible(false), 120)
  }
  function keepCard() { clearTimeout(hideRef.current) }

  return (
    <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0 relative">
      {/* Bar */}
      <div
        ref={barRef}
        className="w-full rounded-[3px] overflow-hidden flex flex-col-reverse cursor-pointer transition-opacity duration-150 hover:opacity-100"
        style={{
          height: BAR_TOTAL,
          background: '#161616',
          opacity: logged ? 1 : 0.5,
          gap: 1,
        }}
        onMouseEnter={showCard}
        onMouseLeave={hideCard}
      >
        {logged
          ? segments.map(({ key, color, height }) => (
              <div
                key={key}
                style={{
                  height,
                  background: color,
                  flexShrink: 0,
                  opacity: 0.9,
                }}
              />
            ))
          : (
            <div
              style={{
                height: 3,
                background: '#2a2a2a',
                marginBottom: 'auto',
                flexShrink: 0,
              }}
            />
          )}
      </div>

      {/* Score pill (only when logged) */}
      {logged && overall != null && (
        <span
          className="text-[8px] font-medium tabular-nums"
          style={{ color: '#555', lineHeight: 1 }}
        >{overall}</span>
      )}

      {/* Day label */}
      <span
        className="text-[9px] font-medium uppercase tracking-wide"
        style={{
          color: isToday ? '#a78bfa' : '#333',
          lineHeight: 1,
        }}
      >{dayLabel}</span>

      {/* Today dot */}
      {isToday && (
        <div className="w-1 h-1 rounded-full bg-[#a78bfa]" />
      )}

      {/* Day hover card */}
      <AnimatePresence>
        {cardVisible && logged && (
          <DayHoverCard
            date={date}
            dayData={dayData}
            anchorRef={barRef}
            onMouseEnter={keepCard}
            onMouseLeave={hideCard}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
