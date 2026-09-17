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
          'week), led by what is still short. The gap leads with the week count under it, best ' +
          'and goal on its line, and the week cells carry each past week, with a tip card each. Open targets take ' +
          "the chart's pace colour; hit is success; missed is muted, never red. Composes " +
          '[Surface](?path=/docs/components-surface--docs) + ' +
          '[Indicator](?path=/docs/components-indicator--docs) + ' +
          '[Typography](?path=/docs/custom-typography--docs) + `GoalMilestoneWeekStrip`.\n\n' +
          'The type scale follows the measured width (`wall` from 420px). See ' +
          '[Lab/Decisions/Goal Milestone Tiles](?path=/story/lab-decisions-goal-milestone-tiles--wall).',
      },
    },
  },
  args: { ...S.onTrack, layout: 'full' },
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
    showWeeks: { control: 'boolean' },
    layout: { control: 'inline-radio', options: ['full', 'compact'] },
    scale: { control: 'select', options: [undefined, 'wall', 'phone'] },
    direction: { control: 'inline-radio', options: ['up', 'down'] },
    framed: { control: 'boolean' },
    currentWeek: { control: { type: 'number', min: 1, max: 16 } },
    weekCount: { control: { type: 'number', min: 1, max: 16 } },
    target: { control: 'object' },
    latest: { control: 'object' },
    start: { control: 'object' },
    weeks: { control: 'object' },
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
export const Compact: Story = { args: { layout: 'compact' } }

export const LossGoal: Story = {
  args: {
    target: { metric: 'bodyweight', value: 189, unit: 'lb' },
    latest: { value: 192.4 },
    start: { value: 195 },
    direction: 'down',
    weekCount: 12,
    currentWeek: 7,
    weeks: [
      { outcome: 'on_track', reading: { value: 194 } },
      { outcome: 'on_track', reading: { value: 193.2 } },
      { outcome: 'ahead', reading: { value: 192 } },
      { outcome: 'none' },
      { outcome: 'on_track', reading: { value: 192.4 } },
      { outcome: 'missed', reading: { value: 193 } },
    ],
  },
}
