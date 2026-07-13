const MS_PER_DAY  = 24 * 60 * 60 * 1000
const MS_PER_WEEK = 7 * MS_PER_DAY

// The Monday of the calendar week containing the user's birthday.
// All week indices are counted from this anchor so every week is Mon–Sun.
function getAnchorMonday(dob) {
  const birth   = new Date(dob + 'T00:00:00')
  const dow     = birth.getDay()                   // 0=Sun … 6=Sat
  const toMon   = dow === 0 ? -6 : 1 - dow         // days back to Monday
  const anchor  = new Date(birth.getTime() + toMon * MS_PER_DAY)
  anchor.setHours(0, 0, 0, 0)
  return anchor
}

// Returns the 7 dates (YYYY-MM-DD Mon–Sun) for a given week index
export function weekDates(dob, weekIndex) {
  const anchor    = getAnchorMonday(dob)
  const weekStart = new Date(anchor.getTime() + weekIndex * MS_PER_WEEK)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart.getTime() + i * MS_PER_DAY)
    return toDateStr(d)
  })
}

// Weeks elapsed from anchor Monday to today
export function weeksLived(dob) {
  const anchor = getAnchorMonday(dob)
  const now    = new Date()
  now.setHours(0, 0, 0, 0)
  return Math.floor((now - anchor) / MS_PER_WEEK)
}

// Current week index (same as weeksLived — the week we're inside right now)
export function currentWeekIndex(dob) {
  return weeksLived(dob)
}

// Total weeks in a lifespan
export function totalWeeks(lifeExpectancy) {
  return lifeExpectancy * 52
}

// Days completed in the current Mon–Sun week (for the conic-gradient fill)
export function daysCompletedThisWeek(dob) {
  const dates = weekDates(dob, currentWeekIndex(dob))
  const today = todayStr()
  return dates.filter(d => d <= today).length
}

// Returns today as 'YYYY-MM-DD'
export function todayStr() {
  return toDateStr(new Date())
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

// Zero-pads a date to 'YYYY-MM-DD'
export function toDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Given a 'YYYY-MM-DD', return which week index it falls in relative to dob
export function dateToWeekIndex(dob, dateStr) {
  const anchor = getAnchorMonday(dob)
  const target = new Date(dateStr + 'T00:00:00')
  return Math.floor((target - anchor) / MS_PER_WEEK)
}

// Is a date string in the future (after today)?
export function isFuture(dateStr) {
  return dateStr > todayStr()
}

// Is a date string today?
export function isToday(dateStr) {
  return dateStr === todayStr()
}
