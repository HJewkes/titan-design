import type { DualPinnedLiveStripProps, LiveStripSlot } from './DualPinnedLiveStrip'
import type { LiveStripRep } from './liveStripModel'

// Synthetic sets in the single strip's round-1 range (VW-429), one per side.
function reps(velocities: readonly number[]): LiveStripRep[] {
  return velocities.map((velocity) => ({
    velocity,
    zone: velocity >= 0.75 ? 'power' : 'strengthSpeed',
  }))
}

const LEFT_SET = reps([0.84, 0.82, 0.79, 0.77, 0.74])
const RIGHT_SET = reps([0.81, 0.78, 0.76, 0.71])
const LEFT_DONE = reps([0.86, 0.84, 0.83, 0.8, 0.78, 0.76, 0.73, 0.71])
const RIGHT_DONE = reps([0.83, 0.81, 0.78, 0.76, 0.72, 0.69, 0.66])
const RIGHT_FATIGUED = reps([0.82, 0.76, 0.69, 0.61, 0.55])
const LEFT_FATIGUED = reps([0.84, 0.77, 0.7, 0.63, 0.58, 0.54])
const LEFT_TWELVE = Array.from({ length: 11 }, (_, i) => 0.9 - i * 0.03)
const RIGHT_TWELVE = Array.from({ length: 9 }, (_, i) => 0.88 - i * 0.035)

const BASE = {
  exerciseName: 'Cable Chest Press',
  setCount: 3,
  targetReps: 8,
}

const ARMS = { left: 'Left arm', right: 'Right arm' }
const OWNER = { left: 'Henry L', right: 'Henry R' }
// The longest name in the set, about 20 characters, as a lifter might name a unit.
const LONG = { left: 'Garage Voltra North', right: 'Garage Voltra South' }

function slot(label: string | undefined, loadLabel: string, slotReps: LiveStripRep[]) {
  return { label, loadLabel, reps: slotReps } satisfies LiveStripSlot
}

export type DualStripScenario =
  | 'set'
  | 'rest'
  | 'longNames'
  | 'noNames'
  | 'fatigueRight'
  | 'fatigueBoth'
  | 'beforeDrop'
  | 'rightDropped'

export const DUAL_STRIP_SCENARIOS: Record<DualStripScenario, DualPinnedLiveStripProps> = {
  set: {
    ...BASE,
    state: 'set',
    setNumber: 2,
    left: slot(ARMS.left, '145 lb', LEFT_SET),
    right: slot(ARMS.right, '140 lb', RIGHT_SET),
  },
  rest: {
    ...BASE,
    state: 'rest',
    setNumber: 3,
    restRemainingMs: 47_000,
    restDurationMs: 90_000,
    left: slot(ARMS.left, '145 lb', LEFT_DONE),
    right: slot(ARMS.right, '140 lb', RIGHT_DONE),
  },
  longNames: {
    ...BASE,
    exerciseName: 'Single-Arm Half-Kneeling Cable Row',
    state: 'set',
    setNumber: 2,
    targetReps: 12,
    left: slot(LONG.left, '62.5 lb', reps(LEFT_TWELVE)),
    right: slot(LONG.right, '57.5 lb', reps(RIGHT_TWELVE)),
  },
  noNames: {
    ...BASE,
    state: 'set',
    setNumber: 1,
    left: slot(undefined, '145 lb', reps([0.85, 0.83])),
    right: slot(undefined, '140 lb', []),
  },
  fatigueRight: {
    ...BASE,
    state: 'set',
    setNumber: 3,
    left: slot(OWNER.left, '145 lb', LEFT_SET),
    right: { ...slot(OWNER.right, '140 lb', RIGHT_FATIGUED), isFatigued: true },
  },
  fatigueBoth: {
    ...BASE,
    state: 'set',
    setNumber: 3,
    left: { ...slot(OWNER.left, '145 lb', LEFT_FATIGUED), isFatigued: true },
    right: { ...slot(OWNER.right, '140 lb', RIGHT_FATIGUED), isFatigued: true },
  },
  beforeDrop: {
    ...BASE,
    state: 'set',
    setNumber: 2,
    left: slot(OWNER.left, '145 lb', LEFT_SET.slice(0, 3)),
    right: slot(OWNER.right, '140 lb', RIGHT_SET.slice(0, 3)),
  },
  rightDropped: {
    ...BASE,
    state: 'set',
    setNumber: 2,
    left: slot(OWNER.left, '145 lb', LEFT_SET),
    right: { ...slot(OWNER.right, '140 lb', RIGHT_SET.slice(0, 3)), isConnected: false },
  },
}
