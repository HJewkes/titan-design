// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { primitiveRamps } from '../../../theme/tokens/primitives'
import { getSemanticColors } from '../../../theme/tokens/semantic'

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

/** Literal-hex fill for each tone (RNW-safe): success · warning · cyan pin. */
const PACE_TONE_COLORS: Record<PaceTone, string> = {
  ahead: getSemanticColors('dark')['status-success'],
  behind: getSemanticColors('dark')['status-warning'],
  neutral: primitiveRamps.cyan[400],
}

/** The literal-hex colour for a tone. */
export function paceToneColor(tone: PaceTone): string {
  return PACE_TONE_COLORS[tone]
}
