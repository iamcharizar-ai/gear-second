// Local-first store. Everything persists to localStorage on every change, so a
// closed tab or a dead battery mid-set loses nothing. When the shared ledger is
// configured (VITE_SUPABASE_*), finished workouts, routines and Arbor skill
// practice also travel through it: that is how the phone and the desktop share
// one history, how Life OS learns the gym session is done, and how the coach's
// add-on skills get here.
import { useSyncExternalStore } from 'react'
import { LIBRARY } from '../data/exercises'
import { RETIRED_SEEDS, SEED_ROUTINES, SEED_VERSION } from '../data/templates'
import { createLedger, type LedgerStatus } from '../arbor-core/ledger.ts'
import { emptyArbor, foldArbor, dayISO, type ArborState, type LedgerEvent } from '../arbor-core/model.ts'
import { planFor } from '../arbor-core/coach.ts'
import { SKILLS, SKILL_BY_ID } from '../arbor-core/skills.ts'
import type { ActiveWorkout, Exercise, LiveExercise, Routine, Workout } from './types'

const K = {
  routines: 'gear2.routines.v1',
  workouts: 'gear2.workouts.v1',
  active: 'gear2.active.v1',
  custom: 'gear2.custom.v1',
  arbor: 'gear2.arbor.v1',
  seed: 'gear2.seed.v',
  published: 'gear2.published.v1',
  deleted: 'gear2.deleted.v1',
} as const

export interface State {
  routines: Routine[]
  workouts: Workout[] // newest first
  active: ActiveWorkout | null
  custom: Exercise[]
  /** Arbor skill progress + today's plan, folded from the ledger */
  arbor: ArborState
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function write(key: string, value: unknown) {
  try {
    if (value == null) localStorage.removeItem(key)
    else localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* quota / private mode — state still lives in memory */
  }
}

/**
 * Bring the routine list up to the current seed version without touching
 * anything you made or edited: new seeds are added if their id is missing,
 * retired seeds are removed only if still exactly as shipped.
 */
function seeded(routines: Routine[] | null): Routine[] {
  if (!routines) return SEED_ROUTINES
  if (read<number>(K.seed, 1) >= SEED_VERSION) return routines
  const kept = routines.filter((r) => RETIRED_SEEDS[r.id] !== r.updatedAt)
  const have = new Set(kept.map((r) => r.id))
  return [...SEED_ROUTINES.filter((r) => !have.has(r.id)), ...kept]
}

function load(): State {
  const routines = seeded(read<Routine[] | null>(K.routines, null))
  write(K.routines, routines)
  write(K.seed, SEED_VERSION)
  return {
    routines,
    workouts: read<Workout[]>(K.workouts, []),
    active: read<ActiveWorkout | null>(K.active, null),
    custom: read<Exercise[]>(K.custom, []),
    arbor: read<ArborState>(K.arbor, emptyArbor()),
  }
}

let state: State = load()
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())
const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}
export const getState = () => state
export const useStore = () => useSyncExternalStore(subscribe, getState)

function set(patch: Partial<State>) {
  state = { ...state, ...patch }
  if ('routines' in patch) write(K.routines, state.routines)
  if ('workouts' in patch) write(K.workouts, state.workouts)
  if ('active' in patch) write(K.active, state.active)
  if ('custom' in patch) write(K.custom, state.custom)
  if ('arbor' in patch) write(K.arbor, state.arbor)
  emit()
}

// Another tab (or the installed PWA next to a browser tab) changed something.
window.addEventListener('storage', (e) => {
  if (e.key && (Object.values(K) as string[]).includes(e.key)) {
    state = load()
    emit()
  }
})

export const uid = () =>
  (globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36))
    .replace(/-/g, '')
    .slice(0, 10)

