import { ChevronLeft } from 'lucide-react'
import { MUSCLE_LABEL, TYPE_LABEL } from '../data/exercises'
import { exerciseById, useStore } from '../lib/store'
import { dateLabel, exerciseSessions, fmtSet } from '../lib/stats'
import { RAMP, UNFILLED } from '../lib/theme'
import { BodyMap } from '../components/BodyMap'
import { VITALS_URL } from '../lib/links'

export function ExerciseDetail({ id, onBack, onOpenSession }: { id: string; onBack: () => void; onOpenSession: (id: string) => void }) {
  const s = useStore()
  const ex = exerciseById(id, s)
  const sessions = exerciseSessions(id, s)

  return (
    <div className="screen">
      <header className="pagebar">
        <button type="button" className="icon-btn" onClick={onBack} aria-label="Back"><ChevronLeft size={20} strokeWidth={2.75} /></button>
        <h1 className="clip">{ex.name}</h1>
      </header>

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

      <section>
        <div className="section-head">
          <h2>History</h2>
          <a className="link" href={VITALS_URL} target="_blank" rel="noreferrer">Progress and records in Vitals</a>
        </div>
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
    </div>
  )
}
