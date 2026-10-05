// Working sets per muscle: what colours the body heatmap. The charts, trends
// and records built on the same workouts are shown in Vitals.
import { exerciseById, type State } from './store'
import type { Muscle, Workout } from './types'

export const workoutsIn = (s: State, [from, to]: [string, string]) => s.workouts.filter((w) => w.finishedAt >= from && w.finishedAt < to)

export type MuscleSets = Partial<Record<Muscle, number>>

/** Working sets per muscle: a primary muscle counts 1, a secondary ½. */
export function muscleSetsOf(workouts: Workout[], s: State): MuscleSets {
  const out: MuscleSets = {}
  for (const w of workouts) {
    for (const e of w.exercises) {
      const ex = exerciseById(e.exerciseId, s)
      for (const m of ex.primary) out[m] = (out[m] ?? 0) + e.sets.length
      for (const m of ex.secondary) out[m] = (out[m] ?? 0) + e.sets.length / 2
    }
  }
  return out
}

export const muscleSetsIn = (s: State, range: [string, string]) => muscleSetsOf(workoutsIn(s, range), s)