// ── exercises ───────────────────────────────────────────────────────────────
const LIB_BY_ID = new Map(LIBRARY.map((e) => [e.id, e]))
const UNKNOWN: Exercise = { id: 'unknown', name: 'Unknown exercise', type: 'weight', equipment: 'other', primary: [], secondary: [] }

export function exerciseById(id: string, s: State = state): Exercise {
  return LIB_BY_ID.get(id) ?? s.custom.find((e) => e.id === id) ?? { ...UNKNOWN, id }
}
export const allExercises = (s: State = state) => [...LIBRARY, ...s.custom]

export function addCustomExercise(ex: Omit<Exercise, 'id' | 'custom'>): Exercise {
  const made: Exercise = { ...ex, id: 'custom-' + uid(), custom: true }
  set({ custom: [...state.custom, made] })
  return made
}

// ── shared ledger ───────────────────────────────────────────────────────────
let sync: { status: LedgerStatus; pending: number } = { status: 'off', pending: 0 }
const syncListeners = new Set<() => void>()
export const useSync = () =>
  useSyncExternalStore((l) => { syncListeners.add(l); return () => { syncListeners.delete(l) } }, () => sync)

const sortNewest = (list: Workout[]) => list.slice().sort((a, b) => (a.finishedAt < b.finishedAt ? 1 : -1))

/** The summary shape Life OS already understands for a `workout` event. */
function lifeOsSummary(w: Workout) {
  const sets = w.exercises.flatMap((e) => e.sets)
  const muscles = [...new Set(w.exercises.flatMap((e) => exerciseById(e.exerciseId).primary))]
  return {
    id: w.id,
    name: w.name,
    startedAt: w.startedAt,
    finishedAt: w.finishedAt,
    durationMin: Math.round((new Date(w.finishedAt).getTime() - new Date(w.startedAt).getTime()) / 60000),
    totalSets: sets.length,
    totalReps: sets.reduce((n, x) => n + x.reps, 0),
    volumeKg: Math.round(sets.reduce((n, x) => n + (x.kg ?? 0) * x.reps, 0)),
    muscles,
    exercises: w.exercises.map((e) => {
      const ex = exerciseById(e.exerciseId)
      return { name: ex.name, kind: ex.type, sets: e.sets.map((x) => ({ weight: x.kg ?? 0, reps: x.reps })) }
    }),
  }
}

function publishWorkout(w: Workout) {
  ledger.emit(
    'workout',
    { type: w.name, at: w.finishedAt, session: JSON.stringify(lifeOsSummary(w)), gear: JSON.stringify(w) },
    dayISO(new Date(w.finishedAt)),
  )
  write(K.published, [...new Set([...read<string[]>(K.published, []), w.id])])
}

function onLedgerEvents(events: LedgerEvent[], boot: boolean) {
  const patch: Partial<State> = {}
  const deleted = new Set(read<string[]>(K.deleted, []))
  const seen = new Set(read<string[]>(K.published, []))
  let workouts = state.workouts
  let routines = state.routines

  for (const ev of events) {
    const p = ev.payload ?? {}
    if (ev.type === 'workout' && typeof p.gear === 'string') {
      try {
        const w = JSON.parse(p.gear) as Workout
        seen.add(w.id)
        if (!deleted.has(w.id) && !workouts.some((x) => x.id === w.id)) workouts = [...workouts, w]
      } catch { /* malformed — skip */ }
    } else if (ev.type === 'workout_delete') {
      const id = String(p.id ?? '')
      deleted.add(id)
      workouts = workouts.filter((w) => w.id !== id)
    } else if (ev.type === 'routine') {
      const id = String(p.id ?? '')
      const mine = routines.find((r) => r.id === id)
      if (mine && mine.updatedAt >= ev.at) continue // local copy is the same or newer
      if (p.deleted) routines = routines.filter((r) => r.id !== id)
      else if (typeof p.json === 'string') {
        try {
          const r = { ...(JSON.parse(p.json) as Routine), updatedAt: ev.at }
          routines = mine ? routines.map((x) => (x.id === id ? r : x)) : [...routines, r]
        } catch { /* malformed — skip */ }
      }
    }
  }
  if (workouts !== state.workouts) patch.workouts = sortNewest(workouts)
  if (routines !== state.routines) patch.routines = routines
  const arbor = foldArbor(state.arbor, events)
  if (arbor !== state.arbor) patch.arbor = arbor
  write(K.deleted, [...deleted])
  write(K.published, [...seen])
  if (Object.keys(patch).length) set(patch)

  // First sync: publish workouts logged on this device before sync existed.
  if (boot) for (const w of state.workouts) if (!seen.has(w.id)) publishWorkout(w)
}

