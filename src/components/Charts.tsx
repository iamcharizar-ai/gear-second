import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { GRID, INK, SERIES } from '../lib/theme'

// Small hand-rolled SVG charts. Spec: thin marks, 4px rounded bar ends on the
// baseline, 2px lines, ≥8px markers, recessive grid, text in text colours
// (never the series colour), and a readout that follows hover / tap so every
// mark can be inspected on a phone.

const nice = (v: number) => {
  if (v <= 0) return 1
  const p = 10 ** Math.floor(Math.log10(v))
  const f = v / p
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p
}
const short = (v: number) => (v >= 10000 ? `${Math.round(v / 1000)}k` : v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(Math.round(v * 10) / 10))

/** Rect with rounded top corners only (data end), square on the baseline. */
function barPath(x: number, y: number, w: number, h: number, r = 4) {
  const rr = Math.min(r, h, w / 2)
  return `M${x},${y + h}V${y + rr}Q${x},${y} ${x + rr},${y}H${x + w - rr}Q${x + w},${y} ${x + w},${y + rr}V${y + h}Z`
}

export interface BarDatum {
  label: string // short axis label
  title: string // readout label
  value: number
}

export function BarChart({
  data,
  unit,
  format = short,
  band,
  color = SERIES.current,
}: {
  data: BarDatum[]
  unit: string
  format?: (v: number) => string
  /** shaded target band, e.g. 10-20 sets */
  band?: [number, number]
  color?: string
}) {
  const [sel, setSel] = useState(data.length - 1)
  const W = 340, H = 170, L = 34, B = 22, T = 8
  const max = nice(Math.max(...data.map((d) => d.value), band ? band[1] : 0, 1))
  const slot = (W - L) / data.length
  const bw = Math.max(4, slot - Math.max(2, slot * 0.3))
  const y = (v: number) => T + (H - T - B) * (1 - v / max)
  const cur = data[Math.min(sel, data.length - 1)]
  const every = Math.ceil(data.length / 6)
  return (
    <figure className="chart">
      <figcaption className="readout">
        <span>{cur?.title}</span>
        <b>{cur ? `${format(cur.value)} ${unit}` : '-'}</b>
      </figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Bar chart of ${unit} per period`} onMouseLeave={() => setSel(data.length - 1)}>
        {band && <rect x={L} y={y(band[1])} width={W - L} height={y(band[0]) - y(band[1])} fill={color} opacity={0.08} />}
        {[0, 0.5, 1].map((f) => (
          <g key={f}>
            <line x1={L} x2={W} y1={y(max * f)} y2={y(max * f)} stroke={GRID} strokeWidth={1} />
            <text x={L - 6} y={y(max * f) + 4} textAnchor="end" className="axis">{short(max * f)}</text>
          </g>
        ))}
        {data.map((d, i) => {
          const h = Math.max(d.value > 0 ? 2 : 0, H - B - y(d.value))
          const x = L + i * slot + (slot - bw) / 2
          return (
            <g key={i} onMouseEnter={() => setSel(i)} onClick={() => setSel(i)}>
              <rect x={L + i * slot} y={T} width={slot} height={H - T - B} fill="transparent" />
              {h > 0 && <path d={barPath(x, H - B - h, bw, h)} fill={color} stroke={i === sel ? INK : 'none'} strokeWidth={2} />}
              {i % every === (data.length - 1) % every && (
                <text x={x + bw / 2} y={H - 6} textAnchor="middle" className="axis">{d.label}</text>
              )}
            </g>
          )
        })}
        <line x1={L} x2={W} y1={H - B} y2={H - B} stroke={INK} strokeWidth={1.5} />
      </svg>
    </figure>
  )
}

export interface LinePoint {
  date: Date
  value: number
}

export function LineChart({ points, unit, onOpen }: { points: LinePoint[]; unit: string; onOpen?: (i: number) => void }) {
  const [sel, setSel] = useState(points.length - 1)
  const W = 340, H = 180, L = 38, R = 10, B = 24, T = 12
  const vals = points.map((p) => p.value)
  const lo0 = Math.min(...vals), hi0 = Math.max(...vals)
  const pad = (hi0 - lo0) * 0.15 || Math.max(1, hi0 * 0.1)
  // whole-number metrics (reps, seconds) get whole-number ticks
  const ints = vals.every(Number.isInteger)
  const lo = ints ? Math.max(0, Math.floor(lo0 - pad)) : Math.max(0, lo0 - pad)
  const hi = ints ? Math.ceil(hi0 + pad) : hi0 + pad
  const t0 = points[0]?.date.getTime() ?? 0, t1 = points[points.length - 1]?.date.getTime() ?? 1
  const x = (d: Date) => (t1 === t0 ? (L + W - R) / 2 : L + ((d.getTime() - t0) / (t1 - t0)) * (W - L - R))
  const y = (v: number) => T + (H - T - B) * (1 - (v - lo) / (hi - lo || 1))
  const cur = points[Math.min(sel, points.length - 1)]
  const d = points.map((p, i) => `${i ? 'L' : 'M'}${x(p.date).toFixed(1)},${y(p.value).toFixed(1)}`).join('')
  const fmtD = (dt: Date) => dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
  const ticks = ints ? [...new Set([lo, Math.round((lo + hi) / 2), hi])] : [lo, (lo + hi) / 2, hi]
  return (
    <figure className="chart">
      <figcaption className="readout">
        <span>{cur ? fmtD(cur.date) : ''}</span>
        <b>{cur ? `${short(cur.value)} ${unit}` : '-'}</b>
      </figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Line chart of ${unit} per session`}>
        {ticks.map((v, i) => (
          <g key={i}>
            <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke={GRID} strokeWidth={1} />
            <text x={L - 6} y={y(v) + 4} textAnchor="end" className="axis">{short(v)}</text>
          </g>
        ))}
        <path d={d} fill="none" stroke={SERIES.current} strokeWidth={2} strokeLinejoin="round" />
        {points.map((p, i) => (
          <g key={i} onMouseEnter={() => setSel(i)} onClick={() => { setSel(i); onOpen?.(i) }} className="pt">
            <circle cx={x(p.date)} cy={y(p.value)} r={12} fill="transparent" />
            <circle cx={x(p.date)} cy={y(p.value)} r={i === sel ? 5.5 : 4} fill={i === sel ? INK : SERIES.current} stroke="#fff" strokeWidth={2} />
          </g>
        ))}
        {points.length > 0 && (
          <>
            <text x={L} y={H - 6} className="axis">{fmtD(points[0].date)}</text>
            {points.length > 1 && <text x={W - R} y={H - 6} textAnchor="end" className="axis">{fmtD(points[points.length - 1].date)}</text>}
          </>
        )}
      </svg>
    </figure>
  )
}

