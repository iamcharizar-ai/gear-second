import { memo } from 'react'
import { BODY_BACK, BODY_FRONT, BODY_H, BODY_W, GLYPHS, HAT, HAT_TONES, PAL, REGION, type GlyphName } from '../lib/art'
import { WEEKLY_SETS } from '../lib/stats'
import type { Muscle } from '../lib/types'

// Glyph bitmaps → CSS mask data URLs (tinted by currentColor), built once.
const urls = new Map<GlyphName, { url: string; w: number; h: number }>()
function glyph(name: GlyphName) {
  let u = urls.get(name)
  if (u) return u
  const rows = GLYPHS[name]
  const w = rows[0].length, h = rows.length
  let rects = ''
  rows.forEach((r, y) => [...r].forEach((c, x) => { if (c === '#') rects += `<rect x="${x}" y="${y}" width="1" height="1"/>` }))
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges">${rects}</svg>`
  u = { url: `url("data:image/svg+xml,${encodeURIComponent(svg)}")`, w, h }
  urls.set(name, u)
  return u
}

/** A pixel glyph; `u` = CSS px per art pixel. */
export function Px({ name, u = 2, className = '' }: { name: GlyphName; u?: number; className?: string }) {
  const g = glyph(name)
  return (
    <span
      aria-hidden="true"
      className={`px ${className}`}
      style={{ width: g.w * u, height: g.h * u, WebkitMaskImage: g.url, maskImage: g.url }}
    />
  )
}

/** Merge each row's same-colour runs into single rects to keep the SVG small. */
function Grid({ rows, color, x0 = 0 }: { rows: string[]; color: (c: string) => string | null; x0?: number }) {
  const rects: React.ReactElement[] = []
  rows.forEach((row, y) => {
    let x = 0
    while (x < row.length) {
      const fill = color(row[x])
      let end = x + 1
      while (end < row.length && color(row[end]) === fill) end++
      if (fill) rects.push(<rect key={`${y}-${x}`} x={x0 + x} y={y} width={end - x} height={1} fill={fill} />)
      x = end
    }
  })
  return <>{rects}</>
}

function heat(sets: number): string {
  if (sets <= 0) return PAL.muscleOff
  if (sets < 5) return '#7a5a2a'
  if (sets < WEEKLY_SETS.min) return '#c9922c'
  if (sets <= WEEKLY_SETS.max) return PAL.straw
  return PAL.red
}

type Fill = Partial<Record<Muscle, string>>

/** Front + back pixel figure. Pass `sets` for a weekly heat map or `fill` for explicit colours. */
export const BodyMap = memo(function BodyMap({
  sets,
  fill,
  scale = 4,
}: {
  sets?: Partial<Record<Muscle, number>>
  fill?: Fill
  scale?: number
}) {
  const color = (c: string) => {
    if (c === '.') return null
    const m = REGION[c]
    if (!m) return PAL.skin
    if (fill) return fill[m] ?? PAL.muscleOff
    return heat(sets?.[m] ?? 0)
  }
  const gap = 3
  const W = BODY_W * 2 + gap
  return (
    <svg
      className="bodymap"
      viewBox={`0 0 ${W} ${BODY_H}`}
      width={W * scale}
      height={BODY_H * scale}
      shapeRendering="crispEdges"
      role="img"
      aria-label="Muscle map, front and back"
    >
      <Grid rows={BODY_FRONT} color={color} />
      <Grid rows={BODY_BACK} color={color} x0={BODY_W + gap} />
    </svg>
  )
})

export function Hat({ scale = 3 }: { scale?: number }) {
  const w = HAT[0].length, h = HAT.length
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w * scale} height={h * scale} shapeRendering="crispEdges" aria-hidden="true">
      <Grid rows={HAT} color={(c) => HAT_TONES[c] ?? null} />
    </svg>
  )
}
