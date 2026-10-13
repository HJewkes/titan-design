/**
 * Motion custom properties (TD-838).
 *
 * Derives the `--ease-*` / `--duration-*` strings from `motion` in
 * `semantic.ts`, so the numbers exist once: `config.completeness.test.ts`
 * holds `global.css` to these values, and `ui/motion` evaluates the same
 * control points as `MOTION.ease`.
 */

import { motion } from './semantic'

type ControlPoints = readonly [number, number, number, number]

/** `[0.22, 1, 0.36, 1]` → `cubic-bezier(0.22, 1, 0.36, 1)` */
export function cubicBezierCss(points: ControlPoints): string {
  return `cubic-bezier(${points.join(', ')})`
}

/** `{ '--ease-out': 'cubic-bezier(…)', …, '--duration-fast': '150ms', … }` */
export const motionCSSVars = Object.freeze({
  '--ease-out': cubicBezierCss(motion.ease.out),
  '--ease-in-out': cubicBezierCss(motion.ease.inOut),
  '--ease-spring': cubicBezierCss(motion.ease.spring),
  '--duration-fast': `${motion.duration.fast}ms`,
  '--duration-normal': `${motion.duration.normal}ms`,
  '--duration-slow': `${motion.duration.slow}ms`,
} as const)
