import type { GoalMilestoneTileProps } from './GoalMilestoneTile'

type Scenario = Omit<GoalMilestoneTileProps, 'scale' | 'outcomeStyle'>

const block = {
  target: { metric: 'top_load_at_reps', reps: 8, load: 105, unit: 'lb' },
  goalWeek: 6,
  weekCount: 6,
  start: { reps: 8, load: 95 },
} as const

/** One 6-week bench block at the points the design round compares; every outcome appears. */
export const GOAL_MILESTONE_SCENARIOS = {
  onTrack: {
    ...block,
    currentWeek: 4,
    latest: { reps: 8, load: 100 },
    status: 'on_track',
    weekOutcomes: ['on_track', 'ahead', 'none'],
  },
  behind: {
    ...block,
    currentWeek: 4,
    latest: { reps: 8, load: 97.5 },
    status: 'behind',
    weekOutcomes: ['on_track', 'missed', 'missed'],
  },
  ahead: {
    ...block,
    currentWeek: 3,
    latest: { reps: 6, load: 105 },
    status: 'ahead',
    weekOutcomes: ['ahead', 'ahead'],
  },
  hit: {
    ...block,
    currentWeek: 5,
    latest: { reps: 8, load: 107.5 },
    status: 'ahead',
    weekOutcomes: ['on_track', 'ahead', 'ahead', 'on_track'],
  },
  missed: {
    ...block,
    currentWeek: 7,
    latest: { reps: 8, load: 102.5 },
    status: 'behind',
    weekOutcomes: ['on_track', 'none', 'missed', 'on_track', 'missed', 'missed'],
  },
} satisfies Record<string, Scenario>

export type GoalMilestoneScenario = keyof typeof GOAL_MILESTONE_SCENARIOS
