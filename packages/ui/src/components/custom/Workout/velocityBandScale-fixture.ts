import type { VelocityBandScale } from './VelocityBandScale'

/**
 * Band-scale fixtures, each hand-copied from what the effort resolver returns for the named set
 * (workout-analytics `resolveSetEffort`, policy `effort/v1`). Velocities are mean concentric m/s.
 * Every label is a PLACEHOLDER for the owner's wording; the SPA supplies the real strings.
 *
 * Tier b profile used throughout: velocity at RIR 0 is 0.30 m/s and each RIR adds 0.06 m/s, so the
 * band edges (RIR 2.5, 1.5, 0.5) sit at 0.45, 0.39 and 0.33 m/s and an RPE 9 cap (RIR 1) at 0.36.
 */
export interface BandScaleFixture {
  /** What the set is, for the story frame's eyebrow. */
  title: string
  velocities: number[]
  scale: VelocityBandScale
}

const TIER_B_EDGES = [0.45, 0.39, 0.33] as const

/** Ten reps slowing from 0.66 to 0.37 m/s. */
const TEN_REPS = [0.66, 0.64, 0.61, 0.58, 0.55, 0.52, 0.49, 0.46, 0.43, 0.4]
/** Tier b bands for {@link TEN_REPS}: RIR 6 down to 1.7. */
const TEN_REPS_EFFORT = [0, 0, 0, 0, 0, 0, 0, 0, 1, 1] as const
/** Tier a bands for {@link TEN_REPS}: thirds of a 30% reference loss from the 0.66 best. */
const TEN_REPS_LOSS = [0, 0, 0, 1, 1, 2, 2, 3, 3, 3] as const

const repRange8to12 = {
  role: 'goal',
  axis: 'rep',
  condition: 'reps',
  repsLow: 8,
  repsHigh: 12,
  label: '8 to 12',
  reached: false,
} as const

const effortCapRpe9 = {
  role: 'guard',
  axis: 'velocity',
  condition: 'effort',
  velocityMps: 0.36,
  band: 2,
  label: 'RPE 9',
  reached: false,
} as const

/** Tier a loss line: best rep 0.66 x (1 - 0.30). */
const lossGuardVl30 = {
  role: 'guard',
  axis: 'velocity',
  condition: 'velocity_loss',
  velocityMps: 0.462,
  band: null,
  label: 'VL 30%',
  reached: true,
} as const

export const TIER_B_REP_RANGE_ONE_GUARD: BandScaleFixture = {
  title: 'Tier b · 8 to 12 · RPE 9 cap',
  velocities: TEN_REPS,
  scale: {
    meaning: 'effort',
    repBands: TEN_REPS_EFFORT,
    edgesMps: TIER_B_EDGES,
    markers: { goal: repRange8to12, guards: [effortCapRpe9] },
    cue: { atRep: null, repsPast: 0 },
  },
}

export const TIER_A_REP_RANGE_LOSS_GUARD: BandScaleFixture = {
  title: 'Tier a · 8 to 12 · planned intent VL 30%',
  velocities: TEN_REPS,
  scale: {
    meaning: 'velocity_loss',
    repBands: TEN_REPS_LOSS,
    markers: {
      goal: repRange8to12,
      guards: [{ ...lossGuardVl30, firedCue: true }],
    },
    cue: { atRep: 8, repsPast: 2 },
  },
}

/** Tier b with a trusted profile and a typed loss percent: both guards live, effort first. */
export const TIER_B_TWO_GUARDS: BandScaleFixture = {
  title: 'Tier b · 8 to 12 · RPE 9 cap and a typed VL 30%',
  velocities: TEN_REPS,
  scale: {
    meaning: 'effort',
    repBands: TEN_REPS_EFFORT,
    edgesMps: TIER_B_EDGES,
    markers: {
      goal: repRange8to12,
      guards: [effortCapRpe9, { ...lossGuardVl30, firedCue: true }],
    },
    cue: { atRep: 8, repsPast: 2 },
  },
}

