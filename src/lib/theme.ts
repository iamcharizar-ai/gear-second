// Colour roles used from TS (charts, heatmap). Keep in sync with :root in styles.css.
// Data colours were run through the dataviz validator:
//  • RAMP  — 5-step single-hue ordinal ramp, passes monotone / ΔL / light-end contrast
//  • SERIES — current vs previous pair, passes CVD + normal-vision separation
export const RAMP = ['#86b6ef', '#5598e7', '#2a78d6', '#1c5cab', '#0d366b']
export const SERIES = { current: '#2a78d6', previous: '#eb6834' }
export const INK = '#111111'
export const TEXT_2 = '#57534c'
export const GRID = '#d9d3c7'
export const UNFILLED = '#ffffff'
export const BODY = '#ebe5d9'

/** Ramp step for a value given 4 ascending cut points (0 → unfilled). */
export function heat(v: number, cuts: [number, number, number, number]): string {
  if (!v || v <= 0) return UNFILLED
  let i = 0
  while (i < 4 && v >= cuts[i]) i++
  return RAMP[i]
}

/** Weekly working sets: <5, 5-9, 10-14, 15-20, >20. */
export const WEEK_CUTS: [number, number, number, number] = [5, 10, 15, 20.01]
