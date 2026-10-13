// Easing curves as pure functions of progress; nothing here reads a clock.

/** Maps linear progress in [0, 1] to eased progress. */
export type Easing = (p: number) => number

/** The identity easing. */
export const linear: Easing = (p) => p

const coord = (s: number, a: number, b: number) =>
  3 * a * s * (1 - s) ** 2 + 3 * b * s ** 2 * (1 - s) + s ** 3

const slope = (s: number, a: number, b: number) =>
  3 * a * (1 - s) ** 2 + 6 * (b - a) * s * (1 - s) + 3 * (1 - b) * s ** 2

/** The curve parameter whose x is `x`: Newton first, bisection where the slope flattens. */
function solveCurveParameter(x: number, x1: number, x2: number): number {
  let s = x
  for (let i = 0; i < 8; i++) {
    const err = coord(s, x1, x2) - x
    if (Math.abs(err) < 1e-7) return s
    const d = slope(s, x1, x2)
    if (Math.abs(d) < 1e-6) break
    s -= err / d
  }
  let lo = 0
  let hi = 1
  s = x
  for (let i = 0; i < 40; i++) {
    if (coord(s, x1, x2) < x) lo = s
    else hi = s
    s = (lo + hi) / 2
  }
  return s
}

/** CSS `cubic-bezier(x1, y1, x2, y2)` evaluated as y for a given x in [0, 1]. */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number): Easing {
  return (p) => {
    if (p <= 0) return 0
    if (p >= 1) return 1
    return coord(solveCurveParameter(p, x1, x2), y1, y2)
  }
}
