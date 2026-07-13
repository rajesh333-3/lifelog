import { useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  useFloating,
  offset,
  flip,
  shift,
  autoUpdate,
  FloatingPortal,
} from '@floating-ui/react'
import { formatDate } from '../../utils/dateUtils'
import { overallScore, scoreToColor } from '../../utils/scoreUtils'

const PILLARS = [
  { key: 'physical', icon: '💪', label: 'Physical', noteKey: 'physicalNote', summaryKey: 'physicalSummary', color: '#4ade80' },
  { key: 'mental',   icon: '🧠', label: 'Mental',   noteKey: 'mentalNote',   summaryKey: 'mentalSummary',   color: '#60a5fa' },
  { key: 'work',     icon: '💼', label: 'Work',     noteKey: 'workNote',     summaryKey: 'workSummary',     color: '#fbbf24' },
]

export function DayHoverCard({ date, dayData, anchorRef, onMouseEnter, onMouseLeave }) {
  const { refs, floatingStyles, isPositioned } = useFloating({
    strategy:  'fixed',
    placement: 'right',
    elements:  { reference: anchorRef?.current ?? null },
    middleware: [offset(10), flip({ padding: 12 }), shift({ padding: 12 })],
    whileElementsMounted: autoUpdate,
  })

  // Re-sync reference if the ref's current changes after mount
  useEffect(() => {
    if (anchorRef?.current) refs.setReference(anchorRef.current)
  }, [anchorRef?.current])

  const overall      = overallScore(dayData.physical, dayData.mental, dayData.work)
  const overallColor = scoreToColor(overall)

  return (
    <FloatingPortal>
      <motion.div
        ref={refs.setFloating}
        style={{
          ...floatingStyles,
          zIndex: 100,
          visibility: isPositioned ? 'visible' : 'hidden',
        }}
        initial={{ opacity: 0, scale: 0.92, x: -8 }}
        animate={{ opacity: 1, scale: 1,    x: 0  }}
        exit={{ opacity: 0, scale: 0.92, x: -8 }}
        transition={{ type: 'spring', stiffness: 520, damping: 32, mass: 0.5 }}
        className="glass rounded-2xl overflow-hidden"
        style={{ ...floatingStyles, zIndex: 100, minWidth: 220, maxWidth: 260, visibility: isPositioned ? 'visible' : 'hidden' }}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-3.5 pb-2.5">
          <span className="text-[#f0f0f0] text-xs font-medium">{formatDate(date)}</span>
          {overall != null && (
            <span className="text-xs font-semibold tabular-nums px-2 py-0.5 rounded-full"
              style={{ color: overallColor, background: `${overallColor}18` }}>
              {overall}<span className="text-[#555] font-normal">/100</span>
            </span>
          )}
        </div>

        <div className="h-px bg-white/[0.04] mx-4" />

        {/* Pillars */}
        {PILLARS.map(({ key, icon, label, noteKey, summaryKey, color }, i) => {
          const score = dayData[key]
          const note  = dayData[summaryKey] ?? dayData[noteKey]
          return (
            <div key={key}>
              <div className="px-4 py-2.5">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs">{icon}</span>
                    <span className="text-[11px] text-[#888] font-medium">{label}</span>
                  </div>
                  {score != null && (
                    <span className="text-[11px] font-semibold tabular-nums" style={{ color }}>{score}</span>
                  )}
                </div>
                {note
                  ? <p className="text-[11px] text-[#666] leading-relaxed line-clamp-2">{note}</p>
                  : <p className="text-[11px] text-[#333] italic">No notes</p>}
              </div>
              {i < 2 && <div className="h-px bg-white/[0.03] mx-4" />}
            </div>
          )
        })}
        <div className="h-3" />
      </motion.div>
    </FloatingPortal>
  )
}
