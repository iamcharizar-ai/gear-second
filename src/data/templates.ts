// The weekly split, seeded into the app. Built for hypertrophy with a
// specialisation: side delts, upper chest, lats and mid/upper back get the most
// work; rear delts, triceps and biceps substantial but controlled volume; legs
// one efficient day. Exercises are chosen for stimulus per unit of fatigue —
// stable, machine/cable heavy, easy to take close to failure safely. No flat
// barbell bench, no direct front-delt work, no heavy oblique or trap work.
// Full rationale and weekly set counts: ROUTINE.md.
//
// Ids match core/schedule.ts in the Arbor core (which plans calisthenics
// around this split).
import type { Routine, RoutineItem } from '../lib/types'

export const SEED_VERSION = 2
const AT = '2026-10-01T00:00:00.000Z'

type Row = [exerciseId: string, sets: number, repMin: number, repMax: number, note: string, superset?: string]
const routine = (id: string, name: string, day: number, rows: Row[]): Routine => ({
  id,
  name,
  day,
  updatedAt: AT,
  items: rows.map(([exerciseId, sets, repMin, repMax, note, superset], i): RoutineItem => ({
    uid: `${id}-${i + 1}`,
    exerciseId,
    sets,
    repMin,
    repMax,
    superset: superset ? `${id}-${superset}` : null,
    note,
  })),
})

export const SEED_ROUTINES: Routine[] = [
  routine('d1-chest-delts', 'Upper Chest + Side Delts', 1, [
    ['incline-db-press', 4, 6, 10, 'Bench at 30°. Elbows about 45° from your sides, deep stretch at the bottom. Last set to failure.'],
    ['low-to-high-cable-fly', 3, 10, 15, 'Upper chest. Hands finish at eye level, arms slightly bent, slow stretch on the way down.'],
    ['pec-deck', 3, 10, 15, 'Mid/lower chest. Seat low enough that hands meet at chest height. Pause in the stretch.', 'a'],
    ['lateral-raise', 4, 12, 20, 'Lead with the elbows, slight forward lean, stop at shoulder height. No swinging.', 'a'],
    ['cable-crunch', 3, 10, 15, 'Round the spine, ribs to hips. Hips stay still.'],
  ]),
  routine('d2-lats-biceps', 'Lats + Rear Delts + Biceps', 2, [
    ['pull-up', 4, 6, 12, 'Full hang to chin over the bar, chest up. When you hit 12 on every set, switch to Weighted Pull-Up.'],
    ['neutral-grip-pulldown', 3, 8, 12, 'Lats. Lean back slightly, drive elbows down to your hips, full stretch at the top.'],
    ['chest-supported-row', 3, 8, 12, 'Upper back. Elbows out about 60°, squeeze shoulder blades, chest stays on the pad.'],
    ['reverse-pec-deck', 3, 12, 20, 'Rear delts. Push the handles out wide rather than back; keep shoulder blades still.'],
    ['incline-db-curl', 3, 8, 12, 'Long head. Bench at 60°, arms hang behind you, no shoulder swing.'],
  ]),
  routine('d3-legs', 'Legs', 3, [
    ['leg-press', 4, 8, 12, 'Feet mid-platform, go as deep as your lower back stays flat. Do not lock out hard.'],
    ['romanian-deadlift', 2, 8, 12, 'Hamstrings and glutes. Soft knees, hips back, bar close, stop when the stretch ends.'],
    ['leg-extension', 3, 10, 15, 'Quads. Lean back for more stretch, pause at the top.', 'a'],
    ['seated-leg-curl', 3, 10, 15, 'Hamstrings. Lean forward into the pad, control the way up.', 'a'],
    ['adductor-machine', 2, 12, 15, 'Inner thigh. Full stretch, slow.'],
    ['standing-calf-raise', 4, 10, 15, 'Two-second pause in the bottom stretch on every rep.'],
  ]),
  routine('d4-delts-triceps', 'Side Delts + Triceps', 4, [
    ['cable-lateral-raise', 4, 10, 15, 'Cable set at hand height, running behind your body. Lean away a little. Your top delt priority.'],
    ['machine-lateral-raise', 3, 12, 20, 'Use dumbbells if the machine is taken. Push to failure, then partial reps in the bottom half.'],
    ['cable-rear-delt-fly', 3, 12, 20, 'Cables crossed at shoulder height, no handles. Sweep out wide.', 'a'],
    ['triceps-pushdown', 3, 10, 15, 'Elbows pinned, lean in slightly, full lockout.', 'a'],
    ['overhead-cable-extension', 3, 10, 15, 'Long head. Deep stretch behind the head, elbows stay narrow.'],
  ]),
  routine('d5-back-biceps', 'Back Thickness + Biceps', 5, [
    ['chest-supported-row', 4, 8, 12, 'Upper back. Elbows out, pull to the lower chest, hard squeeze. The main thickness lift.'],
    ['seated-cable-row', 3, 10, 12, 'Wide grip, elbows high. Let the shoulder blades spread at the stretch.'],
    ['lat-pulldown', 3, 10, 15, 'Lats. Slightly wider than shoulders, pull to the upper chest, slow return.'],
    ['straight-arm-pulldown', 2, 12, 15, 'Lats without the biceps. Arms nearly straight, sweep to the hips.'],
    ['preacher-curl', 3, 8, 12, 'Short head. Full stretch at the bottom, no bouncing out of it.'],
    ['bayesian-curl', 2, 10, 15, 'Cable behind you, arm starts behind the body. Long head stretch.'],
  ]),
  routine('d6-chest-flys', 'Chest Flys + Side Delts', 6, [
    ['incline-machine-press', 3, 8, 12, 'Upper chest. If the machine is busy use the Smith or dumbbells at 30°.'],
    ['cable-fly', 3, 10, 15, 'Mid chest. Cables at shoulder height, hug wide, long stretch.'],
    ['low-to-high-cable-fly', 2, 12, 15, 'Upper chest finisher. Hands meet at eye level.'],
    ['lateral-raise', 4, 12, 20, 'Elbows lead. Last set: failure, then partials.', 'a'],
    ['triceps-pushdown', 3, 10, 15, 'Elbows pinned. Light triceps day.', 'a'],
    ['hanging-leg-raise', 3, 8, 15, 'Curl the pelvis up, do not just swing the legs.'],
  ]),
  routine('d7-arms-delts', 'Arms + Delts Pump', 0, [
    ['cable-lateral-raise', 3, 12, 20, 'Lighter than Thursday. Smooth reps, chase the pump.'],
    ['reverse-pec-deck', 3, 12, 20, 'Rear delts. Out wide, not back.'],
    ['bayesian-curl', 3, 10, 15, 'Cable behind you. Superset with the overhead extension on the same pulley.', 'a'],
    ['overhead-cable-extension', 3, 10, 15, 'Long head. Deep stretch.', 'a'],
    ['lateral-raise', 2, 15, 20, 'Dumbbells to finish the delts.'],
    ['cable-crunch', 3, 10, 15, 'Ribs to hips.'],
  ]),
]

/** Ids of seeds shipped in earlier versions; removed on upgrade if you never edited them. */
export const RETIRED_SEEDS: Record<string, string> = { 'push-day': '2026-09-30T00:00:00.000Z' }
