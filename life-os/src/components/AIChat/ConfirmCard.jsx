import { motion } from 'framer-motion'
import { scoreToColor } from '../../utils/scoreUtils'

const PILLARS = [
  { key: 'physical', icon: '💪', label: 'Physical', noteKey: 'physicalNote', color: '#4ade80' },
  { key: 'mental',   icon: '🧠', label: 'Mental',   noteKey: 'mentalNote',   color: '#60a5fa' },
  { key: 'work',     icon: '💼', label: 'Work',     noteKey: 'workNote',     color: '#fbbf24' },
]

export function ConfirmCard({ data, onConfirm, onEdit }) {
  const overall = Math.round((data.physical + data.mental + data.work) / 3)
  const overallColor = scoreToColor(overall)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0,  scale: 1    }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
      className="mx-1 rounded-2xl overflow-hidden"
      style={{ border: `1px solid ${overallColor}30`, background: '#111' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5"
        style={{ background: `${overallColor}0a` }}>
        <div>
          <p className="text-[#f0f0f0] text-sm font-medium">Today's summary</p>
          <p className="text-[#555] text-xs mt-0.5">{data.aiNote}</p>
        </div>
        <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-light"
          style={{ background: `${overallColor}18`, color: overallColor, border: `1px solid ${overallColor}44` }}>
          {overall}
        </div>
      </div>

      <div className="h-px" style={{ background: `${overallColor}20` }} />

      {/* Pillar rows */}
      <div className="px-4 py-3 flex flex-col gap-3">
        {PILLARS.map(({ key, icon, label, noteKey, color }) => (
          <div key={key}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <span className="text-sm">{icon}</span>
                <span className="text-[#888] text-xs font-medium">{label}</span>
              </div>
              <span className="text-sm font-semibold tabular-nums" style={{ color }}>
                {data[key]}<span className="text-[#444] font-normal text-xs">/100</span>
              </span>
            </div>
            {/* Score bar */}
            <div className="h-1 rounded-full bg-[#1a1a1a] overflow-hidden mb-1">
              <div className="h-full rounded-full" style={{ width: `${data[key]}%`, background: color, opacity: 0.7 }} />
            </div>
            {data[noteKey] && (
              <p className="text-[11px] text-[#555] leading-relaxed">{data[noteKey]}</p>
            )}
          </div>
        ))}
      </div>

      <div className="h-px bg-[#1a1a1a]" />

      {/* Actions */}
      <div className="flex gap-2 p-3">
        <button
          onClick={onConfirm}
          className="flex-1 rounded-xl py-3 text-sm font-semibold active:opacity-80 transition-opacity min-h-[44px]"
          style={{ background: overallColor, color: '#0a0a0a' }}
        >
          Looks right — save it ✓
        </button>
        <button
          onClick={onEdit}
          className="px-4 rounded-xl border border-[#2a2a2a] text-[#888] text-sm min-h-[44px] active:opacity-70"
        >
          Edit
        </button>
      </div>
    </motion.div>
  )
}
