// Renders the app icon (yellow tile, hard ink shadow, dumbbell) to public/.
//   node tools/make-icons.mjs
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { Raster, hex } from './png.mjs'

const PUBLIC = join(dirname(fileURLToPath(import.meta.url)), '..', 'public')
const PAPER = hex('#f4efe6'), INK = hex('#111111'), YELLOW = hex('#ffd23f')

// Drawn on a 32-unit grid; the tile sits inside the maskable safe zone.
function icon(size) {
  const u = size / 32
  const r = new Raster(size, size, PAPER)
  const R = (x, y, w, h, c) => r.rect(Math.round(x * u), Math.round(y * u), Math.max(1, Math.round(w * u)), Math.max(1, Math.round(h * u)), c)
  R(8.5, 8.5, 17, 17, INK) // shadow
  R(6, 6, 17, 17, INK) // border
  R(7, 7, 15, 15, YELLOW)
  // dumbbell
  R(10, 13.5, 9, 2, INK)
  R(9, 11, 2, 7, INK); R(18, 11, 2, 7, INK)
  R(11, 12, 1.5, 5, INK); R(16.5, 12, 1.5, 5, INK)
  return r.png()
}

for (const [name, size] of Object.entries({ 'icon-512.png': 512, 'icon-192.png': 192, 'apple-touch-icon.png': 180, 'favicon-32.png': 32 })) {
  writeFileSync(join(PUBLIC, name), icon(size))
  console.log('wrote', name)
}
