import { useRef, useEffect, useCallback, useState } from 'react'
import { motion, AnimatePresence, animate, useMotionValue } from 'framer-motion'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db'
import { useAppStore } from '../../store/useAppStore'
import { currentWeekIndex, totalWeeks, weekDates, todayStr } from '../../utils/dateUtils'
import { scoreToColor, overallScore } from '../../utils/scoreUtils'
import { WeekDrawer } from './WeekDrawer'

// ── Grid geometry constants ────────────────────────────────────
// CSS grid: '26px repeat(52, 8px)' + gap:2 → 53 cols, 52 gaps
// Width  = 26 + 52*8 + 52*2 = 546px
// Height = 20 + rows*8 + rows*2 = 20 + rows*10
const DOT   = 8       // dot square size px
const GAP   = 2       // gap between all cells
const ST    = DOT + GAP   // stride = 10
const COLS  = 52
const LW    = 26      // age-label column width
const HH    = 20      // header row height
const GW    = LW + COLS * DOT + COLS * GAP   // 26 + 416 + 104 = 546

function gridHeight(total) {
  const rows = Math.ceil(total / COLS)
  return HH + rows * DOT + rows * GAP   // 20 + rows*10
}

// Grid-space center of the dot for week index i
function dotXY(i) {
  const r = Math.floor(i / COLS)
  const c = i % COLS
  // col c center = LW + (c+1)*GAP + c*DOT + DOT/2 = 26+2+2c+8c+4 = 32+10c
  // row r center = HH + (r+1)*GAP + r*DOT + DOT/2 = 20+2+2r+8r+4 = 26+10r
  return { x: 32 + c * ST, y: 26 + r * ST }
}

