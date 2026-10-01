// Exercise library. Ids are stable forever: logged workouts reference them.
import type { Equipment, ExType, Exercise, Muscle } from '../lib/types'

type Row = [id: string, name: string, type: ExType, equipment: Equipment, primary: Muscle[], secondary?: Muscle[]]

const W = 'weight', BW = 'bodyweight', WBW = 'weighted', ABW = 'assisted', DUR = 'duration'

const ROWS: Row[] = [
  // chest
  ['bench-press', 'Bench Press', W, 'barbell', ['chest'], ['chest-upper', 'front-delts', 'triceps']],
  ['incline-bench-press', 'Incline Bench Press', W, 'barbell', ['chest-upper'], ['chest', 'front-delts', 'triceps']],
  ['decline-bench-press', 'Decline Bench Press', W, 'barbell', ['chest'], ['triceps']],
  ['db-bench-press', 'Dumbbell Bench Press', W, 'dumbbell', ['chest'], ['chest-upper', 'front-delts', 'triceps']],
  ['incline-db-press', 'Incline Dumbbell Press', W, 'dumbbell', ['chest-upper'], ['chest', 'front-delts', 'triceps']],
  ['incline-machine-press', 'Incline Machine Press', W, 'machine', ['chest-upper'], ['chest', 'front-delts', 'triceps']],
  ['smith-incline-press', 'Smith Incline Press', W, 'smith', ['chest-upper'], ['chest', 'front-delts', 'triceps']],
  ['chest-press-machine', 'Chest Press (Machine)', W, 'machine', ['chest'], ['front-delts', 'triceps']],
  ['db-fly', 'Dumbbell Fly', W, 'dumbbell', ['chest'], ['front-delts']],
  ['cable-fly', 'Cable Fly', W, 'cable', ['chest'], ['front-delts']],
  ['low-to-high-cable-fly', 'Low-to-High Cable Fly', W, 'cable', ['chest-upper'], ['chest', 'front-delts']],
  ['pec-deck', 'Pec Deck', W, 'machine', ['chest']],
  ['push-up', 'Push-Up', BW, 'bodyweight', ['chest'], ['front-delts', 'triceps', 'abs']],
  ['weighted-push-up', 'Weighted Push-Up', WBW, 'bodyweight', ['chest'], ['front-delts', 'triceps']],
  ['chest-dip', 'Chest Dip', BW, 'bodyweight', ['chest'], ['triceps', 'front-delts']],

  // shoulders
  ['overhead-press', 'Overhead Press', W, 'barbell', ['front-delts'], ['side-delts', 'triceps']],
  ['db-shoulder-press', 'Dumbbell Shoulder Press', W, 'dumbbell', ['front-delts'], ['side-delts', 'triceps']],
  ['machine-shoulder-press', 'Shoulder Press (Machine)', W, 'machine', ['front-delts'], ['side-delts', 'triceps']],
  ['arnold-press', 'Arnold Press', W, 'dumbbell', ['front-delts'], ['side-delts', 'triceps']],
  ['lateral-raise', 'Lateral Raise', W, 'dumbbell', ['side-delts']],
  ['cable-lateral-raise', 'Cable Lateral Raise', W, 'cable', ['side-delts']],
  ['machine-lateral-raise', 'Lateral Raise (Machine)', W, 'machine', ['side-delts']],
  ['front-raise', 'Front Raise', W, 'dumbbell', ['front-delts']],
  ['rear-delt-fly', 'Rear Delt Fly', W, 'dumbbell', ['rear-delts'], ['upper-back']],
  ['reverse-pec-deck', 'Reverse Pec Deck', W, 'machine', ['rear-delts'], ['upper-back']],
  ['cable-rear-delt-fly', 'Cable Rear Delt Fly', W, 'cable', ['rear-delts']],
  ['face-pull', 'Face Pull', W, 'cable', ['rear-delts'], ['upper-back', 'traps']],
  ['upright-row', 'Upright Row', W, 'cable', ['side-delts'], ['traps']],
  ['db-shrug', 'Dumbbell Shrug', W, 'dumbbell', ['traps']],
  ['barbell-shrug', 'Barbell Shrug', W, 'barbell', ['traps']],

  // triceps
  ['triceps-pushdown', 'Triceps Pushdown', W, 'cable', ['triceps']],
  ['overhead-cable-extension', 'Overhead Cable Extension', W, 'cable', ['triceps']],
  ['db-overhead-extension', 'Dumbbell Overhead Extension', W, 'dumbbell', ['triceps']],
  ['skull-crusher', 'Skull Crusher', W, 'ez-bar', ['triceps']],
  ['close-grip-bench', 'Close-Grip Bench Press', W, 'barbell', ['triceps'], ['chest', 'front-delts']],
  ['dip', 'Dip', BW, 'bodyweight', ['triceps'], ['chest', 'front-delts']],
  ['weighted-dip', 'Weighted Dip', WBW, 'bodyweight', ['triceps'], ['chest', 'front-delts']],
  ['assisted-dip', 'Assisted Dip', ABW, 'machine', ['triceps'], ['chest', 'front-delts']],

  // back
  ['pull-up', 'Pull-Up', BW, 'bodyweight', ['lats'], ['upper-back', 'biceps']],
  ['weighted-pull-up', 'Weighted Pull-Up', WBW, 'bodyweight', ['lats'], ['upper-back', 'biceps']],
  ['assisted-pull-up', 'Assisted Pull-Up', ABW, 'machine', ['lats'], ['upper-back', 'biceps']],
  ['chin-up', 'Chin-Up', BW, 'bodyweight', ['lats'], ['biceps', 'upper-back']],
  ['lat-pulldown', 'Lat Pulldown', W, 'cable', ['lats'], ['upper-back', 'biceps']],
  ['neutral-grip-pulldown', 'Neutral-Grip Lat Pulldown', W, 'cable', ['lats'], ['biceps', 'upper-back']],
  ['close-grip-pulldown', 'Close-Grip Pulldown', W, 'cable', ['lats'], ['biceps']],
  ['straight-arm-pulldown', 'Straight-Arm Pulldown', W, 'cable', ['lats']],
  ['barbell-row', 'Barbell Row', W, 'barbell', ['upper-back'], ['lats', 'rear-delts', 'biceps']],
  ['db-row', 'One-Arm Dumbbell Row', W, 'dumbbell', ['lats'], ['upper-back', 'biceps']],
  ['chest-supported-row', 'Chest-Supported Row', W, 'dumbbell', ['upper-back'], ['lats', 'rear-delts']],
  ['seated-cable-row', 'Seated Cable Row', W, 'cable', ['upper-back'], ['lats', 'biceps']],
  ['t-bar-row', 'T-Bar Row', W, 'barbell', ['upper-back'], ['lats', 'biceps']],
  ['machine-row', 'Row (Machine)', W, 'machine', ['upper-back'], ['lats', 'biceps']],
  ['inverted-row', 'Inverted Row', BW, 'bodyweight', ['upper-back'], ['lats', 'biceps']],
  ['deadlift', 'Deadlift', W, 'barbell', ['lower-back'], ['glutes', 'hamstrings', 'traps']],
  ['back-extension', 'Back Extension', BW, 'bodyweight', ['lower-back'], ['glutes', 'hamstrings']],

  // arms
  ['barbell-curl', 'Barbell Curl', W, 'barbell', ['biceps'], ['forearms']],
  ['ez-bar-curl', 'EZ-Bar Curl', W, 'ez-bar', ['biceps'], ['forearms']],
  ['db-curl', 'Dumbbell Curl', W, 'dumbbell', ['biceps'], ['forearms']],
  ['incline-db-curl', 'Incline Dumbbell Curl', W, 'dumbbell', ['biceps']],
  ['hammer-curl', 'Hammer Curl', W, 'dumbbell', ['biceps'], ['forearms']],
  ['preacher-curl', 'Preacher Curl', W, 'ez-bar', ['biceps']],
  ['cable-curl', 'Cable Curl', W, 'cable', ['biceps']],
  ['bayesian-curl', 'Bayesian Cable Curl', W, 'cable', ['biceps']],
  ['concentration-curl', 'Concentration Curl', W, 'dumbbell', ['biceps']],
  ['wrist-curl', 'Wrist Curl', W, 'dumbbell', ['forearms']],
  ['reverse-curl', 'Reverse Curl', W, 'ez-bar', ['forearms'], ['biceps']],
  ['dead-hang', 'Dead Hang', DUR, 'bodyweight', ['forearms'], ['lats']],

  // legs
  ['back-squat', 'Back Squat', W, 'barbell', ['quads'], ['glutes', 'adductors', 'lower-back']],
  ['front-squat', 'Front Squat', W, 'barbell', ['quads'], ['glutes', 'abs']],
  ['hack-squat', 'Hack Squat', W, 'machine', ['quads'], ['glutes']],
  ['leg-press', 'Leg Press', W, 'machine', ['quads'], ['glutes']],
  ['goblet-squat', 'Goblet Squat', W, 'dumbbell', ['quads'], ['glutes']],
  ['bulgarian-split-squat', 'Bulgarian Split Squat', W, 'dumbbell', ['quads'], ['glutes', 'adductors']],
  ['walking-lunge', 'Walking Lunge', W, 'dumbbell', ['quads'], ['glutes']],
  ['leg-extension', 'Leg Extension', W, 'machine', ['quads']],
  ['romanian-deadlift', 'Romanian Deadlift', W, 'barbell', ['hamstrings'], ['glutes', 'lower-back']],
  ['lying-leg-curl', 'Lying Leg Curl', W, 'machine', ['hamstrings']],
  ['seated-leg-curl', 'Seated Leg Curl', W, 'machine', ['hamstrings']],
  ['copenhagen-plank', 'Copenhagen Plank', DUR, 'bodyweight', ['adductors'], ['obliques']],
  ['nordic-curl', 'Nordic Curl', BW, 'bodyweight', ['hamstrings']],
  ['hip-thrust', 'Hip Thrust', W, 'barbell', ['glutes'], ['hamstrings']],
  ['abductor-machine', 'Hip Abduction (Machine)', W, 'machine', ['glutes']],
  ['adductor-machine', 'Hip Adduction (Machine)', W, 'machine', ['adductors']],
  ['standing-calf-raise', 'Standing Calf Raise', W, 'machine', ['calves']],
  ['seated-calf-raise', 'Seated Calf Raise', W, 'machine', ['calves']],

  // core
  ['hanging-leg-raise', 'Hanging Leg Raise', BW, 'bodyweight', ['abs'], ['obliques']],
  ['cable-crunch', 'Cable Crunch', W, 'cable', ['abs']],
  ['ab-wheel', 'Ab Wheel Rollout', BW, 'bodyweight', ['abs'], ['lats']],
  ['decline-crunch', 'Decline Crunch', BW, 'bodyweight', ['abs']],
  ['russian-twist', 'Russian Twist', W, 'dumbbell', ['obliques'], ['abs']],
  ['plank', 'Plank', DUR, 'bodyweight', ['abs'], ['obliques']],
  ['side-plank', 'Side Plank', DUR, 'bodyweight', ['obliques'], ['abs']],
  ['l-sit', 'L-Sit', DUR, 'bodyweight', ['abs'], ['quads', 'triceps']],
]

