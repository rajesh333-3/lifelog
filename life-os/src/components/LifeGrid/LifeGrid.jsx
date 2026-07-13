import { useRef, useEffect, useState, useCallback } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { AnimatePresence } from 'framer-motion'
import { WeekDot } from './WeekDot'
import { WeekTooltip } from './WeekTooltip'
import { db } from '../../db'
import { useAppStore } from '../../store/useAppStore'
import { currentWeekIndex, totalWeeks, weekDates } from '../../utils/dateUtils'
import { scoreToColor, overallScore } from '../../utils/scoreUtils'

const COLS = 52
const GAP  = 1   // px

export function LifeGrid({ dob, lifeExpectancy }) {
  const total       = totalWeeks(lifeExpectancy)
  const currentIdx  = currentWeekIndex(dob)
  const currentRef  = useRef(null)
  const hideTimer   = useRef(null)
  const openDayView = useAppStore(s => s.openDayView)

  const lockedRef  = useRef(false)
  const hoveredRef = useRef(null)

  const [locked,  setLocked]  = useState(false)
  const [hovered, setHovered] = useState(null)

  const allDays = useLiveQuery(() => db.days.toArray(), [])
  const dayMap  = {}
  if (allDays) for (const d of allDays) dayMap[d.date] = d

  const thisWeekDates  = weekDates(dob, currentIdx)
  const loggedThisWeek = thisWeekDates.filter(d => dayMap[d])
  const fillPct        = Math.round((loggedThisWeek.length / 7) * 100)

  const currentWeekColor = (() => {
    const scores = loggedThisWeek
      .map(d => dayMap[d])
      .map(d => overallScore(d?.physical, d?.mental, d?.work))
      .filter(s => s != null)
    if (!scores.length) return null
    return scoreToColor(Math.round(scores.reduce((a, b) => a + b, 0) / scores.length))
  })()

  useEffect(() => {
    currentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [])

  function getWeekColor(i) {
    const dates  = weekDates(dob, i)
    const logged = dates.map(d => dayMap[d]).filter(Boolean)
    if (!logged.length) return null
    if (logged.some(d => d.lifeEvent)) return '#60a5fa'
    const scores = logged.map(d => overallScore(d.physical, d.mental, d.work)).filter(s => s != null)
    if (!scores.length) return null
    return scoreToColor(Math.round(scores.reduce((a, b) => a + b, 0) / scores.length))
  }

  function weekHasLifeEvent(i) {
    return weekDates(dob, i).some(d => dayMap[d]?.lifeEvent)
  }

  const rows = Math.ceil(total / COLS)

  // ── Event delegation ──────────────────────────────────────────
  const handleMouseOver = useCallback((e) => {
    if (lockedRef.current) return
    const dotEl = e.target.closest('[data-week]')
    if (!dotEl) return
    const index = parseInt(dotEl.dataset.week, 10)
    if (hoveredRef.current?.index === index) return
    clearTimeout(hideTimer.current)
    const h = { index, anchorEl: dotEl }
    hoveredRef.current = h
    setHovered(h)
  }, [])

  const handleMouseLeave = useCallback(() => {
    if (lockedRef.current) return
    hideTimer.current = setTimeout(() => { hoveredRef.current = null; setHovered(null) }, 220)
  }, [])

  const handleClick = useCallback((e) => {
    const dotEl = e.target.closest('[data-week]')
    if (!dotEl) return
    const index = parseInt(dotEl.dataset.week, 10)
    if (lockedRef.current && hoveredRef.current?.index === index) {
      openDayView(weekDates(dob, index)[0])
      lockedRef.current = false; hoveredRef.current = null
      setLocked(false); setHovered(null)
    } else {
      clearTimeout(hideTimer.current)
      const h = { index, anchorEl: dotEl }
      hoveredRef.current = h; lockedRef.current = true
      setHovered(h); setLocked(true)
    }
  }, [dob, openDayView])

  const handleTooltipEnter = useCallback(() => {
    if (lockedRef.current) return
    clearTimeout(hideTimer.current)
  }, [])

  const handleTooltipLeave = useCallback(() => {
    if (lockedRef.current) return
    hideTimer.current = setTimeout(() => { hoveredRef.current = null; setHovered(null) }, 220)
  }, [])

  const handleDayClick = useCallback((date) => {
    openDayView(date)
    lockedRef.current = false; hoveredRef.current = null
    setLocked(false); setHovered(null)
  }, [openDayView])

  const handleClose = useCallback(() => {
    lockedRef.current = false; hoveredRef.current = null
    setLocked(false); setHovered(null)
  }, [])

  // ─────────────────────────────────────────────────────────────
  // Single CSS grid: col 1 = age label, cols 2–53 = week dots.
  // Age labels are IN THE SAME ROW as their dots, so heights are
  // always identical — no separate axis that can drift.
  // ─────────────────────────────────────────────────────────────

  return (
    <div className="h-full overflow-y-auto no-scrollbar px-2 py-2">
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `28px repeat(${COLS}, 1fr)`,
          gap: GAP,
        }}
        onMouseOver={handleMouseOver}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      >
        {/* ── Header row: corner + W1…W52 ── */}
        <div /> {/* corner */}
        {Array.from({ length: COLS }, (_, c) => (
          <div key={`wh-${c}`} style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 2 }}>
            {(c === 0 || c === 12 || c === 25 || c === 38 || c === 51) && (
              <span style={{ fontSize: 7, color: '#bbb', lineHeight: 1, userSelect: 'none', fontVariantNumeric: 'tabular-nums' }}>
                W{c + 1}
              </span>
            )}
          </div>
        ))}

        {/* ── Data rows: age label in col 1, 52 dots in cols 2–53 ── */}
        {Array.from({ length: rows }, (_, r) => [
          // Age label — same row as dots, always perfectly aligned
          <div key={`al-${r}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 4 }}>
            <span style={{ fontSize: 7, color: '#bbb', lineHeight: 1, userSelect: 'none', fontVariantNumeric: 'tabular-nums' }}>
              {r}
            </span>
          </div>,

          // 52 week dots
          ...Array.from({ length: COLS }, (_, c) => {
            const i = r * COLS + c
            if (i >= total) return <div key={`e-${i}`} />

            const isCurrent = i === currentIdx
            const state     = i < currentIdx ? 'lived' : isCurrent ? 'current' : 'future'
            const color     = isCurrent ? currentWeekColor
                            : state === 'lived' ? getWeekColor(i) : null

            return (
              <WeekDot
                key={i}
                weekIndex={i}
                state={state}
                color={color}
                fillPct={isCurrent ? fillPct : undefined}
                isCurrent={isCurrent}
                hasLifeEvent={state === 'lived' && weekHasLifeEvent(i)}
                isLocked={locked && hovered?.index === i}
                dotRef={isCurrent ? currentRef : undefined}
              />
            )
          }),
        ]).flat()}
      </div>

      <AnimatePresence>
        {hovered && (
          <WeekTooltip
            weekIndex={hovered.index}
            dob={dob}
            dayMap={dayMap}
            onMouseEnter={handleTooltipEnter}
            onMouseLeave={handleTooltipLeave}
            onDayClick={handleDayClick}
            locked={locked}
            onClose={handleClose}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
