import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useSettingsStore } from './store/useSettingsStore'
import { useAppStore } from './store/useAppStore'
import { Onboarding } from './components/Onboarding/Onboarding'
import { LifeGrid } from './components/LifeGrid/LifeGrid'
import { DayView } from './components/DayView/DayView'
import { InsightsView } from './components/Insights/InsightsView'
import { EisenhowerBoard } from './components/Eisenhower/EisenhowerBoard'
import { Settings } from './components/Settings/Settings'
import { todayStr } from './utils/dateUtils'

const NAV = [
  { id: 'grid',     label: 'Grid',     icon: GridIcon },
  { id: 'today',    label: 'Today',    icon: TodayIcon },
  { id: 'ai',       label: 'Insights', icon: InsightsIcon },
  { id: 'tasks',    label: 'Tasks',    icon: TasksIcon },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
]

export default function App() {
  const { profile, loaded, load } = useSettingsStore()
  const [activeTab, setActiveTab]     = useState('grid')
  const [dayViewDate, setDayViewDate] = useState(null)  // null = closed

  // LifeGrid dot clicks open DayView
  const openDayView = useAppStore(s => s.openDayView)
  const selectedDate = useAppStore(s => s.selectedDate)
  const activePanel  = useAppStore(s => s.activePanel)
  const closePanel   = useAppStore(s => s.closePanel)

  useEffect(() => { load() }, [load])

  if (!loaded) {
    return (
      <div className="min-h-dvh bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-2 h-2 rounded-full bg-[#a78bfa] animate-ping" />
      </div>
    )
  }

  if (!profile) {
    return <Onboarding onComplete={load} />
  }

  return (
    <div className="min-h-dvh bg-[#0a0a0a] flex flex-col select-none">
      <Header profile={profile} />

      <main className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {activeTab === 'grid' && (
            <TabPanel key="grid">
              <div className="h-full overflow-auto px-3 py-3">
                <LifeGrid dob={profile.dob} lifeExpectancy={profile.lifeExpectancy} />
              </div>
            </TabPanel>
          )}
          {activeTab === 'today' && (
            <TabPanel key="today">
              <DayView initialDate={todayStr()} />
            </TabPanel>
          )}
          {activeTab === 'ai' && (
            <TabPanel key="ai">
              <InsightsView />
            </TabPanel>
          )}
          {activeTab === 'tasks' && (
            <TabPanel key="tasks">
              <EisenhowerBoard />
            </TabPanel>
          )}
          {activeTab === 'settings' && (
            <TabPanel key="settings">
              <Settings />
            </TabPanel>
          )}
          {activeTab !== 'grid' && activeTab !== 'today' && activeTab !== 'ai' && activeTab !== 'tasks' && activeTab !== 'settings' && (
            <TabPanel key={activeTab}>
              <ComingSoon tab={activeTab} />
            </TabPanel>
          )}
        </AnimatePresence>
      </main>

      <BottomNav active={activeTab} onChange={(tab) => { closePanel(); setActiveTab(tab) }} />

      {/* DayView overlay — opened from grid dot tap */}
      <AnimatePresence>
        {activePanel === 'dayView' && selectedDate && (
          <DayView key={selectedDate} initialDate={selectedDate} asOverlay />
        )}
      </AnimatePresence>
    </div>
  )
}

