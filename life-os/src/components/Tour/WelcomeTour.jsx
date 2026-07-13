import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const SLIDES = [
  {
    id: 'welcome',
    illustration: <IllustrationWelcome />,
    title: 'Capture today.\nShape tomorrow.',
    body: 'Life Log is your private life operating system. Everything lives on your device — no accounts, no cloud, no noise.',
    accent: '#a78bfa',
  },
  {
    id: 'grid',
    illustration: <IllustrationGrid />,
    title: 'Look at your life.',
    body: 'Every dot is one week. Some are already colored. Most are still waiting. Tap any dot to log that week or revisit the past.',
    accent: '#a78bfa',
  },
  {
    id: 'daylog',
    illustration: <IllustrationDay />,
    title: 'Write your day.',
    body: "Rate how your body, mind, and work felt. Reflect on what went well. It doesn't have to be perfect — it just has to be real.",
    accent: '#4ade80',
  },
  {
    id: 'tasks',
    illustration: <IllustrationTasks />,
    title: 'Focus on what matters.',
    body: 'Drag tasks into four quadrants: Do Now, Schedule, Delegate, Drop. Tasks float forward every day until you close them.',
    accent: '#fbbf24',
  },
  {
    id: 'insights',
    illustration: <IllustrationInsights />,
    title: 'Understand yourself.',
    body: 'Insights shows pillar trends, streaks, and your best days. Connect an AI in Settings to get a weekly narrative written in your own voice.',
    accent: '#60a5fa',
  },
  {
    id: 'done',
    illustration: <IllustrationDone />,
    title: 'Your story starts now.',
    body: 'The best time to start was last week. The next best time is today. Tap a grid dot to log your first day.',
    accent: '#4ade80',
  },
]

