// Dev aid: render glyphs, body map and icon to a PNG.  node tools/preview-art.mjs out.png
import { writeFileSync } from 'node:fs'
import { GLYPHS, BODY_FRONT, BODY_BACK, REGION, HAT, HAT_TONES, PAL } from '../src/lib/art.ts'
import { Raster, hex } from './png.mjs'

const r = new Raster(760, 330, hex(PAL.bg))
let x = 10
for (const rows of Object.values(GLYPHS)) {
  rows.forEach((row, j) => [...row].forEach((c, i) => { if (c === '#') r.rect(x + i * 5, 10 + j * 5, 5, 5, hex(PAL.text)) }))
  x += (rows[0].length + 2) * 5
}
const demo = { chest: 12, 'front-delts': 8, 'side-delts': 16, triceps: 22, lats: 3, quads: 0 }
const col = (m) => { const v = demo[m] ?? 0; return v === 0 ? PAL.muscleOff : v < 5 ? '#7a5a2a' : v < 10 ? '#c9922c' : v <= 20 ? PAL.straw : PAL.red }
const body = (rows, ox) => rows.forEach((row, j) => [...row].forEach((c, i) => {
  if (c === '.') return
  const m = REGION[c]
  r.rect(ox + i * 7, 70 + j * 7, 7, 7, hex(m ? col(m) : PAL.skin))
}))
body(BODY_FRONT, 20); body(BODY_BACK, 180)
HAT.forEach((row, j) => [...row].forEach((c, i) => { if (HAT_TONES[c]) r.rect(380 + i * 16, 90 + j * 16, 16, 16, hex(HAT_TONES[c])) }))
writeFileSync(process.argv[2] || 'art-preview.png', r.png())
