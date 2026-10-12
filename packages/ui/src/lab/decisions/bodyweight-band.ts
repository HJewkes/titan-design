/**
 * TD-325: the bodyweight card's band colour, one and two ramp steps more intense than today.
 * The band is `alpha(brand-secondary, BAND_OPACITY)` laid OVER the track, so it is a
 * translucent overlay, not a lighter ramp step: the same cyan at 28% over whatever sits
 * beneath. "More intense" moves the cyan toward the plane's opposite end of its ramp:
 * brighter on dark (500 -> 400 -> 300), deeper on light (600 -> 700 -> 800). No token changes.
 */
import { compositeOver, contrast } from '../../theme/color-checks'
import { surfaceBackground } from '../../theme/surface-planes'
import { primitiveRamps } from '../../theme/tokens/primitives'
import { getSemanticColors, type ThemeMode } from '../../theme/tokens/semantic'
import { alpha } from '../../utils/colors'
import { BAND_OPACITY } from '../../components/custom/Workout/GoalTrajectoryBand'

export type BandOptionKey = 'today' | 'oneStep' | 'twoSteps'
type CyanStep = keyof typeof primitiveRamps.cyan

export interface BandOption {
  key: BandOptionKey
  title: string
  steps: Record<ThemeMode, CyanStep>
}

export const BAND_OPTIONS: BandOption[] = [
  { key: 'today', title: 'Today', steps: { dark: 500, light: 600 } },
  { key: 'oneStep', title: 'One step more intense', steps: { dark: 400, light: 700 } },
  { key: 'twoSteps', title: 'Two steps more intense', steps: { dark: 300, light: 800 } },
]

export interface BandReading {
  stepLabel: string
  /** The band colour as the track receives it: the ramp step at the band's alpha. */
  color: string
  /** The track's colour, composited over the card plane. */
  track: string
  /** The card plane the track sits on (a `StatCard` at elevation 1 on the base page). */
  plane: string
  /** The band over the track, against the track beneath it. */
  barVsTrack: number
  /** The band over the track, against the card plane around it. */
  barVsPlane: number
}

export function readBand(option: BandOption, mode: ThemeMode): BandReading {
  const step = option.steps[mode]
  const color = alpha(primitiveRamps.cyan[step], BAND_OPACITY)
  const plane = surfaceBackground('elevated', mode)
  const track = compositeOver(getSemanticColors(mode)['border-prominent'], plane)
  const bar = compositeOver(color, track)
  return {
    stepLabel: `cyan[${step}] at ${Math.round(BAND_OPACITY * 100)}%`,
    color,
    track,
    plane,
    barVsTrack: contrast(bar, track),
    barVsPlane: contrast(bar, plane),
  }
}
