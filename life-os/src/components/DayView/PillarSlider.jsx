import { useState } from 'react'

export function PillarSlider({ icon, label, color, value, note, onValue, onNote }) {
  const [expanded, setExpanded] = useState(false)

  const trackBg = `linear-gradient(to right, ${color} ${value}%, #1e1e1e ${value}%)`

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all"
      style={{ background: '#141414', border: '1px solid #242424' }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <span className="text-lg shrink-0">{icon}</span>
        <span className="text-[#888] text-sm font-medium flex-1">{label}</span>
        <span
          className="text-2xl font-light tabular-nums"
          style={{ color, letterSpacing: '-1px', lineHeight: 1 }}
        >
          {value}
        </span>
      </div>

      {/* Slider */}
      <div className="px-4 pb-3.5">
        <input
          type="range"
          min={0} max={100} value={value}
          onChange={e => onValue(Number(e.target.value))}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
          style={{ background: trackBg, accentColor: color }}
        />
        <div className="flex justify-between mt-1.5">
          <span className="text-[9px] font-medium text-[#2e2e2e]">0</span>
          <span className="text-[9px] font-medium text-[#2e2e2e]">100</span>
        </div>
      </div>

      {/* Note toggle */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center gap-2.5 px-4 py-3 text-left active:opacity-70 transition-opacity"
        style={{ borderTop: '1px solid #1e1e1e' }}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0, opacity: 0.4 }}>
          <path d="M1 2h10M1 5.5h7M1 9h5" stroke="#888" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
        <span className="text-[11px] text-[#3a3a3a] flex-1 truncate">
          {note ? note.slice(0, 40) + (note.length > 40 ? '…' : '') : `Add a note…`}
        </span>
        <svg
          width="12" height="12" viewBox="0 0 12 12" fill="none"
          style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}
        >
          <path d="M2 4l4 4 4-4" stroke="#333" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>

      {expanded && (
        <div style={{ borderTop: '1px solid #1e1e1e' }}>
          <textarea
            autoFocus
            value={note}
            onChange={e => onNote(e.target.value)}
            placeholder={`${label} notes for today…`}
            rows={3}
            className="w-full bg-transparent text-[#d0d0d0] text-sm px-4 py-3.5 placeholder:text-[#2e2e2e] resize-none focus:outline-none leading-relaxed"
            style={{ minHeight: 80 }}
          />
        </div>
      )}
    </div>
  )
}
