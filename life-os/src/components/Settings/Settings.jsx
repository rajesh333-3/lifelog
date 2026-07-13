import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSettingsStore } from '../../store/useSettingsStore'
import { useLLM } from '../AIChat/useLLM'

const PILLAR_META = [
  { key: 'physical', label: 'Physical', icon: '💪', color: '#4ade80' },
  { key: 'mental',   label: 'Mental',   icon: '🧠', color: '#60a5fa' },
  { key: 'work',     label: 'Work',     icon: '💼', color: '#fbbf24' },
]

export function Settings() {
  const [section, setSection] = useState('profile')

  return (
    <div className="h-full flex flex-col bg-[#0a0a0a]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#1a1a1a] shrink-0">
        <h1 className="text-[#f0f0f0] text-sm font-medium">Settings</h1>
        <p className="text-[#444] text-xs mt-0.5">Profile, AI, pillars & reminders</p>
      </div>

      {/* Section tabs */}
      <div className="flex gap-1 px-3 pt-3 pb-0 shrink-0">
        {[
          { id: 'profile',   label: 'Profile'   },
          { id: 'ai',        label: 'AI'        },
          { id: 'pillars',   label: 'Pillars'   },
          { id: 'reminders', label: 'Reminders' },
        ].map(({ id, label }) => (
          <button key={id} onClick={() => setSection(id)}
            className="flex-1 py-2 text-xs font-medium rounded-xl transition-all"
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
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4">
        <AnimatePresence mode="wait">
          {section === 'profile'   && <ProfileSection   key="profile"   />}
          {section === 'ai'        && <AISection        key="ai"        />}
          {section === 'pillars'   && <PillarsSection   key="pillars"   />}
          {section === 'reminders' && <RemindersSection key="reminders" />}
        </AnimatePresence>
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
    <div className={`bg-[#111] border border-[#1e1e1e] rounded-2xl overflow-hidden ${className}`}>
      {children}
    </div>
  )
}

function CardRow({ label, children }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#1a1a1a] last:border-0">
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
      className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-3 py-2 text-sm text-[#f0f0f0] text-right placeholder:text-[#333] focus:outline-none focus:border-[#a78bfa] w-full transition-colors"
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
              className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-3 py-2 text-sm text-[#f0f0f0] text-right placeholder:text-[#333] focus:outline-none focus:border-[#a78bfa] w-full transition-colors"
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
      <p className="text-[#444] text-xs px-1 leading-relaxed">
        Reminder times are stored locally. Push notification support will be added in a future phase.
      </p>
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
