import { motion } from '../../../theme/tokens/semantic'
import { cubicBezier, type Easing } from './easing'

type EaseName = keyof typeof motion.ease
type DurationName = keyof typeof motion.duration

const ease = Object.fromEntries(
  Object.entries(motion.ease).map(([name, [x1, y1, x2, y2]]) => [name, cubicBezier(x1, y1, x2, y2)])
) as Record<EaseName, Easing>

const duration = Object.fromEntries(
  Object.entries(motion.duration).map(([name, ms]) => [name, ms / 1000])
) as Record<DurationName, number>

/**
 * titan's motion tokens for time-driven motion: the same `motion` source as the `--duration-*`
 * and `--ease-*` CSS variables, with durations in seconds and eases as evaluable curves.
 */
export const MOTION = { duration, ease } as const
