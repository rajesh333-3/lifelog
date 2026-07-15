import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useSettingsStore } from './store/useSettingsStore'
import { useAppStore } from './store/useAppStore'
import { Onboarding } from './components/Onboarding/Onboarding'
import { LifeGrid } from './components/LifeGrid/LifeGrid'
import { DayView } from './components/DayView/DayView'
import { InsightsView } from './components/Insights/InsightsView'
import { EisenhowerBoard } from './components/Eisenhower/EisenhowerBoard'
import { Settings } from './components/Settings/Settings'
import { CalendarTrigger, CalendarPicker } from './components/Calendar/CalendarPicker'
import { WelcomeTour } from './components/Tour/WelcomeTour'
import { SearchOverlay } from './components/Search/SearchOverlay'
import { todayStr } from './utils/dateUtils'
import { seedCommitmentTasks } from './db'

const LOADING_QUOTES = [
  'Capture today.\nUnderstand yesterday.\nShape tomorrow.',
  'Life is short.\nLook at your grid.',
  'Every dot is a week\nyou\'ll never get back —\nor one you can still shape.',
  'Write your story,\none day at a time.',
  'The weeks don\'t wait.\nBut you still have time.',
  'Small days\nbuild extraordinary years.',
]

const NAV = [
  { id: 'grid',     label: 'Grid',     icon: GridIcon },
  { id: 'today',    label: 'Today',    icon: TodayIcon },
  { id: 'ai',       label: 'Insights', icon: InsightsIcon },
  { id: 'tasks',    label: 'Tasks',    icon: TasksIcon },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
]

export default function App() {
  const { profile, loaded, load } = useSettingsStore()
  const [activeTab,   setActiveTab]   = useState('grid')
  const [tabDir,      setTabDir]      = useState(0)
  const [showTour,    setShowTour]    = useState(false)
  const [showSearch,  setShowSearch]  = useState(false)
  const [calOpen,     setCalOpen]     = useState(false)
  const [splashDone,  setSplashDone]  = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setSplashDone(true), 2600)
    return () => clearTimeout(t)
  }, [])

  const openDayView  = useAppStore(s => s.openDayView)
  const selectedDate = useAppStore(s => s.selectedDate)
  const activePanel  = useAppStore(s => s.activePanel)
  const closePanel   = useAppStore(s => s.closePanel)

  const prevTabRef = useRef(activeTab)
  const tabDirRef  = useRef(0)
  const handleTabChange = (tab) => {
    const prev = prevTabRef.current
    const prevIdx = NAV.findIndex(n => n.id === prev)
    const nextIdx = NAV.findIndex(n => n.id === tab)
    tabDirRef.current = nextIdx > prevIdx ? 1 : -1
    prevTabRef.current = tab
    closePanel()
    setActiveTab(tab)
  }

  useEffect(() => { load() }, [load])

  // Seed commitment tasks for existing users who completed onboarding before this feature
  const pillars = useSettingsStore(s => s.pillars)
  useEffect(() => {
    if (loaded && profile && pillars) {
      seedCommitmentTasks(pillars)
    }
  }, [loaded, profile, pillars])

  // Show tour once after onboarding completes
  useEffect(() => {
    if (profile && !localStorage.getItem('lifelog_tour_done')) {
      setShowTour(true)
    }
  }, [profile])

  if (!loaded) {
    return (
      <>
        <div className="min-h-dvh bg-[#0a0a0a]" />
        <AnimatePresence>{!splashDone && <SplashScreen />}</AnimatePresence>
      </>
    )
  }

  if (!profile) {
    return (
      <>
        <Onboarding onComplete={load} />
        <AnimatePresence>{!splashDone && <SplashScreen />}</AnimatePresence>
      </>
    )
  }

  return (
    <>
    <div className="min-h-dvh bg-[#0a0a0a] flex flex-col select-none">
      <Header profile={profile} onReplayTour={() => setShowTour(true)} onSearch={() => setShowSearch(true)} />

      <AnimatePresence>
        {showTour && (
          <WelcomeTour onDone={() => setShowTour(false)} />
        )}
      </AnimatePresence>

      <main className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {activeTab === 'grid' && (
            <TabPanel key="grid" dir={tabDirRef.current}>
              <div className="relative h-full">
                <LifeGrid dob={profile.dob} lifeExpectancy={profile.lifeExpectancy} />
                <div className="absolute top-3 left-3 z-10 pointer-events-none">
                  <TodayPill />
                </div>
                {profile?.dob && (
                  <div className="absolute top-3 right-3 z-10 pointer-events-auto">
                    <CalendarTrigger dob={profile.dob} onOpen={() => setCalOpen(true)} />
                  </div>
                )}
              </div>
            </TabPanel>
          )}
          {activeTab === 'today' && (
            <TabPanel key="today" dir={tabDirRef.current}>
              <DayView initialDate={todayStr()} />
            </TabPanel>
          )}
          {activeTab === 'ai' && (
            <TabPanel key="ai" dir={tabDirRef.current}>
              <InsightsView />
            </TabPanel>
          )}
          {activeTab === 'tasks' && (
            <TabPanel key="tasks" dir={tabDirRef.current}>
              <EisenhowerBoard />
            </TabPanel>
          )}
          {activeTab === 'settings' && (
            <TabPanel key="settings" dir={tabDirRef.current}>
              <Settings onReplayTour={() => setShowTour(true)} />
            </TabPanel>
          )}
          {activeTab !== 'grid' && activeTab !== 'today' && activeTab !== 'ai' && activeTab !== 'tasks' && activeTab !== 'settings' && (
            <TabPanel key={activeTab} dir={tabDirRef.current}>
              <ComingSoon tab={activeTab} />
            </TabPanel>
          )}
        </AnimatePresence>
      </main>

      <BottomNav active={activeTab} onChange={handleTabChange} />

      {/* DayView overlay — opened from grid dot tap or search result */}
      <AnimatePresence>
        {activePanel === 'dayView' && selectedDate && (
          <DayView key={selectedDate} initialDate={selectedDate} asOverlay />
        )}
      </AnimatePresence>

      {/* Calendar picker — lives at app level, triggered from grid tab */}
      <CalendarPicker dob={profile.dob} open={calOpen} onClose={() => setCalOpen(false)} />

      {/* Search overlay */}
      <AnimatePresence>
        {showSearch && (
          <SearchOverlay
            onClose={() => setShowSearch(false)}
            onSelectDate={(date) => { openDayView(date); setShowSearch(false) }}
          />
        )}
      </AnimatePresence>
    </div>
    <AnimatePresence>{!splashDone && <SplashScreen />}</AnimatePresence>
    </>
  )
}

