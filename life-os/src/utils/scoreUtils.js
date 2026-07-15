// Compute overall day score from 3 pillar scores
export function overallScore(physical, mental, work) {
  const scores = [physical, mental, work].filter(s => s != null)
  if (!scores.length) return null
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
}

// Fine-grained 0–100 → HSL color.
// 0 = deep red, 50 = amber-yellow (brightest), 100 = rich green.
// Every 10-point increment has a clearly distinct shade.
export function scoreToColor(score) {
  if (score == null) return null
  const s = Math.max(0, Math.min(100, score))
  const hue = s * 1.35                                   // 0° → 135°
  const sat = 80 + Math.sin((s / 100) * Math.PI) * 12  // 80%–92%, peaks at mid
  const lit = 47 + Math.sin((s / 100) * Math.PI) * 8   // 47%–55%, peaks at mid
  return `hsl(${hue.toFixed(1)}, ${sat.toFixed(0)}%, ${lit.toFixed(0)}%)`
}

// Map color token to label (approximate; used for legacy display only)
export function colorToLabel(color) {
  if (!color) return 'unlogged'
  // Kept for backwards compat — new colors are HSL strings, not fixed tokens
  if (color === '#60a5fa') return 'milestone'
  return 'logged'
}

// Derive color string from label (legacy pillar-goal display)
export function labelToColor(label) {
  const map = {
    green:     scoreToColor(85),
    yellow:    scoreToColor(50),
    red:       scoreToColor(15),
    milestone: '#60a5fa',
  }
  return map[label] ?? null
}
