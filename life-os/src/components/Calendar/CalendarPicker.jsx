import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db'
import { useAppStore } from '../../store/useAppStore'
import { weekDates, todayStr } from '../../utils/dateUtils'

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]
const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const DAY_LABELS  = ['Mo','Tu','We','Th','Fr','Sa','Su']

function buildMonthGrid(year, month) {
  const firstDow    = new Date(year, month, 1).getDay()   // 0=Sun
  const startOffset = (firstDow + 6) % 7                  // 0=Mon … 6=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(`${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`)
  }
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

/* ── Trigger button shown in the header ── */
export function CalendarTrigger({ dob, onOpen }) {
  const calendarWeekIndex = useAppStore(s => s.calendarWeekIndex)
  const today = todayStr()

  const label = useMemo(() => {
    if (calendarWeekIndex != null && dob) {
      const dates = weekDates(dob, calendarWeekIndex)
      const s = new Date(dates[0] + 'T00:00:00')
      const e = new Date(dates[6] + 'T00:00:00')
      return s.getMonth() === e.getMonth()
        ? `${MONTH_SHORT[s.getMonth()]} ${s.getDate()}–${e.getDate()}`
        : `${MONTH_SHORT[s.getMonth()]} ${s.getDate()} – ${MONTH_SHORT[e.getMonth()]} ${e.getDate()}`
    }
    const d = new Date(today + 'T00:00:00')
    return `${MONTH_SHORT[d.getMonth()]} ${d.getFullYear()}`
  }, [calendarWeekIndex, dob, today])

  const isHovering = calendarWeekIndex != null

  return (
    <button
      onClick={onOpen}
      className="flex items-center gap-1.5 active:scale-95 transition-all"
      style={{
        background:              isHovering ? 'rgba(167,139,250,0.12)' : 'rgba(255,255,255,0.04)',
        border:                  `1px solid ${isHovering ? 'rgba(167,139,250,0.3)' : 'rgba(255,255,255,0.07)'}`,
        borderRadius:            10,
        padding:                 '5px 9px',
        cursor:                  'pointer',
        WebkitTapHighlightColor: 'transparent',
        transition:              'all 0.15s',
      }}
    >
      {/* Calendar icon */}
      <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
        <rect x="1" y="2.5" width="10" height="8.5" rx="2" stroke={isHovering ? '#a78bfa' : '#555'} strokeWidth="1.2"/>
        <path d="M4 1v3M8 1v3" stroke={isHovering ? '#a78bfa' : '#555'} strokeWidth="1.2" strokeLinecap="round"/>
        <path d="M1 5.5h10" stroke={isHovering ? '#a78bfa' : '#555'} strokeWidth="1.2"/>
      </svg>
      <span style={{
        fontSize:            10,
        fontWeight:          600,
        color:               isHovering ? '#a78bfa' : '#555',
        fontVariantNumeric:  'tabular-nums',
        letterSpacing:       '-0.2px',
        lineHeight:          1,
        fontFamily:          "'Inter', system-ui, sans-serif",
        transition:          'color 0.15s',
      }}>
        {label}
      </span>
    </button>
  )
}

