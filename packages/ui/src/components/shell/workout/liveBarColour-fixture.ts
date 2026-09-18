import type { VelocityLossThresholds } from '../../custom/Workout/VelocityStrip'
import type { LiveStripRep, LiveStripZone } from './liveStripModel'

/** One set of realistic cable velocities, with the loss (%) at which its intent calls "stop". */
export interface IntentSet {
  intent: 'Strength' | 'Power' | 'Hypertrophy'
  exerciseName: string
  loadLabel: string
  stopPct: number
  targetReps: number
  velocities: number[]
}

// VW-429 colour round: each set ends at or just past its intent's stop.
export const INTENT_SETS: readonly IntentSet[] = [
  {
    intent: 'Strength',
    exerciseName: 'Cable Chest Press',
    loadLabel: '140 lb',
    stopPct: 20,
    targetReps: 8,
    velocities: [0.52, 0.51, 0.49, 0.46, 0.43, 0.4],
  },
  {
    intent: 'Power',
    exerciseName: 'Cable Push Press',
    loadLabel: '90 lb',
    stopPct: 10,
    targetReps: 6,
    velocities: [0.95, 0.94, 0.91, 0.88, 0.84],
  },
  {
    intent: 'Hypertrophy',
    exerciseName: 'Cable Row',
    loadLabel: '110 lb',
    stopPct: 30,
    targetReps: 10,
    velocities: [0.62, 0.61, 0.58, 0.55, 0.51, 0.47, 0.44, 0.42],
  },
]

/**
 * A consumer's stand-in threshold source: thirds of the stop. titan takes thresholds as given; the
 * app will replace this with a research-backed one.
 */
export const thresholdsFromStop = (stopPct: number): VelocityLossThresholds => [
  stopPct / 3,
  (stopPct * 2) / 3,
  stopPct,
]

// workout-analytics' default compound bands (0.35 / 0.5 / 0.75 / 1.0 m/s).
function zoneOf(velocity: number): LiveStripZone {
  if (velocity < 0.35) return 'grinding'
  if (velocity < 0.5) return 'maximalStrength'
  if (velocity < 0.75) return 'strengthSpeed'
  if (velocity < 1.0) return 'power'
  return 'speed'
}

export const stripRepsOf = (set: IntentSet): LiveStripRep[] =>
  set.velocities.map((velocity) => ({ velocity, zone: zoneOf(velocity) }))
