// Generates placeholder PWA icons using pure Node.js (no extra deps).
// Run: node generate-icons.mjs
// Replace the output PNGs with your real logo when ready.

import { deflateSync } from 'zlib'
import { writeFileSync, mkdirSync } from 'fs'

const crcTable = new Uint32Array(256)
for (let i = 0; i < 256; i++) {
  let c = i
  for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1)
  crcTable[i] = c >>> 0
}
function crc32(buf) {
  let c = 0xFFFFFFFF
  for (const b of buf) c = (crcTable[(c ^ b) & 0xFF] ^ (c >>> 8)) >>> 0
  return (c ^ 0xFFFFFFFF) >>> 0
}

function chunk(type, data) {
  const lenBuf = Buffer.alloc(4)
  lenBuf.writeUInt32BE(data.length)
  const typeBuf = Buffer.from(type, 'ascii')
  const crcInput = Buffer.concat([typeBuf, data])
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(crcInput))
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf])
}

function makePNG(size) {
  // Palette: bg=#0a0a0a, purple=#a78bfa, dark purple=#7c3aed
  const BG = [10, 10, 10]
  const PU = [167, 139, 250]
  const DP = [124, 58, 237]

  const radius = size * 0.22   // rounded corner radius
  const cx     = size / 2
  const cy     = size / 2

  // L lettermark geometry (scaled to size)
  const lx  = Math.round(size * 0.28)   // left edge of L
  const ly  = Math.round(size * 0.24)   // top of L
  const lw  = Math.round(size * 0.10)   // stroke width
  const lh  = Math.round(size * 0.52)   // vertical height
  const lbw = Math.round(size * 0.36)   // horizontal bar width

  // dot accent (top-right)
  const dr  = Math.round(size * 0.07)   // dot radius
  const dx  = Math.round(size * 0.72)
  const dy  = Math.round(size * 0.28)

  function inRoundedRect(x, y, r) {
    const dx = Math.max(0, Math.abs(x - cx) - (size / 2 - r))
    const dy = Math.max(0, Math.abs(y - cy) - (size / 2 - r))
    return dx * dx + dy * dy <= r * r
  }

  function inRect(x, y, rx, ry, rw, rh) {
    return x >= rx && x < rx + rw && y >= ry && y < ry + rh
  }

  function inCircle(x, y, ocx, ocy, or) {
    return (x - ocx) ** 2 + (y - ocy) ** 2 <= or * or
  }

  // IHDR
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8  // bit depth
  ihdr[9] = 2  // RGB color type

  // Raw scanlines (filter byte 0 + RGB per pixel)
  const row = 1 + size * 3
  const raw = Buffer.alloc(size * row)

  for (let y = 0; y < size; y++) {
    raw[y * row] = 0  // filter None
    for (let x = 0; x < size; x++) {
      let [r, g, b] = BG

      if (inRoundedRect(x, y, radius)) {
        // vertical stroke of L
        if (inRect(x, y, lx, ly, lw, lh)) [r, g, b] = PU
        // horizontal bar of L
        else if (inRect(x, y, lx, ly + lh - lw, lbw, lw)) [r, g, b] = PU
        // dot accent
        else if (inCircle(x, y, dx, dy, dr)) [r, g, b] = DP
      }

      const i = y * row + 1 + x * 3
      raw[i] = r; raw[i + 1] = g; raw[i + 2] = b
    }
  }

  const PNG_SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  return Buffer.concat([
    PNG_SIG,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

mkdirSync('public/icons', { recursive: true })
writeFileSync('public/icons/icon-192.png', makePNG(192))
writeFileSync('public/icons/icon-512.png', makePNG(512))
console.log('✓  public/icons/icon-192.png')
console.log('✓  public/icons/icon-512.png')
console.log('\nReplace these with your real logo PNGs when ready.')
