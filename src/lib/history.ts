// Finished-session history — the derived source for ghost values and PRs.
// v0.1 is local-first: every Finish appends a WorkoutSummary here. Cloud sync
// (cloudSync.ts) hydrates this list on boot when Supabase keys exist, so ghost
// values survive across devices; without keys it's pure-local, still fully usable.
import type { WorkoutSummary } from './workout'
import { EMPTY_BEST, foldBest, type ExerciseBest } from './prs'

const KEY = 'strong.history.v1'

export function loadHistory(): WorkoutSummary[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const arr = JSON.parse(raw) as WorkoutSummary[]
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

export function saveHistory(list: WorkoutSummary[]): void {
  localStorage.setItem(KEY, JSON.stringify(list))
}

/** Append newest-first, dedup by id. Returns the new list. */
export function appendHistory(w: WorkoutSummary): WorkoutSummary[] {
  const list = loadHistory().filter((x) => x.id !== w.id)
  list.unshift(w)
  saveHistory(list)
  return list
}

/** Merge cloud-fetched summaries into local history (union by id, newest-first). */
export function mergeHistory(incoming: WorkoutSummary[]): WorkoutSummary[] {
  const byId = new Map<string, WorkoutSummary>()
  for (const w of [...loadHistory(), ...incoming]) byId.set(w.id, w)
  const list = [...byId.values()].sort(
    (a, b) => new Date(b.finishedAt).getTime() - new Date(a.finishedAt).getTime(),
  )
  saveHistory(list)
  return list
}

/** Last logged sets for an exercise (by name) — the ghost values prefilled into a new session. */
export function lastSetsFor(list: WorkoutSummary[], exerciseName: string): { weight: number; reps: number }[] {
  for (const w of list) {
    const ex = w.exercises.find((e) => e.name === exerciseName)
    if (ex && ex.sets.length) return ex.sets
  }
  return []
}

/** Personal best per exercise name, folded across all history. */
export function bestsByExercise(list: WorkoutSummary[]): Map<string, ExerciseBest> {
  const map = new Map<string, ExerciseBest>()
  for (const w of list) {
    for (const ex of w.exercises) {
      let best = map.get(ex.name) ?? EMPTY_BEST
      for (const s of ex.sets) best = foldBest(best, s)
      map.set(ex.name, best)
    }
  }
  return map
}
