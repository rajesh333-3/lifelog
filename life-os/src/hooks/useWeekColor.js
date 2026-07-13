import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { overallScore, scoreToColor } from '../utils/scoreUtils'
import { weekDates } from '../utils/dateUtils'

// Returns the computed color for a week, derived from its 7 logged days.
// Precedence: manual override on weeks table → computed average from days
export function useWeekColor(dob, weekIndex) {
  const dates = weekDates(dob, weekIndex)

  const weekRow = useLiveQuery(
    () => db.weeks.get(`${new Date(dob).getFullYear() + Math.floor(weekIndex / 52)}-${String(weekIndex % 52).padStart(2, '0')}`),
    [weekIndex]
  )

  const days = useLiveQuery(
    () => db.days.where('date').anyOf(dates).toArray(),
    [dob, weekIndex]
  )

  if (weekRow?.color) return weekRow.color

  if (!days?.length) return null

  const scores = days
    .map(d => overallScore(d.physical, d.mental, d.work))
    .filter(s => s != null)

  if (!scores.length) return null

  const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
  return scoreToColor(avg)
}
