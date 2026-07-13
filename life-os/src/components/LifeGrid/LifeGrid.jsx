import { useRef, useEffect, useState, useCallback } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { AnimatePresence } from 'framer-motion'
import { WeekDot } from './WeekDot'
import { WeekTooltip } from './WeekTooltip'
import { db } from '../../db'
import { useAppStore } from '../../store/useAppStore'
import {
  currentWeekIndex,
  totalWeeks,
  weekDates,
} from '../../utils/dateUtils'
import { scoreToColor, overallScore } from '../../utils/scoreUtils'

const COLS = 52

export function LifeGrid({ dob, lifeExpectancy }) {
  const total      = totalWeeks(lifeExpectancy)
  const currentIdx = currentWeekIndex(dob)
  const currentRef = useRef(null)
  const hideTimer  = useRef(null)
  const openDayView = useAppStore(s => s.openDayView)

  const [hovered, setHovered] = useState(null) // { index, anchorEl }

  const allDays = useLiveQuery(() => db.days.toArray(), [])
  const dayMap  = {}
  if (allDays) for (const d of allDays) dayMap[d.date] = d

  // Current week fill pct
  const thisWeekDates  = weekDates(dob, currentIdx)
  const loggedThisWeek = thisWeekDates.filter(d => dayMap[d])
  const fillPct        = Math.round((loggedThisWeek.length / 7) * 100)

  const currentWeekColor = (() => {
    const scores = loggedThisWeek
      .map(d => dayMap[d])
      .map(d => overallScore(d?.physical, d?.mental, d?.work))
      .filter(s => s != null)
    if (!scores.length) return null
    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    return scoreToColor(avg)
  })()

  useEffect(() => {
    currentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [])

  function getWeekColor(weekIndex) {
    const dates  = weekDates(dob, weekIndex)
    const logged = dates.map(d => dayMap[d]).filter(Boolean)
    if (!logged.length) return null
    const scores = logged
      .map(d => overallScore(d.physical, d.mental, d.work))
      .filter(s => s != null)
    if (!scores.length) return null
    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    return scoreToColor(avg)
  }

  const handleDotEnter = useCallback((index, el) => {
    clearTimeout(hideTimer.current)
    setHovered({ index, anchorEl: el })
  }, [])

  const handleDotLeave = useCallback(() => {
    hideTimer.current = setTimeout(() => setHovered(null), 120)
  }, [])

  const handleTooltipEnter = useCallback(() => {
    clearTimeout(hideTimer.current)
  }, [])

  const handleTooltipLeave = useCallback(() => {
    hideTimer.current = setTimeout(() => setHovered(null), 120)
  }, [])

  const rows = Math.ceil(total / COLS)

  return (
    <div className="flex flex-row h-full gap-1">
      {/* Age axis */}
      <div className="flex flex-col shrink-0 justify-start" style={{ gap: 2 }}>
        {Array.from({ length: rows }, (_, r) => (
          <div
            key={r}
            className="flex items-center justify-end shrink-0"
            style={{ height: 0, marginTop: r === 0 ? 4 : 0 }}
          >
            <span
              className="text-right leading-none"
              style={{
                fontSize: 8,
                color: r % 5 === 0 ? '#3a3a3a' : 'transparent',
                minWidth: 20,
                paddingRight: 4,
                userSelect: 'none',
              }}
            >{r}</span>
          </div>
        ))}
      </div>

      {/* Dot grid */}
      <div
        className="relative flex-1"
        style={{ display: 'grid', gridTemplateColumns: `repeat(${COLS}, 1fr)`, gap: 2 }}
      >
        {Array.from({ length: total }, (_, i) => {
          const isCurrent = i === currentIdx
          const state     = i < currentIdx ? 'lived' : isCurrent ? 'current' : 'future'
          const color     = isCurrent ? currentWeekColor : state === 'lived' ? getWeekColor(i) : null

          return (
            <WeekDot
              key={i}
              weekIndex={i}
              state={state}
              color={color}
              fillPct={isCurrent ? fillPct : undefined}
              isCurrent={isCurrent}
              dotRef={isCurrent ? currentRef : undefined}
              onClick={() => openDayView(weekDates(dob, i)[0])}
              onHoverStart={(el) => handleDotEnter(i, el)}
              onHoverEnd={handleDotLeave}
            />
          )
        })}

        <AnimatePresence>
          {hovered && (
            <WeekTooltip
              key={hovered.index}
              weekIndex={hovered.index}
              dob={dob}
              dayMap={dayMap}
              anchorEl={hovered.anchorEl}
              onMouseEnter={handleTooltipEnter}
              onMouseLeave={handleTooltipLeave}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
