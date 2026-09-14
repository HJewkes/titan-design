// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { primitiveRamps } from '../../../theme/tokens/primitives'
import { getSemanticColors, type ThemeMode } from '../../../theme/tokens/semantic'

/** How progress compares to its target pace: `ahead`, `behind`, or `neutral` (no target). */
export type PaceTone = 'ahead' | 'behind' | 'neutral'

/**
 * Classify `progress` (0..1) against an optional `target` (0..1). No target reads
 * as `neutral`; at or past target is `ahead`, otherwise `behind`.
 */
export function paceTone(progress: number, target?: number): PaceTone {
  if (target === undefined) return 'neutral'
  return progress >= target ? 'ahead' : 'behind'
}

/** Semantic token per tone. `neutral` pins a ramp step: there is no "no target" token. */
const PACE_TONE_TOKEN = {
  ahead: 'status-success',
  behind: 'status-warning',
} as const

/**
 * The literal-hex fill for a tone (RNW-safe — `resolveColor` would return a `var()`
 * string here). Takes the theme `mode` rather than holding a resolved palette, so the
 * colour follows the enclosing `<Surface>`: pass `useSurfaceMode()` (VW-316).
 */
export function paceToneColor(tone: PaceTone, mode: ThemeMode): string {
  if (tone === 'neutral') return primitiveRamps.cyan[400]
  return getSemanticColors(mode)[PACE_TONE_TOKEN[tone]]
}