export function WelcomeTour({ onDone }) {
  const [idx, setIdx]       = useState(0)
  const [dir, setDir]       = useState(1)   // 1 = forward, -1 = back
  const [exiting, setExit]  = useState(false)

  const slide = SLIDES[idx]
  const isLast = idx === SLIDES.length - 1

  function go(next) {
    if (next < 0 || next >= SLIDES.length) return
    setDir(next > idx ? 1 : -1)
    setIdx(next)
  }

  function finish() {
    localStorage.setItem('lifelog_tour_done', '1')
    onDone()
  }

  // Swipe support
  function handleDragEnd(_, info) {
    if (info.offset.x < -60 && idx < SLIDES.length - 1) go(idx + 1)
    else if (info.offset.x > 60 && idx > 0) go(idx - 1)
  }

  const variants = {
    enter:  (d) => ({ x: d > 0 ? '100%' : '-100%', opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit:   (d) => ({ x: d > 0 ? '-100%' : '100%', opacity: 0 }),
  }

  return (
    <div
      className="fixed inset-0 flex flex-col"
      style={{ zIndex: 200, background: '#080808' }}
    >
      {/* Skip */}
      <div className="flex justify-end px-5 pt-4 shrink-0" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 16px)' }}>
        <button
          onClick={finish}
          className="px-3 py-1.5 rounded-full text-[11px] font-medium text-[#444] active:text-[#888] transition-colors"
          style={{ background: '#141414', border: '1px solid #242424' }}
        >
          Skip
        </button>
      </div>

      {/* Slide area */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence custom={dir} mode="wait">
          <motion.div
            key={slide.id}
            custom={dir}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 340, damping: 36, mass: 0.85 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.15}
            onDragEnd={handleDragEnd}
            className="absolute inset-0 flex flex-col items-center justify-center px-8 gap-8 select-none"
            style={{ cursor: 'grab' }}
          >
            {/* Illustration */}
            <div
              className="w-48 h-48 flex items-center justify-center rounded-3xl"
              style={{
                background: `${slide.accent}0d`,
                border:     `1px solid ${slide.accent}20`,
              }}
            >
              {slide.illustration}
            </div>

            {/* Text */}
            <div className="flex flex-col items-center gap-3 text-center max-w-xs">
              <h2 style={{
                fontFamily:    "'Outfit', system-ui, sans-serif",
                fontSize:      24,
                fontWeight:    800,
                color:         '#f0f0f0',
                letterSpacing: '-0.5px',
                lineHeight:    1.25,
                whiteSpace:    'pre-line',
              }}>
                {slide.title}
              </h2>
              <p style={{
                fontFamily:  "'Inter', system-ui, sans-serif",
                fontSize:    14,
                fontWeight:  400,
                color:       '#606060',
                lineHeight:  1.65,
              }}>
                {slide.body}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom controls */}
      <div
        className="shrink-0 flex flex-col items-center gap-5 px-6 pb-8"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 32px)' }}
      >
        {/* Dots */}
        <div className="flex items-center gap-2">
          {SLIDES.map((s, i) => (
            <button key={s.id} onClick={() => go(i)}>
              <motion.div
                animate={{
                  width:      i === idx ? 20 : 6,
                  background: i === idx ? slide.accent : '#242424',
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                style={{ height: 6, borderRadius: 3 }}
              />
            </button>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-3 w-full">
          {idx > 0 ? (
            <button
              onClick={() => go(idx - 1)}
              className="flex-1 py-3.5 rounded-2xl text-sm font-semibold active:opacity-70 transition-opacity"
              style={{ background: '#141414', border: '1px solid #242424', color: '#555' }}
            >
              Back
            </button>
          ) : (
            <div className="flex-1" />
          )}

          <button
            onClick={isLast ? finish : () => go(idx + 1)}
            className="flex-1 py-3.5 rounded-2xl text-sm font-semibold active:opacity-80 transition-all"
            style={{
              background: slide.accent,
              color:      idx === SLIDES.length - 1 ? '#0a0a0a' : '#0a0a0a',
              boxShadow:  `0 0 24px ${slide.accent}33`,
            }}
          >
            {isLast ? 'Get Started' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Illustrations ── */

function IllustrationWelcome() {
  return (
    <svg width="96" height="96" viewBox="0 0 96 96" fill="none">
      {/* App icon shape */}
      <rect x="12" y="12" width="72" height="72" rx="18" fill="rgba(167,139,250,0.1)" stroke="rgba(167,139,250,0.3)" strokeWidth="1.5"/>
      {/* L lettermark */}
      <rect x="30" y="26" width="10" height="38" rx="4" fill="#a78bfa"/>
      <rect x="30" y="54" width="32" height="10" rx="4" fill="#a78bfa"/>
      {/* dot accent */}
      <circle cx="66" cy="32" r="6" fill="rgba(167,139,250,0.4)"/>
    </svg>
  )
}

function IllustrationGrid() {
  const colors = ['#a78bfa','#4ade80','#fbbf24','#a78bfa','#f87171','#4ade80',
                  '#a78bfa','#a78bfa','#fbbf24',null,null,null,
                  null,null,null,null,null,null,
                  null,null,null,null,null,null]
  return (
    <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
      {Array.from({ length: 4 }, (_, row) =>
        Array.from({ length: 6 }, (_, col) => {
          const i = row * 6 + col
          const color = colors[i]
          const x = 10 + col * 14
          const y = 20 + row * 14
          return (
            <rect key={i} x={x} y={y} width="10" height="10" rx="2.5"
              fill={color ?? '#1e1e1e'}
              opacity={color ? 1 : 0.8}
            />
          )
        })
      )}
      {/* Current week pulse ring */}
      <rect x="10" y="20" width="10" height="10" rx="2.5" fill="none"
        stroke="#a78bfa" strokeWidth="1.5" opacity="0.9"/>
    </svg>
  )
}

function IllustrationDay() {
  return (
    <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
      {/* Three pillar bars */}
      {[
        { x: 14, h: 52, color: '#4ade80', label: '💪' },
        { x: 41, h: 38, color: '#60a5fa', label: '🧠' },
        { x: 68, h: 62, color: '#fbbf24', label: '💼' },
      ].map(({ x, h, color }) => (
        <g key={x}>
          <rect x={x} y={82 - h} width="18" height={h} rx="5"
            fill={color} opacity="0.2"/>
          <rect x={x} y={82 - h} width="18" height="6" rx="3"
            fill={color} opacity="0.9"/>
        </g>
      ))}
      {/* Baseline */}
      <rect x="8" y="82" width="84" height="2" rx="1" fill="#242424"/>
      {/* Score circle */}
      <circle cx="50" cy="22" r="12" fill="rgba(167,139,250,0.1)" stroke="#a78bfa" strokeWidth="1.5"/>
      <text x="50" y="27" textAnchor="middle" fill="#a78bfa" fontSize="11" fontWeight="700">72</text>
    </svg>
  )
}

function IllustrationTasks() {
  return (
    <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
      {/* 2x2 grid */}
      <rect x="10" y="10" width="36" height="36" rx="8" fill="rgba(248,113,113,0.1)" stroke="rgba(248,113,113,0.25)" strokeWidth="1"/>
      <rect x="54" y="10" width="36" height="36" rx="8" fill="rgba(251,191,36,0.1)"  stroke="rgba(251,191,36,0.25)"  strokeWidth="1"/>
      <rect x="10" y="54" width="36" height="36" rx="8" fill="rgba(96,165,250,0.1)"  stroke="rgba(96,165,250,0.25)"  strokeWidth="1"/>
      <rect x="54" y="54" width="36" height="36" rx="8" fill="rgba(100,100,100,0.08)" stroke="#2a2a2a"                strokeWidth="1"/>
      {/* Labels */}
      <text x="28" y="32" textAnchor="middle" fill="#f87171" fontSize="8" fontWeight="600">DO NOW</text>
      <text x="72" y="32" textAnchor="middle" fill="#fbbf24" fontSize="8" fontWeight="600">SCHEDULE</text>
      <text x="28" y="76" textAnchor="middle" fill="#60a5fa" fontSize="8" fontWeight="600">DELEGATE</text>
      <text x="72" y="76" textAnchor="middle" fill="#444"    fontSize="8" fontWeight="600">DROP</text>
      {/* Task dot in Q1 */}
      <circle cx="18" cy="18" r="3" fill="#f87171" opacity="0.8"/>
      <circle cx="26" cy="18" r="3" fill="#f87171" opacity="0.5"/>
    </svg>
  )
}

function IllustrationInsights() {
  const pts = [[10,60],[22,45],[34,50],[46,30],[58,35],[70,20],[82,25]]
  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]} ${p[1]}`).join(' ')
  const area = path + ` L82 80 L10 80 Z`
  return (
    <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
      {/* Area fill */}
      <path d={area} fill="rgba(167,139,250,0.08)"/>
      {/* Line */}
      <path d={path} stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      {/* Dots */}
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="3" fill="#a78bfa" opacity={i === pts.length - 1 ? 1 : 0.5}/>
      ))}
      {/* Baseline */}
      <rect x="5" y="80" width="90" height="1.5" rx="1" fill="#1e1e1e"/>
      {/* AI spark */}
      <circle cx="78" cy="16" r="8" fill="rgba(96,165,250,0.15)" stroke="rgba(96,165,250,0.4)" strokeWidth="1"/>
      <text x="78" y="20" textAnchor="middle" fill="#60a5fa" fontSize="10">✦</text>
    </svg>
  )
}

function IllustrationDone() {
  return (
    <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
      <circle cx="50" cy="50" r="36" fill="rgba(74,222,128,0.08)" stroke="rgba(74,222,128,0.25)" strokeWidth="1.5"/>
      <circle cx="50" cy="50" r="24" fill="rgba(74,222,128,0.1)"/>
      <path d="M36 50l10 10 18-20" stroke="#4ade80" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
      {/* Sparkles */}
      <circle cx="22" cy="24" r="2.5" fill="#a78bfa" opacity="0.6"/>
      <circle cx="78" cy="20" r="1.5" fill="#fbbf24" opacity="0.6"/>
      <circle cx="80" cy="74" r="2"   fill="#60a5fa" opacity="0.5"/>
      <circle cx="18" cy="72" r="1.5" fill="#4ade80" opacity="0.5"/>
    </svg>
  )
}
