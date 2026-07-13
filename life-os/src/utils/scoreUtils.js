// Compute overall day score from 3 pillar scores
export function overallScore(physical, mental, work) {
  const scores = [physical, mental, work].filter(s => s != null)
  if (!scores.length) return null
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
}

// Map a 0–100 score to a color token
export function scoreToColor(score) {
  if (score == null) return null
  if (score >= 75) return '#4ade80'  // green
  if (score >= 40) return '#fbbf24'  // yellow
  return '#f87171'                   // red
}

// Map color token to label
export function colorToLabel(color) {
  if (!color) return 'unlogged'
  const map = {
    '#4ade80': 'green',
    '#fbbf24': 'yellow',
    '#f87171': 'red',
    '#60a5fa': 'milestone',
  }
  return map[color] ?? 'custom'
}

// Derive color string from label
export function labelToColor(label) {
  const map = {
    green:     '#4ade80',
    yellow:    '#fbbf24',
    red:       '#f87171',
    milestone: '#60a5fa',
  }
  return map[label] ?? null
}