const LEDGER_OFF = import.meta.env.VITE_SUPABASE_DISABLE === '1'
const ledger = createLedger({
  // VITE_SUPABASE_DISABLE=1 forces local-only mode even when keys are present,
  // so dev / test runs can never write to the real ledger.
  url: LEDGER_OFF ? undefined : (import.meta.env.VITE_SUPABASE_URL as string | undefined),
  key: LEDGER_OFF ? undefined : (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined),
  app: 'strong',
  types: ['workout', 'workout_delete', 'routine', 'skill', 'plan'],
  onEvents: onLedgerEvents,
  onStatus: (status, pending) => {
    sync = { status, pending }
    syncListeners.forEach((l) => l())
  },
})
ledger.start()

// ── routines ────────────────────────────────────────────────────────────────
export function saveRoutine(r: Routine) {
  const next = { ...r, updatedAt: new Date().toISOString() }
  const exists = state.routines.some((x) => x.id === r.id)
  set({ routines: exists ? state.routines.map((x) => (x.id === r.id ? next : x)) : [...state.routines, next] })
  ledger.emit('routine', { id: next.id, json: JSON.stringify(next) })
}
export function deleteRoutine(id: string) {
  set({ routines: state.routines.filter((r) => r.id !== id) })
  ledger.emit('routine', { id, deleted: true })
}

/** The routine scheduled for today in the weekly split, if any. */
export const todaysRoutine = (s: State = state): Routine | undefined => {
  const dow = new Date().getDay()
  return s.routines.find((r) => r.day === dow)
}

// ── live workout ────────────────────────────────────────────────────────────
export function blankExercise(exerciseId: string, sets = 3): LiveExercise {
  return {
    uid: uid(),
    exerciseId,
    repMin: null,
    repMax: null,
    superset: null,
    note: '',
    sets: Array.from({ length: sets }, () => ({ kg: '', reps: '', done: false })),
  }
}

export function startWorkout(routineId: string | null) {
  const routine = routineId ? state.routines.find((r) => r.id === routineId) : null
  const active: ActiveWorkout = {
    id: uid(),
    name: routine?.name ?? 'Workout',
    routineId: routine?.id ?? null,
    startedAt: new Date().toISOString(),
    note: '',
    exercises: (routine?.items ?? []).map((it) => ({
      uid: uid(),
      exerciseId: it.exerciseId,
      repMin: it.repMin,
      repMax: it.repMax,
      superset: it.superset,
      note: it.note,
      sets: Array.from({ length: Math.max(1, it.sets) }, () => ({ kg: '', reps: '', done: false })),
    })),
  }
  set({ active })
}

export function updateActive(fn: (w: ActiveWorkout) => ActiveWorkout) {
  if (state.active) set({ active: fn(state.active) })
}

export const discardWorkout = () => set({ active: null })

