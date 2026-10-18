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

/**
 * CSS `cubic-bezier(x1, y1, x2, y2)` evaluated as y for a given x in [0, 1]. As in CSS, a
 * non-finite argument, or `x1` or `x2` outside [0, 1], throws a `RangeError`.
 */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number): Easing {
  if (![x1, y1, x2, y2].every(Number.isFinite) || !(x1 >= 0 && x1 <= 1 && x2 >= 0 && x2 <= 1)) {
    throw new RangeError(
      `cubicBezier(${x1}, ${y1}, ${x2}, ${y2}): needs finite values, x1 and x2 in [0, 1]`
    )
  }
  return (p) => {
    if (p <= 0) return 0
    if (p >= 1) return 1
    return coord(solveCurveParameter(p, x1, x2), y1, y2)
  }
}

/** Returns `f` unchanged: an ease-in curve, named so call sites read like their ease-out pair. */
export const easeIn = (f: Easing): Easing => f

/** `f` reflected through the centre: what `f` does at the start happens at the end. */
export const easeOut =
  (f: Easing): Easing =>
  (p) =>
    1 - f(1 - p)

/** `f` over the first half and `easeOut(f)` over the second, meeting at (0.5, 0.5). */
export const easeInOut =
  (f: Easing): Easing =>
  (p) =>
    p < 0.5 ? f(2 * p) / 2 : 1 - f(2 * (1 - p)) / 2

/** The power curve `p ** n`: `poly(2)` is quadratic, `poly(3)` cubic. */
export const poly =
  (n: number): Easing =>
  (p) =>
    p ** n

/** Pulls back below 0 before moving to 1; `s` sets the depth (the default dips about 10 %). */
export const back =
  (s = 1.70158): Easing =>
  (p) =>
    p * p * (s * (p - 1) + p)

/** Hermite smoothstep: zero slope at both ends. */
export const smoothstep: Easing = (p) => p * p * (3 - 2 * p)

/** Perlin's smootherstep: zero slope and zero curvature at both ends. */
export const smootherstep: Easing = (p) => p ** 3 * (p * (6 * p - 15) + 10)

/**
 * Out and home again: 0 at both ends and 1 at the midpoint, each half eased by `f`. Manim's
 * `there_and_back`, kept for emphasis cues only (a pulse on a mark), never for an entrance.
 */
export const thereAndBack =
  (f: Easing = smootherstep): Easing =>
  (p) =>
    f(p < 0.5 ? 2 * p : 2 - 2 * p)
