import { getSemanticColors, type ThemeMode } from '../../../theme/tokens/semantic'
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

/** Tier a: the `dataviz-slowing-0..3` tokens, band 0 fastest to band 3 at the reference loss. */
export function slowingBandPalette(mode: ThemeMode = 'dark'): VelocityBandPalette {
  const colors = getSemanticColors(mode)
  return [
    colors['dataviz-slowing-0'],
    colors['dataviz-slowing-1'],
    colors['dataviz-slowing-2'],
    colors['dataviz-slowing-3'],
  ]
}

/** Effort colours only when the scale means effort; `none` has no bands, so either would do. */
export function paletteFor(
  meaning: VelocityBandMeaning,
  mode: ThemeMode = 'dark'
): VelocityBandPalette {
  return meaning === 'effort' ? EFFORT_BAND_PALETTE : slowingBandPalette(mode)
}
