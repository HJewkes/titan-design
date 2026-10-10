import { greyRamp, primitiveRamps } from '../../../../theme/tokens/primitives'
import type { ThemeMode } from '../../../../theme/tokens/semantic'

// The silver/red scheme: SILVER when a mark is on track, SHADES OF RED when there is an issue.
// No greens, no ambers; those languages belong to verdict tones and bands, not here.
/** On-track / at-or-above-working. */
export const SILVER = greyRamp[200]
/** The palest red: an issue that is near, not yet over. */
export const RED_PALE = primitiveRamps.red[300]
export const RED_LIGHT = primitiveRamps.red[400]
export const RED_MID = primitiveRamps.red[600]
export const RED_DEEP = primitiveRamps.red[800]
/** A quiet grey a silver mark dims toward (never a colour): a dimmed cool grey in the SAME
 *  neutral family as SILVER, so a fully-dimmed mark reads dim-silver rather than sinking
 *  toward black. */
export const DRIFT_GREY = greyRamp[700]

export interface SilverRedScheme {
  /** A mark with nothing to report. */
  neutral: string
  /** A mark flagged `warning`: near a limit. */
  near: string
  /** A mark flagged `error`: over a limit. */
  over: string
}

// Light mirrors dark down the same ramps. On the TD-789 3b light planes grey[600] falls under
// 3:1 against a hairline track, so the light neutral is grey[700]. The light reds started as the
// owner's console round 6 pick (red[500] / red[700]); 3b moves near to red[600], which measures
// against the plane, a declared exception in bar-list/BarList.test.tsx. In dark the paler red is
// the quieter one, in light the deeper.
const SCHEMES: Record<ThemeMode, SilverRedScheme> = {
  dark: { neutral: SILVER, near: RED_PALE, over: RED_LIGHT },
  light: { neutral: greyRamp[700], near: primitiveRamps.red[600], over: primitiveRamps.red[700] },
}

/** The silver/red tones for a theme mode, as literal hex. */
export function silverRed(mode: ThemeMode): SilverRedScheme {
  return SCHEMES[mode]
}
