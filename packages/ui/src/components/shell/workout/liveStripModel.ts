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
