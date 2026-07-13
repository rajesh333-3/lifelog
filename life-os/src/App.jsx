import { useEffect } from 'react'
import { useSettingsStore } from './store/useSettingsStore'
import { Onboarding } from './components/Onboarding/Onboarding'
import { LifeGrid } from './components/LifeGrid/LifeGrid'

export default function App() {
  const { profile, loaded, load } = useSettingsStore()

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
    <div className="min-h-dvh bg-[#0a0a0a] flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-[#1a1a1a] shrink-0">
        <h1 className="text-[#f0f0f0] font-light text-lg tracking-wide">Life OS</h1>
        <div className="flex items-center gap-2 text-[#888] text-xs">
          <span>{profile.name}</span>
          <span className="text-[#333]">·</span>
          <span>{profile.lifeExpectancy}yr target</span>
        </div>
      </header>

      {/* Grid fills remaining space */}
      <main className="flex-1 overflow-auto px-3 py-4">
        <LifeGrid dob={profile.dob} lifeExpectancy={profile.lifeExpectancy} />
      </main>

      {/* Bottom nav — placeholder, wired up in Phase 2 */}
      <nav className="flex border-t border-[#1a1a1a] shrink-0" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {[
          { icon: '⬛', label: 'Grid' },
          { icon: '✏️', label: 'Today' },
          { icon: '🤖', label: 'AI Chat' },
          { icon: '⚡', label: 'Tasks' },
          { icon: '⚙️', label: 'Settings' },
        ].map(({ icon, label }) => (
          <button
            key={label}
            className="flex-1 flex flex-col items-center gap-1 py-3 text-[#444] active:text-[#a78bfa] min-h-[60px]"
          >
            <span className="text-xl">{icon}</span>
            <span className="text-[9px] uppercase tracking-widest">{label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
