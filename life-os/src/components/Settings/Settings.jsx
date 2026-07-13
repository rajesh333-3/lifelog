import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSettingsStore } from '../../store/useSettingsStore'
import { useLLM } from '../AIChat/useLLM'
import { getHabits, saveHabits } from '../../db'
import { NextReleaseBanner } from '../UI/NextReleaseBanner'

const PILLAR_META = [
  { key: 'physical', label: 'Physical', icon: '💪', color: '#4ade80' },
  { key: 'mental',   label: 'Mental',   icon: '🧠', color: '#60a5fa' },
  { key: 'work',     label: 'Work',     icon: '💼', color: '#fbbf24' },
]

export function Settings({ onReplayTour }) {
  const [section, setSection] = useState('profile')

  return (
    <div className="h-full flex flex-col bg-[#0a0a0a]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#1a1a1a] shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-[#f0f0f0] text-sm font-medium">Settings</h1>
          <p className="text-[#444] text-xs mt-0.5">Profile, AI, pillars & reminders</p>
        </div>
        <button
          onClick={onReplayTour}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-medium active:opacity-60 transition-opacity"
          style={{ background: '#141414', border: '1px solid #242424', color: '#555' }}
        >
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
            <path d="M2 6a4 4 0 1 0 4-4V1L4 3l2 2V4a3 3 0 1 1-3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Tour
        </button>
      </div>

      {/* Section tabs */}
      <div className="flex gap-1 px-3 pt-3 pb-0 shrink-0 overflow-x-auto no-scrollbar">
        {[
          { id: 'profile',   label: 'Profile'   },
          { id: 'ai',        label: 'AI'        },
          { id: 'pillars',   label: 'Pillars'   },
          { id: 'habits',    label: 'Habits'    },
          { id: 'reminders', label: 'Reminders' },
        ].map(({ id, label }) => (
          <button key={id} onClick={() => setSection(id)}
            className="shrink-0 py-2 px-3 text-xs font-medium rounded-xl transition-all"
            style={{
              background: section === id ? '#1e1e1e' : 'transparent',
              color:      section === id ? '#a78bfa' : '#444',
              border:     `1px solid ${section === id ? '#2a2a2a' : 'transparent'}`,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Section content */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="max-w-lg mx-auto px-4 py-5">
          <AnimatePresence mode="wait">
            {section === 'profile'   && <ProfileSection   key="profile"   />}
            {section === 'ai'        && <AISection        key="ai"        />}
            {section === 'pillars'   && <PillarsSection   key="pillars"   />}
            {section === 'habits'    && <HabitsSettings   key="habits"    />}
            {section === 'reminders' && <RemindersSection key="reminders" />}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

/* ── Section wrapper ── */
function Section({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.15 }}
      className="flex flex-col gap-4"
    >
      {children}
    </motion.div>
  )
}

/* ── Card wrapper ── */
function Card({ children, className = '' }) {
  return (
    <div className={`rounded-2xl overflow-hidden ${className}`} style={{ background: '#141414', border: '1px solid #242424' }}>
      {children}
    </div>
  )
}

function CardRow({ label, children }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5 last:border-0" style={{ borderBottom: '1px solid #1e1e1e' }}>
      <span className="text-[#555] text-xs w-24 shrink-0">{label}</span>
      <div className="flex-1 flex justify-end">{children}</div>
    </div>
  )
}

/* ── Shared field ── */
function Field({ value, onChange, type = 'text', placeholder, min, max }) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      min={min}
      max={max}
      className="rounded-xl px-3 py-2.5 text-sm text-[#e0e0e0] text-right placeholder:text-[#383838] focus:outline-none w-full transition-colors"
      style={{ background: '#1c1c1c', border: '1px solid #2e2e2e' }}
      onFocus={e => e.target.style.borderColor = 'rgba(167,139,250,0.5)'}
      onBlur={e => e.target.style.borderColor = '#2e2e2e'}
    />
  )
}

/* ── Save button ── */
function SaveBtn({ onSave, label = 'Save changes' }) {
  const [state, setState] = useState('idle')

  async function handle() {
    setState('saving')
    try {
      await onSave()
      setState('saved')
      setTimeout(() => setState('idle'), 2000)
    } catch {
      setState('idle')
    }
  }

  return (
    <button onClick={handle} disabled={state === 'saving'}
      className="w-full py-3.5 rounded-2xl text-sm font-semibold transition-all active:opacity-80 disabled:opacity-50"
      style={{ background: state === 'saved' ? '#4ade80' : '#a78bfa', color: '#0a0a0a' }}
    >
      {state === 'saving' ? 'Saving…' : state === 'saved' ? '✓ Saved' : label}
    </button>
  )
}

/* ══════════ Profile Section ══════════ */
function ProfileSection() {
  const { profile, saveProfile } = useSettingsStore()
  const [name,            setName]            = useState(profile?.name            ?? '')
  const [dob,             setDob]             = useState(profile?.dob             ?? '')
  const [lifeExpectancy,  setLifeExpectancy]  = useState(profile?.lifeExpectancy  ?? 85)

  async function save() {
    await saveProfile({ ...profile, name: name.trim(), dob, lifeExpectancy: Number(lifeExpectancy) })
  }

  return (
    <Section>
      <Card>
        <CardRow label="Name">
          <Field value={name} onChange={setName} placeholder="Your name" />
        </CardRow>
        <CardRow label="Date of birth">
          <Field value={dob} onChange={setDob} type="date" />
        </CardRow>
        <CardRow label="Life expectancy">
          <div className="flex items-center gap-3 w-full justify-end">
            <span className="text-[#a78bfa] text-sm font-semibold tabular-nums w-10 text-right">
              {lifeExpectancy}
            </span>
            <input
              type="range" min={50} max={120} value={lifeExpectancy}
              onChange={e => setLifeExpectancy(e.target.value)}
              className="w-32 accent-[#a78bfa]"
            />
          </div>
        </CardRow>
      </Card>
      <SaveBtn onSave={save} />
      <NextReleaseBanner
        title="Data Export & Import"
        description="All your logs are stored only on this device. Export and backup support is coming next release — until then, keep regular device backups to avoid data loss."
      />
    </Section>
  )
}

/* ══════════ AI Section ══════════ */
function AISection() {
  const { llm, saveLLM } = useSettingsStore()
  const { testConnection } = useLLM()
  const [provider,    setProvider]    = useState(llm.provider ?? 'ollama')
  const [ollamaUrl,   setOllamaUrl]   = useState(llm.ollamaUrl ?? 'http://localhost:11434')
  const [ollamaModel, setOllamaModel] = useState(llm.ollamaModel ?? 'qwen2.5:7b')
  const [apiKey,      setApiKey]      = useState(llm.apiKey ?? '')
  const [testState,   setTestState]   = useState('idle')  // idle | testing | ok | fail

  async function save() {
    await saveLLM({ provider, ollamaUrl, ollamaModel, apiKey })
  }

  async function test() {
    setTestState('testing')
    try {
      const reply = await testConnection()
      setTestState(reply?.toLowerCase().includes('ok') ? 'ok' : 'ok')
    } catch {
      setTestState('fail')
    }
    setTimeout(() => setTestState('idle'), 3000)
  }

  return (
    <Section>
      {/* Provider toggle */}
      <Card>
        <div className="flex gap-0 p-2">
          {['ollama', 'gemini'].map(p => (
            <button key={p} onClick={() => setProvider(p)}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{
                background: provider === p ? '#a78bfa' : 'transparent',
                color:      provider === p ? '#0a0a0a' : '#555',
              }}
            >
              {p === 'ollama' ? 'Ollama (local)' : 'Gemini (cloud)'}
            </button>
          ))}
        </div>
      </Card>

      {/* Ollama config */}
      {provider === 'ollama' && (
        <Card>
          <CardRow label="Server URL">
            <Field value={ollamaUrl} onChange={setOllamaUrl} placeholder="http://localhost:11434" />
          </CardRow>
          <CardRow label="Model">
            <Field value={ollamaModel} onChange={setOllamaModel} placeholder="qwen2.5:7b" />
          </CardRow>
        </Card>
      )}

      {/* Gemini config */}
      {provider === 'gemini' && (
        <Card>
          <CardRow label="API Key">
            <input
              type="password"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="AIza…"
              className="rounded-xl px-3 py-2.5 text-sm text-[#e0e0e0] text-right placeholder:text-[#383838] focus:outline-none w-full transition-colors"
      style={{ background: '#1c1c1c', border: '1px solid #2e2e2e' }}
      onFocus={e => e.target.style.borderColor = 'rgba(167,139,250,0.5)'}
      onBlur={e => e.target.style.borderColor = '#2e2e2e'}
            />
          </CardRow>
        </Card>
      )}

      {/* Test connection */}
      <button onClick={test} disabled={testState === 'testing'}
        className="w-full py-3 rounded-2xl text-sm font-medium border transition-all active:opacity-70"
        style={{
          borderColor: testState === 'ok' ? '#4ade80' : testState === 'fail' ? '#f87171' : '#2a2a2a',
          color:       testState === 'ok' ? '#4ade80' : testState === 'fail' ? '#f87171' : '#555',
        }}
      >
        {testState === 'testing' ? 'Testing…'
          : testState === 'ok'   ? '✓ Connected'
          : testState === 'fail' ? '✗ Failed — check settings'
          : 'Test connection'}
      </button>

      <SaveBtn onSave={save} />

      {provider === 'ollama' && (
        <p className="text-[#333] text-xs leading-relaxed px-1">
          Ollama must be running locally. Default model: qwen2.5:7b.
          Install via <span className="text-[#555]">ollama.ai</span>, then run{' '}
          <span className="font-mono text-[#444]">ollama pull qwen2.5:7b</span>.
        </p>
      )}
    </Section>
  )
}

/* ══════════ Pillars Section ══════════ */
function PillarsSection() {
  const { pillars, savePillars } = useSettingsStore()
  const [local, setLocal] = useState({
    physical: [...(pillars?.physical ?? [])],
    mental:   [...(pillars?.mental   ?? [])],
    work:     [...(pillars?.work     ?? [])],
  })

  function addGoal(key, text) {
    if (!text.trim()) return
    setLocal(l => ({ ...l, [key]: [...l[key], text.trim()] }))
  }

  function removeGoal(key, idx) {
    setLocal(l => ({ ...l, [key]: l[key].filter((_, i) => i !== idx) }))
  }

  async function save() {
    await savePillars(local)
  }

  return (
    <Section>
      <p className="text-[#444] text-xs px-1">
        Goals appear in your AI check-in prompt and help calibrate pillar scores.
      </p>
      {PILLAR_META.map(({ key, label, icon, color }) => (
        <Card key={key}>
          <div className="px-4 pt-3.5 pb-2 flex items-center gap-2">
            <span>{icon}</span>
            <span className="text-sm font-medium" style={{ color }}>{label}</span>
          </div>
          <div className="h-px bg-[#1a1a1a]" />
          <div className="p-3 flex flex-col gap-1.5">
            <AnimatePresence initial={false}>
              {local[key].map((goal, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 bg-[#161616] rounded-xl px-3 py-2.5"
                  style={{ border: `1px solid ${color}18` }}
                >
                  <span className="flex-1 text-xs text-[#ccc]">{goal}</span>
                  <button onClick={() => removeGoal(key, i)}
                    className="text-[#333] hover:text-[#f87171] transition-colors text-sm leading-none w-5 h-5 flex items-center justify-center">
                    ×
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
            <GoalInput color={color} onAdd={text => addGoal(key, text)} />
          </div>
        </Card>
      ))}
      <SaveBtn onSave={save} />
    </Section>
  )
}

function GoalInput({ color, onAdd }) {
  const [val, setVal] = useState('')
  function submit() {
    if (!val.trim()) return
    onAdd(val)
    setVal('')
  }
  return (
    <div className="flex gap-2 mt-1">
      <input
        type="text"
        value={val}
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && submit()}
        placeholder="Add a goal…"
        className="flex-1 bg-transparent text-xs text-[#f0f0f0] placeholder:text-[#2a2a2a] focus:outline-none border-b border-[#1e1e1e] focus:border-b pb-1 transition-colors"
        style={{ '--focus-border': color }}
      />
      <button onClick={submit} disabled={!val.trim()}
        className="text-xs px-3 py-1.5 rounded-xl disabled:opacity-20 transition-opacity"
        style={{ background: color + '20', color }}>
        Add
      </button>
    </div>
  )
}

/* ══════════ Habits Settings ══════════ */

const HABIT_EMOJIS = [
  '🏃','🏋️','🧘','🚴','🏊','💪','🥗','😴',
  '📚','🎵','✍️','💭','🎨','🤝','🎮','🧩',
  '💼','📊','🎯','📝','💡','⏰','📅','🚀',
  '💧','🌿','🧹','🙏','⭐','🔥','🫁','🛌',
]

const PILLAR_OPTIONS = [
  { key: 'physical', label: 'Physical', color: '#4ade80' },
  { key: 'mental',   label: 'Mental',   color: '#60a5fa' },
  { key: 'work',     label: 'Work',     color: '#fbbf24' },
]

function HabitsSettings() {
  const [habits,  setHabits]  = useState([])
  const [adding,  setAdding]  = useState(false)
  const [name,    setName]    = useState('')
  const [emoji,   setEmoji]   = useState('⭐')
  const [pillar,  setPillar]  = useState('physical')

  useEffect(() => { getHabits().then(setHabits) }, [])

  async function persist(next) {
    setHabits(next)
    await saveHabits(next)
  }

  async function add() {
    if (!name.trim()) return
    const habit = {
      id:     `h-${habits.length + 1}-${name.slice(0,3).toLowerCase()}`,
      name:   name.trim(),
      emoji,
      pillar,
      active: true,
    }
    await persist([...habits, habit])
    setName(''); setEmoji('⭐'); setPillar('physical'); setAdding(false)
  }

  async function remove(id) {
    await persist(habits.filter(h => h.id !== id))
  }

  async function toggleActive(id) {
    await persist(habits.map(h => h.id === id ? { ...h, active: !h.active } : h))
  }

  return (
    <Section>
      <p className="text-[#444] text-xs px-1 leading-relaxed">
        Habits appear as quick-tap chips in your daily view. Each is linked to a pillar.
      </p>

      {/* Habit list */}
      {habits.length > 0 && (
        <Card>
          <AnimatePresence initial={false}>
            {habits.map((habit, i) => {
              const color = PILLAR_OPTIONS.find(p => p.key === habit.pillar)?.color ?? '#a78bfa'
              return (
                <motion.div
                  key={habit.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-3 px-4 py-3 border-b border-[#1a1a1a] last:border-0"
                >
                  <span className="text-lg leading-none shrink-0">{habit.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#e0e0e0] truncate">{habit.name}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
                      <span className="text-[9px] text-[#444] uppercase tracking-widest capitalize">
                        {habit.pillar}
                      </span>
                    </div>
                  </div>
                  {/* Active toggle */}
                  <button
                    onClick={() => toggleActive(habit.id)}
                    className="w-10 h-6 rounded-full flex items-center px-0.5 shrink-0 transition-colors"
                    style={{
                      background: habit.active !== false ? color + '33' : '#1a1a1a',
                      border:     `1px solid ${habit.active !== false ? color + '55' : '#2a2a2a'}`,
                    }}
                  >
                    <motion.div
                      className="w-4 h-4 rounded-full"
                      style={{ background: habit.active !== false ? color : '#333' }}
                      animate={{ x: habit.active !== false ? 16 : 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  </button>
                  {/* Delete */}
                  <button
                    onClick={() => remove(habit.id)}
                    className="w-7 h-7 flex items-center justify-center text-[#333] hover:text-[#f87171] transition-colors shrink-0 text-lg leading-none"
                  >×</button>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </Card>
      )}

      {/* Add form */}
      <AnimatePresence>
        {adding ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card>
              {/* Name */}
              <div className="px-4 py-3 border-b border-[#1a1a1a]">
                <input
                  autoFocus
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && add()}
                  placeholder="Habit name…"
                  className="w-full bg-transparent text-sm text-[#f0f0f0] placeholder:text-[#333] focus:outline-none"
                />
              </div>
              {/* Emoji picker */}
              <div className="px-4 py-3 border-b border-[#1a1a1a]">
                <p className="text-[9px] text-[#444] uppercase tracking-widest mb-2">Emoji</p>
                <div className="flex flex-wrap gap-1.5">
                  {HABIT_EMOJIS.map(e => (
                    <button
                      key={e}
                      onClick={() => setEmoji(e)}
                      className="w-8 h-8 text-lg rounded-lg flex items-center justify-center transition-all"
                      style={{
                        background: emoji === e ? '#a78bfa22' : 'transparent',
                        border:     `1px solid ${emoji === e ? '#a78bfa44' : 'transparent'}`,
                      }}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>
              {/* Pillar selector */}
              <div className="px-4 py-3">
                <p className="text-[9px] text-[#444] uppercase tracking-widest mb-2">Pillar</p>
                <div className="flex gap-2">
                  {PILLAR_OPTIONS.map(p => (
                    <button
                      key={p.key}
                      onClick={() => setPillar(p.key)}
                      className="flex-1 py-2 rounded-xl text-xs font-medium transition-all"
                      style={{
                        background: pillar === p.key ? p.color + '22' : 'transparent',
                        color:      pillar === p.key ? p.color : '#444',
                        border:     `1px solid ${pillar === p.key ? p.color + '44' : '#1e1e1e'}`,
                      }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
              {/* Actions */}
              <div className="flex gap-2 px-4 pb-4">
                <button
                  onClick={add}
                  disabled={!name.trim()}
                  className="flex-1 bg-[#a78bfa] text-[#0a0a0a] text-sm font-semibold rounded-xl py-3 disabled:opacity-30 active:opacity-80"
                >
                  Add habit
                </button>
                <button
                  onClick={() => { setAdding(false); setName('') }}
                  className="px-4 border border-[#2a2a2a] rounded-xl text-[#555] text-sm"
                >
                  Cancel
                </button>
              </div>
            </Card>
          </motion.div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="w-full py-3.5 rounded-2xl text-sm font-medium border border-dashed border-[#2a2a2a] text-[#444] hover:border-[#a78bfa] hover:text-[#a78bfa] transition-colors active:opacity-70"
          >
            + Add habit
          </button>
        )}
      </AnimatePresence>

      {habits.length === 0 && !adding && (
        <p className="text-[#333] text-xs text-center px-2">
          No habits yet. Add ones you want to track daily — exercise, reading, deep work…
        </p>
      )}
    </Section>
  )
}

/* ══════════ Reminders Section ══════════ */
function RemindersSection() {
  const { reminders, saveReminders } = useSettingsStore()
  const [morning, setMorning] = useState(reminders?.morning ?? '07:30')
  const [midday,  setMidday]  = useState(reminders?.midday  ?? '13:00')
  const [evening, setEvening] = useState(reminders?.evening ?? '21:00')

  async function save() {
    await saveReminders({ morning, midday, evening })
  }

  return (
    <Section>
      <NextReleaseBanner
        title="Push Notifications"
        description="Set your preferred times below — they'll be saved and activated automatically when notification support ships in the next release."
      />
      <Card>
        <CardRow label="Morning">
          <input type="time" value={morning} onChange={e => setMorning(e.target.value)}
            className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-3 py-2 text-sm text-[#f0f0f0] text-right focus:outline-none focus:border-[#a78bfa] transition-colors" />
        </CardRow>
        <CardRow label="Midday">
          <input type="time" value={midday} onChange={e => setMidday(e.target.value)}
            className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-3 py-2 text-sm text-[#f0f0f0] text-right focus:outline-none focus:border-[#a78bfa] transition-colors" />
        </CardRow>
        <CardRow label="Evening">
          <input type="time" value={evening} onChange={e => setEvening(e.target.value)}
            className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-3 py-2 text-sm text-[#f0f0f0] text-right focus:outline-none focus:border-[#a78bfa] transition-colors" />
        </CardRow>
      </Card>
      <SaveBtn onSave={save} />
    </Section>
  )
}
