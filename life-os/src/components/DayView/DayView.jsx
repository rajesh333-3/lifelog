import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db'
import { useAppStore } from '../../store/useAppStore'
import { useSettingsStore } from '../../store/useSettingsStore'
import { todayStr, isFuture, isToday, formatDate, weekDates, dateToWeekIndex } from '../../utils/dateUtils'
import { overallScore, scoreToColor } from '../../utils/scoreUtils'
import { PillarSlider } from './PillarSlider'
import { TaskSection } from './TaskSection'
import { HobbySection } from './HobbySection'

const SLIDE_PANEL = {
  initial:  { x: '100%', opacity: 0 },
  animate:  { x: 0,      opacity: 1 },
  exit:     { x: '100%', opacity: 0 },
  transition: { type: 'spring', stiffness: 380, damping: 36, mass: 0.8 },
}

export function DayView({ initialDate, asOverlay = false }) {
  const closePanelStore = useAppStore(s => s.closePanel)
  const closePanel = asOverlay ? closePanelStore : null
  const profile    = useSettingsStore(s => s.profile)
  const pillars    = useSettingsStore(s => s.pillars)

  const [date, setDate]   = useState(initialDate ?? todayStr())
  const saveTimer         = useRef(null)

  const future   = isFuture(date)
  const today    = isToday(date)

  const dayData = useLiveQuery(() => db.days.get(date), [date])

  const [local, setLocal] = useState({
    physical: 50, mental: 50, work: 50,
    physicalNote: '', mentalNote: '', workNote: '',
    wentWell: '', couldBeBetter: '',
  })

  // Sync local state when day changes or data loads
  useEffect(() => {
    if (dayData) {
      setLocal({
        physical:       dayData.physical       ?? 50,
        mental:         dayData.mental         ?? 50,
        work:           dayData.work           ?? 50,
        physicalNote:   dayData.physicalNote   ?? '',
        mentalNote:     dayData.mentalNote     ?? '',
        workNote:       dayData.workNote       ?? '',
        wentWell:       dayData.wentWell       ?? '',
        couldBeBetter:  dayData.couldBeBetter  ?? '',
      })
    } else {
      setLocal({ physical: 50, mental: 50, work: 50, physicalNote: '', mentalNote: '', workNote: '', wentWell: '', couldBeBetter: '' })
    }
  }, [date, dayData?.date])

  // Auto-save with debounce
  const save = useCallback(async (patch) => {
    if (future) return
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      const base = (await db.days.get(date)) ?? { date, weekId: date.slice(0, 7) }
      const merged = { ...base, ...patch }
      const overall = overallScore(merged.physical, merged.mental, merged.work)
      merged.overallScore = overall
      merged.color        = scoreToColor(overall)
      await db.days.put(merged)
    }, 600)
  }, [date, future])

  function update(field, value) {
    const next = { ...local, [field]: value }
    setLocal(next)
    save(next)
  }

  // Navigate to adjacent day
  function goDay(delta) {
    const d = new Date(date + 'T00:00:00')
    d.setDate(d.getDate() + delta)
    const next = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
    setDate(next)
  }

  const overall      = future ? null : overallScore(local.physical, local.mental, local.work)
  const overallColor = scoreToColor(overall)

  return (
    <motion.div
      className="fixed inset-0 z-40 bg-[#0a0a0a] flex flex-col"
      style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
      {...SLIDE_PANEL}
    >
      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1a1a1a] shrink-0">
        <button
          onClick={closePanel ?? undefined}
          className={`w-9 h-9 rounded-full bg-[#1a1a1a] flex items-center justify-center active:scale-95 ${!closePanel ? 'invisible' : ''}`}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8l5 5" stroke="#888" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {/* Date navigator */}
        <div className="flex items-center gap-2">
          <button onClick={() => goDay(-1)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#444] active:text-[#f0f0f0]">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
          <div className="text-center">
            <p className="text-[#f0f0f0] text-sm font-medium">{formatDate(date)}</p>
            {today && <p className="text-[#a78bfa] text-[10px] uppercase tracking-widest">Today</p>}
            {future && <p className="text-[#fbbf24] text-[10px] uppercase tracking-widest">Future</p>}
          </div>
          <button onClick={() => goDay(1)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#444] active:text-[#f0f0f0]">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M5 2l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Score badge */}
        {!future && overall != null ? (
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-semibold"
            style={{ background: `${overallColor}18`, color: overallColor, border: `1px solid ${overallColor}30` }}
          >{overall}</div>
        ) : (
          <div className="w-9 h-9" />
        )}
      </div>

      {/* ── 7-day strip ── */}
      <WeekStrip date={date} dob={profile?.dob} onSelect={setDate} />

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {future ? (
          <FutureNotice date={date} />
        ) : (
          <div className="px-4 py-4 flex flex-col gap-5 pb-8">
            {/* Pillars */}
            <Section title="Your Day" subtitle="Score and reflect on each pillar">
              <div className="flex flex-col gap-4">
                <PillarSlider icon="💪" label="Physical" color="#4ade80"
                  value={local.physical} note={local.physicalNote}
                  onValue={v => update('physical', v)}
                  onNote={v => update('physicalNote', v)} />
                <PillarSlider icon="🧠" label="Mental" color="#60a5fa"
                  value={local.mental} note={local.mentalNote}
                  onValue={v => update('mental', v)}
                  onNote={v => update('mentalNote', v)} />
                <PillarSlider icon="💼" label="Work" color="#fbbf24"
                  value={local.work} note={local.workNote}
                  onValue={v => update('work', v)}
                  onNote={v => update('workNote', v)} />
              </div>
            </Section>

            {/* Reflection */}
            <Section title="Reflection" subtitle="What stood out today?">
              <div className="flex flex-col gap-3">
                <ReflectField
                  label="✦  What went well"
                  value={local.wentWell}
                  onChange={v => update('wentWell', v)}
                  placeholder="A win, however small…"
                />
                <ReflectField
                  label="↺  Could be better"
                  value={local.couldBeBetter}
                  onChange={v => update('couldBeBetter', v)}
                  placeholder="One thing to improve…"
                />
              </div>
            </Section>

            {/* Tasks */}
            <Section title="Tasks" subtitle="What needed doing today">
              <TaskSection date={date} />
            </Section>

            {/* Hobbies */}
            <Section title="Hobbies" subtitle="Time spent on what you love">
              <HobbySection date={date} />
            </Section>
          </div>
        )}

        {/* Future: task scheduling only */}
        {future && (
          <div className="px-4 pt-2 pb-8">
            <Section title="Schedule" subtitle="Plan tasks or deadlines for this day">
              <TaskSection date={date} futureOnly />
            </Section>
          </div>
        )}
      </div>
    </motion.div>
  )
}

