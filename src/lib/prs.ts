// PR math. e1RM via Epley: 1RM = w * (1 + reps/30). For bodyweight/time kinds
// there is no load, so the "record" is max reps (or max seconds for time).
import type { ExerciseKind } from '../config/exercises'

export interface ExerciseBest {
  /** heaviest single set weight seen */
  weight: number
  /** most reps seen in one set */
  reps: number
  /** best estimated 1RM (weight kinds only) */
  e1rm: number
}

export function epley(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0
  return weight * (1 + reps / 30)
}

export const EMPTY_BEST: ExerciseBest = { weight: 0, reps: 0, e1rm: 0 }

export type PRKind = 'weight' | 'rep' | 'e1rm'

export interface SetPR {
  kinds: PRKind[]
  e1rm: number
}

/** Which PRs a finished set beats, given the pre-session best for that exercise. */
export function detectSetPRs(
  kind: ExerciseKind,
  set: { weight: number; reps: number },
  best: ExerciseBest,
): SetPR {
  const kinds: PRKind[] = []
  const e1rm = epley(set.weight, set.reps)
  if (kind === 'weight') {
    if (set.weight > best.weight) kinds.push('weight')
    if (e1rm > best.e1rm + 0.01) kinds.push('e1rm')
  } else {
    // reps / time kinds: the rep (or seconds) count is the record
    if (set.reps > best.reps) kinds.push('rep')
  }
  return { kinds, e1rm }
}

export function foldBest(best: ExerciseBest, set: { weight: number; reps: number }): ExerciseBest {
  return {
    weight: Math.max(best.weight, set.weight),
    reps: Math.max(best.reps, set.reps),
    e1rm: Math.max(best.e1rm, epley(set.weight, set.reps)),
  }
}

export const PR_LABEL: Record<PRKind, string> = {
  weight: 'Weight PR',
  rep: 'Rep PR',
  e1rm: 'e1RM PR',
}
