import { useState } from 'react'
import { ChevronLeft } from 'lucide-react'
import { MUSCLE_LABEL, TYPE_LABEL } from '../data/exercises'
import { exerciseById, useStore } from '../lib/store'
import { dateLabel, exerciseSessions, fmtKg, fmtSet, recordsOf } from '../lib/stats'
import { EX_METRIC_LABEL, EX_METRIC_UNIT, exerciseSeries, metricsFor, setRecords, type ExMetric } from '../lib/insights'
import { RAMP, UNFILLED } from '../lib/theme'
import { BodyMap } from '../components/BodyMap'
import { LineChart, Segmented } from '../components/Charts'

type Tab = 'summary' | 'history'

export function ExerciseDetail({ id, onBack, onOpenSession }: { id: string; onBack: () => void; onOpenSession: (id: string) => void }) {
  const s = useStore()
  const ex = exerciseById(id, s)
  const sessions = exerciseSessions(id, s)
  const metrics = metricsFor(ex.type)
  const [metric, setMetric] = useState<ExMetric>(metrics[0])
  const [tab, setTab] = useState<Tab>('summary')
  const rec = recordsOf(ex.type, sessions.flatMap((x) => x.e.sets))
  const series = exerciseSeries(id, metric, s)
  const loaded = ex.type === 'weight' || ex.type === 'weighted'

  const records: [string, string | null][] = [
    ['Heaviest weight', rec.heaviest != null ? `${fmtKg(rec.heaviest)} kg` : null],
    ['Best 1RM (est.)', rec.bestE1rm != null ? `${fmtKg(Math.round(rec.bestE1rm * 10) / 10)} kg` : null],
    ['Best set volume', rec.bestSetVolume != null ? `${fmtKg(rec.bestSetVolume)} kg` : null],
    ['Most reps', rec.mostReps != null ? String(rec.mostReps) : null],
    ['Best time', rec.longest != null ? `${rec.longest}s` : null],
  ]

  return (
    <div className="screen">
      <header className="pagebar">
        <button type="button" className="icon-btn" onClick={onBack} aria-label="Back"><ChevronLeft size={20} strokeWidth={2.75} /></button>
        <h1 className="clip">{ex.name}</h1>
      </header>

      <Segmented value={tab} onChange={setTab} label="View" options={[{ id: 'summary', label: 'Summary' }, { id: 'history', label: `History (${sessions.length})` }]} />

      {tab === 'summary' && (
        <>
          <div className="card ex-info">
            <BodyMap
              color={(m) => (ex.primary.includes(m) ? RAMP[3] : ex.secondary.includes(m) ? RAMP[0] : UNFILLED)}
              height={230}
              label={`Muscles worked by ${ex.name}`}
            />
            <dl>
              <dt>Primary</dt><dd>{ex.primary.map((m) => MUSCLE_LABEL[m]).join(', ') || '-'}</dd>
              <dt>Secondary</dt><dd>{ex.secondary.map((m) => MUSCLE_LABEL[m]).join(', ') || '-'}</dd>
              <dt>Logged as</dt><dd>{TYPE_LABEL[ex.type]}</dd>
              <dt>Equipment</dt><dd className="cap">{ex.equipment}</dd>
            </dl>
          </div>

          {sessions.length === 0 ? (
            <p className="card empty">No sets logged for this exercise yet.</p>
          ) : (
            <>
              <section className="card">
                <div className="section-head"><h2>Progress</h2></div>
                {metrics.length > 1 && (
                  <div className="scroll-x">
                    <Segmented value={metric} onChange={setMetric} label="Chart metric" options={metrics.map((m) => ({ id: m, label: EX_METRIC_LABEL[m] }))} />
                  </div>
                )}
                {series.length > 1
                  ? <LineChart points={series} unit={EX_METRIC_UNIT[metric]} onOpen={(i) => onOpenSession(series[i].workoutId)} />
                  : <p className="muted">Log this exercise twice to see a trend.</p>}
              </section>

              <section className="card">
                <div className="section-head"><h2>Personal records</h2></div>
                <div className="stat-grid">
                  {records.filter(([, v]) => v).map(([k, v]) => <div key={k}><small>{k}</small><b>{v}</b></div>)}
                </div>
              </section>

              {loaded && (
                <section className="card">
                  <div className="section-head"><h2>Set records</h2><span className="muted">best weight per rep count</span></div>
                  <table className="table">
                    <thead><tr><th>Reps</th><th>Best weight</th><th>Date</th></tr></thead>
                    <tbody>
                      {setRecords(id, s).map((r) => (
                        <tr key={r.reps}>
                          <td>{r.reps}</td>
                          <td><b>{fmtKg(r.kg)} kg</b></td>
                          <td className="muted">{new Date(r.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </section>
              )}
            </>
          )}
        </>
      )}

      {tab === 'history' && (
        <section>
          {sessions.length === 0 && <p className="card empty">No sets logged for this exercise yet.</p>}
          {sessions.map(({ w, e }) => (
            <button key={w.id} type="button" className="card ex-summary" onClick={() => onOpenSession(w.id)}>
              <span className="ex-title">{w.name}<small>{dateLabel(w.finishedAt)}</small></span>
              <ol className="done-sets">
                {e.sets.map((set, k) => <li key={k}><span>{k + 1}</span>{fmtSet(ex.type, set)}</li>)}
              </ol>
            </button>
          ))}
        </section>
      )}
    </div>
  )
}
