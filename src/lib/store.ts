// Local-first store. Routines, finished workouts, the live workout and custom
// exercises each persist to their own localStorage key on every change, so a
// closed tab or a dead battery mid-set loses nothing.
import { useSyncExternalStore } from 'react'
import { LIBRARY } from '../data/exercises'
import { SEED_ROUTINES } from '../data/templates'
import type { ActiveWorkout, Exercise, LiveExercise, Routine, Workout } from './types'

const K = {
  routines: 'gear2.routines.v1',
  workouts: 'gear2.workouts.v1',
  active: 'gear2.active.v1',
  custom: 'gear2.custom.v1',
} as const

export interface State {
  routines: Routine[]
  workouts: Workout[] // newest first
  active: ActiveWorkout | null
  custom: Exercise[]
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

function load(): State {
  return {
    routines: read<Routine[] | null>(K.routines, null) ?? SEED_ROUTINES,
    workouts: read<Workout[]>(K.workouts, []),
    active: read<ActiveWorkout | null>(K.active, null),
    custom: read<Exercise[]>(K.custom, []),
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
  emit()
}

// Another tab (or the installed PWA next to a browser tab) changed something.
window.addEventListener('storage', (e) => {
  if (e.key && Object.values(K).includes(e.key as (typeof K)[keyof typeof K])) {
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

// ── routines ────────────────────────────────────────────────────────────────
export function saveRoutine(r: Routine) {
  const next = { ...r, updatedAt: new Date().toISOString() }
  const exists = state.routines.some((x) => x.id === r.id)
  set({ routines: exists ? state.routines.map((x) => (x.id === r.id ? next : x)) : [...state.routines, next] })
}
export function deleteRoutine(id: string) {
  set({ routines: state.routines.filter((r) => r.id !== id) })
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
  return w
}

export function deleteWorkout(id: string) {
  set({ workouts: state.workouts.filter((w) => w.id !== id) })
}

// ── backup (data only lives on this device until ledger sync lands) ─────────
export function exportData(): string {
  const { routines, workouts, custom } = state
  return JSON.stringify({ app: 'gear-second', version: 1, exportedAt: new Date().toISOString(), routines, workouts, custom }, null, 1)
}

export function importData(text: string): string | null {
  try {
    const d = JSON.parse(text)
    if (d?.app !== 'gear-second' || !Array.isArray(d.workouts) || !Array.isArray(d.routines)) return 'Not a Gear Second backup file.'
    const seen = new Set(state.workouts.map((w) => w.id))
    const workouts = [...state.workouts, ...(d.workouts as Workout[]).filter((w) => !seen.has(w.id))]
      .sort((a, b) => (a.finishedAt < b.finishedAt ? 1 : -1))
    const rSeen = new Set(state.routines.map((r) => r.id))
    const cSeen = new Set(state.custom.map((c) => c.id))
    set({
      workouts,
      routines: [...state.routines, ...(d.routines as Routine[]).filter((r) => !rSeen.has(r.id))],
      custom: [...state.custom, ...((d.custom ?? []) as Exercise[]).filter((c) => !cSeen.has(c.id))],
    })
    return null
  } catch {
    return 'Could not read that file.'
  }
}
