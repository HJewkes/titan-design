// VW-455 fixtures for GoalPriorityIndex: F15 and the small case.
import type { GoalPriorityIndexEntry } from './GoalPriorityIndex'

/** F15: nine declared priorities, one of them tracked by nothing. */
export const NINE_PRIORITIES: GoalPriorityIndexEntry[] = [
  { name: 'Bench press', level: 'specialize', hasTarget: true },
  { name: 'Back', level: 'specialize', hasTarget: true },
  { name: 'Shoulders', level: 'specialize', hasTarget: true },
  { name: 'Squat', level: 'maintain', hasTarget: true },
  { name: 'Chest', level: 'maintain', hasTarget: true },
  { name: 'Biceps', level: 'maintain', hasTarget: true },
  { name: 'Deadlift', level: 'maintain', hasTarget: true },
  { name: 'Bodyweight', level: 'maintain', hasTarget: true },
  { name: 'Calves', level: 'deprioritize', hasTarget: false },
]

/** The small case: one lift pushed, one kept, one declared and never given a target. */
export const THREE_PRIORITIES: GoalPriorityIndexEntry[] = [
  { name: 'Bench press', level: 'specialize', hasTarget: true },
  { name: 'Squat', level: 'maintain', hasTarget: true },
  { name: 'Strength', level: 'maintain', hasTarget: false },
]
