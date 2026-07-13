import { useState, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  ResponsiveContainer, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts'
import { db } from '../../db'
import { AIChat } from '../AIChat/AIChat'

const PERIODS = [
  { label: '7d',  days: 7  },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
]

const PILLARS = [
  { key: 'physical', label: 'Physical', color: '#4ade80' },
  { key: 'mental',   label: 'Mental',   color: '#60a5fa' },
  { key: 'work',     label: 'Work',     color: '#fbbf24' },
]

const MONTH = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function localDateStr(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function todayLocal() {
  return localDateStr(new Date())
}

function nDaysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n + 1)
  return localDateStr(d)
}

export function InsightsView() {
  const [view,   setView]   = useState('stats')
  const [period, setPeriod] = useState(30)

  return (
    <div className="h-full flex flex-col bg-[#0a0a0a]">
      {/* Segment tabs */}
      <div className="flex border-b border-[#1a1a1a] shrink-0">
        {[['stats', 'Insights'], ['chat', 'AI Chat']].map(([v, label]) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className="flex-1 py-3 text-[11px] font-semibold tracking-widest uppercase transition-colors"
            style={{
              color:        view === v ? '#a78bfa' : '#555',
              borderBottom: view === v ? '2px solid #a78bfa' : '2px solid transparent',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {view === 'stats'
        ? <StatsView period={period} onPeriodChange={setPeriod} />
        : <AIChat />
      }
    </div>
  )
}

/* ── Stats tab ── */
function StatsView({ period, onPeriodChange }) {
  const cutoff     = nDaysAgo(period)
  const prevCutoff = nDaysAgo(period * 2)

  const days = useLiveQuery(
    () => db.days.where('date').aboveOrEqual(cutoff).sortBy('date'),
    [cutoff]
  ) ?? []

  const prevDays = useLiveQuery(
    () => db.days.where('date').aboveOrEqual(prevCutoff).below(cutoff).sortBy('date'),
    [prevCutoff, cutoff]
  ) ?? []

  // Fill every calendar date so the line breaks on missing days
  const chartData = useMemo(() => {
    const map = {}
    days.forEach(d => { map[d.date] = d })

    const result = []
    const today  = new Date()
    const start  = new Date(cutoff + 'T00:00:00')

    for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
      const key = localDateStr(d)
      const day = map[key]
      result.push({
        date:     key,
        physical: day?.physical ?? null,
        mental:   day?.mental   ?? null,
        work:     day?.work     ?? null,
      })
    }
    return result
  }, [days, cutoff])

  // Per-pillar avg + delta vs previous period
  const stats = PILLARS.map(p => {
    const vals  = days.filter(d => d[p.key] != null)
    const pvals = prevDays.filter(d => d[p.key] != null)
    const avg   = vals.length  ? Math.round(vals.reduce( (a, d) => a + d[p.key], 0) / vals.length)  : null
    const pavg  = pvals.length ? Math.round(pvals.reduce((a, d) => a + d[p.key], 0) / pvals.length) : null
    const delta = avg != null && pavg != null ? avg - pavg : null
    return { ...p, avg, delta }
  })

  const loggedCount = days.filter(d =>
    d.physical != null || d.mental != null || d.work != null
  ).length

  const streak     = computeStreak(days)
  const bestStreak = computeBestStreak(days)
  const logRate    = period > 0 ? Math.round((loggedCount / period) * 100) : 0

  function fmtTick(dateKey) {
    const d = new Date(dateKey + 'T00:00:00')
    return `${MONTH[d.getMonth()]} ${d.getDate()}`
  }

  const tickInterval = period === 7 ? 0 : period === 30 ? 5 : 13

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar">
      <div className="px-4 pt-4 pb-6 flex flex-col gap-5">

        {/* Header + period picker */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[#f0f0f0] text-sm font-medium">Pillar Trends</p>
            <p className="text-[#555] text-xs mt-0.5">
              {loggedCount}/{period} days logged · {streak}d streak
            </p>
          </div>
          <div className="flex gap-1 shrink-0">
            {PERIODS.map(p => (
              <button
                key={p.days}
                onClick={() => onPeriodChange(p.days)}
                className="px-3 py-1.5 rounded-full text-[10px] font-semibold transition-all"
                style={{
                  background: period === p.days ? 'rgba(167,139,250,0.15)' : 'transparent',
                  color:      period === p.days ? '#a78bfa' : '#444',
                  border:     `1px solid ${period === p.days ? 'rgba(167,139,250,0.3)' : '#1e1e1e'}`,
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Line chart */}
        {loggedCount === 0 ? (
          <EmptyChart />
        ) : (
          <div style={{ height: 200, marginLeft: -4 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 6, right: 6, left: -22, bottom: 0 }}>
                <CartesianGrid
                  strokeDasharray="2 4"
                  stroke="rgba(255,255,255,0.04)"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tickFormatter={fmtTick}
                  interval={tickInterval}
                  tick={{ fontSize: 9, fill: '#444', fontFamily: 'system-ui' }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  ticks={[0, 50, 100]}
                  tick={{ fontSize: 9, fill: '#333', fontFamily: 'system-ui' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<ChartTooltip />} />
                {PILLARS.map(p => (
                  <Line
                    key={p.key}
                    type="monotone"
                    dataKey={p.key}
                    stroke={p.color}
                    strokeWidth={period <= 30 ? 2 : 1.5}
                    dot={period <= 30
                      ? { r: 2.5, fill: p.color, strokeWidth: 0 }
                      : false
                    }
                    activeDot={{ r: 4, fill: p.color, strokeWidth: 0 }}
                    connectNulls={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Pillar legend */}
        <div className="flex gap-5 justify-center -mt-2">
          {PILLARS.map(p => (
            <div key={p.key} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
              <span className="text-[9px] text-[#555] uppercase tracking-widest">{p.label}</span>
            </div>
          ))}
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-3 gap-2">
          {stats.map(s => (
            <StatCard key={s.key} label={s.label} color={s.color} avg={s.avg} delta={s.delta} />
          ))}
        </div>

        {/* Consistency card */}
        <div className="bg-[#0e0e0e] border border-[#1a1a1a] rounded-2xl px-4 py-3.5">
          <p className="text-[9px] text-[#444] uppercase tracking-widest mb-3">Consistency</p>
          <div className="flex items-center justify-between gap-2">
            <Metric label="Current streak" value={streak}      unit="days" />
            <div className="w-px h-10 bg-[#1e1e1e]" />
            <Metric label="Best streak"    value={bestStreak}  unit="days" />
            <div className="w-px h-10 bg-[#1e1e1e]" />
            <Metric label="Log rate"       value={`${logRate}%`} />
          </div>
        </div>

        {/* Best / worst day */}
        {days.length >= 3 && <BestWorstCards days={days} />}

      </div>
    </div>
  )
}

/* ── Empty state ── */
function EmptyChart() {
  return (
    <div
      className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-[#1a1a1a]"
      style={{ height: 200 }}
    >
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <path d="M4 24l7-8 6 5 6-9 5 4" stroke="#2a2a2a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <p className="text-[#333] text-xs">No data logged yet</p>
      <p className="text-[#222] text-[10px]">Start logging days to see trends</p>
    </div>
  )
}

/* ── Chart tooltip ── */
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const hasData = payload.some(p => p.value != null)
  if (!hasData) return null

  const d = new Date(label + 'T00:00:00')
  const formatted = `${MONTH[d.getMonth()]} ${d.getDate()}`

  return (
    <div style={{
      background:     'rgba(14,14,14,0.96)',
      backdropFilter: 'blur(20px)',
      border:         '1px solid rgba(255,255,255,0.06)',
      borderRadius:   12,
      padding:        '10px 12px',
      boxShadow:      '0 8px 24px rgba(0,0,0,0.5)',
    }}>
      <p style={{ color: '#888', fontSize: 10, marginBottom: 6 }}>{formatted}</p>
      {payload.map(p => p.value != null && (
        <div key={p.dataKey} style={{ display: 'flex', justifyContent: 'space-between', gap: 20 }}>
          <span style={{ color: p.color, fontSize: 11, textTransform: 'capitalize' }}>{p.dataKey}</span>
          <span style={{ color: p.color, fontSize: 11, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
            {p.value}
          </span>
        </div>
      ))}
    </div>
  )
}

/* ── Stat card ── */
function StatCard({ label, color, avg, delta }) {
  return (
    <div className="bg-[#0e0e0e] border border-[#1a1a1a] rounded-2xl px-3 py-3 flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5">
        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
        <span className="text-[9px] text-[#444] uppercase tracking-widest truncate">{label}</span>
      </div>
      <div className="flex items-end gap-1">
        <span
          className="text-[22px] font-bold leading-none tabular-nums"
          style={{ color: avg != null ? color : '#222' }}
        >
          {avg ?? '—'}
        </span>
        {delta != null && (
          <span
            className="text-[10px] font-semibold pb-0.5"
            style={{ color: delta >= 0 ? '#4ade80' : '#f87171' }}
          >
            {delta >= 0 ? '+' : ''}{delta}
          </span>
        )}
      </div>
      <span className="text-[9px] text-[#333]">avg score</span>
    </div>
  )
}

/* ── Metric block ── */
function Metric({ label, value, unit }) {
  return (
    <div className="flex flex-col gap-0.5 items-center">
      <span className="text-[9px] text-[#444] uppercase tracking-widest text-center whitespace-nowrap">{label}</span>
      <div className="flex items-baseline gap-1">
        <span className="text-xl font-bold text-[#f0f0f0] tabular-nums">{value}</span>
        {unit && <span className="text-[10px] text-[#444]">{unit}</span>}
      </div>
    </div>
  )
}

/* ── Best / worst day cards ── */
function BestWorstCards({ days }) {
  const scored = days.map(d => {
    const vals = [d.physical, d.mental, d.work].filter(s => s != null)
    if (!vals.length) return null
    return { date: d.date, avg: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) }
  }).filter(Boolean)

  if (scored.length < 3) return null

  const best  = scored.reduce((a, b) => b.avg > a.avg ? b : a)
  const worst = scored.reduce((a, b) => b.avg < a.avg ? b : a)

  return (
    <div className="grid grid-cols-2 gap-2">
      <HighlightCard label="Best day"    date={best.date}  score={best.avg}  color="#4ade80" />
      <HighlightCard label="Hardest day" date={worst.date} score={worst.avg} color="#f87171" />
    </div>
  )
}

function HighlightCard({ label, date, score, color }) {
  const d   = new Date(date + 'T00:00:00')
  const fmt = `${MONTH[d.getMonth()]} ${d.getDate()}`

  return (
    <div
      className="rounded-2xl px-3 py-3 flex flex-col gap-1"
      style={{ background: color + '0a', border: `1px solid ${color}22` }}
    >
      <span className="text-[9px] uppercase tracking-widest" style={{ color: color + 'aa' }}>{label}</span>
      <span className="text-[22px] font-bold tabular-nums leading-none" style={{ color }}>{score}</span>
      <span className="text-[10px]" style={{ color: color + '88' }}>{fmt}</span>
    </div>
  )
}

/* ── Streak helpers ── */
function computeStreak(days) {
  if (!days.length) return 0
  const sorted   = [...days].sort((a, b) => b.date.localeCompare(a.date))
  const today    = todayLocal()
  let streak     = 0
  let expected   = today

  for (const d of sorted) {
    if (d.date === expected) {
      streak++
      const prev = new Date(expected + 'T00:00:00')
      prev.setDate(prev.getDate() - 1)
      expected = localDateStr(prev)
    } else if (d.date < expected) {
      break
    }
  }
  return streak
}

function computeBestStreak(days) {
  if (!days.length) return 0
  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date))
  let best = 1, cur = 1

  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1].date + 'T00:00:00')
    prev.setDate(prev.getDate() + 1)
    if (localDateStr(prev) === sorted[i].date) {
      cur++
      best = Math.max(best, cur)
    } else {
      cur = 1
    }
  }
  return best
}
