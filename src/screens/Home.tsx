import { MUSCLES, MUSCLE_LABEL } from '../data/exercises'
import { exerciseById, startWorkout, useStore } from '../lib/store'
import { WEEKLY_SETS, fmtDuration, weeklyMuscleSets } from '../lib/stats'
import { confirmDialog } from '../lib/confirm'
import { BodyMap, Hat, Px } from '../components/Pixel'

export function Home({
  onOpenWorkout,
  onEditRoutine,
  onOpenSession,
}: {
  onOpenWorkout: () => void
  onEditRoutine: (id: string | null) => void
  onOpenSession: (id: string) => void
}) {
  const s = useStore()
  const week = weeklyMuscleSets(s)
  const last = s.workouts[0]

  const start = async (routineId: string | null) => {
    if (s.active && !(await confirmDialog(`"${s.active.name}" is still running. Discard it and start a new one?`, 'Start new', true))) return
    startWorkout(routineId)
    onOpenWorkout()
  }

  const trained = MUSCLES.filter((m) => (week[m] ?? 0) > 0)
  const untrained = MUSCLES.filter((m) => !(week[m] ?? 0))

  return (
    <div className="screen">
      <header className="brandbar">
        <Hat scale={2} />
        <h1>STRONG</h1>
      </header>

      {s.active && (
        <button type="button" className="resume" onClick={onOpenWorkout}>
          <Px name="play" />
          <span>
            <b>{s.active.name}</b>
            <small>in progress · started {fmtDuration(Date.now() - new Date(s.active.startedAt).getTime())} ago</small>
          </span>
          <span className="resume-go">Resume</span>
        </button>
      )}

      <button type="button" className="btn wide" onClick={() => start(null)}>
        <Px name="plus" /> Start empty workout
      </button>

      <section>
        <div className="section-head">
          <h2>Routines</h2>
          <button type="button" className="btn sm" onClick={() => onEditRoutine(null)}><Px name="plus" /> New</button>
        </div>
        {s.routines.length === 0 && <p className="empty">No routines yet.</p>}
        {s.routines.map((r) => (
          <div key={r.id} className="card routine">
            <div className="routine-main">
              <h3>{r.name}</h3>
              <p>{r.items.map((it) => exerciseById(it.exerciseId, s).name).join(' · ') || 'No exercises'}</p>
            </div>
            <div className="routine-actions">
              <button type="button" className="icon-btn" onClick={() => onEditRoutine(r.id)} aria-label={`Edit ${r.name}`}><Px name="pencil" /></button>
              <button type="button" className="btn primary sm" onClick={() => start(r.id)} disabled={!r.items.length}>Start</button>
            </div>
          </div>
        ))}
      </section>

      <section>
        <div className="section-head">
          <h2>This week</h2>
          <span className="muted">sets per muscle · target {WEEKLY_SETS.min}-{WEEKLY_SETS.max}</span>
        </div>
        <div className="card week">
          <BodyMap sets={week} scale={4} />
          <div className="week-side">
          {trained.length === 0 && <p className="week-empty">Nothing trained yet this week.</p>}
          <ul className="muscle-bars">
            {trained.map((m) => {
              const v = week[m] ?? 0
              const pct = Math.min(100, (v / WEEKLY_SETS.max) * 100)
              const cls = v === 0 ? 'zero' : v < WEEKLY_SETS.min ? 'low' : v <= WEEKLY_SETS.max ? 'good' : 'over'
              return (
                <li key={m} className={cls}>
                  <span className="m-name">{MUSCLE_LABEL[m]}</span>
                  <span className="m-bar"><i style={{ width: `${pct}%` }} /><b style={{ left: `${(WEEKLY_SETS.min / WEEKLY_SETS.max) * 100}%` }} /></span>
                  <span className="m-n">{Math.round(v * 10) / 10}</span>
                </li>
              )
            })}
          </ul>
          {trained.length > 0 && untrained.length > 0 && (
            <p className="untrained">Not trained: {untrained.map((m) => MUSCLE_LABEL[m]).join(', ')}</p>
          )}
          </div>
        </div>
      </section>

      {last && (
        <section>
          <div className="section-head"><h2>Last workout</h2></div>
          <button type="button" className="card last" onClick={() => onOpenSession(last.id)}>
            <b>{last.name}</b>
            <small>{new Date(last.finishedAt).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })} · {fmtDuration(new Date(last.finishedAt).getTime() - new Date(last.startedAt).getTime())}</small>
          </button>
        </section>
      )}
    </div>
  )
}