/* ── Full calendar bottom sheet ── */
export function CalendarPicker({ dob, open, onClose }) {
  const calendarWeekIndex = useAppStore(s => s.calendarWeekIndex)
  const openDayView       = useAppStore(s => s.openDayView)
  const today             = todayStr()

  const [viewYear,  setViewYear]  = useState(() => new Date().getFullYear())
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth())

  // Jump to the hovered week's month whenever grid hover changes while open
  useEffect(() => {
    if (!open) return
    if (calendarWeekIndex != null && dob) {
      const dates = weekDates(dob, calendarWeekIndex)
      const d = new Date(dates[0] + 'T00:00:00')
      setViewYear(d.getFullYear())
      setViewMonth(d.getMonth())
    }
  }, [calendarWeekIndex, dob, open])

  // On first open with no hover context, go to today's month
  useEffect(() => {
    if (open && calendarWeekIndex == null) {
      const d = new Date()
      setViewYear(d.getFullYear())
      setViewMonth(d.getMonth())
    }
  }, [open]) // eslint-disable-line

  // Dates of the hovered grid week
  const hoveredDates = useMemo(() => {
    if (calendarWeekIndex == null || !dob) return new Set()
    return new Set(weekDates(dob, calendarWeekIndex))
  }, [calendarWeekIndex, dob])

  // Days with logged data in this month
  const monthTag   = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`
  const monthStart = `${monthTag}-01`
  const monthEnd   = `${monthTag}-31`
  const monthDays  = useLiveQuery(
    () => db.days.where('date').between(monthStart, monthEnd, true, true).toArray(),
    [monthStart, monthEnd]
  ) ?? []
  const loggedSet = useMemo(() => new Set(monthDays.map(d => d.date)), [monthDays])

  // Score colors for logged days
  const scoreMap = useMemo(() => {
    const m = {}
    monthDays.forEach(d => { if (d.color) m[d.date] = d.color })
    return m
  }, [monthDays])

  const grid  = buildMonthGrid(viewYear, viewMonth)
  const weeks = []
  for (let i = 0; i < grid.length; i += 7) weeks.push(grid.slice(i, i + 7))

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }
  function goToday() {
    const d = new Date()
    setViewYear(d.getFullYear())
    setViewMonth(d.getMonth())
  }

  function pickDate(date) {
    if (date > today) return  // don't open future days from calendar
    openDayView(date)
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0"
            style={{ zIndex: 60, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          {/* Bottom sheet */}
          <motion.div
            className="fixed left-0 right-0 rounded-t-3xl overflow-hidden"
            style={{
              zIndex:        65,
              bottom:        0,
              background:    'rgba(12,12,12,0.97)',
              backdropFilter:'blur(32px) saturate(180%)',
              border:        '1px solid rgba(255,255,255,0.07)',
              borderBottom:  'none',
              paddingBottom: 'calc(56px + env(safe-area-inset-bottom))',
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 40, mass: 0.85 }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-0.5">
              <div className="w-9 h-1 rounded-full bg-white/10" />
            </div>

            {/* Month navigation */}
            <div className="flex items-center px-5 py-3 gap-3">
              <button
                onClick={prevMonth}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#555] active:text-[#f0f0f0] active:bg-white/05 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

              <button onClick={goToday} className="flex-1 text-center active:opacity-60">
                <p style={{
                  fontFamily:    "'Outfit', system-ui, sans-serif",
                  fontSize:      16,
                  fontWeight:    700,
                  color:         '#f0f0f0',
                  letterSpacing: '-0.3px',
                }}>
                  {MONTH_NAMES[viewMonth]}
                </p>
                <p className="text-[11px] text-[#444] mt-0.5">{viewYear}</p>
              </button>

              <button
                onClick={nextMonth}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#555] active:text-[#f0f0f0] active:bg-white/05 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M5 2l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>

            {/* Day-of-week headers */}
            <div className="grid grid-cols-7 px-4 mb-1">
              {DAY_LABELS.map(l => (
                <div key={l} className="flex items-center justify-center h-7">
                  <span className="text-[10px] font-semibold text-[#333] uppercase tracking-widest">{l}</span>
                </div>
              ))}
            </div>

            {/* Calendar week rows */}
            <div className="px-2 pb-2 flex flex-col gap-0.5">
              {weeks.map((week, wi) => {
                const isHoveredWeek = week.some(d => d && hoveredDates.has(d))

                return (
                  <div
                    key={wi}
                    className="grid grid-cols-7 rounded-2xl overflow-hidden"
                    style={{
                      background: isHoveredWeek ? 'rgba(167,139,250,0.08)' : 'transparent',
                      border:     isHoveredWeek ? '1px solid rgba(167,139,250,0.18)' : '1px solid transparent',
                      transition: 'background 0.15s, border-color 0.15s',
                    }}
                  >
                    {week.map((date, di) => {
                      if (!date) return <div key={di} className="h-12" />

                      const isToday    = date === today
                      const isHovered  = hoveredDates.has(date)
                      const hasData    = loggedSet.has(date)
                      const isPast     = date < today
                      const isFutureD  = date > today
                      const dotColor   = scoreMap[date]

                      return (
                        <button
                          key={date}
                          onClick={() => pickDate(date)}
                          disabled={isFutureD}
                          className="flex flex-col items-center justify-center h-12 gap-0.5 active:opacity-50 transition-opacity disabled:cursor-default"
                        >
                          {/* Date number */}
                          <div
                            className="w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium transition-all"
                            style={{
                              background: isToday
                                ? '#a78bfa'
                                : isHovered
                                  ? 'rgba(167,139,250,0.2)'
                                  : 'transparent',
                              color: isToday
                                ? '#0a0a0a'
                                : isHovered
                                  ? '#c4b5fd'
                                  : isFutureD
                                    ? '#282828'
                                    : isPast && !hasData
                                      ? '#383838'
                                      : '#e0e0e0',
                              fontWeight: isToday || isHovered ? 700 : 400,
                              fontFamily: "'Inter', system-ui, sans-serif",
                            }}
                          >
                            {parseInt(date.slice(8))}
                          </div>

                          {/* Data dot */}
                          <div
                            className="w-1 h-1 rounded-full transition-all"
                            style={{
                              background: hasData && !isToday
                                ? isHovered ? '#a78bfa' : (dotColor ?? '#3a3a3a')
                                : 'transparent',
                            }}
                          />
                        </button>
                      )
                    })}
                  </div>
                )
              })}
            </div>

            {/* Footer legend */}
            <div className="flex items-center justify-center gap-5 px-4 py-2">
              {[
                ['#4ade80', 'Great'],
                ['#fbbf24', 'Okay'],
                ['#f87171', 'Tough'],
                ['#3a3a3a', 'Unrated'],
              ].map(([color, label]) => (
                <div key={label} className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
                  <span className="text-[9px] text-[#333] uppercase tracking-widest">{label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