/* ── 7-day strip ── */
function WeekStrip({ date, dob, onSelect }) {
  if (!dob) return null
  const weekIdx = dateToWeekIndex(dob, date)
  const dates   = weekDates(dob, weekIdx)
  const today   = todayStr()
  const DAY_LABELS = ['M','T','W','T','F','S','S']

  return (
    <div className="flex border-b border-[#1a1a1a] shrink-0">
      {dates.map((d, i) => {
        const active  = d === date
        const isT     = d === today
        const fut     = d > today
        return (
          <button
            key={d}
            onClick={() => onSelect(d)}
            className="flex-1 flex flex-col items-center py-2.5 gap-1 transition-colors"
            style={{ background: active ? '#1a1a1a' : 'transparent' }}
          >
            <span className="text-[9px] uppercase tracking-widest"
              style={{ color: isT ? '#a78bfa' : '#333' }}>{DAY_LABELS[i]}</span>
            <span className="text-[13px] font-medium"
              style={{ color: active ? '#f0f0f0' : fut ? '#2a2a2a' : '#555' }}>
              {new Date(d + 'T00:00:00').getDate()}
            </span>
            {isT && <div className="w-1 h-1 rounded-full bg-[#a78bfa]" />}
          </button>
        )
      })}
    </div>
  )
}

/* ── Section wrapper ── */
function Section({ title, subtitle, children }) {
  return (
    <div>
      <div className="mb-3">
        <h2 className="text-[#f0f0f0] text-sm font-medium">{title}</h2>
        {subtitle && <p className="text-[#444] text-xs mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}

/* ── Reflection text field ── */
function ReflectField({ label, value, onChange, placeholder }) {
  return (
    <div className="bg-[#111] border border-[#1e1e1e] rounded-xl p-3">
      <p className="text-[#555] text-[10px] uppercase tracking-widest mb-2">{label}</p>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={2}
        className="w-full bg-transparent text-[#f0f0f0] text-sm placeholder:text-[#2a2a2a] resize-none focus:outline-none leading-relaxed"
      />
    </div>
  )
}

/* ── Future day notice ── */
function FutureNotice({ date }) {
  return (
    <div className="flex flex-col items-center justify-center h-40 gap-2 px-8">
      <div className="w-8 h-8 rounded-full bg-[#1a1a1a] flex items-center justify-center">
        <span className="text-sm">⏳</span>
      </div>
      <p className="text-[#444] text-sm text-center">
        This day hasn't happened yet.<br/>
        <span className="text-[#555]">You can schedule tasks below.</span>
      </p>
    </div>
  )
}
