/**
 * Motion custom properties (TD-838).
 *
 * Derives the `--ease-*` / `--duration-*` strings from `motion` in
 * `semantic.ts`, so the numbers exist once: `config.completeness.test.ts`
 * holds `global.css` to these values, and `ui/motion` evaluates the same
 * control points as `MOTION.ease`.
 */

import { motion } from './semantic'

/** The four control points of a CSS `cubic-bezier()`. */
export type ControlPoints = readonly [number, number, number, number]

/** The CSS string for `P`, kept literal so the theme's types still name each curve exactly. */
export type CubicBezierCss<P extends ControlPoints> =
  `cubic-bezier(${P[0]}, ${P[1]}, ${P[2]}, ${P[3]})`

/** `[0.22, 1, 0.36, 1]` → `cubic-bezier(0.22, 1, 0.36, 1)` */
export function cubicBezierCss<const P extends ControlPoints>(points: P): CubicBezierCss<P> {
  return `cubic-bezier(${points.join(', ')})` as CubicBezierCss<P>
}

/** `{ '--ease-out': 'cubic-bezier(…)', …, '--duration-fast': '150ms', … }` */
export const motionCSSVars = Object.freeze({
  '--ease-out': cubicBezierCss(motion.ease.out),
  '--ease-in-out': cubicBezierCss(motion.ease.inOut),
  '--ease-spring': cubicBezierCss(motion.ease.spring),
  '--ease-in': cubicBezierCss(motion.ease.in),
  '--duration-fast': `${motion.duration.fast}ms`,
  '--duration-normal': `${motion.duration.normal}ms`,
  '--duration-slow': `${motion.duration.slow}ms`,
} as const)
