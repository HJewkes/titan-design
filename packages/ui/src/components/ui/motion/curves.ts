// The named curves both MOTION and the preset evaluator read, kept apart so neither imports the other.
import { motion } from '../../../theme/tokens/semantic'
import { cubicBezier, type Easing } from './easing'
import type { SpringOptions } from './spring'

/** An ease token's name. */
export type EaseName = keyof typeof motion.ease

/** The `motion.ease` control points as evaluable curves. */
export const motionEase = Object.fromEntries(
  Object.entries(motion.ease).map(([name, [x1, y1, x2, y2]]) => [name, cubicBezier(x1, y1, x2, y2)])
) as Record<EaseName, Easing>

/** The physics of a named spring preset. */
export type SpringPreset = Required<Pick<SpringOptions, 'stiffness' | 'damping' | 'mass'>>

/** Every preset but `bouncy`, the payoff spring, is damped past critical, so it cannot overshoot. */
export const springPresets = {
  snappy: { stiffness: 300, damping: 42, mass: 1 },
  smooth: { stiffness: 100, damping: 24, mass: 1 },
  heavy: { stiffness: 80, damping: 32, mass: 2 },
  bouncy: { stiffness: 180, damping: 12, mass: 1 },
} as const satisfies Record<string, SpringPreset>

/** A spring preset's name. */
export type SpringPresetName = keyof typeof springPresets

/** Critical damping is the least damping that cannot overshoot; heavier damping is kept. */
function withoutOvershoot({ stiffness, damping, mass }: SpringPreset): SpringPreset {
  return { stiffness, mass, damping: Math.max(damping, 2 * Math.sqrt(stiffness * mass)) }
}

/**
 * The named spring preset. It never overshoots unless `allowOvershoot` is set, which only changes
 * `bouncy`, the payoff spring: the other presets are already damped past critical.
 */
export function springPreset(
  name: SpringPresetName,
  { allowOvershoot = false }: { allowOvershoot?: boolean } = {}
): SpringPreset {
  const preset = springPresets[name]
  return allowOvershoot ? { ...preset } : withoutOvershoot(preset)
}