/** Spider chart: current vs previous period, with legend and a table view. */
export function Radar({ axes, current, previous }: { axes: string[]; current: number[]; previous: number[] }) {
  const [sel, setSel] = useState<number | null>(null)
  const S = 300, C = S / 2, R = 104
  const max = nice(Math.max(...current, ...previous, 1))
  const pt = (i: number, v: number) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / axes.length
    const r = (R * v) / max
    return [C + Math.cos(a) * r, C + Math.sin(a) * r] as const
  }
  const poly = (vals: number[]) => vals.map((v, i) => pt(i, v).join(',')).join(' ')
  const ring = (f: number) => axes.map((_, i) => pt(i, max * f).join(',')).join(' ')
  return (
    <figure className="chart radar">
      <div className="legend">
        <span><i style={{ background: SERIES.current }} /> This period</span>
        <span><i className="dash" style={{ borderColor: SERIES.previous }} /> Previous</span>
      </div>
      <svg viewBox={`0 0 ${S} ${S}`} role="img" aria-label="Muscle distribution, this period versus previous">
        {[0.25, 0.5, 0.75, 1].map((f) => <polygon key={f} points={ring(f)} fill="none" stroke={GRID} strokeWidth={1} />)}
        {axes.map((_, i) => {
          const [x, y] = pt(i, max)
          return <line key={i} x1={C} y1={C} x2={x} y2={y} stroke={GRID} strokeWidth={1} />
        })}
        <polygon points={poly(previous)} fill={SERIES.previous} fillOpacity={0.08} stroke={SERIES.previous} strokeWidth={2} strokeDasharray="5 4" />
        <polygon points={poly(current)} fill={SERIES.current} fillOpacity={0.2} stroke={SERIES.current} strokeWidth={2} />
        {current.map((v, i) => {
          const [x, y] = pt(i, v)
          return <circle key={i} cx={x} cy={y} r={4} fill={SERIES.current} stroke="#fff" strokeWidth={2} />
        })}
        {axes.map((a, i) => {
          const [x, y] = pt(i, max * 1.2)
          return (
            <text key={a} x={x} y={y + 4} textAnchor="middle" className={`axis-label ${sel === i ? 'on' : ''}`} onClick={() => setSel(sel === i ? null : i)}>
              {a}
            </text>
          )
        })}
      </svg>
      <table className="mini-table">
        <thead><tr><th>Group</th><th>Now</th><th>Before</th></tr></thead>
        <tbody>
          {axes.map((a, i) => (
            <tr key={a} className={sel === i ? 'on' : ''} onClick={() => setSel(sel === i ? null : i)}>
              <td>{a}</td><td>{short(current[i])}</td><td>{short(previous[i])}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}

/** Month grid; days with a workout are filled. */
export function Calendar({ days, onOpen }: { days: Map<string, string[]>; onOpen: (workoutId: string) => void }) {
  const [offset, setOffset] = useState(0)
  const month = useMemo(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth() + offset, 1)
  }, [offset])
  const key = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const lead = (month.getDay() + 6) % 7
  const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
  const today = key(new Date())
  const cells = Array.from({ length: lead + count }, (_, i) => (i < lead ? null : new Date(month.getFullYear(), month.getMonth(), i - lead + 1)))
  const trained = cells.filter((d) => d && days.has(key(d))).length
  return (
    <div className="calendar">
      <div className="cal-head">
        <button type="button" className="icon-btn" onClick={() => setOffset((o) => o - 1)} aria-label="Previous month"><ChevronLeft size={18} /></button>
        <b>{month.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</b>
        <button type="button" className="icon-btn" onClick={() => setOffset((o) => Math.min(0, o + 1))} disabled={offset === 0} aria-label="Next month"><ChevronRight size={18} /></button>
      </div>
      <div className="cal-grid">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <span key={i} className="cal-dow">{d}</span>)}
        {cells.map((d, i) => {
          if (!d) return <span key={i} />
          const k = key(d)
          const ids = days.get(k)
          return (
            <button
              key={i}
              type="button"
              className={`cal-day ${ids ? 'on' : ''} ${k === today ? 'today' : ''}`}
              disabled={!ids}
              onClick={() => ids && onOpen(ids[0])}
              aria-label={`${d.toDateString()}${ids ? `, ${ids.length} workout${ids.length > 1 ? 's' : ''}` : ''}`}
            >
              {d.getDate()}
            </button>
          )
        })}
      </div>
      <p className="muted">{trained} workout day{trained === 1 ? '' : 's'} this month</p>
    </div>
  )
}

