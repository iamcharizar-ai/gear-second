import { motion } from 'framer-motion'
import type { WorkoutSummary } from '../lib/workout'
import { detectSetPRs, EMPTY_BEST, PR_LABEL, type ExerciseBest, type PRKind } from '../lib/prs'
import { EXERCISE_MAP } from '../config/exercises'

/** bestsBefore = personal bests computed EXCLUDING this session, so PRs light up. */
export function Summary({
  workout,
  bestsBefore,
  onDone,
}: {
  workout: WorkoutSummary
  bestsBefore: Map<string, ExerciseBest>
  onDone: () => void
}) {
  const prs: { name: string; kinds: PRKind[] }[] = []
  for (const ex of workout.exercises) {
    const kind = EXERCISE_MAP.get(nameToId(ex.name))?.kind ?? 'weight'
    let best = bestsBefore.get(ex.name) ?? EMPTY_BEST
    const hit = new Set<PRKind>()
    for (const s of ex.sets) {
      for (const k of detectSetPRs(kind, s, best).kinds) hit.add(k)
      best = { weight: Math.max(best.weight, s.weight), reps: Math.max(best.reps, s.reps), e1rm: best.e1rm }
    }
    if (hit.size) prs.push({ name: ex.name, kinds: [...hit] })
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4 px-4 pb-28 pt-8">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="card text-center"
      >
        <div className="text-sm text-dim">Workout complete</div>
        <div className="mt-1 text-xl font-bold">{workout.name}</div>
        <div className="mt-5 flex justify-around">
          <Big n={workout.durationMin} unit="min" />
          <Big n={workout.totalSets} unit="sets" />
          <Big n={workout.volumeKg} unit="kg vol" />
        </div>
      </motion.div>

      {prs.length > 0 && (
        <section className="card border border-gold/40">
          <div className="mb-2 text-sm font-semibold text-gold">⭑ New records</div>
          {prs.map((p) => (
            <div key={p.name} className="flex items-center justify-between py-1.5 text-sm">
              <span>{p.name}</span>
              <span className="text-xs font-semibold text-gold">
                {p.kinds.map((k) => PR_LABEL[k]).join(' · ')}
              </span>
            </div>
          ))}
        </section>
      )}

      <section className="card">
        {workout.exercises.map((e) => (
          <div key={e.name} className="border-b border-line/40 py-2.5 last:border-0">
            <div className="mb-1 font-medium">{e.name}</div>
            <div className="flex flex-wrap gap-1.5">
              {e.sets.map((s, i) => (
                <span key={i} className="num rounded-lg bg-card-2 px-2 py-1 text-xs text-dim">
                  {e.kind === 'time' ? `${s.reps}s` : s.weight > 0 ? `${s.weight}×${s.reps}` : `${s.reps}`}
                </span>
              ))}
            </div>
          </div>
        ))}
      </section>

      <button onClick={onDone} className="pill w-full bg-accent py-3.5 text-base text-ink">
        Done
      </button>
    </div>
  )
}

function nameToId(name: string): string {
  for (const [id, ex] of EXERCISE_MAP) if (ex.name === name) return id
  return name
}

function Big({ n, unit }: { n: number; unit: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="num text-3xl font-bold text-accent">{n}</span>
      <span className="text-xs text-faint">{unit}</span>
    </div>
  )
}
