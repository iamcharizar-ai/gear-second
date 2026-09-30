import { memo } from 'react'
import { BACK, FRONT, HEAD, OUTLINE, VIEW_H, VIEW_W, linePath, mirrorPts, smooth, type Region } from '../lib/anatomy'
import { BODY, INK } from '../lib/theme'
import { MUSCLE_LABEL } from '../data/exercises'
import type { Muscle } from '../lib/types'

// Paths are static: build them once at module load.
const OUT = smooth(OUTLINE, 0.4)
const HEAD_D = smooth(HEAD)
const build = (regions: Region[]) =>
  regions.map((r) => ({
    muscle: r.muscle,
    d: [smooth(r.pts), smooth(mirrorPts(r.pts))],
    lines: (r.lines ?? []).flatMap((l) => [linePath(l), linePath(l.map(([x, y]) => [VIEW_W - x, y] as [number, number]))]),
  }))
const FRONT_P = build(FRONT)
const BACK_P = build(BACK)
const GAP = 24

/**
 * Front + back muscle map. `color(m)` decides each muscle's fill; tapping a
 * muscle reports it (and the chosen one gets a thick outline).
 */
export const BodyMap = memo(function BodyMap({
  color,
  selected = null,
  onSelect,
  height = 360,
  label,
}: {
  color: (m: Muscle) => string
  selected?: Muscle | null
  onSelect?: (m: Muscle) => void
  height?: number
  label: string
}) {
  const W = VIEW_W * 2 + GAP
  const fig = (parts: ReturnType<typeof build>, ox: number, side: string) => (
    <g transform={`translate(${ox},0)`}>
      <path d={OUT} fill={BODY} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      <path d={HEAD_D} fill={BODY} stroke={INK} strokeWidth={3} />
      {parts.map((p, i) => {
        const on = selected === p.muscle
        return (
          <g
            key={i}
            className={onSelect ? 'muscle hit' : 'muscle'}
            onClick={onSelect ? () => onSelect(p.muscle) : undefined}
            role={onSelect ? 'button' : undefined}
            aria-label={onSelect ? `${MUSCLE_LABEL[p.muscle]} (${side})` : undefined}
          >
            {p.d.map((d, k) => (
              <path key={k} d={d} fill={color(p.muscle)} stroke={INK} strokeWidth={on ? 4 : 2} strokeLinejoin="round" />
            ))}
            {p.lines.map((d, k) => <path key={`l${k}`} d={d} fill="none" stroke={INK} strokeWidth={1.4} strokeLinecap="round" opacity={0.7} />)}
          </g>
        )
      })}
    </g>
  )
  return (
    <svg className="bodymap" viewBox={`-4 0 ${W + 8} ${VIEW_H + 18}`} style={{ height, maxWidth: '100%' }} role="img" aria-label={label}>
      {fig(FRONT_P, 0, 'front')}
      {fig(BACK_P, VIEW_W + GAP, 'back')}
      <text x={VIEW_W / 2} y={VIEW_H + 15} className="bm-cap" textAnchor="middle">FRONT</text>
      <text x={VIEW_W * 1.5 + GAP} y={VIEW_H + 15} className="bm-cap" textAnchor="middle">BACK</text>
    </svg>
  )
})
