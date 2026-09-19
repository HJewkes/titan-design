// VW-455 fixtures F2 to F14 from the Round 0 contract. Sessions count training days (VW-460).
// Bodyweight numbers come from voltras-mcp's band constants (cut -0.5 to -1 %/wk, gain +0.25 to
// +0.5 %/wk, hold ±2 %): the owner's store holds no weigh-ins yet, so none of them is a real reading.
import type { WholeBodySessionsRow, WholeBodyWeightRow } from './wholeBody'

function sessions(overrides: Partial<WholeBodySessionsRow>): WholeBodySessionsRow {
  return {
    status: 'on_track',
    counted: 12,
    committed: 12,
    dueByNow: 12,
    windowDays: 28,
    agingOutNext7d: 3,
    ...overrides,
  }
}

const CUT: WholeBodyWeightRow = {
  status: 'on_track',
  basis: 'On track: the week-3 weigh-in sits inside the band.',
  unit: 'lb',
  direction: 'down',
  phase: { name: 'fat-loss', weeksInPhase: 3 },
  latest: { value: 196.8, ts: '2026-09-18T07:10:00Z' },
  readingCount: 9,
  week: { index: 3, of: 8, low: 197.0, high: 194.0 },
  committed: 192.0,
  stretch: 184.0,
  rate: {
    observedPctPerWeek: -0.6,
    bandLowPctPerWeek: -0.5,
    bandHighPctPerWeek: -1,
    weeksOutsideBand: 0,
    vetoed: false,
  },
}

const HOLD: WholeBodyWeightRow = {
  status: 'on_track',
  basis: 'On track: inside the maintenance corridor.',
  unit: 'lb',
  direction: 'hold',
  phase: { name: 'maintenance', weeksInPhase: 5 },
  latest: { value: 181.2, ts: '2026-09-18T07:10:00Z' },
  readingCount: 12,
  week: { index: 5, of: 8, low: 176.4, high: 183.6 },
  committed: 176.4,
  stretch: 183.6,
  rate: {
    observedPctPerWeek: 0.1,
    bandLowPctPerWeek: null,
    bandHighPctPerWeek: null,
    weeksOutsideBand: 0,
    vetoed: false,
  },
}

export const WHOLE_BODY_SESSIONS = {
  /** F2: the owner's real history is one training day (2026-09-07), so the goal made today is 1 of 1. */
  realHistory: sessions({ counted: 1, committed: 1, dueByNow: 0, agingOutNext7d: 0 }),
  /** F3: a goal made today. Nothing is due yet; the marker must not read as done. */
  windowStarted: sessions({ counted: 12, committed: 12, dueByNow: 0, agingOutNext7d: 0 }),
  /** F4: under pace while the first window fills. */
  underPace: sessions({ status: 'behind', counted: 9, committed: 12, dueByNow: 10 }),
  /** F5: a daily commitment, past the segment limit. */
  largeCommitment: sessions({ counted: 25, committed: 28, dueByNow: 24, agingOutNext7d: 7 }),
  /** A full window at the commitment, for the both-goals case. */
  atCommitment: sessions({ counted: 12, committed: 12, dueByNow: 12, agingOutNext7d: 3 }),
} satisfies Record<string, WholeBodySessionsRow>

export const WHOLE_BODY_WEIGHT = {
  /** F6: a cut from 200 lb, week 3 of 8. */
  cut: CUT,
  /** F7: a gain from 170 lb, week 2 of 8. */
  gain: {
    ...CUT,
    basis: 'On track: the week-2 weigh-in sits inside the band.',
    direction: 'up',
    phase: { name: 'gain', weeksInPhase: 2 },
    latest: { value: 171.0, ts: '2026-09-18T07:10:00Z' },
    readingCount: 6,
    week: { index: 2, of: 8, low: 170.9, high: 171.7 },
    committed: 173.4,
    stretch: 176.8,
    rate: {
      observedPctPerWeek: 0.3,
      bandLowPctPerWeek: 0.25,
      bandHighPctPerWeek: 0.5,
      weeksOutsideBand: 0,
      vetoed: false,
    },
  },
  /** F8: a hold at 180 lb, inside its ±2 % corridor. */
  hold: HOLD,
  /** F9: the same hold, 0.5 lb over the corridor. Reads `behind` once VW-457 lands. */
  outsideHold: {
    ...HOLD,
    status: 'behind',
    basis: 'Behind: 0.5 lb over the maintenance corridor.',
    latest: { value: 184.1, ts: '2026-09-18T07:10:00Z' },
    rate: {
      observedPctPerWeek: 0.6,
      bandLowPctPerWeek: null,
      bandHighPctPerWeek: null,
      weeksOutsideBand: 1,
      vetoed: false,
    },
  },
  /** F10: slow-loss recomposition: one line, committed equals stretch. */
  slowLoss: {
    ...CUT,
    basis: 'On track: on the slow-loss line.',
    phase: { name: 'recomposition', weeksInPhase: 4, slowLoss: true },
    latest: { value: 186.3, ts: '2026-09-18T07:10:00Z' },
    week: { index: 4, of: 8, low: 186.2, high: 186.2 },
    committed: 182.4,
    stretch: 182.4,
    rate: {
      observedPctPerWeek: -0.5,
      bandLowPctPerWeek: -0.5,
      bandHighPctPerWeek: -0.5,
      weeksOutsideBand: 0,
      vetoed: false,
    },
  },
  /** F11: one weigh-in, on the start day. No rate yet. */
  oneReading: {
    ...CUT,
    status: 'calibrating',
    basis: 'Calibrating: one weigh-in so far.',
    latest: { value: 200.0, ts: '2026-09-14T07:10:00Z' },
    readingCount: 1,
    week: { index: 1, of: 8, low: 199.0, high: 198.0 },
    rate: null,
  },
  /** F12: an accepted goal with no weigh-in yet. */
  noReadings: {
    ...CUT,
    status: 'calibrating',
    basis: 'Calibrating: no weigh-in yet.',
    latest: null,
    readingCount: 0,
    week: { index: 1, of: 8, low: 199.0, high: 198.0 },
    rate: null,
  },
  /** F13: week 1 after a phase change; the review holds its verdict. */
  rateVetoed: {
    ...CUT,
    status: 'tolerated',
    basis: 'Tolerated: inside the settling window after a phase change.',
    phase: { name: 'fat-loss', weeksInPhase: 1 },
    latest: { value: 198.2, ts: '2026-09-18T07:10:00Z' },
    week: { index: 1, of: 8, low: 199.0, high: 198.0 },
    rate: {
      observedPctPerWeek: -0.9,
      bandLowPctPerWeek: -0.5,
      bandHighPctPerWeek: -1,
      weeksOutsideBand: 0,
      vetoed: true,
    },
  },
} satisfies Record<string, WholeBodyWeightRow>
