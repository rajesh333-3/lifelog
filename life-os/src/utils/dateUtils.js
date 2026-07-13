// Returns weeks elapsed from dob to today
export function weeksLived(dob) {
  const birth = new Date(dob)
  const now   = new Date()
  const ms    = now - birth
  return Math.floor(ms / (7 * 24 * 60 * 60 * 1000))
}

// Total weeks in a life given life expectancy in years
export function totalWeeks(lifeExpectancy) {
  return lifeExpectancy * 52
}

// Returns { year (0-indexed), week (0-indexed) } for a given week index from birth
export function weekIndexToPosition(index) {
  return { year: Math.floor(index / 52), week: index % 52 }
}

// Returns 'YYYY-WW' ISO week id for a given week index from dob
export function weekIndexToId(dob, index) {
  const birth = new Date(dob)
  const d = new Date(birth.getTime() + index * 7 * 24 * 60 * 60 * 1000)
  const year = d.getFullYear()
  const week = getISOWeek(d)
  return `${year}-${String(week).padStart(2, '0')}`
}

// ISO week number for a date
export function getISOWeek(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 4 - (d.getDay() || 7))
  const yearStart = new Date(d.getFullYear(), 0, 1)
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
}

// Returns the week index (from birth) of today
export function currentWeekIndex(dob) {
  return weeksLived(dob)
}

// Days completed in the current week (0–7)
export function daysCompletedThisWeek(loggedDates) {
  const now = new Date()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay())
  startOfWeek.setHours(0, 0, 0, 0)

  return loggedDates.filter(dateStr => {
    const d = new Date(dateStr)
    return d >= startOfWeek && d <= now
  }).length
}

// Format 'YYYY-MM-DD' → 'Mon, Jul 13'
export function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

// Format week index to age label e.g. "Age 28"
export function weekIndexToAge(index) {
  return `Age ${Math.floor(index / 52)}`
}

// Returns today as 'YYYY-MM-DD'
export function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Returns the 7 dates (YYYY-MM-DD) of the week containing a given weekIndex from dob
export function weekDates(dob, weekIndex) {
  const birth = new Date(dob)
  const weekStart = new Date(birth.getTime() + weekIndex * 7 * 24 * 60 * 60 * 1000)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart.getTime() + i * 24 * 60 * 60 * 1000)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  })
}