export const LIBRARY: Exercise[] = ROWS.map(([id, name, type, equipment, primary, secondary = []]) => ({
  id, name, type, equipment, primary, secondary,
}))

export const MUSCLES: Muscle[] = [
  'chest-upper', 'chest', 'front-delts', 'side-delts', 'rear-delts', 'traps', 'upper-back', 'lats', 'lower-back',
  'biceps', 'triceps', 'forearms', 'abs', 'obliques', 'quads', 'adductors', 'hamstrings', 'glutes', 'calves',
]

export const MUSCLE_LABEL: Record<Muscle, string> = {
  'chest-upper': 'Upper chest',
  chest: 'Chest',
  'front-delts': 'Front delts',
  'side-delts': 'Side delts',
  'rear-delts': 'Rear delts',
  traps: 'Traps',
  'upper-back': 'Upper back',
  lats: 'Lats',
  'lower-back': 'Lower back',
  biceps: 'Biceps',
  triceps: 'Triceps',
  forearms: 'Forearms',
  abs: 'Abs',
  obliques: 'Obliques',
  quads: 'Quads',
  adductors: 'Inner thigh',
  hamstrings: 'Hamstrings',
  glutes: 'Glutes',
  calves: 'Calves',
}

export const TYPE_LABEL: Record<ExType, string> = {
  weight: 'Weight × reps',
  bodyweight: 'Bodyweight reps',
  weighted: 'Weighted bodyweight',
  assisted: 'Assisted bodyweight',
  duration: 'Duration',
}

/** Six broad groups for the muscle-distribution (spider) chart. */
export type Group = 'Chest' | 'Back' | 'Shoulders' | 'Arms' | 'Legs' | 'Core'
export const GROUPS: Group[] = ['Chest', 'Shoulders', 'Arms', 'Core', 'Legs', 'Back']
export const GROUP_OF: Record<Muscle, Group> = {
  'chest-upper': 'Chest', chest: 'Chest',
  'front-delts': 'Shoulders', 'side-delts': 'Shoulders', 'rear-delts': 'Shoulders',
  traps: 'Back', 'upper-back': 'Back', lats: 'Back', 'lower-back': 'Back',
  biceps: 'Arms', triceps: 'Arms', forearms: 'Arms',
  abs: 'Core', obliques: 'Core',
  quads: 'Legs', adductors: 'Legs', hamstrings: 'Legs', glutes: 'Legs', calves: 'Legs',
}
