# STRONG // Gear Second

A neo-brutalist hypertrophy workout log. Named for Luffy's Gear Second: pump the blood, get stronger.

Built as a lean, one-person replacement for the core loop of big workout apps: **start a routine → log sets against last time → superset to save time → finish → see your records.** No social feed, no paywall, no rest timer, no set types (every set is a working set, taken to failure).

## What it does

- **Routines** with sets and a rep range per exercise, and supersets (link any exercise with the one below it; groups of 2+ run back to back).
- **Live workout** that survives closing the tab: every tap is saved on the device. The screen stays awake while you train.
- **PREVIOUS column** shows what you did last time for each set.
- **Double progression built in**: inside a rep range, if every set last time hit the top of the range the app suggests **+2.5 kg** and drops you back to the bottom of the range; otherwise it asks you to beat last time's reps. Suggestions sit in the inputs as placeholders, so ticking an empty set logs the suggestion.
- **Superset flow**: ticking a set jumps you to the same set of the partner exercise.
- **Records** on finish: heaviest weight, best estimated 1RM, best set volume, most reps, longest hold.
- **Muscle heatmap**: front/back anatomy (upper vs mid chest, all three delt heads, traps / mid back / lats / lower back, inner thigh, ...) coloured by weekly working sets, with a bar per muscle underneath against the 10-20 set target. Tap a muscle for its 12-week trend.
- **Stats tab**: week streak, 12-week duration / volume / reps / sets chart, workout calendar, and for 7 days / 30 days / 3 months / year: the muscle heatmap, a spider chart of muscle-group split vs the previous period, and your main exercises.
- **Exercise pages**: charts for heaviest weight, one rep max, best set volume, session volume and total reps; personal records; a set-records table (best weight per rep count); full history.
- **Workout detail**: muscles worked (heatmap + bars), records broken, every set.
- Exercise types: weight × reps, bodyweight reps, weighted bodyweight (log the added kg), assisted bodyweight, and timed holds. Custom exercises supported.
- Installable PWA, works offline. Changes queue and sync when you are back online; **History → Backup → Export** gives an offline copy.

## Run it

    npm install
    npm run dev      # http://localhost:5173
    npm run build
    npm run icons    # regenerate the PWA icons

## Code map

- `src/lib/store.ts` — routines, history, the live workout; localStorage persistence and ledger sync
- `src/lib/stats.ts` — previous sets, progression targets, records
- `src/lib/supersets.ts` — superset grouping and list moves (shared by workout + routine editor)
- `src/lib/insights.ts` — periods, muscle/group distributions, weekly series, streaks, exercise metrics, set records
- `src/lib/anatomy.ts` — the front/back anatomy (original artwork, mirrored smooth shapes)
- `src/lib/theme.ts` — chart and heatmap colours (validated for colour-blind separation)
- `src/components/Charts.tsx` — bar, line, spider, calendar, muscle bars
- `src/data/exercises.ts` — the exercise library (ids are permanent: logs reference them)
- `src/data/templates.ts` — seeded routines
- `src/screens/` — Home, Stats, Workout, Session (finish summary), History, ExerciseDetail, RoutineEditor

## The routine

The seeded weekly split (seven short sessions, specialised for side delts, upper chest, lats and mid/upper back) is explained exercise by exercise in [ROUTINE.md](ROUTINE.md). Home shows today's session; edit any routine freely, your edits are never overwritten by a later seed.

## Linked apps

Strong shares one append-only event ledger (a Supabase table) with **Life OS** (habits) and **Arbor** (calisthenics skill tree):

- Finishing a workout writes a `workout` event. Life OS ticks its Gym habit from it (and locks Gym from being ticked by hand).
- Workouts and routines sync between your devices through the same ledger.
- The Arbor coach picks one or two calisthenics skills that need the gym each day; they appear as **Skill work** at the top of the workout, and ticking them logs the practice for Arbor.

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (in `.env.local` and in the host's environment) to turn the link on. Without them the app is fully local.

`src/arbor-core/` is copied from the Arbor repo (`npm run core` there). Do not edit it here.
