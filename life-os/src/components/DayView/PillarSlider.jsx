import { useState } from 'react'

export function PillarSlider({ icon, label, color, value, note, onValue, onNote }) {
  const [expanded, setExpanded] = useState(false)

  const trackBg = `linear-gradient(to right, ${color} ${value}%, #1e1e1e ${value}%)`

  return (
    <div className="bg-[#111] border border-[#1e1e1e] rounded-xl overflow-hidden">
      {/* Header row */}
      <div className="flex items-center gap-3 px-4 pt-3.5 pb-2">
        <span className="text-base">{icon}</span>
        <span className="text-[#888] text-sm font-medium flex-1">{label}</span>
        <span className="text-lg font-light tabular-nums" style={{ color }}>{value}</span>
      </div>

      {/* Slider */}
      <div className="px-4 pb-3">
        <input
          type="range"
          min={0} max={100} value={value}
          onChange={e => onValue(Number(e.target.value))}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
          style={{
            background: trackBg,
            WebkitAppearance: 'none',
            accentColor: color,
          }}
        />
        <div className="flex justify-between mt-1">
          <span className="text-[9px] text-[#2a2a2a]">0</span>
          <span className="text-[9px] text-[#2a2a2a]">100</span>
        </div>
      </div>

      {/* Note toggle */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center gap-2 px-4 py-2.5 border-t border-[#1a1a1a] text-left active:opacity-70"
      >
        <span className="text-[#333] text-[10px] uppercase tracking-widest flex-1">
          {note ? 'Note  ·  ' + note.slice(0, 32) + (note.length > 32 ? '…' : '') : 'Add note…'}
        </span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
          style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
          <path d="M2 4l4 4 4-4" stroke="#333" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>

      {expanded && (
        <div className="px-4 pb-3 border-t border-[#1a1a1a]">
          <textarea
            autoFocus
            value={note}
            onChange={e => onNote(e.target.value)}
            placeholder={`${label} notes for today…`}
            rows={3}
            className="w-full bg-transparent text-[#f0f0f0] text-sm placeholder:text-[#2a2a2a] resize-none focus:outline-none leading-relaxed pt-2"
          />
        </div>
      )}
    </div>
  )
}