/* ── Header ── */
function Header({ profile }) {
  const [logoSrc, setLogoSrc]   = useState(() => localStorage.getItem('lifelog_logo') || null)
  const [totalsMode, setTotals] = useState(false)  // false = yr/mo/d, true = yr/wk/d-total

  function handleLogoPick(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const src = ev.target.result
      setLogoSrc(src)
      localStorage.setItem('lifelog_logo', src)
    }
    reader.readAsDataURL(file)
  }

  const age = profile.dob ? computeAge(profile.dob) : null

  return (
    <header className="flex items-center gap-3 px-4 shrink-0 border-b border-[#1a1a1a]"
      style={{ paddingTop: `calc(env(safe-area-inset-top) + 10px)`, paddingBottom: 10 }}>

      {/* Logo upload */}
      <label className="cursor-pointer group shrink-0" title="Tap to change logo">
        <input type="file" accept="image/*" className="hidden" onChange={handleLogoPick} />
        {logoSrc ? (
          <img src={logoSrc} alt="Life Log" className="h-7 w-7 rounded-lg object-cover" />
        ) : (
          <div className="h-7 w-7 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] border-dashed flex items-center justify-center group-hover:border-[#a78bfa] transition-colors">
            <span className="text-[10px] text-[#333] group-hover:text-[#a78bfa]">+</span>
          </div>
        )}
      </label>

      {/* App title + name */}
      <div className="flex items-baseline gap-2 min-w-0 flex-1">
        <span className="text-[#f0f0f0] font-light text-lg tracking-wide shrink-0">Life Log</span>
        <span className="text-[#444] text-sm shrink-0">·</span>
        <span className="text-[#555] text-xs truncate max-w-[90px]">{profile.name}</span>
      </div>

      {/* Live age pill — tap to toggle between yr/mo/d and yr/wk/d-total */}
      {age && (
        <button
          onClick={() => setTotals(t => !t)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'rgba(167,139,250,0.07)',
            border: '1px solid rgba(167,139,250,0.16)',
            borderRadius: 12,
            padding: '5px 11px',
            flexShrink: 0,
            cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <AgeStat n={age.years} u="yr" size={19} color="#a78bfa" glow />
          <div style={{ width: 1, height: 14, background: 'rgba(167,139,250,0.18)' }} />

          {totalsMode ? (
            <>
              <AgeStat n={age.totalWeeks.toLocaleString()} u="wk" size={14} color="#7c6fe0" />
              <div style={{ width: 1, height: 14, background: 'rgba(167,139,250,0.18)' }} />
              <AgeStat n={age.totalDays.toLocaleString()}  u="d"  size={12} color="#5348a8" />
            </>
          ) : (
            <>
              <AgeStat n={age.months} u="mo" size={14} color="#7c6fe0" />
              <div style={{ width: 1, height: 14, background: 'rgba(167,139,250,0.18)' }} />
              <AgeStat n={age.days}   u="d"  size={12} color="#5348a8" />
            </>
          )}

          {/* Swap icon */}
          <svg width="9" height="9" viewBox="0 0 10 10" fill="none" style={{ marginLeft: 2, opacity: 0.3 }}>
            <path d="M1 3h8M7 1l2 2-2 2M9 7H1M3 5l-2 2 2 2" stroke="#a78bfa" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}
    </header>
  )
}

function AgeStat({ n, u, size, color, glow }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
      <span style={{
        fontSize: size,
        fontWeight: 700,
        color,
        fontVariantNumeric: 'tabular-nums',
        letterSpacing: -0.5,
        lineHeight: 1,
        textShadow: glow ? `0 0 18px ${color}66` : 'none',
      }}>{n}</span>
      <span style={{
        fontSize: 8,
        fontWeight: 500,
        color: color + '88',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
      }}>{u}</span>
    </div>
  )
}

function computeAge(dob) {
  const today = new Date()
  const birth = new Date(dob + 'T00:00:00')

  // Exact breakdown: years, months, days
  let years  = today.getFullYear() - birth.getFullYear()
  let months = today.getMonth()    - birth.getMonth()
  let days   = today.getDate()     - birth.getDate()

  if (days < 0) {
    months--
    // days remaining from the previous month
    days += new Date(today.getFullYear(), today.getMonth(), 0).getDate()
  }
  if (months < 0) {
    years--
    months += 12
  }

  // Totals
  const totalDays  = Math.floor((today - birth) / 86400000)
  const totalWeeks = Math.floor(totalDays / 7)

  return { years, months, days, totalWeeks, totalDays }
}

