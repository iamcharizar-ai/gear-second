// Dev aid: render the anatomy figure to a PNG.  node tools/preview-body.mjs out.png
// Needs a Node that strips TypeScript types (it imports ../src/lib/anatomy.ts directly; Node 22.18+ / 23.6+)
// and a Chromium-based browser: set BROWSER_PATH, or it falls back to Edge's default Windows location.
import puppeteer from 'puppeteer-core'
import { FRONT, BACK, OUTLINE, HEAD, smooth, mirrorPts, linePath, VIEW_W, VIEW_H } from '../src/lib/anatomy.ts'

const RAMP = ['#86b6ef', '#5598e7', '#2a78d6', '#1c5cab', '#0d366b']
const demo = { 'chest-upper': 4, chest: 2, 'front-delts': 1, 'side-delts': 3, triceps: 4, lats: 2, quads: 0, glutes: 1, abs: 0 }
const fill = (m) => (m == null ? '#e9e3d7' : demo[m] ? RAMP[demo[m]] : '#ffffff')
const base = `<path d="${smooth(OUTLINE, 0.4)}" fill="#e9e3d7" stroke="#111" stroke-width="3" stroke-linejoin="round"/><path d="${smooth(HEAD)}" fill="#e9e3d7" stroke="#111" stroke-width="3"/>`
const fig = (regions, ox) => `<g transform="translate(${ox},0)">${base}</g>` + regions.map((r) => {
  const both = [r.pts, mirrorPts(r.pts)]
  const shapes = both.map((pts) => `<path d="${smooth(pts)}" fill="${fill(r.muscle)}" stroke="#111" stroke-width="2" stroke-linejoin="round"/>`).join('')
  const lines = (r.lines || []).flatMap((l) => [l, l.map(([x, y]) => [VIEW_W - x, y])]).map((l) => `<path d="${linePath(l)}" fill="none" stroke="#111" stroke-width="1.6" stroke-linecap="round"/>`).join('')
  return `<g transform="translate(${ox},0)">${shapes}${lines}</g>`
}).join('')
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEW_W * 2 + 20} ${VIEW_H}" width="${(VIEW_W * 2 + 20) * 1.6}" height="${VIEW_H * 1.6}">${fig(FRONT, 0)}${fig(BACK, VIEW_W + 20)}</svg>`
const executablePath = process.env.BROWSER_PATH ?? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
const b = await puppeteer.launch({ executablePath, headless: 'new' })
try {
  const p = await b.newPage()
  await p.setViewport({ width: Math.ceil((VIEW_W * 2 + 20) * 1.6) + 20, height: Math.ceil(VIEW_H * 1.6) + 20 })
  await p.setContent(`<body style="margin:10px;background:#f6f2ea">${svg}</body>`)
  await p.screenshot({ path: process.argv[2] || 'body.png' })
} finally {
  await b.close() // never leave the browser process running if a step above throws
}
