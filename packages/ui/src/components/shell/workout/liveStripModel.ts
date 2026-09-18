import { type resolveColor } from '../../../theme/resolve-color'

type ColorToken = Parameters<typeof resolveColor>[0]

/**
 * A rep's velocity zone, structurally identical to workout-analytics' `VelocityZoneId`.
 * titan never imports the analytics package, so the id arrives as data and the strip
 * only chooses its colour (VW-429: the zone is an analytics decision, not a design one).
 */
export type LiveStripZone = 'grinding' | 'maximalStrength' | 'strengthSpeed' | 'power' | 'speed'

/** One performed rep: its mean concentric velocity (m/s) and the zone analytics assigned it. */
export interface LiveStripRep {
  velocity: number
  zone: LiveStripZone
}

/** The session phase the strip mirrors. `idle` renders nothing. */
export type LiveStripState = 'set' | 'rest' | 'idle'

/** Same stops VelocityStrip's band colours use, as semantic tokens so the theme can move them. */
export const LIVE_STRIP_ZONE_TOKEN: Record<LiveStripZone, ColorToken> = {
  speed: 'dataviz-sequential-0',
  power: 'dataviz-sequential-2',
  strengthSpeed: 'dataviz-sequential-3',
  maximalStrength: 'dataviz-sequential-4',
  grinding: 'dataviz-sequential-5',
}

/** The longest rest the strip counts; a longer one reads "999s" (over 16 minutes). */
export const LIVE_STRIP_REST_MAX_SECONDS = 999

/** `full` fits "99s" in the numeral slot; `reduced` is the one smaller step that fits "999s". */
export type LiveStripRestStep = 'full' | 'reduced'

/** The rest readout: whole seconds left (rounded up) and the type step chosen by that value. */
export function liveStripRestReadout(remainingMs: number): {
  seconds: number
  step: LiveStripRestStep
} {
  const seconds = Math.min(LIVE_STRIP_REST_MAX_SECONDS, Math.max(0, Math.ceil(remainingMs / 1000)))
  return { seconds, step: seconds >= 100 ? 'reduced' : 'full' }
}
