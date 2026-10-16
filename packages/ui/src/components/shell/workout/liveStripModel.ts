import { type resolveColor } from '../../../theme/resolve-color'
import { greyRamp, primitiveRamps } from '../../../theme/tokens/primitives'
import type { ThemeMode } from '../../../theme/tokens/semantic'
import type { SetBarTreatment } from '../../custom/charts/setBarTones'
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
  zone?: LiveStripZone
}

/** Same reps by velocity and zone: a rest tick re-renders the strip with equal but new arrays. */
export function sameLiveStripReps(a: readonly LiveStripRep[], b: readonly LiveStripRep[]): boolean {
  return (
    a === b ||
    (a.length === b.length &&
      a.every((rep, i) => rep.velocity === b[i].velocity && rep.zone === b[i].zone))
  )
}

/** Same loss thresholds by value, so a consumer rebuilding the tuple each render does not redraw. */
export function sameLossThresholds(
  a?: VelocityLossThresholds,
  b?: VelocityLossThresholds
): boolean {
  return a === b || (a != null && b != null && a.every((t, i) => t === b[i]))
}

/** The last rep's velocity, or `null` when there is none or it is not a finite number. */
export function liveStripLastVelocity(reps: readonly LiveStripRep[]): number | null {
  const last = reps[reps.length - 1]
  return last && Number.isFinite(last.velocity) ? last.velocity : null
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

/** The colour token for one rep, by zone or by its loss from the best rep of `reps`; a rep without a zone uses its loss. */
export function liveStripRepToken(
  reps: readonly LiveStripRep[],
  index: number,
  barColor: LiveStripBarColor = 'loss',
  lossThresholds?: VelocityLossThresholds
): ColorToken {
  const rep = reps[index]
  if (barColor === 'zone' && rep.zone) return LIVE_STRIP_ZONE_TOKEN[rep.zone]
  const best = Math.max(...reps.map((r) => r.velocity))
  return LIVE_STRIP_LOSS_TOKEN[
    velocityLossBand(velocityLossForRep(rep.velocity, best), lossThresholds)
  ]
}

/**
 * Why one side has no bar in a column the other side filled: mid-set the rep may still come
 * (`behind`); once the set has ended it never will (`missed`).
 */
export type LiveStripGap = 'behind' | 'missed'

export function liveStripGap(state: LiveStripState): LiveStripGap {
  return state === 'set' ? 'behind' : 'missed'
}

/**
 * Filled stubs for each gap, from the ramps' mark steps (600 light, 400 dark): 3:1 or more on every
 * plane in both modes. Grey for a miss, an absence; blue for behind, a rep still pending. Neither
 * hue is one of the loss or zone bar colours.
 */
export const LIVE_STRIP_GAP_COLOR: Record<LiveStripGap, Readonly<Record<ThemeMode, string>>> = {
  behind: { light: primitiveRamps.blue[600], dark: primitiveRamps.blue[400] },
  missed: { light: greyRamp[600], dark: greyRamp[400] },
}

/**
 * The strip's bars per gap. The paper's drop shadow smudged on the light card, and a side's
 * missed rep vanished there (VW-877); a rep still to come reads apart from one that never came (VW-879).
 */
const LIVE_STRIP_GAP_BARS: Record<LiveStripGap, SetBarTreatment> = {
  behind: { emptyColor: LIVE_STRIP_GAP_COLOR.behind, lightPaper: 'soft' },
  missed: { emptyColor: LIVE_STRIP_GAP_COLOR.missed, lightPaper: 'soft' },
}

/** The SetBarTreatment the strip's bars take in `state`; one stable object per gap. */
export function liveStripBars(state: LiveStripState): SetBarTreatment {
  return LIVE_STRIP_GAP_BARS[liveStripGap(state)]
}

/** The longest rest the strip counts; a longer one reads "999s" (over 16 minutes). */
export const LIVE_STRIP_REST_MAX_SECONDS = 999

/** `full` fits "99s" in the numeral slot; `reduced` is the one smaller step that fits "999s". */
export type LiveStripRestStep = 'full' | 'reduced'

/** A duration in ms as the strip reads it: anything non-finite or negative is 0. */
export function liveStripMs(ms: number | undefined): number {
  return ms != null && Number.isFinite(ms) ? Math.max(0, ms) : 0
}

/** The rest readout: whole seconds left (rounded up) and the type step chosen by that value. */
export function liveStripRestReadout(remainingMs: number | undefined): {
  seconds: number
  step: LiveStripRestStep
} {
  const ms = liveStripMs(remainingMs)
  const seconds = Math.min(LIVE_STRIP_REST_MAX_SECONDS, Math.ceil(ms / 1000))
  return { seconds, step: seconds >= 100 ? 'reduced' : 'full' }
}

/** The planned rep count as the strip draws it: a whole number, and 0 when missing, negative or non-finite. */
export function liveStripTarget(targetReps: number): number {
  return Number.isFinite(targetReps) && targetReps > 0 ? Math.floor(targetReps) : 0
}
