import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'

const STARTERS = [
  'How was your energy today?',
  'Did you hit your physical goals?',
  'What was your biggest win today?',
  'How focused were you at work?',
]

export function AIChatPlaceholder({ name }) {
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      text: `Hey ${name} 👋 How did today go? I'll ask you a few questions about your Physical, Mental, and Work pillars, then score your day.`,
    },
  ])
  const [input, setInput] = useState('')
  const [typing, setTyping]   = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing])

  function send(text) {
    const trimmed = (text ?? input).trim()
    if (!trimmed) return
    setInput('')
    setMessages(m => [...m, { role: 'user', text: trimmed }])
    setTyping(true)
    // Placeholder reply — real LLM wired in Phase 3
    setTimeout(() => {
      setTyping(false)
      setMessages(m => [...m, {
        role: 'ai',
        text: "Got it! AI check-ins will be fully powered by Ollama in Phase 3. For now I'm just a placeholder 🙂",
      }])
    }, 1200)
  }

  return (
    <div className="h-full flex flex-col bg-[#0a0a0a]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#1a1a1a] shrink-0">
        <div className="w-8 h-8 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
            <path d="M4 14.5C4 14.5 3 17 2 18c1.5-.5 3.5-1.5 4.5-2H15a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v7.5c0 1.1.9 2 2 2h-.5z" stroke="#a78bfa" strokeWidth="1.5" strokeLinejoin="round" />
            <circle cx="7" cy="9" r="1" fill="#a78bfa" />
            <circle cx="10" cy="9" r="1" fill="#a78bfa" />
            <circle cx="13" cy="9" r="1" fill="#a78bfa" />
          </svg>
        </div>
        <div>
          <p className="text-[#f0f0f0] text-sm font-medium">Daily Check-in</p>
          <p className="text-[#444] text-xs">Powered by Ollama · Phase 3</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80] animate-pulse" />
          <span className="text-[#4ade80] text-xs">Ready</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-[#a78bfa] text-[#0a0a0a] rounded-br-sm'
                  : 'bg-[#1a1a1a] text-[#f0f0f0] rounded-bl-sm border border-[#2a2a2a]'
              }`}
            >
              {msg.text}
            </div>
          </motion.div>
        ))}

        {typing && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1.5 items-center">
              {[0, 1, 2].map(i => (
                <motion.span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-[#a78bfa]"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </div>
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Quick starters */}
      {messages.length === 1 && (
        <div className="px-4 pb-2 flex gap-2 overflow-x-auto shrink-0 no-scrollbar">
          {STARTERS.map(s => (
            <button
              key={s}
              onClick={() => send(s)}
              className="shrink-0 bg-[#1a1a1a] border border-[#2a2a2a] rounded-full px-3 py-2 text-xs text-[#888] whitespace-nowrap active:border-[#a78bfa] active:text-[#a78bfa] transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input bar */}
      <div
        className="flex items-center gap-3 px-4 py-3 border-t border-[#1a1a1a] shrink-0 bg-[#0a0a0a]"
        style={{ paddingBottom: `calc(env(safe-area-inset-bottom) + 12px)` }}
      >
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="Type a message…"
          className="flex-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-full px-4 py-3 text-sm text-[#f0f0f0] placeholder:text-[#333] focus:outline-none focus:border-[#a78bfa] transition-colors"
        />
        <button
          onClick={() => send()}
          disabled={!input.trim() || typing}
          className="w-11 h-11 rounded-full bg-[#a78bfa] flex items-center justify-center shrink-0 disabled:opacity-30 active:scale-95 transition-all"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M2 8h12M9 3l5 5-5 5" stroke="#0a0a0a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  )
}
