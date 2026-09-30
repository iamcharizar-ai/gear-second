// Pure pixel data (no DOM): palette, UI glyphs, the body map and the app
// icon. Shared by the app and tools/make-icons.mjs.
import type { Muscle } from './types'

// Keep in sync with :root in styles.css.
export const PAL = {
  bg: '#140f0c',
  panel: '#1f1813',
  panel2: '#2a2019',
  line: '#463629',
  lineHi: '#7a5f45',
  text: '#f4e9d0',
  dim: '#a8927a',
  straw: '#f2c230',
  strawDeep: '#b8871c',
  strawLite: '#ffe38a',
  red: '#e0402f',
  redDeep: '#9c2a1f',
  sea: '#36b8a4',
  skin: '#5a4636',
  muscleOff: '#33271f',
}

const g = (s: string) => s.trim().split('\n').map((r) => r.trim())

export const GLYPHS = {
  plus: g(`
    ...#...
    ...#...
    ...#...
    #######
    ...#...
    ...#...
    ...#...`),
  minus: g(`
    .......
    .......
    .......
    #######
    .......
    .......
    .......`),
  close: g(`
    #.....#
    .#...#.
    ..#.#..
    ...#...
    ..#.#..
    .#...#.
    #.....#`),
  check: g(`
    .......
    ......#
    .....##
    #...##.
    ##.##..
    .###...
    ..#....`),
  dots: g(`
    ........
    ........
    ##.##.##
    ##.##.##
    ........
    ........`),
  up: g(`
    ...#...
    ..###..
    .#.#.#.
    #..#..#
    ...#...
    ...#...
    ...#...`),
  down: g(`
    ...#...
    ...#...
    ...#...
    #..#..#
    .#.#.#.
    ..###..
    ...#...`),
  link: g(`
    ....###
    ...#..#
    ..#.#.#
    .#.#.#.
    #.#.#..
    #..#...
    ###....`),
  trash: g(`
    ..###..
    #######
    .#.#.#.
    .#.#.#.
    .#.#.#.
    .#.#.#.
    .#####.`),
  search: g(`
    .#####...
    #.....#..
    #.....#..
    #.....#..
    #.....#..
    #.....#..
    .#####.#.
    .......##
    ........#`),
  clock: g(`
    ..###..
    .#...#.
    #..#..#
    #..##.#
    #.....#
    .#...#.
    ..###..`),
  home: g(`
    ...#...
    ..###..
    .#####.
    #######
    .#...#.
    .#.#.#.
    .#.#.#.`),
  trophy: g(`
    #######
    #.###.#
    .#####.
    ..###..
    ...#...
    ..###..
    .#####.`),
  dumbbell: g(`
    .#.....#.
    ##.....##
    #########
    ##.....##
    .#.....#.`),
  note: g(`
    #######
    #.....#
    #.###.#
    #.....#
    #.###.#
    #.....#
    #######`),
  play: g(`
    #......
    ###....
    #####..
    #######
    #####..
    ###....
    #......`),
  back: g(`
    ...##
    ..##.
    .##..
    ##...
    .##..
    ..##.
    ...##`),
  pencil: g(`
    ......##
    .....###
    ....###.
    ...###..
    ..###...
    .###....
    ###.....
    ##......`),
  swap: g(`
    ....#..
    #######
    ....#..
    .......
    ..#....
    #######
    ..#....`),
  flame: g(`
    ...#...
    ..##...
    ..###..
    .#####.
    .##.###
    .##.###
    ..###..`),
}
export type GlyphName = keyof typeof GLYPHS

// ── body map ────────────────────────────────────────────────────────────────
// Left half + centre column of a 19-px-wide figure; the right half is mirrored
// so the figure is always symmetric. Letters are muscle regions.
const FRONT_HALF = [
  '.......HHH', '......HHHH', '......HHHH', '......HHHH', '.......HHH',
  '.....TTTXX',
  '..ddDDCCCC', '.ddDDCCCCC', '.dDD.CCCCC',
  '.BBB.CCCCC', '.BBB.CCCCC',
  '.BBB.OAAAA', '.BBB.OAAAA',
  '.FFF.OAAAA', '.FFF.OAAAA', 'FFF...OAAA', 'FFF...OAAA', 'XX....OAAA',
  'XX...QQQQX',
  '.....QQQQ.', '.....QQQQ.', '.....QQQQ.', '.....QQQQ.', '.....QQQQ.',
  '......QQQ.', '......QQQ.',
  '......kkk.',
  '......VVV.', '......VVV.', '......VVV.', '......VV..', '......VV..',
  '......XX..', '.....XXX..',
]
const BACK_HALF = [
  '.......HHH', '......HHHH', '......HHHH', '......HHHH', '.......HHH',
  '.....TTTTT',
  '..ddRRTTTT', '.ddRRUUTTT', '.dRR.LUUUU',
  '.YYY.LLUUU', '.YYY.LLUUU',
  '.YYY.LLLWW', '.YYY.LLLWW',
  '.FFF.LLWWW', '.FFF..LWWW', 'FFF...WWWW', 'FFF...WWWW', 'XX....WWWW',
  'XX...GGGGG',
  '.....GGGG.', '.....GGGG.',
  '.....MMMM.', '.....MMMM.', '.....MMMM.',
  '......MMM.', '......MMM.',
  '......kkk.',
  '.....VVVV.', '.....VVVV.', '......VVV.', '......VV..', '......VV..',
  '......XX..', '.....XXX..',
]

export const REGION: Record<string, Muscle | null> = {
  C: 'chest', D: 'front-delts', d: 'side-delts', R: 'rear-delts', T: 'traps', U: 'upper-back',
  L: 'lats', W: 'lower-back', B: 'biceps', Y: 'triceps', F: 'forearms', A: 'abs', O: 'obliques',
  Q: 'quads', M: 'hamstrings', G: 'glutes', V: 'calves',
  H: null, X: null, k: null,
}

const mirror = (half: string[]) => half.map((r) => r + r.slice(0, 9).split('').reverse().join(''))
export const BODY_FRONT = mirror(FRONT_HALF)
export const BODY_BACK = mirror(BACK_HALF)
export const BODY_W = 19
export const BODY_H = FRONT_HALF.length

// ── app icon: a straw hat ───────────────────────────────────────────────────
export const HAT = g(`
  ......oooooo......
  ....oo######oo....
  ...o##########o...
  ...o#########lo...
  ...oRRRRRRRRRRo...
  .oooRRRRRRRRRRooo.
  o################o
  o#d############d#o
  .oo############oo.
  ...oooooooooooo...`)
export const HAT_TONES: Record<string, string> = {
  o: '#5c3a12',
  '#': PAL.straw,
  d: PAL.strawDeep,
  l: PAL.strawLite,
  R: PAL.red,
}
