// The rail's chip timeline: pure functions of position, so a seek or a frame-stepped
// capture reproduces every frame.
import { interpolate } from '../motion/interpolate'
import { easeOut, poly } from '../motion/easing'
import { interpolateColorOklch } from '../motion/color'

/** A rail chip's state, announced in its accessibility label. */
export type ProgressStepState = 'done' | 'active' | 'pending'

/**
 * The bar into step `k` is the work on step `k`, so chip `k`'s whole timeline runs over the
 * position span `[k - 1, k]`. As the bar starts, its ring turns from grey to the brand colour
 * over `ONSET`. The core then fills in step with the bar until the bar is full at
 * `BAR_FULL`. Over the rest of the span the chip completes: the core fills the chip while its
 * colour turns from the brand colour to the done colour. At `k` the step is done.
 */
const ONSET = 0.1
const BAR_FULL = 0.75
/** Core diameter, percent of the chip, when the bar into it is full: almost a full disc. */
const ALMOST_FULL = 85
/** Lightness turns last, so the hue passes through yellow at full lightness rather than olive. */
const tintLightnessEase = poly(3)

/** A step is done once the position reaches it, and active while the bar into it fills. */
function stepStateAt(index: number, position: number): ProgressStepState {
  if (position >= index) return 'done'
  return position > index - 1 ? 'active' : 'pending'
}

export interface ChipLook {
  state: ProgressStepState
  /** Opacity of the brand ring over the grey one, 0..1. */
  ring: number
  /** Brand core diameter, percent of the chip. */
  core: number
  /** How far the chip's colour has turned from the brand colour to the done colour, 0..1. */
  tint: number
}

export function chipLook(index: number, position: number): ChipLook {
  const start = index - 1
  const barFull = start + BAR_FULL
  const core =
    position <= barFull
      ? interpolate(position, [start, barFull], [0, ALMOST_FULL])
      : interpolate(position, [barFull, index], [ALMOST_FULL, 100], { ease: easeOut(poly(2)) })
  return {
    state: stepStateAt(index, position),
    ring: interpolate(position, [start, start + ONSET], [0, 1]),
    core,
    tint: interpolate(position, [barFull, index], [0, 1]),
  }
}

/** How full the connector into step `segment + 1` is, 0..1: it fills over the step's work. */
export function barFill(segment: number, position: number): number {
  return interpolate(position, [segment, segment + BAR_FULL], [0, 1])
}

/** The chip colour at `tint`, mixed in OKLCH between resolved brand and done hex values. */
export function chipTint(tint: number, [brand, done]: readonly [string, string]): string {
  return interpolateColorOklch(tint, [0, 1], [brand, done], { lightnessEase: tintLightnessEase })
}

export function railPosition(position: number, totalSteps: number, reducedMotion: boolean): number {
  const clamped = Math.min(Math.max(position, 0), Math.max(totalSteps - 1, 0))
  // Reduced motion shows where each transition ends: the step being worked on, done.
  return reducedMotion ? Math.ceil(clamped) : clamped
}
