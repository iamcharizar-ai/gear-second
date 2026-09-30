# STRONG // Gear Second

A pixel-art hypertrophy workout log. Named for Luffy's Gear Second: pump the blood, get stronger.

Built as a lean, one-person replacement for the core loop of big workout apps: **start a routine → log sets against last time → superset to save time → finish → see your records.** No social feed, no paywall, no rest timer, no set types (every set is a working set, taken to failure).

## What it does

- **Routines** with sets and a rep range per exercise, and supersets (link any exercise with the one below it; groups of 2+ run back to back).
- **Live workout** that survives closing the tab: every tap is saved on the device. The screen stays awake while you train.
- **PREVIOUS column** shows what you did last time for each set.
- **Double progression built in**: inside a rep range, if every set last time hit the top of the range the app suggests **+2.5 kg** and drops you back to the bottom of the range; otherwise it asks you to beat last time's reps. Suggestions sit in the inputs as placeholders, so ticking an empty set logs the suggestion.
- **Superset flow**: ticking a set jumps you to the same set of the partner exercise.
- **Records** on finish: heaviest weight, best estimated 1RM, best set volume, most reps, longest hold.
- **Weekly sets per muscle** on a pixel body map (target band 10-20 working sets; secondary muscles count half).
- **Exercise pages** with records, a progress chart and every session logged.
- Exercise types: weight × reps, bodyweight reps, weighted bodyweight (log the added kg), assisted bodyweight, and timed holds. Custom exercises supported.
- Installable PWA, works offline. Data is local to the device for now: use **History → Backup → Export** now and then.

## Run it

    npm install
    npm run dev      # http://localhost:5173
    npm run build
    npm run icons    # regenerate the straw-hat PWA icons

## Code map

- `src/lib/store.ts` — routines, history, the live workout; localStorage persistence
- `src/lib/stats.ts` — previous sets, progression targets, records, weekly muscle volume
- `src/lib/supersets.ts` — superset grouping and list moves (shared by workout + routine editor)
- `src/lib/art.ts` — palette, pixel glyphs, body map, icon art
- `src/data/exercises.ts` — the exercise library (ids are permanent: logs reference them)
- `src/data/templates.ts` — seeded routines
- `src/screens/` — Home, Workout, Session (finish summary), History, ExerciseDetail, RoutineEditor

## Next

- Sync through the shared Supabase ledger with LifeOS (Gym habit + XP), so phone and desktop share one history.
- Arbor skill add-ons appended to the gym session.