/* ── Search hint data ── */
const SEARCH_HINTS = [
  { text: 'great gym session…',      color: '#4ade80' },
  { text: 'felt anxious today…',     color: '#f87171' },
  { text: 'productive deep work…',   color: '#a78bfa' },
  { text: 'coffee with a friend…',   color: '#60a5fa' },
  { text: "couldn't sleep well…",    color: '#fbbf24' },
  { text: 'meditation morning…',     color: '#34d399' },
  { text: 'hit my goal today…',      color: '#4ade80' },
  { text: 'rough week overall…',     color: '#f97316' },
  { text: 'cleared my task list…',   color: '#a78bfa' },
  { text: 'journaled about stress…', color: '#fb7185' },
]

/* ── Animated search bar ── */
function AnimatedSearchBar({ onClick }) {
  const [idx,     setIdx]     = useState(0)
  const [hovered, setHovered] = useState(false)

  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % SEARCH_HINTS.length), 2800)
    return () => clearInterval(t)
  }, [])

  const hint = SEARCH_HINTS[idx]

  return (
    <motion.button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex items-center gap-2.5 w-full active:scale-[0.97]"
      animate={{
        boxShadow: hovered
          ? '0 0 0 1.5px rgba(167,139,250,0.35), 0 0 18px rgba(167,139,250,0.12)'
          : '0 0 0 1px rgba(255,255,255,0.07)',
        backgroundColor: hovered
          ? 'rgba(167,139,250,0.07)'
          : 'rgba(255,255,255,0.04)',
      }}
      transition={{ duration: 0.18 }}
      style={{
        borderRadius:            11,
        padding:                 '7px 12px',
        border:                  'none',
        cursor:                  'pointer',
        WebkitTapHighlightColor: 'transparent',
        overflow:                'hidden',
        height:                  36,
      }}
    >
      {/* Search icon */}
      <motion.div
        className="shrink-0"
        animate={hovered ? { scale: 1.15 } : { scale: 1 }}
        transition={{ duration: 0.18 }}
      >
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
          <circle cx="5.5" cy="5.5" r="4"
            stroke={hovered ? '#a78bfa' : '#666'}
            strokeWidth="1.4"
            style={{ transition: 'stroke 0.18s' }}
          />
          <path d="M9 9l2.5 2.5"
            stroke={hovered ? '#a78bfa' : '#666'}
            strokeWidth="1.4" strokeLinecap="round"
            style={{ transition: 'stroke 0.18s' }}
          />
        </svg>
      </motion.div>

      {/* Cycling hint text */}
      <div className="flex-1 min-w-0 relative" style={{ height: 18, overflow: 'hidden' }}>
        <AnimatePresence mode="wait">
          <motion.span
            key={idx}
            initial={{ opacity: 0, y: 9 }}
            animate={{ opacity: 1, y: 0 }}
            exit={  { opacity: 0, y: -9 }}
            transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{
              position:      'absolute',
              inset:         0,
              display:       'flex',
              alignItems:    'center',
              fontSize:      12,
              fontWeight:    500,
              color:         hint.color,
              whiteSpace:    'nowrap',
              overflow:      'hidden',
              textOverflow:  'ellipsis',
              letterSpacing: '0.01em',
            }}
          >
            {hint.text}
          </motion.span>
        </AnimatePresence>
      </div>

      {/* Tap hint */}
      <span style={{
        fontSize:   9,
        fontWeight: 500,
        color:      hovered ? 'rgba(167,139,250,0.7)' : 'rgba(255,255,255,0.18)',
        flexShrink: 0,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        transition: 'color 0.18s',
      }}>
        search
      </span>
    </motion.button>
  )
}

