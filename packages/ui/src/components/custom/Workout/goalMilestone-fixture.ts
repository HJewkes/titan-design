import type { GoalMilestoneTileProps } from './GoalMilestoneTile'

type Scenario = Omit<GoalMilestoneTileProps, 'scale' | 'summaryStyle' | 'tipStyle'>

const block = {
  target: { metric: 'top_load_at_reps', reps: 8, load: 105, unit: 'lb' },
  weekCount: 6,
} as const

/** Weeks 1-5 of the block, so a scenario can take the prefix it has lived through. */
const WEEKS = [
  { outcome: 'on_track', reading: { reps: 8, load: 95 } },
  { outcome: 'ahead', reading: { reps: 8, load: 100 } },
  { outcome: 'none' },
  { outcome: 'missed', reading: { reps: 6, load: 97.5 } },
  { outcome: 'on_track', reading: { reps: 8, load: 100 } },
] as const

/** One 6-week bench block at the points the design round compares. */
export const GOAL_MILESTONE_SCENARIOS = {
  onTrack: {
    ...block,
    currentWeek: 4,
    latest: { reps: 8, load: 100 },
    status: 'on_track',
    weeks: WEEKS.slice(0, 3),
  },
  behind: {
    ...block,
    currentWeek: 4,
    latest: { reps: 8, load: 97.5 },
    status: 'behind',
    weeks: [WEEKS[0], WEEKS[3], WEEKS[2]],
  },
  ahead: {
    ...block,
    currentWeek: 3,
    latest: { reps: 6, load: 105 },
    status: 'ahead',
    weeks: WEEKS.slice(0, 2),
  },
  hit: {
    ...block,
    currentWeek: 5,
    latest: { reps: 8, load: 107.5 },
    status: 'ahead',
    weeks: WEEKS.slice(0, 4),
  },
  missed: {
    ...block,
    currentWeek: 7,
    latest: { reps: 8, load: 102.5 },
    status: 'behind',
    weeks: [...WEEKS, { outcome: 'missed', reading: { reps: 8, load: 102.5 } }],
  },
} satisfies Record<string, Scenario>

export type GoalMilestoneScenario = keyof typeof GOAL_MILESTONE_SCENARIOS