/** The lifter went past the rep-count cue: 10 of 8 to 10, then two more. */
export const TIER_B_PAST_CUE: BandScaleFixture = {
  title: 'Tier b · 8 to 10 · two reps past the cue',
  velocities: [...TEN_REPS, 0.38, 0.35],
  scale: {
    meaning: 'effort',
    repBands: [...TEN_REPS_EFFORT, 1, 2],
    edgesMps: TIER_B_EDGES,
    markers: {
      goal: { ...repRange8to12, repsHigh: 10, label: '8 to 10', reached: true, firedCue: true },
      guards: [effortCapRpe9],
    },
    cue: { atRep: 10, repsPast: 2 },
  },
}

/** A target_rpe row before a profile exists: the rep range cues, and the label says so. */
export const TIER_A_TARGET_RPE_FALLBACK: BandScaleFixture = {
  title: 'Tier a · RPE 8 target, cueing by reps',
  velocities: TEN_REPS.slice(0, 7),
  scale: {
    meaning: 'velocity_loss',
    repBands: TEN_REPS_LOSS.slice(0, 7),
    markers: {
      goal: { ...repRange8to12, label: 'RPE 8 · by reps until calibrated' },
      guards: [],
    },
    cue: { atRep: null, repsPast: 0 },
  },
}

/** Tier b, the last reps read below the fitted RIR span, so their bands are low confidence. */
export const TIER_B_LOW_CONFIDENCE: BandScaleFixture = {
  title: 'Tier b · last two reps outside the fitted range',
  velocities: [...TEN_REPS.slice(0, 8), 0.34, 0.31],
  scale: {
    meaning: 'effort',
    repBands: [0, 0, 0, 0, 0, 0, 0, 0, 2, 3],
    repConfidence: ['high', 'high', 'high', 'high', 'high', 'high', 'high', 'high', 'low', 'low'],
    edgesMps: TIER_B_EDGES,
    markers: {
      goal: repRange8to12,
      guards: [{ ...effortCapRpe9, reached: true, firedCue: true }],
    },
    cue: { atRep: 9, repsPast: 1 },
  },
}

/** A setting changed on rep 6: bands stop from there, the rep count carries on. */
export const TIER_B_SUSPENDED_TAIL: BandScaleFixture = {
  title: 'Tier b · setting changed on rep 6',
  velocities: [0.66, 0.64, 0.61, 0.58, 0.55, 0.71, 0.69, 0.66, 0.63],
  scale: {
    meaning: 'effort',
    repBands: [0, 0, 0, 0, 0, null, null, null, null],
    edgesMps: TIER_B_EDGES,
    markers: { goal: repRange8to12, guards: [effortCapRpe9] },
    cue: { atRep: null, repsPast: 0 },
    settingChangedAtRep: 6,
    settingChangedLabel: 'Setting changed',
  },
}

/** Tier a with no loss number resolved: the rep count is the only cue, and there is no line. */
export const TIER_A_NO_GUARD: BandScaleFixture = {
  title: 'Tier a · 8 to 12 · no loss number',
  velocities: TEN_REPS.slice(0, 5),
  scale: {
    meaning: 'velocity_loss',
    repBands: TEN_REPS_LOSS.slice(0, 5),
    markers: { goal: repRange8to12, guards: [] },
    cue: { atRep: null, repsPast: 0 },
  },
}

/** Degenerate: the set has not started; the zone shows as empty places. */
export const EMPTY_SET: BandScaleFixture = {
  title: 'No reps yet · 8 to 12',
  velocities: [],
  scale: {
    meaning: 'velocity_loss',
    repBands: [],
    markers: { goal: repRange8to12, guards: [] },
    cue: null,
  },
}

export const BAND_SCALE_FIXTURES = {
  tierBRepRangeOneGuard: TIER_B_REP_RANGE_ONE_GUARD,
  tierARepRangeLossGuard: TIER_A_REP_RANGE_LOSS_GUARD,
  tierBTwoGuards: TIER_B_TWO_GUARDS,
  tierBPastCue: TIER_B_PAST_CUE,
  tierATargetRpeFallback: TIER_A_TARGET_RPE_FALLBACK,
  tierBLowConfidence: TIER_B_LOW_CONFIDENCE,
  tierBSuspendedTail: TIER_B_SUSPENDED_TAIL,
  tierANoGuard: TIER_A_NO_GUARD,
  emptySet: EMPTY_SET,
} as const

export type BandScaleFixtureKey = keyof typeof BAND_SCALE_FIXTURES
