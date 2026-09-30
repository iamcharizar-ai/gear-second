// Renders the pixel straw hat to the PWA / favicon PNGs in public/.
//   node tools/make-icons.mjs
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { HAT, HAT_TONES, PAL } from '../src/lib/art.ts'
import { Raster, hex } from './png.mjs'

const PUBLIC = join(dirname(fileURLToPath(import.meta.url)), '..', 'public')
const W = HAT[0].length, H = HAT.length

function icon(size, scale) {
  const r = new Raster(size, size, hex(PAL.bg))
  const ox = Math.floor((size - W * scale) / 2), oy = Math.floor((size - H * scale) / 2)
  HAT.forEach((row, y) => [...row].forEach((c, x) => {
    if (HAT_TONES[c]) r.rect(ox + x * scale, oy + y * scale, scale, scale, hex(HAT_TONES[c]))
  }))
  return r.png()
}

// maskable icons keep the art inside the central ~60% safe zone
const out = { 'icon-512.png': [512, 18], 'icon-192.png': [192, 7], 'apple-touch-icon.png': [180, 7], 'favicon-32.png': [32, 1] }
for (const [name, [size, scale]] of Object.entries(out)) {
  writeFileSync(join(PUBLIC, name), icon(size, scale))
  console.log('wrote', name)
}
