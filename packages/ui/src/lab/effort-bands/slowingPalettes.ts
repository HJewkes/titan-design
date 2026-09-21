import { primitiveRamps as ramp } from '../../theme/tokens/primitives'
import {
  EFFORT_BAND_PALETTE,
  type VelocityBandPalette,
} from '../../components/custom/Workout/VelocityBandPreview'

/**
 * Candidates for the proposed `dataviz-slowing-0..3` token (VW-448 round 1): the tier a palette,
 * one hue, band 0 fastest to band 3 at the reference loss. Built from existing ramp steps so no
 * hex is invented; the chosen one becomes a four-file token chain in the integration PR.
 * Blue, not cyan: cyan already means a set-type window on the strip.
 */
export const SLOWING_PALETTES = {
  /** Tier b reference: absolute effort, the shipped green-to-red scale. */
  effort: EFFORT_BAND_PALETTE,
  /** Light to dark: the fastest rep is brightest and slowing reps sink toward the plane. */
  slowingBlue: [ramp.blue[200], ramp.blue[400], ramp.blue[600], ramp.blue[800]],
  /** Dark to light: slowing reps brighten, so the rep at the reference loss is the loudest. */
  slowingBlueRising: [ramp.blue[800], ramp.blue[600], ramp.blue[400], ramp.blue[200]],
  /** The design's alternative, not recommended: tier a on the effort colours, relying on labels. */
  trafficLight: EFFORT_BAND_PALETTE,
} as const satisfies Record<string, VelocityBandPalette>

export type SlowingPaletteKey = keyof typeof SLOWING_PALETTES