// ── Component ─────────────────────────────────────────────────
export function LifeGrid({ dob, lifeExpectancy }) {
  const total      = totalWeeks(lifeExpectancy)
  const currentIdx = currentWeekIndex(dob)
  const rows       = Math.ceil(total / COLS)
  const GH         = gridHeight(total)
  const today      = todayStr()

  const openDayView          = useAppStore(s => s.openDayView)
  const setCalendarWeekIndex = useAppStore(s => s.setCalendarWeekIndex)

  const allDays = useLiveQuery(() => db.days.toArray(), [])
  const dayMap  = {}
  if (allDays) for (const d of allDays) dayMap[d.date] = d

  const [activeWeek, setActiveWeek] = useState(null)

  // Camera: zoom level + grid-space center point
  const zoomMV    = useMotionValue(1)
  const cxMV      = useMotionValue(GW / 2)
  const cyMV      = useMotionValue(GH / 2)
  // Effective grid viewport height (shrinks to vpH/2 when drawer is open)
  const gridVpHMV = useMotionValue(0)

  const vpRef      = useRef(null)
  const innerRef   = useRef(null)
  const vpWRef     = useRef(390)
  const vpHRef     = useRef(700)
  const introRan   = useRef(false)
  const introAnims = useRef([])   // cancellable intro animation controls

  // Direct DOM transform — no React re-renders during pan/zoom
  const applyTransform = useCallback(() => {
    if (!innerRef.current) return
    const z  = zoomMV.get()
    const x_ = cxMV.get()
    const y_ = cyMV.get()
    const gh = gridVpHMV.get()
    const w  = vpWRef.current
    innerRef.current.style.transform =
      `translate(${w / 2 - x_ * z}px, ${gh / 2 - y_ * z}px) scale(${z})`
  }, [zoomMV, cxMV, cyMV, gridVpHMV])

  useEffect(() => {
    const unsubs = [
      zoomMV.on('change',    applyTransform),
      cxMV.on('change',      applyTransform),
      cyMV.on('change',      applyTransform),
      gridVpHMV.on('change', applyTransform),
    ]
    applyTransform()
    return () => unsubs.forEach(fn => fn())
  }, [applyTransform])

  // ResizeObserver to know the viewport size
  useEffect(() => {
    const el = vpRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width
      const h = entry.contentRect.height
      vpWRef.current = w
      vpHRef.current = h
      gridVpHMV.set(activeWeek !== null ? h * 0.5 : h)
      applyTransform()
      if (!introRan.current && dob && w > 0) startIntro(w, h)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [dob]) // eslint-disable-line

  function startIntro(w, h) {
    introRan.current = true
    const minZ  = Math.min(w / GW, h / GH) * 0.92
    const comfZ = Math.min(14 / DOT, 3.5)   // ~14px physical dot at comfortable zoom
    const { x: cwX, y: cwY } = dotXY(currentIdx)
    const ease  = [0.16, 1, 0.3, 1]          // expo-out — fast start, smooth settle

    // Phase 1: full life view (instant)
    zoomMV.set(minZ)
    cxMV.set(GW / 2)
    cyMV.set(GH / 2)
    gridVpHMV.set(h)
    applyTransform()

    // Phase 2 & 3: pan + zoom to current week simultaneously
    const tid = setTimeout(() => {
      introAnims.current = [
        animate(zoomMV, comfZ, { duration: 2.2, ease }),
        animate(cxMV,   cwX,   { duration: 2.0, ease }),
        animate(cyMV,   cwY,   { duration: 2.0, ease }),
      ]
    }, 750)
    introAnims.current = [{ stop: () => clearTimeout(tid) }]
  }

  function cancelIntro() {
    introAnims.current.forEach(a => a?.stop?.())
    introAnims.current = []
  }

  // Drawer open/close — smoothly adjust camera into 50/50 split
  useEffect(() => {
    const h = vpHRef.current
    if (!h) return
    if (activeWeek !== null) {
      const { y: wy } = dotXY(activeWeek)
      animate(gridVpHMV, h * 0.5, { duration: 0.45, ease: [0.16, 1, 0.3, 1] })
      animate(cyMV, wy, { duration: 0.45, ease: [0.16, 1, 0.3, 1] })
      setCalendarWeekIndex(activeWeek)
    } else {
      animate(gridVpHMV, h, { duration: 0.35, ease: [0.16, 1, 0.3, 1] })
      setCalendarWeekIndex(null)
    }
  }, [activeWeek]) // eslint-disable-line

  // ── Touch / pointer ────────────────────────────────────────────
  // All coordinates stored as container-relative (not viewport-relative).
  // vpRef container may have header above it, so clientX/Y must have
  // getBoundingClientRect().left/top subtracted before use.
  const ptrs       = useRef({})
  const prevPinchD = useRef(null)
  const prevPt     = useRef(null)
  const downInfo   = useRef({})
  const hoverIdx   = useRef(null)

  const toLocal = useCallback((clientX, clientY) => {
    const r = vpRef.current?.getBoundingClientRect() ?? { left: 0, top: 0 }
    return { x: clientX - r.left, y: clientY - r.top }
  }, [])

  const onPointerDown = useCallback((e) => {
    cancelIntro()
    const { x, y } = toLocal(e.clientX, e.clientY)
    ptrs.current[e.pointerId]     = { x, y }
    downInfo.current[e.pointerId] = { x, y, t: Date.now() }
    e.currentTarget.setPointerCapture(e.pointerId)
    if (Object.keys(ptrs.current).length === 1) prevPt.current = { x, y }
    if (vpRef.current) vpRef.current.style.cursor = 'grabbing'
  }, [toLocal]) // eslint-disable-line

  // Hover glow: direct DOM class toggle — zero React re-renders
  const clearDotHover = useCallback(() => {
    if (hoverIdx.current !== null && innerRef.current) {
      innerRef.current.querySelector(`[data-week="${hoverIdx.current}"]`)
        ?.classList.remove('dot-h')
      hoverIdx.current = null
    }
  }, [])

  const moveDotHover = useCallback((lx, ly) => {
    const z  = zoomMV.get()
    if (DOT * z < 6) { clearDotHover(); return }  // too small to hover meaningfully
    const w  = vpWRef.current
    const gh = gridVpHMV.get()
    const gx = (lx - (w / 2 - cxMV.get() * z)) / z
    const gy = (ly - (gh / 2 - cyMV.get() * z)) / z
    let idx  = null
    if (gx >= LW && gy >= HH) {
      const c = Math.floor((gx - LW - GAP) / ST)
      const r = Math.floor((gy - HH - GAP) / ST)
      if (c >= 0 && c < COLS) {
        const candidate = r * COLS + c
        if (candidate >= 0 && candidate < total) idx = candidate
      }
    }
    if (idx === hoverIdx.current) return
    clearDotHover()
    hoverIdx.current = idx
    if (idx !== null && innerRef.current) {
      innerRef.current.querySelector(`[data-week="${idx}"]`)?.classList.add('dot-h')
    }
  }, [cxMV, cyMV, zoomMV, gridVpHMV, clearDotHover, total]) // eslint-disable-line

  const onPointerMove = useCallback((e) => {
    if (!ptrs.current[e.pointerId]) return
    const { x, y } = toLocal(e.clientX, e.clientY)
    ptrs.current[e.pointerId] = { x, y }
    const pts = Object.values(ptrs.current)

    if (pts.length === 1 && prevPt.current) {
      cxMV.set(cxMV.get() - (x - prevPt.current.x) / zoomMV.get())
      cyMV.set(cyMV.get() - (y - prevPt.current.y) / zoomMV.get())
      prevPt.current = { x, y }
      moveDotHover(x, y)
    } else if (pts.length === 2) {
      const [a, b] = pts
      const dist = Math.hypot(b.x - a.x, b.y - a.y)
      if (prevPinchD.current) {
        const vpW  = vpWRef.current
        const gh   = gridVpHMV.get()
        const z    = zoomMV.get()
        const minZ = Math.min(vpW / GW, vpHRef.current / GH) * 0.8
        const newZ = Math.max(minZ, Math.min(5, z * (dist / prevPinchD.current)))
        const midX = (a.x + b.x) / 2
        const midY = (a.y + b.y) / 2
        const gx   = (midX - (vpW / 2 - cxMV.get() * z)) / z
        const gy   = (midY - (gh  / 2 - cyMV.get() * z)) / z
        cxMV.set(gx + (vpW / 2 - midX) / newZ)
        cyMV.set(gy + (gh  / 2 - midY) / newZ)
        zoomMV.set(newZ)
      }
      prevPinchD.current = dist
      prevPt.current = null
      clearDotHover()
    }
  }, [cxMV, cyMV, zoomMV, gridVpHMV, toLocal, clearDotHover, moveDotHover, GH]) // eslint-disable-line

  const onPointerUp = useCallback((e) => {
    const info = downInfo.current[e.pointerId]
    delete ptrs.current[e.pointerId]
    delete downInfo.current[e.pointerId]
    if (Object.keys(ptrs.current).length === 0) {
      prevPinchD.current = null
      prevPt.current     = null
      if (vpRef.current) vpRef.current.style.cursor = 'grab'
      clearDotHover()
    }
    if (info) {
      const { x, y } = toLocal(e.clientX, e.clientY)
      const dx = Math.abs(x - info.x)
      const dy = Math.abs(y - info.y)
      if (dx < 9 && dy < 9 && Date.now() - info.t < 280) handleTap(x, y)
    }
  }, [toLocal, clearDotHover]) // eslint-disable-line

  const handleTap = useCallback((sx, sy) => {
    // sx/sy are container-relative — same space as the camera transform
    const z  = zoomMV.get()
    const w  = vpWRef.current
    const gh = gridVpHMV.get()
    const tx = w / 2 - cxMV.get() * z
    const ty = gh / 2 - cyMV.get() * z
    const gx = (sx - tx) / z
    const gy = (sy - ty) / z

    if (gx < 0 || gy < 0) { setActiveWeek(null); return }
    if (gx < LW)           { setActiveWeek(null); return }

    const adjX = gx - LW - GAP
    const adjY = gy - HH - GAP
    if (adjX < 0 || adjY < 0) { setActiveWeek(null); return }

    const c       = Math.floor(adjX / ST)
    const r       = Math.floor(adjY / ST)
    const weekIdx = r * COLS + c

    if (c < 0 || c >= COLS || r < 0 || weekIdx < 0 || weekIdx >= total) {
      setActiveWeek(null)
      return
    }

    // If zoomed out too far (dot < 7px physical), snap-zoom first
    if (DOT * z < 7) {
      const { x: wx, y: wy } = dotXY(weekIdx)
      const comfZ = 14 / DOT
      animate(zoomMV, comfZ, { duration: 0.55, ease: [0.16, 1, 0.3, 1] })
      animate(cxMV,   wx,    { duration: 0.55, ease: [0.16, 1, 0.3, 1] })
      animate(cyMV,   wy,    { duration: 0.55, ease: [0.16, 1, 0.3, 1] })
      return
    }

    setActiveWeek(prev => prev === weekIdx ? null : weekIdx)
  }, [cxMV, cyMV, zoomMV, gridVpHMV, total]) // eslint-disable-line

  // ── Mouse wheel zoom (desktop / web) ──────────────────────────
  useEffect(() => {
    const el = vpRef.current
    if (!el) return
    const onWheel = (e) => {
      e.preventDefault()
      cancelIntro()
      const vpW  = vpWRef.current
      const vpH  = vpHRef.current
      const gh   = gridVpHMV.get()
      const z    = zoomMV.get()
      const minZ = Math.min(vpW / GW, vpH / GH) * 0.8
      // trackpad sends small deltas; mouse wheel sends large ones — normalise
      const delta  = e.deltaMode === 1 ? e.deltaY * 30 : e.deltaY
      const factor = Math.exp(-delta * 0.001)
      const newZ   = Math.max(minZ, Math.min(5, z * factor))
      const rect   = el.getBoundingClientRect()
      const sx     = e.clientX - rect.left
      const sy     = e.clientY - rect.top
      const tx     = vpW / 2 - cxMV.get() * z
      const ty     = gh / 2 - cyMV.get() * z
      const gx     = (sx - tx) / z
      const gy     = (sy - ty) / z
      cxMV.set(gx + (vpW / 2 - sx) / newZ)
      cyMV.set(gy + (gh / 2 - sy) / newZ)
      zoomMV.set(newZ)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [cxMV, cyMV, zoomMV, gridVpHMV, GH]) // eslint-disable-line

  // ── Color helpers ──────────────────────────────────────────────
  function getWeekColor(i) {
    if (!dob) return null
    const logged = weekDates(dob, i).map(d => dayMap[d]).filter(Boolean)
    if (!logged.length) return null
    if (logged.some(d => d.lifeEvent)) return '#60a5fa'
    const scores = logged.map(d => overallScore(d.physical, d.mental, d.work)).filter(s => s != null)
    return scores.length
      ? scoreToColor(Math.round(scores.reduce((a, b) => a + b) / scores.length))
      : null
  }

  const currentWeekDates  = dob ? weekDates(dob, currentIdx) : []
  const loggedThisWeek    = currentWeekDates.filter(d => dayMap[d])
  const fillPct           = Math.round((loggedThisWeek.length / 7) * 100)
  const currentColor      = (() => {
    const sc = loggedThisWeek.map(d => overallScore(dayMap[d]?.physical, dayMap[d]?.mental, dayMap[d]?.work))
      .filter(s => s != null)
    return sc.length ? scoreToColor(Math.round(sc.reduce((a, b) => a + b) / sc.length)) : null
  })()

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div
      ref={vpRef}
      className="relative w-full h-full overflow-hidden"
      style={{ cursor: 'grab', touchAction: 'none', userSelect: 'none', background: '#0a0a0a' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onPointerLeave={clearDotHover}
    >
      {/* Dot hover + transition styles */}
      <style>{`
        [data-week] { transition: filter 0.08s ease, box-shadow 0.12s ease; }
        .dot-h      { filter: brightness(1.85) drop-shadow(0 0 3px rgba(255,255,255,0.35)) !important; cursor: pointer !important; }
      `}</style>

      {/* Inner grid — transform applied directly, no React re-renders */}
      <div
        ref={innerRef}
        style={{
          display:             'grid',
          gridTemplateColumns: `${LW}px repeat(${COLS}, ${DOT}px)`,
          gridTemplateRows:    `${HH}px repeat(${rows}, ${DOT}px)`,
          gap:                 `${GAP}px`,
          transformOrigin:     '0 0',
          willChange:          'transform',
          position:            'absolute',
          top:                 0,
          left:                0,
        }}
      >
        {/* Corner */}
        <div />

        {/* Header: week markers at W1 W13 W26 W39 W52 */}
        {Array.from({ length: COLS }, (_, c) => (
          <div key={`h${c}`} style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 3 }}>
            {(c === 0 || c === 12 || c === 25 || c === 38 || c === 51) && (
              <span style={{ fontSize: 6, color: '#5a5a6a', lineHeight: 1, userSelect: 'none' }}>
                W{c + 1}
              </span>
            )}
          </div>
        ))}

        {/* Data rows */}
        {Array.from({ length: rows }, (_, r) => [
          <div key={`l${r}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 3 }}>
            {r % 5 === 0 && (
              <span style={{ fontSize: 5.5, color: '#4a4a5a', lineHeight: 1, userSelect: 'none' }}>
                {r}
              </span>
            )}
          </div>,

          ...Array.from({ length: COLS }, (_, c) => {
            const i         = r * COLS + c
            if (i >= total) return <div key={`e${i}`} />

            const isCurrent = i === currentIdx
            const isPast    = i < currentIdx
            const isActive  = i === activeWeek
            const color     = isCurrent ? currentColor : (isPast ? getWeekColor(i) : null)
            const hasLife   = isPast && weekDates(dob, i).some(d => dayMap[d]?.lifeEvent)

            // Background: scored past = rich color, unscored past = cool dim gray,
            // current = purple conic, future = barely-there outline square
            const bg = isCurrent
              ? `conic-gradient(${color ?? '#a78bfa'} ${fillPct}%, #181820 ${fillPct}%)`
              : isPast
                ? (color ?? 'rgba(180,200,220,0.10)')
                : 'rgba(255,255,255,0.04)'

            // Box shadow: scored past = subtle color ring, unscored = cool inset,
            // current = strong purple ring, active = highlight, future = dim outline
            const shadow = isCurrent
              ? `0 0 0 1px rgba(167,139,250,0.65), 0 0 6px rgba(167,139,250,0.25)`
              : isActive
                ? '0 0 0 1.5px #a78bfa, 0 0 8px rgba(167,139,250,0.55)'
                : isPast
                  ? (color
                      ? `0 0 0 0.5px ${color}50`
                      : 'inset 0 0 0 0.5px rgba(180,200,230,0.18)')
                  : 'inset 0 0 0 0.5px rgba(255,255,255,0.09)'

            return (
              <div
                key={i}
                data-week={i}
                style={{
                  width:        DOT,
                  height:       DOT,
                  borderRadius: 2,
                  background:   bg,
                  position:     'relative',
                  boxShadow:    shadow,
                  zIndex:       isActive ? 2 : 0,
                }}
              >
                {/* Current week pulse ring */}
                {isCurrent && (
                  <div
                    className="animate-ping"
                    style={{
                      position:     'absolute',
                      inset:        -2,
                      borderRadius: 3,
                      background:   'rgba(167,139,250,0.12)',
                      animationDuration: '2.8s',
                      pointerEvents: 'none',
                    }}
                  />
                )}
                {/* Life event dot */}
                {hasLife && (
                  <div style={{
                    position:     'absolute',
                    top:          0,
                    right:        0,
                    width:        3,
                    height:       3,
                    borderRadius: '50%',
                    background:   '#60a5fa',
                    boxShadow:    '0 0 4px #60a5fa88',
                    transform:    'translate(30%, -30%)',
                    pointerEvents: 'none',
                  }} />
                )}
              </div>
            )
          }),
        ]).flat()}
      </div>

      {/* Week drawer — overlays bottom 50% */}
      <AnimatePresence>
        {activeWeek !== null && (
          <WeekDrawer
            key={activeWeek}
            weekIndex={activeWeek}
            dob={dob}
            dayMap={dayMap}
            onClose={() => setActiveWeek(null)}
            onDayClick={(date) => { openDayView(date); setActiveWeek(null) }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
