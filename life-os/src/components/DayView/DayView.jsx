import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, tasksForDate } from '../../db'
import { useAppStore } from '../../store/useAppStore'
import { useSettingsStore } from '../../store/useSettingsStore'
import {
  todayStr, isFuture, isToday, formatDate,
  weekDates, dateToWeekIndex, toDateStr,
} from '../../utils/dateUtils'
import { overallScore, scoreToColor } from '../../utils/scoreUtils'
import { PillarReadOnly } from './PillarReadOnly'
import { TaskSection } from './TaskSection'
import { HobbySection } from './HobbySection'
import { HabitsSection } from './HabitsSection'
import { useVoiceInput } from '../Voice/useVoiceInput'

const PILLARS = ['physical', 'mental', 'work']
function pillarOf(task) {
  return PILLARS.includes(task.pillar) ? task.pillar : 'work'
}

const SLIDE = {
  initial:    { x: '100%', opacity: 0 },
  animate:    { x: 0,      opacity: 1 },
  exit:       { x: '100%', opacity: 0 },
  transition: { type: 'spring', stiffness: 380, damping: 38, mass: 0.8 },
}

export function DayView({ initialDate, asOverlay = false }) {
  const closePanelStore = useAppStore(s => s.closePanel)
  const closePanel      = asOverlay ? closePanelStore : null
  const profile         = useSettingsStore(s => s.profile)

  const [date, setDate]     = useState(initialDate ?? todayStr())
  const [saveState, setSaveState] = useState('idle') // 'idle' | 'saving' | 'saved'
  const [pastUnlocked, setPastUnlocked] = useState(false)
  const saveTimer = useRef(null)
  const saveStateTimer = useRef(null)

  const isPast   = !isToday(date) && !isFuture(date)
  const isFut    = isFuture(date)
  const isTod    = isToday(date) || (isPast && pastUnlocked)

  const dayData = useLiveQuery(() => db.days.get(date), [date])

  const [local, setLocal] = useState(emptyDay())

  useEffect(() => { setPastUnlocked(false) }, [date])

  // Live task data — used to derive pillar scores automatically
  const allTasks = useLiveQuery(() => tasksForDate(date), [date]) ?? []

  // Compute per-pillar score from task completion (null = no tasks for that pillar → keep default)
  const taskScores = useMemo(() => {
    const score = (p) => {
      const pt = allTasks.filter(t => pillarOf(t) === p)
      if (!pt.length) return null
      const doneCount = pt.filter(t =>
        t.source === 'commitment' ? t.completedDate === date : t.done
      ).length
      return Math.round(doneCount / pt.length * 100)
    }
    return { physical: score('physical'), mental: score('mental'), work: score('work') }
  }, [allTasks, date])

  // Ref so the score-sync effect can read latest local without a stale closure
  const localRef = useRef(local)
  useEffect(() => { localRef.current = local })

  // Auto-persist task-derived pillar scores whenever task completion changes
  const lastScoreSig = useRef('')
  useEffect(() => {
    if (!isTod) return
    const sig = `${taskScores.physical}-${taskScores.mental}-${taskScores.work}`
    if (sig === lastScoreSig.current) return
    lastScoreSig.current = sig
    const patch = {}
    if (taskScores.physical !== null) patch.physical = taskScores.physical
    if (taskScores.mental   !== null) patch.mental   = taskScores.mental
    if (taskScores.work     !== null) patch.work     = taskScores.work
    if (!Object.keys(patch).length)  return
    const next = { ...localRef.current, ...patch }
    setLocal(next)
    persist(next)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskScores.physical, taskScores.mental, taskScores.work, isTod])

  useEffect(() => {
    setLocal(dayData ? {
      physical:      dayData.physical      ?? 50,
      mental:        dayData.mental        ?? 50,
      work:          dayData.work          ?? 50,
      physicalNote:  dayData.physicalNote  ?? '',
      mentalNote:    dayData.mentalNote    ?? '',
      workNote:      dayData.workNote      ?? '',
      wentWell:      dayData.wentWell      ?? '',
      couldBeBetter: dayData.couldBeBetter ?? '',
      lifeEvent:     dayData.lifeEvent     ?? false,
      lifeEventNote: dayData.lifeEventNote ?? '',
      voiceNote:     dayData.voiceNote     ?? '',
    } : emptyDay())
  }, [date, dayData?.date])

  const persist = useCallback(async (patch) => {
    setSaveState('saving')
    clearTimeout(saveStateTimer.current)
    const base   = (await db.days.get(date)) ?? { date, weekId: date.slice(0, 7) }
    const merged = { ...base, ...patch }

    // If the day has no meaningful data, remove it rather than storing blank defaults
    if (isDayEmpty(merged)) {
      await db.days.delete(date)
      setSaveState('saved')
      saveStateTimer.current = setTimeout(() => setSaveState('idle'), 2200)
      return
    }

    const overall = overallScore(merged.physical, merged.mental, merged.work)
    merged.overallScore = overall
    merged.color        = merged.lifeEvent ? '#60a5fa' : scoreToColor(overall)
    await db.days.put(merged)
    setSaveState('saved')
    saveStateTimer.current = setTimeout(() => setSaveState('idle'), 2200)
  }, [date])

  async function resetDay() {
    clearTimeout(saveTimer.current)
    await db.days.delete(date)
    setLocal(emptyDay())
  }

  // Debounced auto-save for text inputs only
  function autoSave(next) {
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => persist(next), 800)
  }

  function update(field, value) {
    const next = { ...local, [field]: value }
    setLocal(next)
    autoSave(next)
  }

  // Explicit save (for sliders & manual button press)
  function saveNow(patch) {
    clearTimeout(saveTimer.current)
    const next = patch ? { ...local, ...patch } : local
    if (patch) setLocal(next)
    persist(next)
  }

  function goDay(delta) {
    const d = new Date(date + 'T00:00:00')
    d.setDate(d.getDate() + delta)
    setDate(toDateStr(d))
  }

  const overall      = overallScore(local.physical, local.mental, local.work)
  const overallColor = local.lifeEvent ? '#60a5fa' : scoreToColor(overall)

  return (
    <motion.div
      className={asOverlay
        ? 'fixed inset-0 z-40 bg-[#0a0a0a] flex flex-col'
        : 'h-full flex flex-col bg-[#0a0a0a]'}
      style={asOverlay ? { paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'calc(56px + env(safe-area-inset-bottom))' } : undefined}
      {...(asOverlay ? SLIDE : {})}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1a1a1a] shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={closePanel ?? undefined}
            className={`w-9 h-9 rounded-full bg-[#1a1a1a] flex items-center justify-center active:scale-95 ${!closePanel ? 'invisible' : ''}`}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 3L5 8l5 5" stroke="#888" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {/* Reset day — only shown when the day has saved data */}
          {!isFut && dayData && (
            <button
              onClick={resetDay}
              className="w-9 h-9 rounded-full bg-[#1a1a1a] flex items-center justify-center active:scale-95 transition-colors"
              title="Reset day"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 4h10M5 4V3a1 1 0 011-1h2a1 1 0 011 1v1M11 4l-.6 7a1 1 0 01-1 .9H4.6a1 1 0 01-1-.9L3 4" stroke="#555" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
        </div>

        {/* Date nav */}
        <div className="flex items-center gap-2">
          <button onClick={() => goDay(-1)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#444] active:text-[#f0f0f0]">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
          <div className="text-center min-w-[110px]">
            <p className="text-[#f0f0f0] text-sm font-medium">{formatDate(date)}</p>
            <p className="text-[10px] uppercase tracking-widest" style={{
              color: isTod ? '#a78bfa' : isFut ? '#fbbf24' : '#444'
            }}>
              {isTod ? 'Today' : isFut ? 'Future' : 'Past'}
            </p>
          </div>
          <button onClick={() => goDay(1)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#444] active:text-[#f0f0f0]">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M5 2l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Score / lock badge */}
        {!isFut && (
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-semibold transition-all"
            style={{
              background: `${overallColor ?? '#222'}22`,
              color:       overallColor ?? '#444',
              border:      `1px solid ${overallColor ?? '#222'}44`,
            }}
          >
            {isPast && !local.lifeEvent ? (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="2" y="6" width="10" height="7" rx="1.5" stroke="#444" strokeWidth="1.3"/>
                <path d="M4.5 6V4.5a2.5 2.5 0 015 0V6" stroke="#444" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
            ) : overall ?? '—'}
          </div>
        )}
        {isFut && <div className="w-9 h-9" />}
      </div>

      {/* 7-day strip */}
      {profile?.dob && (
        <WeekStrip date={date} dob={profile.dob} onSelect={setDate} />
      )}

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="max-w-lg mx-auto">

          {/* ── FUTURE mode ── */}
          {isFut && (
            <div className="px-4 pt-5 pb-10 flex flex-col gap-5">
              <FutureNotice />
              <Section title="Schedule">
                <TaskSection date={date} futureOnly />
              </Section>
            </div>
          )}

          {/* ── PAST mode ── */}
          {isPast && !pastUnlocked && (
            <div className="px-4 pt-5 pb-10 flex flex-col gap-5">
              <PastNotice onEdit={() => {
                if (window.confirm('This day is in the past. Do you want to edit it?')) {
                  setPastUnlocked(true)
                }
              }} />

              <Section title="Tasks">
                <TaskSection date={date} readOnly />
              </Section>

              {(local.wentWell || local.couldBeBetter) && (
                <Section title="Reflection">
                  <div className="flex flex-col gap-2.5">
                    {local.wentWell && (
                      <ReadOnlyCard label="✦  What went well" text={local.wentWell} />
                    )}
                    {local.couldBeBetter && (
                      <ReadOnlyCard label="↺  Could be better" text={local.couldBeBetter} />
                    )}
                  </div>
                </Section>
              )}

              {local.voiceNote && (
                <Section title="Voice Journal">
                  <ReadOnlyCard label="🎙 Voice note" text={local.voiceNote} />
                </Section>
              )}

              <Section title="Habits">
                <HabitsSection date={date} readOnly />
              </Section>

              <LifeEventSection
                value={local.lifeEvent}
                note={local.lifeEventNote}
                onToggle={v => saveNow({ ...local, lifeEvent: v })}
                onNote={v => update('lifeEventNote', v)}
              />
            </div>
          )}

          {/* ── TODAY mode ── */}
          {isTod && (
            <div className="px-4 pt-5 pb-10 flex flex-col gap-5">
              <Section title="Tasks">
                <TaskSection date={date} />
              </Section>

              <Section title="Reflection">
                <div className="flex flex-col gap-2.5">
                  <ReflectField label="✦  What went well"   value={local.wentWell}
                    onChange={v => update('wentWell', v)}      placeholder="A win, however small…" />
                  <ReflectField label="↺  Could be better" value={local.couldBeBetter}
                    onChange={v => update('couldBeBetter', v)} placeholder="One thing to work on…" />
                </div>
              </Section>

              <Section title="Voice Journal">
                <VoiceJournal
                  value={local.voiceNote}
                  onChange={v => update('voiceNote', v)}
                />
              </Section>

              <Section title="Habits">
                <HabitsSection date={date} />
              </Section>

              <Section title="Hobbies">
                <HobbySection date={date} />
              </Section>

              <LifeEventSection
                value={local.lifeEvent}
                note={local.lifeEventNote}
                onToggle={v => saveNow({ ...local, lifeEvent: v })}
                onNote={v => update('lifeEventNote', v)}
              />
            </div>
          )}

        </div>
      </div>

      {/* Auto-save indicator — subtle top-right badge, no blocking button */}
      {isTod && saveState !== 'idle' && (
        <div className="absolute top-[60px] right-3 pointer-events-none" style={{ zIndex: 10 }}>
          <motion.div
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
            style={{ background: saveState === 'saved' ? 'rgba(74,222,128,0.1)' : 'rgba(167,139,250,0.1)', border: `1px solid ${saveState === 'saved' ? '#4ade8033' : '#a78bfa33'}` }}
          >
            {saveState === 'saved' ? (
              <>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2 5l2.5 2.5 3.5-4" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <span className="text-[10px]" style={{ color: '#4ade80' }}>Saved</span>
              </>
            ) : (
              <span className="text-[10px]" style={{ color: '#a78bfa' }}>Saving…</span>
            )}
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}

/* ── Life Event section ── */
function LifeEventSection({ value, note, onToggle, onNote }) {
  return (
    <Section title="Life Event" subtitle="Always editable">
      <div className="rounded-2xl overflow-hidden transition-all"
        style={{ background: '#141414', border: `1px solid ${value ? 'rgba(96,165,250,0.25)' : '#242424'}` }}>
        <button
          onClick={() => onToggle(!value)}
          className="w-full flex items-center justify-between px-4 py-4 active:opacity-70"
        >
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full transition-colors" style={{ background: value ? '#60a5fa' : '#2e2e2e' }} />
            <span className="text-sm font-medium" style={{ color: value ? '#93c5fd' : '#555' }}>
              {value ? 'Life event marked' : 'Mark as life event'}
            </span>
          </div>
          <div
            className="w-11 h-6 rounded-full transition-all flex items-center px-0.5"
            style={{ background: value ? 'rgba(96,165,250,0.2)' : '#1e1e1e', border: `1px solid ${value ? 'rgba(96,165,250,0.4)' : '#2e2e2e'}` }}
          >
            <motion.div
              className="w-5 h-5 rounded-full shadow-sm"
              style={{ background: value ? '#60a5fa' : '#383838' }}
              animate={{ x: value ? 18 : 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          </div>
        </button>

        <AnimatePresence>
          {value && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
              style={{ borderTop: '1px solid rgba(96,165,250,0.12)' }}
            >
              <textarea
                value={note}
                onChange={e => onNote(e.target.value)}
                placeholder="Describe this life event…"
                rows={3}
                className="w-full bg-transparent px-4 py-3.5 text-sm text-[#d0d0d0] placeholder:text-[#2e2e2e] resize-none focus:outline-none leading-relaxed"
                style={{ minHeight: 80 }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Section>
  )
}

/* ── 7-day strip ── */
function WeekStrip({ date, dob, onSelect }) {
  const weekIdx  = dateToWeekIndex(dob, date)
  const dates    = weekDates(dob, weekIdx)
  const today    = todayStr()
  const LABELS   = ['M','T','W','T','F','S','S']

  return (
    <div className="border-b border-[#1a1a1a] shrink-0">
      <div className="max-w-lg mx-auto flex">
        {dates.map((d, i) => {
          const active = d === date
          const isT    = d === today
          const fut    = d > today
          return (
            <button key={d} onClick={() => onSelect(d)}
              className="flex-1 flex flex-col items-center py-3 gap-1 transition-colors active:bg-[#161616]"
              style={{ background: active ? '#161616' : 'transparent' }}>
              <span className="text-[9px] font-semibold uppercase tracking-widest"
                style={{ color: isT ? '#a78bfa' : '#444' }}>{LABELS[i]}</span>
              <span className="w-7 h-7 flex items-center justify-center rounded-full text-[13px] font-medium transition-all"
                style={{
                  background: active ? '#a78bfa' : 'transparent',
                  color: active ? '#0a0a0a' : fut ? '#252525' : isT ? '#c4b5fd' : '#888',
                  fontWeight: active || isT ? 600 : 400,
                }}>
                {new Date(d + 'T00:00:00').getDate()}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ── Reusable section wrapper ── */
function Section({ title, subtitle, children }) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between gap-2">
        <p style={{
          fontFamily:    "'Inter', system-ui, sans-serif",
          fontSize:      11,
          fontWeight:    600,
          letterSpacing: '0.07em',
          textTransform: 'uppercase',
          color:         '#484848',
        }}>{title}</p>
        {subtitle && (
          <p style={{ fontSize: 10, color: '#303030', flexShrink: 0 }}>{subtitle}</p>
        )}
      </div>
      {children}
    </div>
  )
}

/* ── Editable reflection textarea with inline mic ── */
function ReflectField({ label, value, onChange, placeholder }) {
  const { listening, interim, toggle } = useVoiceInput()
  const valueRef = useRef(value)
  valueRef.current = value

  function handleFinal(text) {
    onChange(valueRef.current ? `${valueRef.current} ${text}` : text)
  }

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all"
      style={{
        background:  '#141414',
        border:      `1px solid ${listening ? 'rgba(167,139,250,0.35)' : '#242424'}`,
      }}
    >
      <div className="flex items-center justify-between px-4 pt-3.5 pb-1">
        <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#404040' }}>{label}</p>
        <button
          onClick={() => toggle(handleFinal)}
          className="w-6 h-6 rounded-full flex items-center justify-center transition-all active:scale-90 shrink-0"
          style={{
            background: listening ? 'rgba(248,113,113,0.15)' : '#1e1e1e',
            border:     `1px solid ${listening ? 'rgba(248,113,113,0.4)' : '#2e2e2e'}`,
          }}
        >
          {listening ? (
            <motion.div
              className="w-2 h-2 rounded-full bg-[#f87171]"
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 0.7, repeat: Infinity }}
            />
          ) : (
            <svg width="8" height="9" viewBox="0 0 8 10" fill="none">
              <rect x="2.5" y="0.5" width="3" height="5" rx="1.5" stroke="#555" strokeWidth="1.1"/>
              <path d="M1 5c0 1.65 1.35 3 3 3s3-1.35 3-3" stroke="#555" strokeWidth="1.1" strokeLinecap="round"/>
              <line x1="4" y1="8" x2="4" y2="9.5" stroke="#555" strokeWidth="1.1" strokeLinecap="round"/>
            </svg>
          )}
        </button>
      </div>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={listening ? interim || 'Listening…' : placeholder}
        rows={3}
        className="w-full bg-transparent text-[#d0d0d0] text-sm px-4 pb-4 pt-1 placeholder:text-[#2e2e2e] resize-none focus:outline-none leading-relaxed"
        style={{ minHeight: 80 }}
      />
      {interim && (
        <p className="px-4 pb-2 text-[11px] text-[#484848] italic">{interim}…</p>
      )}
    </div>
  )
}

/* ── Read-only text card for past days ── */
function ReadOnlyCard({ label, text }) {
  return (
    <div className="rounded-2xl px-4 py-4" style={{ background: '#141414', border: '1px solid #242424' }}>
      <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#404040', marginBottom: 8 }}>{label}</p>
      <p className="text-[#999] text-sm leading-relaxed">{text}</p>
    </div>
  )
}

/* ── Notices ── */
function FutureNotice() {
  return (
    <div className="rounded-2xl px-4 py-4" style={{ background: '#141414', border: '1px solid #242424' }}>
      <p className="text-[#505050] text-sm font-medium">This day hasn't been written yet.</p>
      <p className="text-[#343434] text-xs mt-1">You can schedule tasks here to get ahead.</p>
    </div>
  )
}

function PastNotice({ onEdit }) {
  return (
    <div className="rounded-2xl px-4 py-4 flex items-center justify-between gap-4" style={{ background: '#141414', border: '1px solid #242424' }}>
      <div>
        <p className="text-[#505050] text-sm font-medium">This is a past day.</p>
        <p className="text-[#343434] text-xs mt-0.5">Read only — tap to edit anyway.</p>
      </div>
      {onEdit && (
        <button onClick={onEdit}
          className="shrink-0 text-xs font-medium px-3 py-1.5 rounded-xl active:opacity-70 transition-opacity"
          style={{ background: '#1e1e1e', border: '1px solid #2a2a2a', color: '#555' }}>
          Edit
        </button>
      )}
    </div>
  )
}

/* ── Voice Journal ── */
function VoiceJournal({ value, onChange }) {
  const { listening, interim, supported, toggle } = useVoiceInput()
  const valueRef = useRef(value)
  valueRef.current = value

  function handleFinal(text) {
    onChange(valueRef.current ? `${valueRef.current} ${text}` : text)
  }

  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0

  // supported = null (checking), true (available), false (API absent — keyboard mic still works)
  const showMicBtn = supported !== false

  return (
    <div
      className="bg-[#111] rounded-2xl overflow-hidden transition-all"
      style={{ border: `1px solid ${listening ? 'rgba(167,139,250,0.35)' : '#1e1e1e'}` }}
    >
      {/* Text area — always shown so keyboard voice typing always works */}
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={listening ? '' : 'Tap 🎙 to dictate, or type freely…'}
        rows={3}
        className="w-full bg-transparent text-[#e0e0e0] text-sm px-4 pt-3 pb-1 placeholder:text-[#2a2a2a] resize-none focus:outline-none leading-relaxed"
      />

      {/* Interim transcript — appears dimly while speaking */}
      {interim && (
        <p className="px-4 pb-1 text-sm text-[#555] italic leading-relaxed">{interim}…</p>
      )}

      {/* Bottom bar */}
      <div className="flex items-center justify-between px-4 pb-3 pt-1">
        <div className="flex items-center gap-2">
          {listening ? (
            <motion.div
              className="flex items-center gap-1.5"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            >
              <motion.div
                className="w-2 h-2 rounded-full bg-[#f87171]"
                animate={{ scale: [1, 1.4, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
              />
              <span className="text-[11px] text-[#f87171] font-medium">Listening…</span>
            </motion.div>
          ) : (
            <span className="text-[10px] text-[#333]">
              {wordCount > 0 ? `${wordCount} word${wordCount !== 1 ? 's' : ''}` : 'Voice or type'}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {value && !listening && (
            <button
              onClick={() => onChange('')}
              className="text-[10px] text-[#333] hover:text-[#f87171] transition-colors px-2 py-1"
            >
              Clear
            </button>
          )}
          {showMicBtn && <button
            onClick={() => toggle(handleFinal)}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90"
            style={{
              background: listening
                ? 'rgba(248,113,113,0.15)'
                : 'rgba(167,139,250,0.12)',
              border: `1px solid ${listening ? 'rgba(248,113,113,0.4)' : 'rgba(167,139,250,0.25)'}`,
              boxShadow: listening ? '0 0 20px rgba(248,113,113,0.25)' : 'none',
            }}
          >
            {listening ? (
              /* Stop square */
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <rect x="1" y="1" width="8" height="8" rx="1.5" fill="#f87171"/>
              </svg>
            ) : (
              /* Mic */
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="4.5" y="1" width="5" height="7" rx="2.5" stroke="#a78bfa" strokeWidth="1.3"/>
                <path d="M2 7c0 2.76 2.24 5 5 5s5-2.24 5-5" stroke="#a78bfa" strokeWidth="1.3" strokeLinecap="round"/>
                <line x1="7" y1="12" x2="7" y2="13.5" stroke="#a78bfa" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
            )}
          </button>}
        </div>
      </div>
    </div>
  )
}

/* ── Default empty day state ── */
function emptyDay() {
  return {
    physical: 50, mental: 50, work: 50,
    physicalNote: '', mentalNote: '', workNote: '',
    wentWell: '', couldBeBetter: '',
    lifeEvent: false, lifeEventNote: '',
    voiceNote: '',
  }
}

function isDayEmpty(d) {
  return (
    !d.lifeEvent &&
    (d.physical ?? 50) === 50 &&
    (d.mental   ?? 50) === 50 &&
    (d.work     ?? 50) === 50 &&
    !d.physicalNote?.trim() &&
    !d.mentalNote?.trim() &&
    !d.workNote?.trim() &&
    !d.wentWell?.trim() &&
    !d.couldBeBetter?.trim() &&
    !d.voiceNote?.trim() &&
    !d.lifeEventNote?.trim()
  )
}
