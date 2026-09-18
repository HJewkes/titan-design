import { type resolveColor } from '../../../theme/resolve-color'
import {
  velocityLossBand,
  velocityLossForRep,
  type VelocityLossThresholds,
} from '../../custom/Workout/VelocityStrip'

type ColorToken = Parameters<typeof resolveColor>[0]

/**
 * A rep's velocity zone, structurally identical to workout-analytics' `VelocityZoneId`.
 * titan never imports the analytics package, so the id arrives as data and the strip
 * only chooses its colour (VW-429: the zone is an analytics decision, not a design one).
 */
export type LiveStripZone = 'grinding' | 'maximalStrength' | 'strengthSpeed' | 'power' | 'speed'

/** One performed rep: its mean concentric velocity (m/s) and the zone analytics assigned it (used by `barColor="zone"`). */
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

/** How the strip colours its bars: the rep's absolute zone, or its loss from the set's best. */
export type LiveStripBarColor = 'zone' | 'loss'

/** Loss bands green, yellow, orange, red: the zone tokens that match VelocityStrip's loss hues. */
const LIVE_STRIP_LOSS_TOKEN: readonly ColorToken[] = [
  LIVE_STRIP_ZONE_TOKEN.speed,
  LIVE_STRIP_ZONE_TOKEN.power,
  LIVE_STRIP_ZONE_TOKEN.strengthSpeed,
  LIVE_STRIP_ZONE_TOKEN.maximalStrength,
]

/** The colour token for one rep, by zone or by its loss from the best rep of `reps`. */
export function liveStripRepToken(
  reps: readonly LiveStripRep[],
  index: number,
  barColor: LiveStripBarColor = 'loss',
  lossThresholds?: VelocityLossThresholds
): ColorToken {
  const rep = reps[index]
  if (barColor === 'zone') return LIVE_STRIP_ZONE_TOKEN[rep.zone]
  const best = Math.max(...reps.map((r) => r.velocity))
  return LIVE_STRIP_LOSS_TOKEN[
    velocityLossBand(velocityLossForRep(rep.velocity, best), lossThresholds)
  ]
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
