import { weekDates, formatDate } from '../../utils/dateUtils'

// Placeholder — full implementation in Phase 1B
export function WeekTooltip({ weekIndex, dob, dayMap }) {
  const dates = weekDates(dob, weekIndex)
  const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div
      className="absolute z-50 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-3 shadow-2xl pointer-events-none"
      style={{ top: 0, left: '50%', transform: 'translateX(-50%)', minWidth: 220 }}
    >
      <p className="text-[#888] text-xs mb-2">Week {weekIndex} · Age {Math.floor(weekIndex / 52)}</p>
      <div className="flex gap-1 items-end h-12">
        {dates.map((date, i) => {
          const day = dayMap[date]
          const score = day
            ? Math.round(((day.physical ?? 0) + (day.mental ?? 0) + (day.work ?? 0)) / 3)
            : 0
          const height = day ? Math.max(8, (score / 100) * 48) : 4

          return (
            <div key={date} className="flex flex-col items-center flex-1 gap-1">
              <div
                className="w-full rounded-sm"
                style={{
                  height,
                  background: day ? '#a78bfa' : '#222',
                }}
              />
              <span className="text-[#444] text-[8px]">{DAY_LABELS[i]}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
