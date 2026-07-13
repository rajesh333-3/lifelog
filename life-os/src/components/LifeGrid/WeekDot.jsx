import { useRef } from 'react'

export function WeekDot({ weekIndex, state, color, fillPct, isCurrent, onClick, onHoverStart, onHoverEnd }) {
  const ref = useRef(null)

  const bg = isCurrent
    ? `conic-gradient(${color ?? '#a78bfa'} ${fillPct ?? 0}%, #1e1e1e ${fillPct ?? 0}%)`
    : color ?? (state === 'lived' ? '#252525' : '#141414')

  return (
    <div
      ref={ref}
      onClick={onClick}
      onMouseEnter={() => onHoverStart?.(ref.current)}
      onMouseLeave={() => onHoverEnd?.()}
      onTouchStart={() => onHoverStart?.(ref.current)}
      onTouchEnd={() => onHoverEnd?.()}
      className={[
        'rounded-[2px] cursor-pointer transition-all duration-100',
        'hover:scale-[1.5] hover:z-10 active:scale-125',
        isCurrent ? 'week-current' : '',
      ].join(' ')}
      style={{
        width: '100%',
        aspectRatio: '1',
        background: bg,
        opacity: state === 'future' ? 0.5 : 1,
      }}
    />
  )
}
