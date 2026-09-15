import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'

import { GoalMuscleCard } from './GoalMuscleCard'
import { MuscleGroup } from './muscleTaxonomy'
import { Surface } from '../../ui/surface'

const meta: Meta<typeof GoalMuscleCard> = {
  title: 'Custom/Workout/GoalMuscleCard',
  component: GoalMuscleCard,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          "**Organism.** A muscle priority's goal state at card scale — the figure " +
          'with this muscle lit by its status, the lifts-on-track count beneath it as a ' +
          'label, and every contributing lift to its right. Maps 1:1 onto a row of the ' +
          '`#/goals` muscle-rollup panel plus the targets under that priority (VW-386). ' +
          'Composes [Card](?path=/docs/components-card--docs) + ' +
          '[Pill](?path=/docs/components-pill--docs) / ' +
          '[Indicator](?path=/docs/components-indicator--docs) + ' +
          '[Typography](?path=/docs/custom-typography--docs) + ' +
          '[MuscleGlyph](?path=/docs/custom-workout-muscleglyph--docs).\n\n' +
          'A **sibling** of [GoalLiftCard](?path=/docs/custom-workout-goalliftcard--docs), ' +
          'not a variant: the two share only `name` and `status`, and this one pulls ' +
          '`react-native-body-highlighter`, so it ships from the `/bodymap` subpath.\n\n' +
          "A lift row prints its own week **only** when that lift's `goalWeek` differs " +
          'from `commonGoalWeek` — it is a per-target due week, so on most muscles every ' +
          'row matches and the week disappears.',
      },
    },
  },
  args: {
    name: 'BACK',
    muscle: MuscleGroup.UPPER_BACK,
    side: 'back',
    status: 'ahead',
    liftsOnTrack: 3,
    liftsTotal: 3,
    commonGoalWeek: 5,
    density: 'comfortable',
    lifts: [
      { name: 'Barbell row', status: 'on_track', reps: 10, load: 100, unit: 'lb', goalWeek: 5 },
      {
        name: 'Weighted pull up',
        status: 'deload_week',
        reps: 6,
        load: 30,
        unit: 'lb',
        goalWeek: 5,
      },
      { name: 'Lat pulldown', status: 'ahead', reps: 12, load: 70, unit: 'lb', goalWeek: 7 },
    ],
  },
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
    side: { control: 'select', options: ['front', 'back'] },
    density: { control: 'select', options: ['comfortable', 'compact'] },
    muscle: { control: 'select', options: Object.values(MuscleGroup) },
    lifts: { control: 'object' },
    commonGoalWeek: { control: 'number' },
  },
  decorators: [
    (Story) => (
      <Surface level="base" className="p-gutter-md">
        <View style={{ width: 459 }}>
          <Story />
        </View>
      </Surface>
    ),
  ],
}
export default meta

type Story = StoryObj<typeof GoalMuscleCard>

/** The 4-up cell at 1920. "Lat pulldown" is due a different week, so it alone prints one. */
export const Default: Story = {}

/** Every lift due in the same week — the common case, where no row prints a week. */
export const NoWeekVariance: Story = {
  args: {
    lifts: [
      { name: 'Barbell row', status: 'on_track', reps: 10, load: 100, unit: 'lb', goalWeek: 5 },
      { name: 'Lat pulldown', status: 'ahead', reps: 12, load: 70, unit: 'lb', goalWeek: 5 },
    ],
    liftsTotal: 2,
    liftsOnTrack: 2,
  },
}

/** One contributing lift — the case that decided top-aligned rows over centred. */
export const SingleLift: Story = {
  args: {
    name: 'SHOULDERS',
    muscle: MuscleGroup.SIDE_DELTS,
    side: 'front',
    status: 'calibrating',
    liftsOnTrack: 0,
    liftsTotal: 1,
    commonGoalWeek: 8,
    lifts: [
      { name: 'Overhead press', status: 'calibrating', reps: 8, load: 65, unit: 'lb', goalWeek: 8 },
    ],
  },
}
