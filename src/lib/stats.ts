// Training math: last session's numbers, next-session targets (double
// progression), personal records and weekly sets per muscle.
import type { DoneSet, ExType, Workout } from './types'
import { exerciseById, type State } from './store'

export const INCREMENT_KG = 2.5
/** Weekly working-set target band per muscle for hypertrophy. */
export const WEEKLY_SETS = { min: 10, max: 20 }

export const e1rm = (kg: number, reps: number) => (reps <= 1 ? kg : kg * (1 + reps / 30))
const loaded = (t: ExType) => t === 'weight' || t === 'weighted'

export function fmtKg(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return ''
  return String(Math.round(n * 100) / 100)
}

export function fmtSet(type: ExType, s: DoneSet): string {
  if (type === 'duration') return `${s.reps}s`
  if (type === 'bodyweight') return `${s.reps} reps`
  const kg = fmtKg(s.kg ?? 0)
  if (type === 'weighted') return `+${kg} kg × ${s.reps}`
  if (type === 'assisted') return `-${kg} kg × ${s.reps}`
  return `${kg} kg × ${s.reps}`
}

export const dateLabel = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })

/** Compact form for the PREVIOUS column: 22.5×12, +10×6, 12, 30s. */
export function fmtSetShort(type: ExType, s: DoneSet): string {
  if (type === 'duration') return `${s.reps}s`
  if (type === 'bodyweight') return String(s.reps)
  const sign = type === 'weighted' ? '+' : type === 'assisted' ? '-' : ''
  return `${sign}${fmtKg(s.kg ?? 0)}×${s.reps}`
}

export function fmtDuration(ms: number): string {
  const m = Math.max(0, Math.round(ms / 60000))
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`
}

export function workoutVolume(w: Workout, s: State): number {
  let v = 0
  for (const e of w.exercises) {
    if (!loaded(exerciseById(e.exerciseId, s).type)) continue
    for (const set of e.sets) v += (set.kg ?? 0) * set.reps
  }
  return Math.round(v)
}

export const setCount = (w: Workout) => w.exercises.reduce((n, e) => n + e.sets.length, 0)

/** Sets from the most recent finished workout that included this exercise. */
export function previousSets(exerciseId: string, workouts: Workout[]): DoneSet[] | null {
  for (const w of workouts) {
    const e = w.exercises.find((x) => x.exerciseId === exerciseId)
    if (e) return e.sets
  }
  return null
}

export interface Target {
  kg: string
  reps: string
}

export interface Plan {
  targets: Target[]
  hint: string | null
  /** true when this session should go up in load */
  up: boolean
}

/**
 * Double progression: work inside a rep range. When every set of the last
 * session reached the top of the range, add weight and drop back to the bottom;
 * otherwise keep the weight and beat last time's reps.
 */
export function planFor(
  type: ExType,
  setsWanted: number,
  repMin: number | null,
  repMax: number | null,
  prev: DoneSet[] | null,
): Plan {
  const n = Math.max(setsWanted, 1)
  const range = repMin != null && repMax != null
  const blank = (reps: string): Target[] => Array.from({ length: n }, () => ({ kg: '', reps }))

  if (!prev || prev.length === 0) {
    const reps = range ? `${repMin}-${repMax}` : ''
    return {
      targets: blank(reps),
      hint: range && type !== 'duration' ? `First time: pick a load you can do ${repMin}-${repMax} reps with` : null,
      up: false,
    }
  }

  const at = (i: number) => prev[Math.min(i, prev.length - 1)]
  const allTop = range && prev.every((s) => s.reps >= (repMax as number))

  if (type === 'duration') {
    return { targets: Array.from({ length: n }, (_, i) => ({ kg: '', reps: String(at(i).reps) })), hint: 'Hold longer than last time', up: false }
  }

  if (type === 'bodyweight') {
    const targets = Array.from({ length: n }, (_, i) => ({ kg: '', reps: String(at(i).reps + 1) }))
    return {
      targets,
      hint: allTop ? `Every set hit ${repMax}. Time to add weight or a harder variation` : '+1 rep on each set',
      up: false,
    }
  }

  const kgs = prev.map((s) => s.kg ?? 0)
  const top = type === 'assisted' ? Math.min(...kgs) : Math.max(...kgs)
  if (allTop) {
    const kg = type === 'assisted' ? Math.max(0, top - INCREMENT_KG) : top + INCREMENT_KG
    return {
      targets: Array.from({ length: n }, () => ({ kg: fmtKg(kg), reps: String(repMin) })),
      hint: `${type === 'assisted' ? 'Less assistance' : `+${INCREMENT_KG} kg`}: you hit ${repMax} on every set`,
      up: true,
    }
  }
  return {
    targets: Array.from({ length: n }, (_, i) => ({ kg: fmtKg(at(i).kg ?? top), reps: String(at(i).reps) })),
    hint: range ? `Same load, beat last time's reps (aim for ${repMax})` : null,
    up: false,
  }
}

