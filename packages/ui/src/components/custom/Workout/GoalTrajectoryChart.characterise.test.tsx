import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import { composeStories } from '@storybook/react'
import * as stories from './GoalTrajectoryChart.stories'
import { GoalTrajectoryChart, type GoalTrajectoryChartProps } from './GoalTrajectoryChart'
import { calibratingGoalAt } from './goalTrajectoryCalibratingFixture'
import { Surface } from '../../ui/surface'

const composed = Object.entries(composeStories(stories))

const onTrack = stories.OnTrack.args as GoalTrajectoryChartProps
const lossGoal = stories.LossGoalBodyweight.args as GoalTrajectoryChartProps
const calibrating = {
  ...calibratingGoalAt('above'),
  width: 360,
  height: 220,
} as GoalTrajectoryChartProps

const fixtures: Array<[string, GoalTrajectoryChartProps]> = [
  ['y-axis labels', { ...onTrack, yAxisLabels: true }],
  ['named rule labels', { ...onTrack, ruleLabelText: 'named' }],
  ['no rule labels', { ...onTrack, ruleLabelText: 'none' }],
  ['no week labels', { ...onTrack, showWeekLabels: false }],
  ['right reference labels', { ...onTrack, referenceLabelSide: 'right' }],
  [
    'calibrating with a note and a next target',
    {
      ...calibrating,
      calibratingNote: 'Waiting on two more matched sessions',
      nextTarget: { weekIndex: 3, value: 105, label: 'next week: 105 x 8' },
    },
  ],
  ['goal met', { ...onTrack, status: 'goal_met' }],
  ['beyond goal', { ...onTrack, status: 'beyond_goal' }],
  [
    'loss goal past committed',
    {
      ...lossGoal,
      status: 'behind',
      actuals: [
        { ts: '2026-09-08', value: 198 },
        { ts: '2026-09-15', value: 192 },
      ],
    },
  ],
]

const rampWeeks = Array.from({ length: 8 }, (_, i) => ({ weekIndex: i + 1, low: 100 + i * 2.5 }))
const overhanging: GoalTrajectoryChartProps = {
  ...calibratingGoalAt('start'),
  expected: rampWeeks.map((w) => ({ ...w, high: w.low })),
  weeks: rampWeeks.map((w) => ({ index: w.weekIndex })),
  committed: 117.5,
  stretch: 117.5,
  actuals: Array.from({ length: 8 }, (_, i) => ({ weekIndex: i + 1, value: 90 })),
  width: 296,
  height: 220,
} as GoalTrajectoryChartProps

const coarsePointer = () => ({
  matches: true,
  addEventListener: () => undefined,
  removeEventListener: () => undefined,
})

describe('GoalTrajectoryChart characterisation', () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: new Date('2026-01-01T00:00:00Z') })
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  describe.each(['dark', 'light'] as const)('on a %s surface', (theme) => {
    it.each(composed)('renders the %s story unchanged', (_name, Story) => {
      const { container } = render(
        <Surface theme={theme}>
          <Story />
        </Surface>
      )
      expect(container).toMatchSnapshot()
    })

    it.each(fixtures)('renders the %s fixture unchanged', (_name, args) => {
      const { container } = render(
        <Surface theme={theme}>
          <GoalTrajectoryChart {...args} />
        </Surface>
      )
      expect(container).toMatchSnapshot()
    })

    it('renders a target hung under the plot unchanged', () => {
      vi.stubGlobal('matchMedia', coarsePointer)
      const { container } = render(
        <Surface theme={theme}>
          <GoalTrajectoryChart {...overhanging} animate={false} />
        </Surface>
      )
      expect(container).toMatchSnapshot()
    })
  })
})
