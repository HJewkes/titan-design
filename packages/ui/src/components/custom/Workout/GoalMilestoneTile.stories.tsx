import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'

import { GoalMilestoneTile } from './GoalMilestoneTile'
import { Surface } from '../../ui/surface'

const meta: Meta<typeof GoalMilestoneTile> = {
  title: 'Custom/Workout/GoalMilestoneTile',
  component: GoalMilestoneTile,
  tags: ['autodocs', 'status:candidate', '!status:review'],
  parameters: {
    docs: {
      description: {
        component:
          "**Molecule.** A lifter's next milestone for one goal: the target, when it is due, " +
          'and how far away the lifter is. Data sits on a lowered plane inside a raised card, ' +
          'and the state is carried by one colour. Composes ' +
          '[Surface](?path=/docs/components-surface--docs) + ' +
          '[Indicator](?path=/docs/components-indicator--docs) + ' +
          '[Typography](?path=/docs/custom-typography--docs) + `GoalMilestoneWeekStrip`.\n\n' +
          'The `variant` is an open question for VW-385 unit 3; see ' +
          '[Lab/Decisions/Goal Milestone Tiles](?path=/story/lab-decisions-goal-milestone-tiles--compare).',
      },
    },
  },
  args: {
    variant: 'progress',
    milestone: { reps: 8, load: 105, unit: 'lb', goalWeek: 8 },
    current: { reps: 8, load: 100 },
    start: { reps: 8, load: 95 },
    currentWeek: 5,
    totalWeeks: 10,
    status: 'on_track',
    density: 'comfortable',
    framed: true,
  },
  argTypes: {
    variant: { control: 'inline-radio', options: ['numeric', 'progress', 'timeline', 'gap'] },
    state: {
      control: 'select',
      options: [undefined, 'upcoming', 'due_this_week', 'hit', 'missed'],
    },
    status: {
      control: 'select',
      options: [
        undefined,
        'on_track',
        'ahead',
        'behind',
        'tolerated',
        'deload_week',
        'calibrating',
        'stalled',
      ],
    },
    density: { control: 'inline-radio', options: ['comfortable', 'compact'] },
    framed: { control: 'boolean' },
    currentWeek: { control: { type: 'number', min: 1, max: 16 } },
    totalWeeks: { control: { type: 'number', min: 1, max: 16 } },
    milestone: { control: 'object' },
    current: { control: 'object' },
    start: { control: 'object' },
  },
  decorators: [
    (Story) => (
      <Surface level="base" className="p-gutter-md">
        <View style={{ width: 360 }}>
          <Story />
        </View>
      </Surface>
    ),
  ],
}
export default meta

type Story = StoryObj<typeof GoalMilestoneTile>

export const Default: Story = {}

export const Hit: Story = { args: { current: { reps: 8, load: 105 }, currentWeek: 7 } }

export const Missed: Story = { args: { current: { reps: 8, load: 102.5 }, currentWeek: 9 } }

export const CompactUnframed: Story = {
  args: { density: 'compact', framed: false, variant: 'numeric' },
}