/* ── Bottom nav ── */
function BottomNav({ active, onChange }) {
  return (
    <nav
      className="grid shrink-0 border-t border-[#1a1a1a] bg-[#0a0a0a]"
      style={{
        gridTemplateColumns: `repeat(${NAV.length}, 1fr)`,
        paddingBottom: 'env(safe-area-inset-bottom)',
        position: 'relative',
        zIndex: 50,
      }}
    >
      {NAV.map(({ id, label, icon: Icon }) => {
        const isActive = active === id
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            className="flex flex-col items-center justify-center gap-1 py-3 min-h-[56px] active:scale-95 transition-transform duration-100"
          >
            <Icon active={isActive} />
            <span
              className="text-[9px] uppercase tracking-widest font-medium transition-colors duration-150"
              style={{ color: isActive ? '#a78bfa' : '#555' }}
            >
              {label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}

/* ── Tab panel wrapper ── */
function TabPanel({ children }) {
  return (
    <motion.div
      className="absolute inset-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      {children}
    </motion.div>
  )
}

/* ── Coming soon stub ── */
function ComingSoon({ tab }) {
  const labels = {
    today:    { title: 'Day View',    sub: 'Log your day — journal, sliders, checklist. Coming in Phase 2.' },
    tasks:    { title: 'Eisenhower',  sub: 'AI-powered task matrix. Coming in Phase 4.' },
    settings: { title: 'Settings',   sub: 'Pillars, AI config, reminders. Coming in Phase 3.' },
  }
  const { title, sub } = labels[tab] ?? { title: tab, sub: '' }
  return (
    <div className="h-full flex flex-col items-center justify-center px-8 gap-3">
      <p className="text-[#f0f0f0] text-xl font-light">{title}</p>
      <p className="text-[#444] text-sm text-center">{sub}</p>
    </div>
  )
}

/* ── Nav icons ── */
function GridIcon({ active }) {
  const c = active ? '#a78bfa' : '#555'
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="2" y="2" width="7" height="7" rx="1.5" fill={c} />
      <rect x="11" y="2" width="7" height="7" rx="1.5" fill={c} opacity={active ? 1 : 0.7} />
      <rect x="2" y="11" width="7" height="7" rx="1.5" fill={c} opacity={active ? 1 : 0.7} />
      <rect x="11" y="11" width="7" height="7" rx="1.5" fill={c} opacity={active ? 1 : 0.7} />
    </svg>
  )
}

function TodayIcon({ active }) {
  const c = active ? '#a78bfa' : '#555'
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="3" y="4" width="14" height="13" rx="2" stroke={c} strokeWidth="1.5" />
      <path d="M7 2v3M13 2v3" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M3 8h14" stroke={c} strokeWidth="1.5" />
      <circle cx="10" cy="13" r="1.5" fill={c} />
    </svg>
  )
}

function InsightsIcon({ active }) {
  const c = active ? '#a78bfa' : '#555'
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M2 15l4.5-5.5 4 3.5 4-6 3.5 3" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="6.5" cy="9.5"  r="1.5" fill={c} opacity={active ? 1 : 0.7} />
      <circle cx="10.5" cy="13" r="1.5" fill={c} opacity={active ? 1 : 0.7} />
      <circle cx="14.5" cy="7"  r="1.5" fill={c} opacity={active ? 1 : 0.7} />
    </svg>
  )
}

function TasksIcon({ active }) {
  const c = active ? '#a78bfa' : '#555'
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="2" y="2" width="7" height="7" rx="1" stroke={c} strokeWidth="1.5" />
      <rect x="11" y="2" width="7" height="7" rx="1" stroke={c} strokeWidth="1.5" />
      <rect x="2" y="11" width="7" height="7" rx="1" stroke={c} strokeWidth="1.5" />
      <rect x="11" y="11" width="7" height="7" rx="1" stroke={c} strokeWidth="1.5" />
    </svg>
  )
}

function SettingsIcon({ active }) {
  const c = active ? '#a78bfa' : '#555'
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="2.5" stroke={c} strokeWidth="1.5" />
      <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.22 4.22l1.42 1.42M14.36 14.36l1.42 1.42M4.22 15.78l1.42-1.42M14.36 5.64l1.42-1.42" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}
