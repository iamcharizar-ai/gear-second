// Analytics behind the Stats tab and exercise charts: periods, muscle and
// group distributions, weekly series, streaks, per-exercise metrics.
import { GROUPS, GROUP_OF, type Group } from '../data/exercises'
import { exerciseById, type State } from './store'
import { e1rm, exerciseSessions, setCount, weekStart, workoutVolume } from './stats'
import type { DoneSet, ExType, Muscle, Workout } from './types'

const DAY = 86_400_000

// ── periods ─────────────────────────────────────────────────────────────────
export type Period = '7d' | '30d' | '90d' | '365d'
export const PERIODS: Period[] = ['7d', '30d', '90d', '365d']
export const PERIOD_DAYS: Record<Period, number> = { '7d': 7, '30d': 30, '90d': 90, '365d': 365 }
export const PERIOD_LABEL: Record<Period, string> = { '7d': '7 days', '30d': '30 days', '90d': '3 months', '365d': 'Year' }

/** [from, to) ISO bounds; offset 1 = the equal-length period just before. */
export function periodRange(p: Period, offset = 0, now = Date.now()): [string, string] {
  const len = PERIOD_DAYS[p] * DAY
  const to = now - offset * len
  return [new Date(to - len).toISOString(), new Date(to).toISOString()]
}

export const workoutsIn = (s: State, [from, to]: [string, string]) => s.workouts.filter((w) => w.finishedAt >= from && w.finishedAt < to)

// ── distributions ───────────────────────────────────────────────────────────
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

export function groupSets(ms: MuscleSets): Record<Group, number> {
  const out = Object.fromEntries(GROUPS.map((g) => [g, 0])) as Record<Group, number>
  for (const [m, v] of Object.entries(ms)) out[GROUP_OF[m as Muscle]] += v ?? 0
  return out
}

// ── weekly series ───────────────────────────────────────────────────────────
export type WeekMetric = 'duration' | 'volume' | 'reps' | 'sets'
export const WEEK_METRICS: WeekMetric[] = ['duration', 'volume', 'reps', 'sets']
export const WEEK_METRIC_LABEL: Record<WeekMetric, string> = { duration: 'Duration', volume: 'Volume', reps: 'Reps', sets: 'Sets' }
export const WEEK_METRIC_UNIT: Record<WeekMetric, string> = { duration: 'min', volume: 'kg', reps: 'reps', sets: 'sets' }

/** Monday of each of the last `n` weeks, oldest first. */
export function lastWeeks(n: number, now = new Date()): Date[] {
  const start = weekStart(now)
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(start)
    d.setDate(d.getDate() - (n - 1 - i) * 7)
    return d
  })
}

const weekRange = (week: Date): [string, string] => {
  const end = new Date(week)
  end.setDate(end.getDate() + 7)
  return [week.toISOString(), end.toISOString()]
}

function workoutMetric(w: Workout, m: WeekMetric, s: State): number {
  if (m === 'duration') return (new Date(w.finishedAt).getTime() - new Date(w.startedAt).getTime()) / 60000
  if (m === 'volume') return workoutVolume(w, s)
  if (m === 'sets') return setCount(w)
  return w.exercises.reduce(
    (n, e) => (exerciseById(e.exerciseId, s).type === 'duration' ? n : n + e.sets.reduce((k, x) => k + x.reps, 0)),
    0,
  )
}

export function weeklySeries(s: State, metric: WeekMetric, n = 12): { week: Date; value: number }[] {
  return lastWeeks(n).map((week) => ({
    week,
    value: Math.round(workoutsIn(s, weekRange(week)).reduce((a, w) => a + workoutMetric(w, metric, s), 0)),
  }))
}

/** Sets for one muscle in each of the last `n` weeks. */
export function muscleWeekly(s: State, muscle: Muscle, n = 12): { week: Date; value: number }[] {
  return lastWeeks(n).map((week) => ({ week, value: muscleSetsIn(s, weekRange(week))[muscle] ?? 0 }))
}

