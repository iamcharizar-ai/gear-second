import { useEffect, useState } from 'react'
import { Check, ChevronRight, Dumbbell, Pencil, Play, Plus, X } from 'lucide-react'
import { supersetLabels } from '../lib/supersets'
import { exerciseById, gymSkillsToday, startWorkout, todaysRoutine, useStore, useSync } from '../lib/store'
import { dayISO } from '../arbor-core/model.ts'
import { fmtDuration, weekStart } from '../lib/stats'
import { muscleSetsIn } from '../lib/insights'
import { confirmDialog } from '../lib/confirm'
import { MuscleOverview } from '../components/MuscleOverview'
import { RewardIcon } from '../components/RewardIcon'
import { cleanName, REWARDS } from '../data/rewards'

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
  const sync = useSync()
  const today = todaysRoutine(s)
  const doneToday = s.workouts.some((w) => dayISO(new Date(w.finishedAt)) === dayISO())
  const skills = gymSkillsToday(s)
  // weekly split in calendar order starting Monday, then everything else
  const order = (r: { day?: number }) => (r.day == null ? 99 : (r.day + 6) % 7)
  const routines = s.routines.slice().sort((a, b) => order(a) - order(b))

  const [previewId, setPreviewId] = useState<string | null>(null)
  const preview = previewId ? s.routines.find((r) => r.id === previewId) ?? null : null
  useEffect(() => {
    if (!preview) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setPreviewId(null) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [preview])

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

      {today && !s.active && (
        <section className={`card today ${doneToday ? 'done' : ''}`}>
          <small className="eyebrow">{doneToday ? 'Done today · next up' : 'Next up'}</small>
          <button type="button" className="today-head today-tap" onClick={() => setPreviewId(today.id)} aria-label={`Preview ${cleanName(today.name)}`}>
            <RewardIcon routineId={today.id} size={48} />
            <span>
              <h3>{cleanName(today.name)}</h3>
              {REWARDS[today.id] && <small className="muted">Earns {REWARDS[today.id].name}, one of seven in the Pokedex's training kit</small>}
            </span>
          </button>
          <p>{today.items.length} exercises · {today.items.reduce((n, it) => n + it.sets, 0)} sets{skills.length ? ` · + ${skills.map((k) => k.name).join(', ')}` : ''}</p>
          {doneToday
            ? <span className="today-done"><Check size={18} strokeWidth={3} aria-hidden="true" /> Logged. Gym is ticked in Life OS.</span>
            : <button type="button" className="btn primary wide" onClick={() => start(today.id)}><Play size={18} strokeWidth={2.75} fill="currentColor" aria-hidden="true" /> Start next workout</button>}
        </section>
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
        {routines.map((r) => (
          <div key={r.id} className="card routine">
            <button type="button" className="routine-tap" onClick={() => setPreviewId(r.id)} aria-label={`Preview ${cleanName(r.name)}`}>
              <RewardIcon routineId={r.id} size={40} />
              <span className="routine-main">
                <h3>{cleanName(r.name)}</h3>
                <p>{r.items.map((it) => exerciseById(it.exerciseId, s).name).join(' · ') || 'No exercises'}</p>
              </span>
            </button>
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

      {sync.status !== 'off' && (
        <p className={`sync ${sync.status}`}>
          {sync.status === 'live' ? 'Synced with Life OS and Arbor' : sync.status === 'connecting' ? 'Connecting...' : 'Offline: changes are queued'}
          {sync.pending > 0 ? ` · ${sync.pending} waiting` : ''}
        </p>
      )}

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
      {preview && (() => {
        const labels = supersetLabels(preview.items)
        const sets = preview.items.reduce((n, it) => n + it.sets, 0)
        return (
          <div className="veil preview-veil" onClick={() => setPreviewId(null)}>
            <div className="dialog preview" role="dialog" aria-modal="true" aria-label={`${cleanName(preview.name)} preview`} onClick={(e) => e.stopPropagation()}>
              <header className="preview-head">
                <RewardIcon routineId={preview.id} size={40} />
                <div>
                  <h2>{cleanName(preview.name)}</h2>
                  <small className="muted">{preview.items.length} exercises · {sets} sets</small>
                </div>
                <button type="button" className="icon-btn" onClick={() => setPreviewId(null)} aria-label="Close preview"><X size={18} strokeWidth={2.75} /></button>
              </header>
              {preview.items.length === 0
                ? <p className="muted">No exercises yet.</p>
                : (
                  <ol className="preview-list">
                    {preview.items.map((it) => {
                      const l = it.superset ? labels.get(it.superset) : undefined
                      return (
                        <li key={it.uid} className={l ? 'in-ss' : ''} style={l ? ({ '--ss': l.color } as React.CSSProperties) : undefined}>
                          <span className="preview-name">
                            <b>{exerciseById(it.exerciseId, s).name}</b>
                            {it.note && <small>{it.note}</small>}
                          </span>
                          {l && <span className="ss-tag" title="Superset">{l.letter}</span>}
                          <span className="preview-sets">{it.sets} × {it.repMin === it.repMax ? it.repMin : `${it.repMin}-${it.repMax}`}</span>
                        </li>
                      )
                    })}
                  </ol>
                )}
              <div className="row-end">
                <button type="button" className="btn" onClick={() => { const id = preview.id; setPreviewId(null); onEditRoutine(id) }}><Pencil size={16} strokeWidth={2.5} aria-hidden="true" /> Edit</button>
                <button type="button" className="btn primary" disabled={!preview.items.length} onClick={() => { const id = preview.id; setPreviewId(null); void start(id) }}><Play size={16} strokeWidth={2.75} fill="currentColor" aria-hidden="true" /> Start</button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
