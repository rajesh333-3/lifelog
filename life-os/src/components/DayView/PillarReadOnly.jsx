export function PillarReadOnly({ icon, label, color, value, note }) {
  const pct = value ?? 0
  return (
    <div className="bg-[#111] border border-[#1e1e1e] rounded-xl px-4 py-3.5">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <span className="text-base">{icon}</span>
          <span className="text-[#888] text-sm font-medium">{label}</span>
        </div>
        <span className="text-lg font-light tabular-nums" style={{ color }}>{value ?? '—'}</span>
      </div>

      {/* Static fill bar */}
      <div className="h-1.5 rounded-full bg-[#1e1e1e] overflow-hidden">
        <div
          className="h-full rounded-full transition-none"
          style={{ width: `${pct}%`, background: color, opacity: 0.7 }}
        />
      </div>

      {note && (
        <p className="text-[#555] text-xs leading-relaxed mt-2.5">{note}</p>
      )}
    </div>
  )
}
