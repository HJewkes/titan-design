import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'

import { GoalMilestoneTile } from './GoalMilestoneTile'
import { GOAL_MILESTONE_SCENARIOS as S } from './goalMilestone-fixture'
import { Surface } from '../../ui/surface'

const meta: Meta<typeof GoalMilestoneTile> = {
  title: 'Custom/Workout/GoalMilestoneTile',
  component: GoalMilestoneTile,
  tags: ['autodocs', 'status:candidate', '!status:review'],
  parameters: {
    docs: {
      description: {
        component:
          "**Molecule.** A goal's meso target (the block's committed value, due in its last " +
          'week), led by what is still short. A bar runs from the block start to the target and a ' +
          'thin week strip shows now, the goal week and how each past week went. Open targets take ' +
          "the chart's pace colour; hit is success; missed is muted, never red. Composes " +
          '[Surface](?path=/docs/components-surface--docs) + ' +
          '[Indicator](?path=/docs/components-indicator--docs) + ' +
          '[Typography](?path=/docs/custom-typography--docs) + `GoalMilestoneWeekStrip`.\n\n' +
          'The type scale follows the measured width (`wall` from 420px). The past-week ' +
          'treatment (`outcomeStyle`) is open; see ' +
          '[Lab/Decisions/Goal Milestone Tiles](?path=/story/lab-decisions-goal-milestone-tiles--wall-cells).',
      },
    },
  },
  args: { ...S.onTrack, outcomeStyle: 'cells', layout: 'full' },
  argTypes: {
    status: {
      control: 'select',
      options: [
        'on_track',
        'ahead',
        'behind',
        'tolerated',
        'deload_week',
        'calibrating',
        'stalled',
      ],
    },
    state: { control: 'select', options: [undefined, 'upcoming', 'hit', 'missed'] },
    outcomeStyle: { control: 'inline-radio', options: ['cells', 'dots'] },
    layout: { control: 'inline-radio', options: ['full', 'compact'] },
    scale: { control: 'select', options: [undefined, 'wall', 'phone'] },
    direction: { control: 'inline-radio', options: ['up', 'down'] },
    framed: { control: 'boolean' },
    currentWeek: { control: { type: 'number', min: 1, max: 16 } },
    goalWeek: { control: { type: 'number', min: 1, max: 16 } },
    weekCount: { control: { type: 'number', min: 1, max: 16 } },
    target: { control: 'object' },
    latest: { control: 'object' },
    start: { control: 'object' },
    weekOutcomes: { control: 'object' },
  },
  decorators: [
    (Story) => (
      <Surface level="base" className="p-gutter-md">
        <View style={{ width: 480 }}>
          <Story />
        </View>
      </Surface>
    ),
  ],
}
export default meta

type Story = StoryObj<typeof GoalMilestoneTile>

export const OnTrack: Story = {}
export const Behind: Story = { args: S.behind }
export const Ahead: Story = { args: S.ahead }
export const Hit: Story = { args: S.hit }
export const Missed: Story = { args: S.missed }
export const Dots: Story = { args: { outcomeStyle: 'dots' } }
export const Compact: Story = { args: { layout: 'compact' } }

export const LossGoal: Story = {
  args: {
    target: { metric: 'bodyweight', value: 189, unit: 'lb' },
    latest: { value: 192.4 },
    start: { value: 195 },
    direction: 'down',
    goalWeek: 12,
    weekCount: 12,
    currentWeek: 7,
    weekOutcomes: ['on_track', 'on_track', 'ahead', 'none', 'on_track', 'missed'],
  },
}
