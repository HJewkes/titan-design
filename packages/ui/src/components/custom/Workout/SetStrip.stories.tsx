import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { SetStrip, type SetStripSet } from './SetStrip'

/**
 * `SetStrip` — the per-set segmented performance strip. One continuous bar per
 * set (rep intensities as butted color segments, no rep gaps); sets separated by
 * a fixed gap. Colors are the real titan ramp pins (red-600 · orange-400 ·
 * amber-300 · green-300).
 */
const meta: Meta<typeof SetStrip> = {
  title: 'Workout/SetStrip',
  component: SetStrip,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '**Molecule.** The per-set segmented performance strip — one bar per set, rep ' +
          'intensities as butted ramp-pin segments (no rep gaps), active set pulses. Composes ' +
          '[SetBar](?path=/docs/workout-setbar--docs) × N. ' +
          'Used-by ↑ [ExerciseCardHeading](?path=/docs/workout-exercisecardheading--docs).',
      },
    },
  },
  argTypes: {
    height: { control: { type: 'range', min: 2, max: 16, step: 1 } },
  },
  decorators: [
    (Story) => (
      <View style={{ width: 210, padding: 16, backgroundColor: '#131313' }}>
        <Story />
      </View>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof SetStrip>

const decay = (n: number, start: number, span = 0.4): number[] =>
  Array.from({ length: n }, (_, r) => +(start - (span * r) / Math.max(1, n - 1)).toFixed(3))

export const Completed: Story = {
  args: {
    height: 8,
    sets: [1.0, 0.9, 0.8, 0.7, 0.6].map(
      (s): SetStripSet => ({ status: 'done', velocities: decay(8, s) })
    ),
  },
}

export const InProgress: Story = {
  args: {
    height: 8,
    sets: [
      { status: 'done', velocities: decay(10, 0.72) },
      { status: 'active', velocities: decay(5, 0.62), planned: 10 },
      { status: 'todo', planned: 10 },
    ],
  },
  parameters: {
    docs: { description: { story: 'Active set: performed reps pulse; the remainder is greyed.' } },
  },
}

export const Upcoming: Story = {
  args: {
    height: 8,
    sets: [1, 2, 3, 4, 5].map((): SetStripSet => ({ status: 'todo', planned: 20 })),
  },
}

export const ShortStrip: Story = {
  args: { ...Completed.args, height: 4 },
  parameters: {
    docs: { description: { story: 'The 4px height alternative (default is 8px).' } },
  },
}
