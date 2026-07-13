import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db'
import { useSettingsStore } from '../../store/useSettingsStore'
import { useAppStore } from '../../store/useAppStore'
import { todayStr } from '../../utils/dateUtils'
import { scoreToColor, overallScore } from '../../utils/scoreUtils'
import { useLLM, extractScoringJSON, buildSystemPrompt } from './useLLM'
import { ConfirmCard } from './ConfirmCard'

const STARTERS = [
  'Had a productive day 💪',
  'Tough day, need to vent',
  'Feeling good overall',
  'Mixed bag today',
]

export function AIChat({ name }) {
  const { chat, provider }  = useLLM()
  const pillars    = useSettingsStore(s => s.pillars)
  const profile    = useSettingsStore(s => s.profile)
  const openDayView = useAppStore(s => s.openDayView)

  const today = todayStr()

  // Last 3 days for context
  const recentDays = useLiveQuery(async () => {
    const all = await db.days.orderBy('date').reverse().limit(3).toArray()
    return all.filter(d => d.date !== today)
  }, []) ?? []

  const systemPrompt = profile
    ? buildSystemPrompt(profile, pillars, recentDays)
    : ''

  const [messages,    setMessages]    = useState([])
  const [input,       setInput]       = useState('')
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState(null)
  const [pendingData, setPendingData] = useState(null)  // parsed JSON from AI
  const [saved,       setSaved]       = useState(false)
  const bottomRef  = useRef(null)
  const inputRef   = useRef(null)
  const initialized = useRef(false)

  // Open with greeting
  useEffect(() => {
    if (initialized.current || !profile) return
    initialized.current = true
    const greeting = { role: 'assistant', content: `Hey ${profile.name} 👋  How did today go? Let's do your evening check-in.` }
    setMessages([greeting])
  }, [profile])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading, pendingData])

  async function send(text) {
    const trimmed = (text ?? input).trim()
    if (!trimmed || loading) return
    setInput('')
    setError(null)

    const userMsg = { role: 'user', content: trimmed }
    const nextMsgs = [...messages, userMsg]
    setMessages(nextMsgs)
    setLoading(true)

    try {
      const reply = await chat(nextMsgs, systemPrompt)
      const aiMsg = { role: 'assistant', content: reply }
      setMessages(m => [...m, aiMsg])

      // Check if the AI included a scoring JSON
      const json = extractScoringJSON(reply)
      if (json) setPendingData(json)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  async function confirmSave() {
    if (!pendingData) return
    const overall = Math.round((pendingData.physical + pendingData.mental + pendingData.work) / 3)
    const base    = (await db.days.get(today)) ?? { date: today, weekId: today.slice(0, 7) }
    await db.days.put({
      ...base,
      ...pendingData,
      overallScore: overall,
      color:        scoreToColor(overall),
    })
    setPendingData(null)
    setSaved(true)
    setMessages(m => [...m, {
      role: 'assistant',
      content: `✓ Saved! Your day is logged. Rest well, ${profile?.name ?? ''} 🌙`,
    }])
  }

  function editScores() {
    setPendingData(null)
    openDayView(today)
  }

  return (
    <div className="h-full flex flex-col bg-[#0a0a0a]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#1a1a1a] shrink-0">
        <div className="w-8 h-8 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center shrink-0">
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
            <path d="M4 14.5C4 14.5 3 17 2 18c1.5-.5 3.5-1.5 4.5-2H15a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v7.5c0 1.1.9 2 2 2h-.5z"
              stroke="#a78bfa" strokeWidth="1.5" strokeLinejoin="round"/>
            <circle cx="7" cy="9" r="1" fill="#a78bfa"/>
            <circle cx="10" cy="9" r="1" fill="#a78bfa"/>
            <circle cx="13" cy="9" r="1" fill="#a78bfa"/>
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-[#f0f0f0] text-sm font-medium">Evening Check-in</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className={`w-1.5 h-1.5 rounded-full ${provider === 'ollama' ? 'bg-[#4ade80]' : 'bg-[#60a5fa]'}`} />
            <p className="text-[#444] text-xs capitalize">{provider}</p>
          </div>
        </div>
        {saved && (
          <div className="flex items-center gap-1.5 bg-[#4ade8015] border border-[#4ade8030] rounded-full px-2.5 py-1">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M2 5l2 2 4-4" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <span className="text-[#4ade80] text-[10px] font-medium">Saved</span>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 flex flex-col gap-3">
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-[#a78bfa] text-[#0a0a0a] rounded-br-sm font-medium'
                    : 'bg-[#161616] text-[#e0e0e0] rounded-bl-sm border border-[#1e1e1e]'
                }`}
              >
                {msg.content.replace(/\{[\s\S]*?"physical"[\s\S]*?\}/g, '').trim() || msg.content}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        {loading && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="flex justify-start">
            <div className="bg-[#161616] border border-[#1e1e1e] rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1.5 items-center">
              {[0, 1, 2].map(i => (
                <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-[#a78bfa]"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }} />
              ))}
            </div>
          </motion.div>
        )}

        {/* Error */}
        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="bg-[#f8717115] border border-[#f8717130] rounded-xl px-4 py-3">
            <p className="text-[#f87171] text-xs font-medium mb-0.5">Connection error</p>
            <p className="text-[#f87171] text-xs opacity-70">{error}</p>
            <p className="text-[#555] text-xs mt-1">Check Settings → AI to configure your provider.</p>
          </motion.div>
        )}

        {/* Confirm card */}
        <AnimatePresence>
          {pendingData && !saved && (
            <ConfirmCard
              data={pendingData}
              onConfirm={confirmSave}
              onEdit={editScores}
            />
          )}
        </AnimatePresence>

        <div ref={bottomRef} />
      </div>

      {/* Quick starters */}
      {messages.length === 1 && !loading && (
        <div className="px-4 pb-2 flex gap-2 overflow-x-auto no-scrollbar shrink-0">
          {STARTERS.map(s => (
            <button key={s} onClick={() => send(s)}
              className="shrink-0 bg-[#161616] border border-[#1e1e1e] rounded-full px-3 py-2 text-xs text-[#888] whitespace-nowrap active:border-[#a78bfa] active:text-[#a78bfa] transition-colors">
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex items-center gap-3 px-4 py-3 border-t border-[#1a1a1a] shrink-0 bg-[#0a0a0a]"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 12px)' }}>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder={saved ? 'Day saved — feel free to chat' : 'Type a message…'}
          disabled={loading}
          className="flex-1 bg-[#161616] border border-[#1e1e1e] rounded-full px-4 py-3 text-sm text-[#f0f0f0] placeholder:text-[#333] focus:outline-none focus:border-[#a78bfa] disabled:opacity-50 transition-colors"
        />
        <button
          onClick={() => send()}
          disabled={!input.trim() || loading}
          className="w-11 h-11 rounded-full bg-[#a78bfa] flex items-center justify-center shrink-0 disabled:opacity-30 active:scale-95 transition-all"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M2 8h12M9 3l5 5-5 5" stroke="#0a0a0a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
