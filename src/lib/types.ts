// Core data model. Everything is plain JSON so it can move to the shared
// Supabase ledger later without reshaping.

export type Muscle =
  | 'chest'
  | 'front-delts'
  | 'side-delts'
  | 'rear-delts'
  | 'traps'
  | 'upper-back'
  | 'lats'
  | 'lower-back'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'abs'
  | 'obliques'
  | 'quads'
  | 'hamstrings'
  | 'glutes'
  | 'calves'

/**
 * How a set is logged.
 *  weight     kg × reps
 *  bodyweight reps only
 *  weighted   added kg × reps (bodyweight not counted)
 *  assisted   assistance kg × reps (less is harder)
 *  duration   seconds
 */
export type ExType = 'weight' | 'bodyweight' | 'weighted' | 'assisted' | 'duration'

export type Equipment = 'barbell' | 'dumbbell' | 'cable' | 'machine' | 'bodyweight' | 'smith' | 'ez-bar' | 'other'

export interface Exercise {
  id: string
  name: string
  type: ExType
  equipment: Equipment
  primary: Muscle[]
  secondary: Muscle[]
  custom?: boolean
}

/** One exercise slot in a routine. */
export interface RoutineItem {
  uid: string
  exerciseId: string
  sets: number
  repMin: number
  repMax: number
  /** exercises sharing a superset id are done back to back */
  superset: string | null
  note: string
}

export interface Routine {
  id: string
  name: string
  items: RoutineItem[]
  updatedAt: string
}

/** kg/reps are kept as typed text while a workout is live. */
export interface LiveSet {
  kg: string
  reps: string
  done: boolean
}

export interface LiveExercise {
  uid: string
  exerciseId: string
  repMin: number | null
  repMax: number | null
  superset: string | null
  note: string
  sets: LiveSet[]
}

export interface ActiveWorkout {
  id: string
  name: string
  routineId: string | null
  startedAt: string
  note: string
  exercises: LiveExercise[]
}

/** A logged set. `kg` is null for bodyweight/duration; `reps` holds seconds for duration. */
export interface DoneSet {
  kg: number | null
  reps: number
}

export interface DoneExercise {
  exerciseId: string
  superset: string | null
  note: string
  sets: DoneSet[]
}

export interface Workout {
  id: string
  name: string
  routineId: string | null
  startedAt: string
  finishedAt: string
  note: string
  exercises: DoneExercise[]
}
