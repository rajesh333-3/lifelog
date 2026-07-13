import { useRef } from 'react'

const STATE_COLORS = {
  lived:   '#2a2a2a',
  future:  '#161616',
  current: null,  // uses conic gradient
}

export function WeekDot({ weekIndex, state, color, fillPct, onClick, onHoverStart, onHoverEnd, isCurrent, dotRef }) {
  const resolvedColor = color ?? (state === 'lived' ? STATE_COLORS.lived : STATE_COLORS.future)

  const style = isCurrent
    ? {
        background: `conic-gradient(${color ?? '#a78bfa'} ${fillPct ?? 0}%, #222222 ${fillPct ?? 0}%)`,
        '--fill-color': color ?? '#a78bfa',
        '--fill-pct': `${fillPct ?? 0}%`,
      }
    : { background: resolvedColor }

  return (
    <div
      ref={dotRef}
      onClick={onClick}
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
      onTouchStart={onHoverStart}
      onTouchEnd={onHoverEnd}
      className={[
        'rounded-sm cursor-pointer transition-transform duration-150',
        'active:scale-110',
        isCurrent ? 'week-current' : '',
        state === 'lived' ? 'opacity-80' : '',
      ].join(' ')}
      style={{
        width: '100%',
        aspectRatio: '1',
        minWidth: 6,
        ...style,
      }}
      aria-label={`Week ${weekIndex}`}
    />
  )
}
