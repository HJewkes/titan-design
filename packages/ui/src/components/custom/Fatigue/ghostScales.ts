import { clamp01 } from './fatigue-tokens'
import type { RepVelocityCurve } from './fatigue-model'

export interface GhostScales {
  x: (ms: number) => number
  mag: (v: number) => number
}

/** Left and right inset of the time axis inside the svg, px. */
export interface GhostPad {
  left: number
  right: number
}

/**
 * The time scale and magnitude scale of a ghost spark. `GhostSpark` calls it with its own
 * curves, `DualGhostSpark` with both devices' curves together, so one curve set gives one
 * pair of scales whichever component draws it. Time runs over the longest curve with 4%
 * headroom; magnitude is normalised to the fastest sample with 6% headroom and scaled to
 * `plotH`.
 */
export function ghostScales(
  curves: RepVelocityCurve[],
  w: number,
  plotH: number,
  pad: GhostPad
): GhostScales {
  const vmax = Math.max(0.01, ...curves.flatMap((c) => c.samples.map((s) => s.velocityMps))) * 1.06
  const axisMaxT =
    Math.max(1, ...curves.map((c) => c.samples[c.samples.length - 1]?.tMs ?? 0)) * 1.04
  return {
    x: (ms) => pad.left + (ms / axisMaxT) * (w - pad.left - pad.right),
    mag: (v) => clamp01(v / vmax) * plotH,
  }
}
