export function NextReleaseBanner({ title, description }) {
  return (
    <div
      className="rounded-2xl px-4 py-4 flex gap-3"
      style={{ background: '#0f0f0f', border: '1px solid #222' }}
    >
      {/* Icon */}
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
        style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.15)' }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="7" cy="7" r="5.5" stroke="#fbbf24" strokeWidth="1.3"/>
          <path d="M7 4.5v3" stroke="#fbbf24" strokeWidth="1.4" strokeLinecap="round"/>
          <circle cx="7" cy="9.5" r="0.7" fill="#fbbf24"/>
        </svg>
      </div>

      {/* Text */}
      <div className="flex flex-col gap-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-[#d0a83a] text-xs font-semibold">{title}</p>
          <span
            className="text-[9px] font-semibold uppercase tracking-widest px-1.5 py-0.5 rounded-full"
            style={{ background: 'rgba(251,191,36,0.1)', color: '#a07820', border: '1px solid rgba(251,191,36,0.15)' }}
          >
            Next release
          </span>
        </div>
        <p className="text-[#484848] text-xs leading-relaxed">{description}</p>
      </div>
    </div>
  )
}
