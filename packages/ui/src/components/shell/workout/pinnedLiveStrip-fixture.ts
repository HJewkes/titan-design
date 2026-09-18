import type { PinnedLiveStripProps } from './PinnedLiveStrip'
import type { LiveStripRep } from './liveStripModel'

// Round-1 mock numbers (VW-429), zoned by workout-analytics' compound table (0.35/0.5/0.75/1.0).
const SET_REPS: LiveStripRep[] = [
  { velocity: 0.84, zone: 'power' },
  { velocity: 0.82, zone: 'power' },
  { velocity: 0.79, zone: 'power' },
  { velocity: 0.77, zone: 'power' },
  { velocity: 0.74, zone: 'strengthSpeed' },
]

const REST_REPS: LiveStripRep[] = [
  { velocity: 0.86, zone: 'power' },
  { velocity: 0.84, zone: 'power' },
  { velocity: 0.83, zone: 'power' },
  { velocity: 0.8, zone: 'power' },
  { velocity: 0.78, zone: 'power' },
  { velocity: 0.76, zone: 'power' },
  { velocity: 0.73, zone: 'strengthSpeed' },
  { velocity: 0.71, zone: 'strengthSpeed' },
]

const FATIGUE_REPS: LiveStripRep[] = [
  { velocity: 0.84, zone: 'power' },
  { velocity: 0.8, zone: 'power' },
  { velocity: 0.74, zone: 'strengthSpeed' },
  { velocity: 0.67, zone: 'strengthSpeed' },
  { velocity: 0.61, zone: 'strengthSpeed' },
  { velocity: 0.55, zone: 'strengthSpeed' },
]

// A 12-rep target set, where the rep count and a long rest both press on the numeral slot.
const TWO_DIGIT_REPS: LiveStripRep[] = Array.from({ length: 11 }, (_, i) => ({
  velocity: 0.9 - i * 0.03,
  zone: i < 6 ? 'power' : 'strengthSpeed',
}))

const BASE = {
  exerciseName: 'Cable Chest Press',
  setCount: 3,
  loadLabel: '140 lb',
  targetReps: 8,
}

export type LiveStripScenario =
  | 'set'
  | 'rest'
  | 'fatigue'
  | 'idle'
  | 'longName'
  | 'setTwoDigit'
  | 'restTwoDigit'

export const LIVE_STRIP_SCENARIOS: Record<LiveStripScenario, PinnedLiveStripProps> = {
  set: { ...BASE, state: 'set', setNumber: 2, reps: SET_REPS },
  rest: {
    ...BASE,
    state: 'rest',
    setNumber: 3,
    reps: REST_REPS,
    restRemainingMs: 47_000,
    restDurationMs: 90_000,
  },
  fatigue: { ...BASE, state: 'set', setNumber: 2, reps: FATIGUE_REPS, isFatigued: true },
  setTwoDigit: { ...BASE, state: 'set', setNumber: 2, targetReps: 12, reps: TWO_DIGIT_REPS },
  restTwoDigit: {
    ...BASE,
    state: 'rest',
    setNumber: 3,
    targetReps: 12,
    reps: TWO_DIGIT_REPS,
    restRemainingMs: 150_000,
    restDurationMs: 180_000,
  },
  idle: { ...BASE, state: 'idle', setNumber: 2, reps: [] },
  longName: {
    ...BASE,
    exerciseName: 'Single-Arm Half-Kneeling Cable Row',
    state: 'set',
    setNumber: 2,
    reps: SET_REPS,
  },
}