// ── records ─────────────────────────────────────────────────────────────────
export interface Records {
  heaviest: number | null
  bestE1rm: number | null
  bestSetVolume: number | null
  mostReps: number | null
  longest: number | null
}

export function recordsOf(type: ExType, sets: DoneSet[]): Records {
  const r: Records = { heaviest: null, bestE1rm: null, bestSetVolume: null, mostReps: null, longest: null }
  const max = (a: number | null, b: number) => (a == null || b > a ? b : a)
  for (const s of sets) {
    if (type === 'duration') { r.longest = max(r.longest, s.reps); continue }
    r.mostReps = max(r.mostReps, s.reps)
    if (loaded(type) && s.kg != null) {
      r.heaviest = max(r.heaviest, s.kg)
      r.bestE1rm = max(r.bestE1rm, e1rm(s.kg, s.reps))
      r.bestSetVolume = max(r.bestSetVolume, s.kg * s.reps)
    }
  }
  return r
}

export interface PR {
  exerciseId: string
  label: string
  value: string
}

/** Records broken by `w` against everything logged before it. First-ever sessions don't count. */
export function prsIn(w: Workout, s: State): PR[] {
  const earlier = s.workouts.filter((x) => x.finishedAt < w.finishedAt)
  const out: PR[] = []
  for (const e of w.exercises) {
    const ex = exerciseById(e.exerciseId, s)
    const before = earlier.flatMap((x) => x.exercises.filter((y) => y.exerciseId === e.exerciseId).flatMap((y) => y.sets))
    if (!before.length) continue
    const old = recordsOf(ex.type, before)
    const now = recordsOf(ex.type, e.sets)
    const beat = (a: number | null, b: number | null) => a != null && (b == null || a > b + 1e-9)
    if (beat(now.heaviest, old.heaviest)) out.push({ exerciseId: ex.id, label: 'Heaviest weight', value: `${fmtKg(now.heaviest)} kg` })
    if (beat(now.bestE1rm, old.bestE1rm)) out.push({ exerciseId: ex.id, label: 'Best est. 1RM', value: `${fmtKg(Math.round((now.bestE1rm ?? 0) * 10) / 10)} kg` })
    if (beat(now.bestSetVolume, old.bestSetVolume)) out.push({ exerciseId: ex.id, label: 'Best set volume', value: `${fmtKg(now.bestSetVolume)} kg` })
    if (!loaded(ex.type) && beat(now.mostReps, old.mostReps)) out.push({ exerciseId: ex.id, label: 'Most reps', value: `${now.mostReps}` })
    if (beat(now.longest, old.longest)) out.push({ exerciseId: ex.id, label: 'Longest hold', value: `${now.longest}s` })
  }
  return out
}

// ── weekly volume per muscle ────────────────────────────────────────────────
export function weekStart(d = new Date()): Date {
  const s = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  s.setDate(s.getDate() - ((s.getDay() + 6) % 7)) // Monday
  return s
}


/** Every session of one exercise, newest first. */
export function exerciseSessions(exerciseId: string, s: State) {
  return s.workouts
    .map((w) => ({ w, e: w.exercises.find((x) => x.exerciseId === exerciseId) }))
    .filter((x): x is { w: Workout; e: NonNullable<typeof x.e> } => Boolean(x.e))
}
