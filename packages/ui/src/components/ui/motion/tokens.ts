import { motion } from '../../../theme/tokens/semantic'
import {
  motionEase,
  springPreset,
  springPresets,
  type SpringPreset,
  type SpringPresetName,
} from './curves'
import { motionPreset } from './presets'

type DurationName = keyof typeof motion.duration

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

const spring = Object.fromEntries(
  (Object.keys(springPresets) as SpringPresetName[]).map((name) => [name, springPreset(name)])
) as Record<SpringPresetName, SpringPreset>

/** Seconds between neighbours in a cascade of `count` items, so the whole cascade fits `video.staggerMax`. */
function staggerEachS(count: number): number {
  return count > 1 ? Math.min(video.staggerEach, video.staggerMax / (count - 1)) : video.staggerEach
}

/**
 * titan's motion tokens for time-driven motion: the same `motion` source as the `--duration-*`
 * and `--ease-*` CSS variables, with durations in seconds and eases as evaluable curves. `video`
 * times are seconds too; `spring` holds the presets without overshoot, and `springPreset` is the
 * explicit way to opt into it. `preset(name, tier)` evaluates a `motion.presets` entry at a
 * tier. `dim.context` is the weight of de-emphasised context.
 */
export const MOTION = {
  duration,
  ease: motionEase,
  video,
  spring,
  springPreset,
  staggerEachS,
  preset: motionPreset,
  dim: motion.dim,
} as const
