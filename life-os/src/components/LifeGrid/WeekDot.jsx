import { memo, useRef } from 'react'

export const WeekDot = memo(function WeekDot({
  weekIndex, state, color, fillPct, isCurrent, hasLifeEvent, isLocked, dotRef,
}) {
  const ref = useRef(null)

  function setRef(el) {
    ref.current = el
    if (dotRef) dotRef.current = el
  }

  // Lived = solid filled square. Future = ghost outline only, clearly empty.
  const isFuture = state === 'future'
  const bg = isCurrent
    ? `conic-gradient(${color ?? '#a78bfa'} ${fillPct ?? 0}%, #1a1a1a ${fillPct ?? 0}%)`
    : isFuture
      ? 'transparent'
      : color ?? '#2a2a2a'

  return (
    <div
      ref={setRef}
      data-week={weekIndex}
      className={[
        'relative rounded-[2px] cursor-pointer transition-transform duration-100',
        isLocked ? 'scale-[1.4] z-10' : 'hover:scale-[1.5] hover:z-10 active:scale-125',
      ].join(' ')}
      style={{
        width: '100%',
        aspectRatio: '1',
        background: bg,
        // Future weeks: just a barely-visible border, no fill
        boxShadow: isFuture && !isLocked ? 'inset 0 0 0 0.5px rgba(255,255,255,0.07)' : undefined,
      }}
    >
      {isLocked && (
        <div
          className="absolute inset-0 rounded-[2px] pointer-events-none"
          style={{ boxShadow: '0 0 0 1.5px #a78bfa, 0 0 6px #a78bfa55' }}
        />
      )}
      {hasLifeEvent && (
        <div
          className="absolute top-0 right-0 w-[35%] h-[35%] rounded-full pointer-events-none"
          style={{ background: '#60a5fa', transform: 'translate(25%, -25%)', boxShadow: '0 0 3px #60a5fa' }}
        />
      )}
    </div>
  )
})
