import { MUSCLE_LABEL, TYPE_LABEL } from '../data/exercises'
import { exerciseById, useStore } from '../lib/store'
import { dateLabel, e1rm, exerciseSessions, fmtKg, fmtSet, recordsOf } from '../lib/stats'
import { PAL } from '../lib/art'
import type { ExType, Muscle } from '../lib/types'
import { BodyMap, Px } from '../components/Pixel'

const metricName = (t: ExType) =>
  t === 'duration' ? 'Longest hold (s)' : t === 'bodyweight' || t === 'assisted' ? 'Most reps' : 'Best est. 1RM (kg)'

/** Pixel bar chart of the key metric per session, oldest → newest. */
function Chart({ values }: { values: number[] }) {
  if (values.length < 2) return <p className="muted">Log this exercise twice to see a trend.</p>
  const lo = Math.min(...values) * 0.85, hi = Math.max(...values)
  // at least 20 slots so two sessions don't render as two giant blocks; newest on the right
  const H = 24, bw = 3, gap = 1, slots = Math.max(values.length, 20)
  const W = slots * (bw + gap)
  const x0 = (slots - values.length) * (bw + gap)
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" shapeRendering="crispEdges" role="img" aria-label="Progress per session">
      {values.map((v, i) => {
        const h = Math.max(1, Math.round(((v - lo) / (hi - lo || 1)) * (H - 2)) + 1)
        return <rect key={i} x={x0 + i * (bw + gap)} y={H - h} width={bw} height={h} fill={i === values.length - 1 ? PAL.straw : PAL.strawDeep} />
      })}
    </svg>
  )
}

export function ExerciseDetail({ id, onBack, onOpenSession }: { id: string; onBack: () => void; onOpenSession: (id: string) => void }) {
  const s = useStore()
  const ex = exerciseById(id, s)
  const sessions = exerciseSessions(id, s)
  const rec = recordsOf(ex.type, sessions.flatMap((x) => x.e.sets))
  const metric = (sets: { kg: number | null; reps: number }[]) =>
    ex.type === 'duration' || ex.type === 'bodyweight' || ex.type === 'assisted'
      ? Math.max(...sets.map((x) => x.reps))
      : Math.max(...sets.map((x) => e1rm(x.kg ?? 0, x.reps)))
  const trend = sessions.slice(0, 24).reverse().map((x) => metric(x.e.sets))

  const fill: Partial<Record<Muscle, string>> = {}
  for (const m of ex.secondary) fill[m] = PAL.strawDeep
  for (const m of ex.primary) fill[m] = PAL.straw

  const records: [string, string | null][] = [
    ['Heaviest', rec.heaviest != null ? `${fmtKg(rec.heaviest)} kg` : null],
    ['Best est. 1RM', rec.bestE1rm != null ? `${fmtKg(Math.round(rec.bestE1rm * 10) / 10)} kg` : null],
    ['Best set volume', rec.bestSetVolume != null ? `${fmtKg(rec.bestSetVolume)} kg` : null],
    ['Most reps', rec.mostReps != null ? String(rec.mostReps) : null],
    ['Longest hold', rec.longest != null ? `${rec.longest}s` : null],
  ]

  return (
    <div className="screen">
      <header className="pagebar">
        <button type="button" className="icon-btn" onClick={onBack} aria-label="Back"><Px name="back" /></button>
        <h1 className="clip">{ex.name}</h1>
      </header>

      <div className="card ex-info">
        <BodyMap fill={fill} scale={3} />
        <dl>
          <dt>Main</dt><dd>{ex.primary.map((m) => MUSCLE_LABEL[m]).join(', ') || '-'}</dd>
          <dt>Also</dt><dd>{ex.secondary.map((m) => MUSCLE_LABEL[m]).join(', ') || '-'}</dd>
          <dt>Logged as</dt><dd>{TYPE_LABEL[ex.type]}</dd>
          <dt>Equipment</dt><dd>{ex.equipment}</dd>
        </dl>
      </div>

      {sessions.length === 0 ? (
        <p className="empty">No sets logged for this exercise yet.</p>
      ) : (
        <>
          <section>
            <div className="section-head"><h2>Records</h2></div>
            <div className="card stat-grid">
              {records.filter(([, v]) => v).map(([k, v]) => <div key={k}><small>{k}</small><b>{v}</b></div>)}
            </div>
          </section>
          <section>
            <div className="section-head"><h2>Progress</h2><span className="muted">{metricName(ex.type)}</span></div>
            <div className="card"><Chart values={trend} /></div>
          </section>
          <section>
            <div className="section-head"><h2>History</h2></div>
            {sessions.map(({ w, e }) => (
              <button key={w.id} type="button" className="card ex-summary" onClick={() => onOpenSession(w.id)}>
                <span className="ex-name">{w.name}<small>{dateLabel(w.finishedAt)}</small></span>
                <ol className="done-sets">
                  {e.sets.map((set, k) => <li key={k}><span>{k + 1}</span>{fmtSet(ex.type, set)}</li>)}
                </ol>
              </button>
            ))}
          </section>
        </>
      )}
    </div>
  )
}
