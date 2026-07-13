export function PillarReadOnly({ icon, label, color, value, note }) {
  const pct = value ?? 0
  return (
    <div className="rounded-2xl px-4 py-4" style={{ background: '#141414', border: '1px solid #242424' }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <span className="text-lg">{icon}</span>
          <span className="text-[#888] text-sm font-medium">{label}</span>
        </div>
        <span className="text-2xl font-light tabular-nums" style={{ color, letterSpacing: '-1px', lineHeight: 1 }}>
          {value ?? '—'}
        </span>
      </div>

      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#1e1e1e' }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color, opacity: 0.65 }} />
      </div>

      {note && (
        <p className="text-[#555] text-xs leading-relaxed mt-3">{note}</p>
      )}
    </div>
  )
}
