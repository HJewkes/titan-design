import { primitiveRamps as ramp } from '../../../theme/tokens/primitives'
import { WORKOUT_TOKENS } from '../../../theme/workout-tokens'
import type { VelocityBandMeaning } from './VelocityBandScale'

/** Fill for bands 0 to 3, in the palette the scale's `meaning` calls for. */
export type VelocityBandPalette = readonly [string, string, string, string]

/** Tier b: absolute effort on the shipped four-step performance scale. Also a line's ink. */
export const EFFORT_BAND_PALETTE: VelocityBandPalette = [
  WORKOUT_TOKENS.scale.green,
  WORKOUT_TOKENS.scale.yellow,
  WORKOUT_TOKENS.scale.orange,
  WORKOUT_TOKENS.scale.red,
]

/**
 * Tier a: one blue, light to dark, band 0 fastest to band 3 at the reference loss (VW-448 round 1,
 * Pa1). Ramp steps until the integration PR adds the `dataviz-slowing-0..3` token.
 */
export const SLOWING_BAND_PALETTE: VelocityBandPalette = [
  ramp.blue[200],
  ramp.blue[400],
  ramp.blue[600],
  ramp.blue[800],
]

/** Effort colours only when the scale means effort; `none` has no bands, so either would do. */
export function paletteFor(meaning: VelocityBandMeaning): VelocityBandPalette {
  return meaning === 'effort' ? EFFORT_BAND_PALETTE : SLOWING_BAND_PALETTE
}