/* ── Header ── */
function Header({ profile, onSearch }) {
  const [totalsMode, setTotals] = useState(false)

  const age       = profile.dob ? computeAge(profile.dob) : null
  const firstName = profile.name?.split(' ')[0] ?? profile.name

  return (
    <header
      className="flex items-center gap-2.5 px-3 shrink-0 border-b border-[#1a1a1a]"
      style={{ paddingTop: `calc(env(safe-area-inset-top) + 9px)`, paddingBottom: 9 }}
    >
      {/* Logo */}
      <img
        src="/icons/icon-192.png"
        alt="Life Log"
        style={{
          width:        34,
          height:       34,
          borderRadius: 10,
          objectFit:    'cover',
          flexShrink:   0,
          boxShadow:    '0 0 0 1px rgba(167,139,250,0.15), 0 2px 10px rgba(167,139,250,0.18)',
        }}
      />

      {/* Brand · name — fixed width, no shrink */}
      <div className="flex items-center gap-1.5 shrink-0">
        <span style={{
          fontFamily:    "'Outfit', system-ui, sans-serif",
          fontSize:      16,
          fontWeight:    800,
          color:         '#f0f0f0',
          letterSpacing: '-0.5px',
          lineHeight:    1,
        }}>
          Life Log
        </span>
        <span style={{
          width:        4,
          height:       4,
          borderRadius: '50%',
          background:   'rgba(167,139,250,0.4)',
          flexShrink:   0,
        }} />
        <span style={{
          fontFamily:    "'Outfit', system-ui, sans-serif",
          fontSize:      13,
          fontWeight:    300,
          fontStyle:     'italic',
          color:         '#c4b5fd',
          letterSpacing: '0.1px',
          lineHeight:    1,
          maxWidth:      72,
          overflow:      'hidden',
          textOverflow:  'ellipsis',
          whiteSpace:    'nowrap',
        }}>
          {firstName}
        </span>
      </div>

      {/* Animated search bar — fills all remaining space */}
      <div className="flex-1 min-w-0">
        <AnimatedSearchBar onClick={onSearch} />
      </div>

      {/* Age pill — fixed, no shrink */}
      {age && (
        <button
          onClick={() => setTotals(t => !t)}
          className="shrink-0 active:scale-95 transition-transform"
          style={{
            display:                 'flex',
            alignItems:              'center',
            gap:                     6,
            background:              'rgba(167,139,250,0.07)',
            border:                  '1px solid rgba(167,139,250,0.16)',
            borderRadius:            11,
            padding:                 '5px 9px',
            cursor:                  'pointer',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <AgeStat n={age.years} u="yr" size={17} color="#a78bfa" glow />
          <div style={{ width: 1, height: 12, background: 'rgba(167,139,250,0.18)' }} />

          {totalsMode ? (
            <>
              <AgeStat n={age.totalWeeks.toLocaleString()} u="wk" size={12} color="#7c6fe0" />
              <div style={{ width: 1, height: 12, background: 'rgba(167,139,250,0.18)' }} />
              <AgeStat n={age.totalDays.toLocaleString()}  u="d"  size={11} color="#5348a8" />
            </>
          ) : (
            <>
              <AgeStat n={age.months} u="mo" size={12} color="#7c6fe0" />
              <div style={{ width: 1, height: 12, background: 'rgba(167,139,250,0.18)' }} />
              <AgeStat n={age.days}   u="d"  size={11} color="#5348a8" />
            </>
          )}
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
      className="grid shrink-0 bg-[#0d0d0d]"
      style={{
        gridTemplateColumns: `repeat(${NAV.length}, 1fr)`,
        paddingBottom: 'env(safe-area-inset-bottom)',
        position: 'relative',
        zIndex: 50,
        borderTop: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {NAV.map(({ id, label, icon: Icon }) => {
        const isActive = active === id
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            className="relative flex flex-col items-center justify-center gap-1 py-3 min-h-[56px] transition-transform duration-100 active:scale-90"
          >
            {/* Sliding active pill */}
            {isActive && (
              <motion.div
                layoutId="nav-pill"
                className="absolute inset-x-2 inset-y-1.5 rounded-xl pointer-events-none"
                style={{
                  background: 'rgba(167,139,250,0.1)',
                  border:     '1px solid rgba(167,139,250,0.2)',
                }}
                transition={{ type: 'spring', stiffness: 440, damping: 38 }}
              />
            )}
            <Icon active={isActive} />
            <span
              className="text-[9px] uppercase tracking-widest font-semibold transition-colors duration-150"
              style={{ color: isActive ? '#a78bfa' : '#666' }}
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
function TabPanel({ children, dir = 0 }) {
  const x = dir * 28  // slide 28px in the direction of travel
  return (
    <motion.div
      className="absolute inset-0"
      initial={{ opacity: 0, x }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -x }}
      transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
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

/* ── Today pill (grid tab top-left) ── */
function TodayPill() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  return (
    <div style={{
      display:       'flex',
      alignItems:    'center',
      gap:           6,
      background:    'rgba(255,255,255,0.04)',
      border:        '1px solid rgba(255,255,255,0.08)',
      borderRadius:  10,
      padding:       '5px 9px',
    }}>
      <span style={{ fontSize: 10, fontWeight: 600, color: '#888', letterSpacing: '-0.2px', lineHeight: 1 }}>
        {dateStr}
      </span>
      <div style={{ width: 1, height: 10, background: 'rgba(255,255,255,0.1)', flexShrink: 0 }} />
      <span style={{ fontSize: 10, fontWeight: 700, color: '#a78bfa', letterSpacing: '-0.3px', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
        {timeStr}
      </span>
    </div>
  )
}

/* ── Splash screen ── */
function SplashScreen() {
  return (
    <motion.div
      className="fixed inset-0 flex flex-col items-center justify-center bg-[#0a0a0a]"
      style={{ zIndex: 200 }}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.04 }}
      transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Logo */}
      <motion.img
        src="/icons/icon-192.png"
        alt="Life Log"
        initial={{ scale: 0.3, opacity: 0 }}
        animate={{ scale: 1,   opacity: 1 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        style={{
          width:        128,
          height:       128,
          borderRadius: 30,
          boxShadow:    '0 0 0 1.5px rgba(167,139,250,0.28), 0 16px 64px rgba(167,139,250,0.5)',
        }}
      />

      {/* Brand */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.38, ease: 'easeOut' }}
        style={{ marginTop: 28, textAlign: 'center' }}
      >
        <span style={{
          fontFamily:    "'Outfit', system-ui, sans-serif",
          fontSize:      30,
          fontWeight:    800,
          color:         '#f0f0f0',
          letterSpacing: '-1.2px',
          lineHeight:    1,
          display:       'block',
        }}>
          Life Log
        </span>
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ duration: 0.45, delay: 0.65 }}
          style={{
            display:       'block',
            marginTop:     7,
            fontSize:      12,
            color:         '#a78bfa',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            fontWeight:    500,
          }}
        >
          Live intentionally
        </motion.span>
      </motion.div>

      {/* Subtle progress line */}
      <motion.div
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 0.35 }}
        transition={{ duration: 2.2, delay: 0.25, ease: 'easeInOut' }}
        style={{
          position:        'absolute',
          bottom:          '18%',
          width:           80,
          height:          1.5,
          background:      'linear-gradient(90deg, transparent, #a78bfa, transparent)',
          transformOrigin: 'left',
        }}
      />
    </motion.div>
  )
}

/* ── Nav icons ── */
function GridIcon({ active }) {
  const c = active ? '#a78bfa' : '#686868'
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
  const c = active ? '#a78bfa' : '#686868'
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
  const c = active ? '#a78bfa' : '#686868'
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
  const c = active ? '#a78bfa' : '#686868'
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
  const c = active ? '#a78bfa' : '#686868'
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="2.5" stroke={c} strokeWidth="1.5" />
      <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.22 4.22l1.42 1.42M14.36 14.36l1.42 1.42M4.22 15.78l1.42-1.42M14.36 5.64l1.42-1.42" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}
