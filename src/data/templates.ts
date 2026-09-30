// Routines seeded on first launch.
import type { Routine } from '../lib/types'

export const SEED_ROUTINES: Routine[] = [
  {
    id: 'push-day',
    name: 'Push Day',
    updatedAt: '2026-09-30T00:00:00.000Z',
    items: [
      { uid: 'p1', exerciseId: 'incline-db-press', sets: 4, repMin: 8, repMax: 12, superset: null, note: '' },
      { uid: 'p2', exerciseId: 'bench-press', sets: 3, repMin: 6, repMax: 10, superset: null, note: '' },
      { uid: 'p3', exerciseId: 'overhead-press', sets: 3, repMin: 6, repMax: 10, superset: null, note: '' },
      { uid: 'p4', exerciseId: 'lateral-raise', sets: 4, repMin: 12, repMax: 20, superset: 'ss-a', note: '' },
      { uid: 'p5', exerciseId: 'triceps-pushdown', sets: 4, repMin: 10, repMax: 15, superset: 'ss-a', note: '' },
      { uid: 'p6', exerciseId: 'overhead-cable-extension', sets: 3, repMin: 10, repMax: 15, superset: null, note: '' },
    ],
  },
]
