import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { searchDays } from '../../utils/searchUtils'
import { formatDate } from '../../utils/dateUtils'

export function SearchOverlay({ onClose, onSelectDate }) {
  const [query,   setQuery]   = useState('')
  const [results, setResults] = useState([])
  const [status,  setStatus]  = useState('idle') // 'idle' | 'searching' | 'done'
  const inputRef  = useRef(null)
  const timerRef  = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const runSearch = useCallback(async (q) => {
    if (!q.trim()) { setResults([]); setStatus('idle'); return }
    setStatus('searching')
    const res = await searchDays(q)
    setResults(res)
    setStatus('done')
  }, [])

  function handleChange(e) {
    const q = e.target.value
    setQuery(q)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => runSearch(q), 300)
  }

  function handleSelect(date) {
    onSelectDate(date)
    onClose()
  }

  const hasResults  = results.length > 0
  const showEmpty   = status === 'done' && !hasResults
  const showIdle    = status === 'idle'

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col bg-[#0a0a0a]"
      style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      transition={{ duration: 0.18 }}
    >
      {/* Search bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#1a1a1a] shrink-0">
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-[#1a1a1a] flex items-center justify-center shrink-0 active:scale-95"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8l5 5" stroke="#888" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        <div className="flex-1 flex items-center gap-2.5 bg-[#141414] border border-[#242424] rounded-2xl px-3.5 py-2.5">
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" className="shrink-0">
            <circle cx="6.5" cy="6.5" r="4.5" stroke="#484848" strokeWidth="1.4"/>
            <path d="M10 10l3 3" stroke="#484848" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleChange}
            placeholder="Search your journey…"
            className="flex-1 bg-transparent text-[#e0e0e0] text-sm placeholder:text-[#333] focus:outline-none"
          />
          {query.length > 0 && (
            <button
              onClick={() => { setQuery(''); setResults([]); setStatus('idle'); inputRef.current?.focus() }}
              className="text-[#333] hover:text-[#888] transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
            </button>
          )}
        </div>

        {status === 'searching' && (
          <div className="w-4 h-4 rounded-full border-2 border-[#a78bfa] border-t-transparent animate-spin shrink-0" />
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <AnimatePresence mode="wait">

          {/* Idle hint */}
          {showIdle && (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="px-5 pt-10 flex flex-col items-center gap-3"
            >
              <div className="w-10 h-10 rounded-full bg-[#141414] flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <circle cx="8" cy="8" r="5.5" stroke="#383838" strokeWidth="1.5"/>
                  <path d="M12.5 12.5L16 16" stroke="#383838" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <p className="text-[#383838] text-sm text-center leading-relaxed">
                Try <Hint>gym</Hint>, <Hint>stressed</Hint>, <Hint>met Arjun</Hint>, or <Hint>bad day</Hint>
              </p>
              <p className="text-[10px] text-[#2a2a2a] uppercase tracking-widest text-center">
                Searches notes · reflections · tasks · habits
              </p>
            </motion.div>
          )}

          {/* Empty */}
          {showEmpty && (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="px-5 pt-10 flex flex-col items-center gap-2"
            >
              <p className="text-[#383838] text-sm">No matching days found.</p>
              <p className="text-[10px] text-[#2a2a2a] uppercase tracking-widest">
                Try different words or a broader phrase
              </p>
            </motion.div>
          )}

          {/* Results */}
          {hasResults && (
            <motion.div
              key="results"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="px-4 pt-3 pb-6 flex flex-col gap-2"
            >
              <p className="text-[10px] text-[#333] uppercase tracking-widest px-1 pb-1">
                {results.length} result{results.length !== 1 ? 's' : ''}
              </p>
              {results.map((r, i) => (
                <ResultCard key={r.date} result={r} index={i} onSelect={handleSelect} />
              ))}
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </motion.div>
  )
}

function ResultCard({ result, index, onSelect }) {
  const { date, snippet, isLifeEvent, color } = result

  const dotColor  = color ?? '#333'
  const dateLabel = formatDate(date)
  const dow = new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' })

  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.18 }}
      onClick={() => onSelect(date)}
      className="w-full text-left bg-[#111] border border-[#1e1e1e] rounded-2xl px-4 py-3.5 flex items-start gap-3 active:scale-[0.98] transition-transform"
      style={{ borderLeftColor: dotColor, borderLeftWidth: 2 }}
    >
      {/* Colored dot */}
      <div className="shrink-0 mt-0.5 flex flex-col items-center gap-1">
        <div
          className="w-2.5 h-2.5 rounded-full"
          style={{ background: dotColor, boxShadow: `0 0 8px ${dotColor}66` }}
        />
        {isLifeEvent && (
          <span className="text-[8px]" style={{ color: '#60a5fa' }}>★</span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1.5 mb-1">
          <span className="text-[13px] font-semibold text-[#d0d0d0]">{dateLabel}</span>
          <span className="text-[10px] text-[#383838]">{dow}</span>
        </div>
        {snippet ? (
          <p className="text-[12px] text-[#555] leading-relaxed line-clamp-2">{snippet}</p>
        ) : (
          <p className="text-[11px] text-[#333] italic">Tap to view this day</p>
        )}
      </div>

      {/* Chevron */}
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0 mt-1">
        <path d="M5 3l4 4-4 4" stroke="#2a2a2a" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    </motion.button>
  )
}

function Hint({ children }) {
  return (
    <span className="px-2 py-0.5 rounded-full text-[11px] font-medium"
      style={{ background: 'rgba(167,139,250,0.08)', color: '#7c6fe0', border: '1px solid rgba(167,139,250,0.15)' }}>
      {children}
    </span>
  )
}
