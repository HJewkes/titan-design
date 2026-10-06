import { greyRamp, primitiveRamps } from '../../../../theme/tokens/primitives'
import type { ThemeMode } from '../../../../theme/tokens/semantic'

// The silver/red scheme: SILVER when a mark is on track, SHADES OF RED when there is an issue.
// No greens, no ambers; those languages belong to verdict tones and bands, not here.
/** On-track / at-or-above-working. */
export const SILVER = greyRamp[200]
export const RED_LIGHT = primitiveRamps.red[400]
export const RED_MID = primitiveRamps.red[600]
export const RED_DEEP = primitiveRamps.red[800]
/** A quiet grey a silver mark dims toward (never a colour): a dimmed cool grey in the SAME
 *  neutral family as SILVER, so a fully-dimmed mark reads dim-silver rather than sinking
 *  toward black. */
export const DRIFT_GREY = greyRamp[700]

export interface SilverRedPair {
  /** A mark with nothing to report. */
  neutral: string
  /** A mark that carries a flag. */
  flag: string
}

// Light mirrors dark down the same ramps. On the light base surface grey[500] falls under 3:1
// against a hairline track, so the light neutral is grey[600].
const PAIRS: Record<ThemeMode, SilverRedPair> = {
  dark: { neutral: SILVER, flag: RED_LIGHT },
  light: { neutral: greyRamp[600], flag: RED_MID },
}

/** The two-tone silver/red pair for a theme mode, as literal hex. */
export function silverRed(mode: ThemeMode): SilverRedPair {
  return PAIRS[mode]
}
