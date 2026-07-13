import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useSettingsStore } from './store/useSettingsStore'
import { useAppStore } from './store/useAppStore'
import { Onboarding } from './components/Onboarding/Onboarding'
import { LifeGrid } from './components/LifeGrid/LifeGrid'
import { AIChatPlaceholder } from './components/AIChat/AIChatPlaceholder'

const NAV = [
  { id: 'grid',     label: 'Grid',     icon: GridIcon },
  { id: 'today',    label: 'Today',    icon: TodayIcon },
  { id: 'ai',       label: 'AI Chat',  icon: AIIcon },
  { id: 'tasks',    label: 'Tasks',    icon: TasksIcon },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
]

export default function App() {
  const { profile, loaded, load } = useSettingsStore()
  const [activeTab, setActiveTab] = useState('grid')

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
          {activeTab === 'ai' && (
            <TabPanel key="ai">
              <AIChatPlaceholder name={profile.name} />
            </TabPanel>
          )}
          {activeTab !== 'grid' && activeTab !== 'ai' && (
            <TabPanel key={activeTab}>
              <ComingSoon tab={activeTab} />
            </TabPanel>
          )}
        </AnimatePresence>
      </main>

      <BottomNav active={activeTab} onChange={setActiveTab} />
    </div>
  )
}

/* ── Header ── */
function Header({ profile }) {
  const [logoSrc, setLogoSrc] = useState(() => localStorage.getItem('lifelog_logo') || null)

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

  return (
    <header className="flex items-center justify-between px-4 shrink-0 border-b border-[#1a1a1a]"
      style={{ paddingTop: `calc(env(safe-area-inset-top) + 12px)`, paddingBottom: 12 }}>

      {/* Logo / app name */}
      <label className="flex items-center gap-2 cursor-pointer group" title="Tap to upload logo">
        <input type="file" accept="image/*" className="hidden" onChange={handleLogoPick} />
        {logoSrc ? (
          <img src={logoSrc} alt="Life Log" className="h-7 w-7 rounded-lg object-cover" />
        ) : (
          <div className="h-7 w-7 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] border-dashed flex items-center justify-center group-hover:border-[#a78bfa] transition-colors">
            <span className="text-[10px] text-[#333] group-hover:text-[#a78bfa]">+</span>
          </div>
        )}
        <span className="text-[#f0f0f0] font-light text-lg tracking-wide">Life Log</span>
      </label>

      {/* User chip */}
      <div className="flex items-center gap-1.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-full px-3 py-1.5">
        <span className="text-[#888] text-xs">{profile.name}</span>
        <span className="text-[#333] text-xs">·</span>
        <span className="text-[#555] text-xs">{profile.lifeExpectancy}yr</span>
      </div>
    </header>
  )
}

/* ── Bottom nav ── */
function BottomNav({ active, onChange }) {
  return (
    <nav
      className="grid shrink-0 border-t border-[#1a1a1a] bg-[#0a0a0a]"
      style={{
        gridTemplateColumns: `repeat(${NAV.length}, 1fr)`,
        paddingBottom: 'env(safe-area-inset-bottom)',
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
              style={{ color: isActive ? '#a78bfa' : '#3a3a3a' }}
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
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="2" y="2" width="7" height="7" rx="1.5" fill={active ? '#a78bfa' : '#3a3a3a'} />
      <rect x="11" y="2" width="7" height="7" rx="1.5" fill={active ? '#a78bfa' : '#2a2a2a'} />
      <rect x="2" y="11" width="7" height="7" rx="1.5" fill={active ? '#a78bfa' : '#2a2a2a'} />
      <rect x="11" y="11" width="7" height="7" rx="1.5" fill={active ? '#a78bfa' : '#2a2a2a'} />
    </svg>
  )
}

function TodayIcon({ active }) {
  const c = active ? '#a78bfa' : '#3a3a3a'
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="3" y="4" width="14" height="13" rx="2" stroke={c} strokeWidth="1.5" />
      <path d="M7 2v3M13 2v3" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M3 8h14" stroke={c} strokeWidth="1.5" />
      <circle cx="10" cy="13" r="1.5" fill={c} />
    </svg>
  )
}

function AIIcon({ active }) {
  const c = active ? '#a78bfa' : '#3a3a3a'
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M4 14.5C4 14.5 3 17 2 18c1.5-.5 3.5-1.5 4.5-2H15a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v7.5c0 1.1.9 2 2 2h-.5z" stroke={c} strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="7" cy="9" r="1" fill={c} />
      <circle cx="10" cy="9" r="1" fill={c} />
      <circle cx="13" cy="9" r="1" fill={c} />
    </svg>
  )
}

function TasksIcon({ active }) {
  const c = active ? '#a78bfa' : '#3a3a3a'
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
  const c = active ? '#a78bfa' : '#3a3a3a'
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="2.5" stroke={c} strokeWidth="1.5" />
      <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.22 4.22l1.42 1.42M14.36 14.36l1.42 1.42M4.22 15.78l1.42-1.42M14.36 5.64l1.42-1.42" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}
