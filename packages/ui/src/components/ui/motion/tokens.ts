import { motion } from '../../../theme/tokens/semantic'
import { cubicBezier, type Easing } from './easing'
import type { SpringOptions } from './spring'

type EaseName = keyof typeof motion.ease
type DurationName = keyof typeof motion.duration
type SpringPresetName = keyof typeof motion.spring
type SpringPreset = Required<Pick<SpringOptions, 'stiffness' | 'damping' | 'mass'>>

const ease = Object.fromEntries(
  Object.entries(motion.ease).map(([name, [x1, y1, x2, y2]]) => [name, cubicBezier(x1, y1, x2, y2)])
) as Record<EaseName, Easing>

const duration = Object.fromEntries(
  Object.entries(motion.duration).map(([name, ms]) => [name, ms / 1000])
) as Record<DurationName, number>

const { rise, scaleFrom, exitScale, ...videoMs } = motion.video
const video = {
  ...(Object.fromEntries(Object.entries(videoMs).map(([name, ms]) => [name, ms / 1000])) as Record<
    keyof typeof videoMs,
    number
  >),
  rise,
  scaleFrom,
  exitScale,
}

/** Critical damping is the least damping that cannot overshoot; heavier damping is kept. */
function withoutOvershoot({ stiffness, damping, mass }: SpringPreset): SpringPreset {
  return { stiffness, mass, damping: Math.max(damping, 2 * Math.sqrt(stiffness * mass)) }
}

/**
 * The named spring preset. It never overshoots unless `allowOvershoot` is set, which only changes
 * `bouncy`, the payoff spring: the other presets are already damped past critical.
 */
function springPreset(
  name: SpringPresetName,
  { allowOvershoot = false }: { allowOvershoot?: boolean } = {}
): SpringPreset {
  const preset = motion.spring[name]
  return allowOvershoot ? { ...preset } : withoutOvershoot(preset)
}

const spring = Object.fromEntries(
  (Object.keys(motion.spring) as SpringPresetName[]).map((name) => [name, springPreset(name)])
) as Record<SpringPresetName, SpringPreset>

/** Seconds between neighbours in a cascade of `count` items, so the whole cascade fits `video.staggerMax`. */
function staggerEachS(count: number): number {
  return count > 1 ? Math.min(video.staggerEach, video.staggerMax / (count - 1)) : video.staggerEach
}

/**
 * titan's motion tokens for time-driven motion: the same `motion` source as the `--duration-*`
 * and `--ease-*` CSS variables, with durations in seconds and eases as evaluable curves. `video`
 * times are seconds too; `spring` holds the presets without overshoot, and `springPreset` is the
 * explicit way to opt into it. `dim.context` is the weight of de-emphasised context.
 */
export const MOTION = {
  duration,
  ease,
  video,
  spring,
  springPreset,
  staggerEachS,
  dim: motion.dim,
} as const
