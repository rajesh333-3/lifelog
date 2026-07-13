import { useRef, useEffect, useCallback } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { WeekDot } from './WeekDot'
import { WeekTooltip } from './WeekTooltip'
import { db } from '../../db'
import { useAppStore } from '../../store/useAppStore'
import {
  currentWeekIndex,
  totalWeeks,
  daysCompletedThisWeek,
  weekDates,
} from '../../utils/dateUtils'
import { scoreToColor, overallScore } from '../../utils/scoreUtils'

const COLS = 52

export function LifeGrid({ dob, lifeExpectancy }) {
  const total       = totalWeeks(lifeExpectancy)
  const currentIdx  = currentWeekIndex(dob)
  const currentRef  = useRef(null)
  const hoveredWeek = useAppStore(s => s.hoveredWeek)
  const setHovered  = useAppStore(s => s.setHoveredWeek)
  const openDayView = useAppStore(s => s.openDayView)

  // All logged days so we can color lived weeks
  const allDays = useLiveQuery(() => db.days.toArray(), [])
  const dayMap  = {}
  if (allDays) {
    for (const d of allDays) dayMap[d.date] = d
  }

  // Days logged this week for the current dot fill
  const thisWeekDates  = weekDates(dob, currentIdx)
  const loggedThisWeek = thisWeekDates.filter(d => dayMap[d])
  const fillPct        = Math.round((loggedThisWeek.length / 7) * 100)

  // Current week color from logged days
  const currentWeekColor = (() => {
    const scores = loggedThisWeek
      .map(d => dayMap[d])
      .map(d => overallScore(d?.physical, d?.mental, d?.work))
      .filter(s => s != null)
    if (!scores.length) return null
    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    return scoreToColor(avg)
  })()

  // Scroll to current week on mount
  useEffect(() => {
    if (currentRef.current) {
      currentRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [])

  function getWeekColor(weekIndex) {
    const dates = weekDates(dob, weekIndex)
    const logged = dates.map(d => dayMap[d]).filter(Boolean)
    if (!logged.length) return null
    const scores = logged
      .map(d => overallScore(d.physical, d.mental, d.work))
      .filter(s => s != null)
    if (!scores.length) return null
    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    return scoreToColor(avg)
  }

  const rows = Math.ceil(total / COLS)

  return (
    <div className="flex flex-row h-full">
      {/* Age labels */}
      <div
        className="flex flex-col shrink-0 pr-2"
        style={{ gap: 2 }}
      >
        {Array.from({ length: rows }, (_, r) => (
          <div
            key={r}
            className="flex items-center justify-end text-[#333] shrink-0"
            style={{ height: 0, fontSize: 9, minWidth: 28 }}
          >
            {r % 5 === 0 ? r : ''}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div
        className="relative flex-1"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${COLS}, 1fr)`,
          gap: 2,
        }}
      >
        {Array.from({ length: total }, (_, i) => {
          const isCurrent = i === currentIdx
          const state = i < currentIdx ? 'lived' : i === currentIdx ? 'current' : 'future'
          const color = isCurrent ? currentWeekColor : state === 'lived' ? getWeekColor(i) : null

          return (
            <WeekDot
              key={i}
              weekIndex={i}
              state={state}
              color={color}
              fillPct={isCurrent ? fillPct : undefined}
              isCurrent={isCurrent}
              dotRef={isCurrent ? currentRef : undefined}
              onClick={() => {
                const dates = weekDates(dob, i)
                openDayView(dates[0])
              }}
              onHoverStart={() => setHovered(i)}
              onHoverEnd={() => setHovered(null)}
            />
          )
        })}

        {/* Tooltip */}
        {hoveredWeek != null && (
          <WeekTooltip
            weekIndex={hoveredWeek}
            dob={dob}
            dayMap={dayMap}
          />
        )}
      </div>
    </div>
  )
}