/** Most-trained exercises in a range, by working sets. */
export function mainExercises(s: State, range: [string, string], n = 6) {
  const tally = new Map<string, { sessions: number; sets: number }>()
  for (const w of workoutsIn(s, range)) {
    for (const e of w.exercises) {
      const t = tally.get(e.exerciseId) ?? { sessions: 0, sets: 0 }
      t.sessions++
      t.sets += e.sets.length
      tally.set(e.exerciseId, t)
    }
  }
  return [...tally.entries()].map(([exerciseId, t]) => ({ exerciseId, ...t })).sort((a, b) => b.sets - a.sets).slice(0, n)
}

// ── calendar & streak ───────────────────────────────────────────────────────
export const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export function workoutDays(s: State): Map<string, string[]> {
  const m = new Map<string, string[]>()
  for (const w of s.workouts) {
    const k = dayKey(new Date(w.finishedAt))
    m.set(k, [...(m.get(k) ?? []), w.id])
  }
  return m
}

/** Consecutive weeks with a workout, ending this week (or last week, if this one is still empty). */
export function weekStreak(s: State, now = new Date()): number {
  const weeks = new Set(s.workouts.map((w) => weekStart(new Date(w.finishedAt)).getTime()))
  const d = weekStart(now)
  if (!weeks.has(d.getTime())) d.setDate(d.getDate() - 7)
  let n = 0
  while (weeks.has(d.getTime())) {
    n++
    d.setDate(d.getDate() - 7)
  }
  return n
}

// ── per-exercise charts ─────────────────────────────────────────────────────
export type ExMetric = 'heaviest' | 'e1rm' | 'bestSet' | 'sessionVolume' | 'totalReps' | 'mostReps' | 'longest'
export const EX_METRIC_LABEL: Record<ExMetric, string> = {
  heaviest: 'Heaviest weight',
  e1rm: 'One rep max',
  bestSet: 'Best set volume',
  sessionVolume: 'Session volume',
  totalReps: 'Total reps',
  mostReps: 'Most reps',
  longest: 'Best time',
}
export const EX_METRIC_UNIT: Record<ExMetric, string> = {
  heaviest: 'kg', e1rm: 'kg', bestSet: 'kg', sessionVolume: 'kg', totalReps: 'reps', mostReps: 'reps', longest: 's',
}

export function metricsFor(type: ExType): ExMetric[] {
  if (type === 'duration') return ['longest']
  if (type === 'bodyweight' || type === 'assisted') return ['mostReps', 'totalReps']
  return ['heaviest', 'e1rm', 'bestSet', 'sessionVolume', 'totalReps']
}

function sessionValue(sets: DoneSet[], m: ExMetric): number {
  const kg = (x: DoneSet) => x.kg ?? 0
  switch (m) {
    case 'heaviest': return Math.max(...sets.map(kg))
    case 'e1rm': return Math.round(Math.max(...sets.map((x) => e1rm(kg(x), x.reps))) * 10) / 10
    case 'bestSet': return Math.max(...sets.map((x) => kg(x) * x.reps))
    case 'sessionVolume': return sets.reduce((a, x) => a + kg(x) * x.reps, 0)
    case 'totalReps': return sets.reduce((a, x) => a + x.reps, 0)
    case 'mostReps':
    case 'longest': return Math.max(...sets.map((x) => x.reps))
  }
}

/** One point per session, oldest → newest. */
export function exerciseSeries(exerciseId: string, m: ExMetric, s: State) {
  return exerciseSessions(exerciseId, s)
    .slice()
    .reverse()
    .map(({ w, e }) => ({ date: new Date(w.finishedAt), value: sessionValue(e.sets, m), workoutId: w.id }))
}

/** Best weight lifted for each exact rep count (the "set records" table). */
export function setRecords(exerciseId: string, s: State) {
  const best = new Map<number, { kg: number; date: string }>()
  for (const { w, e } of exerciseSessions(exerciseId, s)) {
    for (const x of e.sets) {
      const kg = x.kg ?? 0
      const cur = best.get(x.reps)
      if (!cur || kg > cur.kg) best.set(x.reps, { kg, date: w.finishedAt })
    }
  }
  return [...best.entries()].map(([reps, v]) => ({ reps, ...v })).sort((a, b) => a.reps - b.reps)
}