/** Keep only completed sets. Returns the saved workout, or null if nothing was done. */
export function finishWorkout(): Workout | null {
  const a = state.active
  if (!a) return null
  const exercises = a.exercises
    .map((e) => ({
      exerciseId: e.exerciseId,
      superset: e.superset,
      note: e.note.trim(),
      sets: e.sets
        .filter((s) => s.done && s.reps !== '')
        .map((s) => ({ kg: s.kg === '' ? null : Number(s.kg), reps: Number(s.reps) })),
    }))
    .filter((e) => e.sets.length > 0)
  if (!exercises.length) return null
  const w: Workout = {
    id: a.id,
    name: a.name.trim() || 'Workout',
    routineId: a.routineId,
    startedAt: a.startedAt,
    finishedAt: new Date().toISOString(),
    note: a.note.trim(),
    exercises,
  }
  set({ workouts: [w, ...state.workouts], active: null })
  publishWorkout(w) // → history on other devices, and the Gym tick in Life OS
  return w
}

export function deleteWorkout(id: string) {
  const w = state.workouts.find((x) => x.id === id)
  set({ workouts: state.workouts.filter((x) => x.id !== id) })
  write(K.deleted, [...new Set([...read<string[]>(K.deleted, []), id])])
  ledger.emit('workout_delete', { id })
  // If that was the only session of its day, un-tick the day in Life OS too.
  if (w) {
    const day = dayISO(new Date(w.finishedAt))
    if (!state.workouts.some((x) => dayISO(new Date(x.finishedAt)) === day)) ledger.emit('workout_clear', {}, day)
  }
}

// ── Arbor add-ons ───────────────────────────────────────────────────────────
/** Skills the coach wants practised in the gym today. Publishes the plan if no device has yet. */
export function gymSkillsToday(s: State = state) {
  const day = dayISO()
  const { plan } = planFor(SKILLS, s.arbor, day)
  return plan.gym.map((id) => SKILL_BY_ID.get(id)).filter((x): x is NonNullable<typeof x> => Boolean(x))
}

export function ensurePlanPublished() {
  const day = dayISO()
  const { plan, frozen } = planFor(SKILLS, state.arbor, day)
  if (frozen || sync.status !== 'live') return // wait until we know nobody else already published one
  const ev = ledger.emit('plan', { morning: JSON.stringify(plan.morning), gym: JSON.stringify(plan.gym) }, day)
  set({ arbor: foldArbor(state.arbor, [ev]) })
}

/** Mark a skill practised today (optionally with a new best value), or undo it. */
export function logSkill(skillId: string, done: boolean, value?: number) {
  const skill = SKILL_BY_ID.get(skillId)
  if (!skill) return
  const payload: LedgerEvent['payload'] = { skillId, done }
  if (done && typeof value === 'number' && Number.isFinite(value)) {
    payload.value = value
    payload.kind = skill.unit ? 'cur' : 'lvl'
  }
  const ev = ledger.emit('skill', payload)
  set({ arbor: foldArbor(state.arbor, [ev]) })
}

// ── backup ──────────────────────────────────────────────────────────────────
export function exportData(): string {
  const { routines, workouts, custom } = state
  return JSON.stringify({ app: 'gear-second', version: 1, exportedAt: new Date().toISOString(), routines, workouts, custom }, null, 1)
}

export function importData(text: string): string | null {
  try {
    const d = JSON.parse(text)
    if (d?.app !== 'gear-second' || !Array.isArray(d.workouts) || !Array.isArray(d.routines)) return 'Not a Gear Second backup file.'
    const seen = new Set(state.workouts.map((w) => w.id))
    const fresh = (d.workouts as Workout[]).filter((w) => !seen.has(w.id))
    const rSeen = new Set(state.routines.map((r) => r.id))
    const cSeen = new Set(state.custom.map((c) => c.id))
    set({
      workouts: sortNewest([...state.workouts, ...fresh]),
      routines: [...state.routines, ...(d.routines as Routine[]).filter((r) => !rSeen.has(r.id))],
      custom: [...state.custom, ...((d.custom ?? []) as Exercise[]).filter((c) => !cSeen.has(c.id))],
    })
    for (const w of fresh) publishWorkout(w)
    return null
  } catch {
    return 'Could not read that file.'
  }
}
