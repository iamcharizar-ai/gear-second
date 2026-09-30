import { ChevronRight, Dumbbell, Pencil, Play, Plus } from 'lucide-react'
import { exerciseById, startWorkout, useStore } from '../lib/store'
import { fmtDuration, weekStart } from '../lib/stats'
import { muscleSetsIn } from '../lib/insights'
import { confirmDialog } from '../lib/confirm'
import { MuscleOverview } from '../components/MuscleOverview'

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
  const week = muscleSetsIn(s, [weekStart().toISOString(), new Date(Date.now() + 60_000).toISOString()])
  const last = s.workouts[0]

  const start = async (routineId: string | null) => {
    if (s.active && !(await confirmDialog(`"${s.active.name}" is still running. Discard it and start a new one?`, 'Start new', true))) return
    startWorkout(routineId)
    onOpenWorkout()
  }

  return (
    <div className="screen">
      <header className="brandbar">
        <span className="logo" aria-hidden="true"><Dumbbell size={22} strokeWidth={2.75} /></span>
        <h1>Strong</h1>
      </header>

      {s.active && (
        <button type="button" className="resume" onClick={onOpenWorkout}>
          <Play size={20} strokeWidth={2.75} fill="currentColor" aria-hidden="true" />
          <span>
            <b>{s.active.name}</b>
            <small>in progress · started {fmtDuration(Date.now() - new Date(s.active.startedAt).getTime())} ago</small>
          </span>
          <span className="resume-go">Resume</span>
        </button>
      )}

      <button type="button" className="btn wide" onClick={() => start(null)}>
        <Plus size={18} strokeWidth={2.75} aria-hidden="true" /> Start empty workout
      </button>

      <section>
        <div className="section-head">
          <h2>Routines</h2>
          <button type="button" className="btn sm" onClick={() => onEditRoutine(null)}><Plus size={16} strokeWidth={2.75} aria-hidden="true" /> New</button>
        </div>
        {s.routines.length === 0 && <p className="card empty">No routines yet.</p>}
        {s.routines.map((r) => (
          <div key={r.id} className="card routine">
            <div className="routine-main">
              <h3>{r.name}</h3>
              <p>{r.items.map((it) => exerciseById(it.exerciseId, s).name).join(' · ') || 'No exercises'}</p>
            </div>
            <div className="routine-actions">
              <button type="button" className="icon-btn" onClick={() => onEditRoutine(r.id)} aria-label={`Edit ${r.name}`}><Pencil size={18} strokeWidth={2.5} /></button>
              <button type="button" className="btn primary sm" onClick={() => start(r.id)} disabled={!r.items.length}>Start</button>
            </div>
          </div>
        ))}
      </section>

      <section className="card">
        <div className="section-head">
          <h2>This week</h2>
          <span className="muted">since Monday · tap a muscle</span>
        </div>
        <MuscleOverview sets={week} weeks={1} />
      </section>

      {last && (
        <button type="button" className="card row-card" onClick={() => onOpenSession(last.id)}>
          <span className="row-main">
            <small className="eyebrow">Last workout</small>
            <b>{last.name}</b>
            <small>{new Date(last.finishedAt).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })} · {fmtDuration(new Date(last.finishedAt).getTime() - new Date(last.startedAt).getTime())}</small>
          </span>
          <ChevronRight size={20} aria-hidden="true" />
        </button>
      )}
    </div>
  )
}
