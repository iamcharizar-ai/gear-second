import { exerciseById, deleteWorkout, getState, saveRoutine, uid, useStore } from '../lib/store'
import { dateLabel, fmtDuration, fmtSet, prsIn, setCount, workoutVolume } from '../lib/stats'
import { supersetLabels } from '../lib/supersets'
import type { Routine, Workout } from '../lib/types'
import { confirmDialog } from '../lib/confirm'
import { Hat, Px } from '../components/Pixel'


/** Turn a finished workout into a routine, keeping rep ranges from its source routine when known. */
function routineFrom(w: Workout): Routine {
  const s = getState()
  const src = s.routines.find((r) => r.id === w.routineId)
  const taken = new Set(s.routines.map((r) => r.name.toLowerCase()))
  let name = w.name
  for (let n = 2; taken.has(name.toLowerCase()); n++) name = `${w.name} ${n}`
  const ids = new Map<string, string>()
  return {
    id: uid(),
    name,
    updatedAt: new Date().toISOString(),
    items: w.exercises.map((e) => {
      const from = src?.items.find((it) => it.exerciseId === e.exerciseId)
      let superset: string | null = null
      if (e.superset) {
        if (!ids.has(e.superset)) ids.set(e.superset, 'ss-' + uid())
        superset = ids.get(e.superset) ?? null
      }
      return {
        uid: uid(),
        exerciseId: e.exerciseId,
        sets: e.sets.length,
        repMin: from?.repMin ?? 8,
        repMax: from?.repMax ?? 12,
        superset,
        note: e.note,
      }
    }),
  }
}

export function Session({
  id,
  celebrate,
  onBack,
  onOpenExercise,
  onEditRoutine,
}: {
  id: string
  celebrate: boolean
  onBack: () => void
  onOpenExercise: (id: string) => void
  onEditRoutine: (id: string) => void
}) {
  const s = useStore()
  const w = s.workouts.find((x) => x.id === id)
  if (!w) {
    return (
      <div className="screen">
        <header className="pagebar"><button type="button" className="icon-btn" onClick={onBack} aria-label="Back"><Px name="back" /></button><h1>Workout</h1></header>
        <p className="empty">This workout no longer exists.</p>
      </div>
    )
  }
  const prs = prsIn(w, s)
  const labels = supersetLabels(w.exercises.map((e, i) => ({ uid: String(i), superset: e.superset })))

  return (
    <div className="screen">
      <header className="pagebar">
        <button type="button" className="icon-btn" onClick={onBack} aria-label="Back"><Px name="back" /></button>
        <h1>{celebrate ? 'Done' : 'Workout'}</h1>
      </header>

      {celebrate && (
        <div className="celebrate">
          <Hat scale={4} />
          <h2>Workout complete</h2>
          {prs.length > 0 && <p className="gold">{prs.length} new record{prs.length > 1 ? 's' : ''}</p>}
        </div>
      )}

      <div className="card">
        <h2 className="session-title">{w.name}</h2>
        <small className="muted">{dateLabel(w.finishedAt)}</small>
        <div className="stat-grid">
          <div><small>Duration</small><b>{fmtDuration(new Date(w.finishedAt).getTime() - new Date(w.startedAt).getTime())}</b></div>
          <div><small>Volume</small><b>{workoutVolume(w, s).toLocaleString('en-IN')} kg</b></div>
          <div><small>Sets</small><b>{setCount(w)}</b></div>
        </div>
        {w.note && <p className="session-note">{w.note}</p>}
      </div>

      {prs.length > 0 && (
        <section>
          <div className="section-head"><h2>Records</h2></div>
          <ul className="card pr-list">
            {prs.map((p, i) => (
              <li key={i}>
                <Px name="trophy" className="gold" />
                <span className="pr-text">{exerciseById(p.exerciseId, s).name}<small>{p.label}</small></span>
                <b>{p.value}</b>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        {w.exercises.map((e, i) => {
          const def = exerciseById(e.exerciseId, s)
          const l = e.superset ? labels.get(e.superset) : null
          return (
            <div key={i} className={`card ex-summary ${l ? 'in-ss' : ''}`} style={l ? ({ '--ss': l.color } as React.CSSProperties) : undefined}>
              <button type="button" className="ex-name" onClick={() => onOpenExercise(def.id)}>
                {l && <span className="ss-tag">{l.letter}</span>}{def.name}
              </button>
              <ol className="done-sets">
                {e.sets.map((set, k) => <li key={k}><span>{k + 1}</span>{fmtSet(def.type, set)}</li>)}
              </ol>
              {e.note && <p className="muted">{e.note}</p>}
            </div>
          )
        })}
      </section>

      <div className="stack">
        {celebrate && <button type="button" className="btn primary wide" onClick={onBack}>Done</button>}
        <button
          type="button"
          className="btn wide"
          onClick={() => {
            const r = routineFrom(w)
            saveRoutine(r)
            onEditRoutine(r.id)
          }}
        >
          Save as routine
        </button>
        <button
          type="button"
          className="btn danger-ghost wide"
          onClick={async () => {
            if (await confirmDialog('Delete this workout from your history? This cannot be undone.', 'Delete', true)) {
              deleteWorkout(w.id)
              onBack()
            }
          }}
        >
          <Px name="trash" /> Delete workout
        </button>
      </div>
    </div>
  )
}
