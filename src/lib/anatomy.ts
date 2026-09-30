// Stylised front/back anatomy for the muscle heatmap. Original artwork: each
// region is a list of control points on the figure's left half (x < 100 in a
// 200×460 box); the right half is mirrored, and points are joined with a
// closed Catmull-Rom spline so shapes read as muscles, not polygons.
// Region split follows the useful-for-hypertrophy anatomy (upper vs mid chest,
// all three delt heads, traps / mid back / lats / lower back, inner thigh…).
import type { Muscle } from './types'

type Pt = [number, number]

export interface Region {
  muscle: Muscle
  pts: Pt[]
  /** decorative inner lines (e.g. ab segments), drawn on top */
  lines?: Pt[][]
}

export const VIEW_W = 200
export const VIEW_H = 460

/** Closed smooth path through points (centripetal-ish Catmull-Rom → cubic Bézier). */
export function smooth(pts: Pt[], tension = 0.5): string {
  const n = pts.length
  const p = (i: number) => pts[(i + n) % n]
  let d = `M${p(0)[0].toFixed(1)},${p(0)[1].toFixed(1)}`
  for (let i = 0; i < n; i++) {
    const [p0, p1, p2, p3] = [p(i - 1), p(i), p(i + 1), p(i + 2)]
    const c1: Pt = [p1[0] + ((p2[0] - p0[0]) * tension) / 3, p1[1] + ((p2[1] - p0[1]) * tension) / 3]
    const c2: Pt = [p2[0] - ((p3[0] - p1[0]) * tension) / 3, p2[1] - ((p3[1] - p1[1]) * tension) / 3]
    d += `C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`
  }
  return d + 'Z'
}

export const mirrorPts = (pts: Pt[]): Pt[] => pts.map(([x, y]) => [VIEW_W - x, y] as Pt).reverse()
export const linePath = (pts: Pt[]) => 'M' + pts.map(([x, y]) => `${x},${y}`).join('L')

// ── shared parts ────────────────────────────────────────────────────────────
export const HEAD: Pt[] = [[100, 8], [114, 13], [120, 30], [117, 46], [108, 58], [100, 61], [92, 58], [83, 46], [80, 30], [86, 13]]

/** Left half of the body outline, neck → arm → leg → crotch; mirrored to close. */
const OUTLINE_LEFT: Pt[] = [
  [100, 56], [89, 58], [86, 68], [70, 76], [52, 80], [40, 90], [35, 106], [36, 126], [34, 152], [33, 178],
  [28, 212], [29, 248], [26, 268], [32, 288], [42, 290], [48, 272], [47, 250], [55, 216], [60, 184], [62, 150],
  [65, 128], [69, 150], [71, 190], [66, 236], [60, 290], [64, 356], [60, 400], [67, 436], [60, 450], [90, 455],
  [87, 434], [92, 400], [91, 366], [96, 300], [100, 256],
]
export const OUTLINE: Pt[] = [...OUTLINE_LEFT, ...mirrorPts(OUTLINE_LEFT).slice(1, -1)]

const FOREARM: Pt[] = [[42, 182], [58, 182], [58, 198], [52, 226], [46, 248], [34, 248], [32, 222], [34, 198]]

// ── front ───────────────────────────────────────────────────────────────────
export const FRONT: Region[] = [
  { muscle: 'traps', pts: [[88, 62], [86, 72], [72, 78], [58, 82], [66, 74], [80, 66]] },
  { muscle: 'side-delts', pts: [[56, 84], [44, 90], [38, 104], [40, 122], [47, 118], [50, 100]] },
  { muscle: 'front-delts', pts: [[58, 83], [70, 82], [76, 90], [70, 104], [60, 116], [50, 118], [52, 100]] },
  { muscle: 'chest-upper', pts: [[97, 84], [80, 84], [70, 92], [72, 102], [97, 104]] },
  { muscle: 'chest', pts: [[97, 107], [72, 105], [66, 115], [72, 130], [86, 136], [97, 134]] },
  { muscle: 'biceps', pts: [[52, 124], [62, 124], [60, 150], [56, 172], [46, 172], [42, 150], [44, 130]] },
  { muscle: 'forearms', pts: FOREARM },
  {
    muscle: 'abs',
    pts: [[97, 140], [86, 140], [84, 168], [84, 198], [86, 224], [97, 230]],
    lines: [[[85, 164], [97, 163]], [[84, 188], [97, 187]], [[85, 210], [97, 210]]],
  },
  { muscle: 'obliques', pts: [[82, 140], [72, 138], [70, 166], [72, 196], [78, 222], [82, 216], [81, 190], [81, 164]] },
  { muscle: 'adductors', pts: [[97, 254], [92, 256], [86, 284], [89, 318], [94, 300], [97, 276]] },
  {
    muscle: 'quads',
    pts: [[84, 246], [72, 240], [62, 268], [62, 304], [68, 338], [78, 354], [88, 350], [90, 322], [86, 284], [88, 258]],
    lines: [[[74, 264], [77, 300], [79, 342]]],
  },
  { muscle: 'calves', pts: [[68, 382], [88, 382], [88, 406], [84, 432], [74, 434], [66, 408]] },
]

// ── back ────────────────────────────────────────────────────────────────────
export const BACK: Region[] = [
  { muscle: 'traps', pts: [[92, 62], [88, 72], [66, 80], [80, 90], [97, 108], [99, 70]] },
  { muscle: 'side-delts', pts: [[48, 86], [40, 96], [38, 112], [42, 122], [46, 104]] },
  { muscle: 'rear-delts', pts: [[62, 82], [50, 88], [47, 100], [52, 110], [64, 106], [70, 92]] },
  { muscle: 'upper-back', pts: [[97, 111], [80, 95], [70, 101], [74, 122], [97, 140]] },
  { muscle: 'lats', pts: [[72, 126], [66, 118], [64, 138], [68, 166], [78, 196], [90, 200], [92, 178], [86, 152], [80, 132]] },
  { muscle: 'lower-back', pts: [[97, 158], [90, 162], [92, 190], [88, 222], [97, 228]] },
  { muscle: 'triceps', pts: [[54, 118], [62, 124], [60, 150], [56, 172], [46, 172], [42, 148], [44, 126]] },
  { muscle: 'forearms', pts: FOREARM },
  { muscle: 'glutes', pts: [[97, 236], [84, 232], [70, 242], [66, 264], [76, 286], [92, 288], [97, 278]] },
  {
    muscle: 'hamstrings',
    pts: [[92, 294], [76, 292], [64, 312], [66, 342], [76, 356], [88, 352], [92, 322]],
    lines: [[[79, 298], [79, 348]]],
  },
  { muscle: 'adductors', pts: [[97, 294], [95, 296], [94, 328], [97, 320]] },
  { muscle: 'calves', pts: [[66, 380], [88, 380], [92, 402], [86, 428], [72, 430], [64, 404]], lines: [[[78, 386], [78, 420]]] },
]