/** Horizontal bars per muscle with the 10-20 target marked; zero = empty bar. */
export function MuscleBars<M extends string>({
  rows,
  target,
  selected,
  onSelect,
  unit,
}: {
  rows: { key: M; label: string; value: number }[]
  target?: [number, number]
  selected?: M | null
  onSelect?: (m: M) => void
  unit: string
}) {
  const max = Math.max(target ? target[1] * 1.25 : 1, ...rows.map((r) => r.value))
  return (
    <ul className="mbars" aria-label={`Sets per muscle (${unit})`}>
      {rows.map((r) => (
        <li key={r.key}>
          <button type="button" className={`mbar ${selected === r.key ? 'on' : ''} ${r.value ? '' : 'zero'}`} onClick={() => onSelect?.(r.key)}>
            <span className="mbar-name">{r.label}</span>
            <span className="mbar-track">
              <i style={{ width: `${(r.value / max) * 100}%` }} />
              {target && (
                <>
                  <b style={{ left: `${(target[0] / max) * 100}%` }} />
                  <b style={{ left: `${(target[1] / max) * 100}%` }} />
                </>
              )}
            </span>
            <span className="mbar-n">{Math.round(r.value * 10) / 10}</span>
          </button>
        </li>
      ))}
      {target && <li className="mbar-key"><b /> target {target[0]}-{target[1]} {unit}</li>}
    </ul>
  )
}

export function Segmented<T extends string>({ value, options, onChange, label }: { value: T; options: { id: T; label: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div className="seg" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button key={o.id} type="button" role="radio" aria-checked={value === o.id} className={value === o.id ? 'on' : ''} onClick={() => onChange(o.id)}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

