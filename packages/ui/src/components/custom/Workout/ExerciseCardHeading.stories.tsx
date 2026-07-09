import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { ExerciseCardHeading } from './ExerciseCardHeading'
import type { SetStripSet } from './SetStrip'

/**
 * `ExerciseCardHeading` — the complete, standalone session-rail heading: an
 * `ExerciseHeading` info block over its per-set `SetStrip`. This is the unit the rail
 * lists; it is independent of `ExerciseCard` (whose `state="rail"` delegates here).
 * An empty `setStates` renders no strip.
 */
const meta: Meta<typeof ExerciseCardHeading> = {
  title: 'Workout/ExerciseCardHeading',
  component: ExerciseCardHeading,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '**Molecule.** The complete standalone session-rail heading. Composes ' +
          '[ExerciseHeading](?path=/docs/workout-exerciseheading--docs) + ' +
          '[SetStrip](?path=/docs/workout-setstrip--docs). ' +
          'Used-by ↑ [SessionRail](?path=/docs/shell-sessionrail--docs); ' +
          '[ExerciseCard](?path=/docs/workout-exercisecard--docs) `state="rail"` delegates here.',
      },
    },
  },
  argTypes: {
    unit: { control: 'select', options: ['lbs', 'kg'] },
    indicator: { control: 'select', options: [undefined, 'pr', 'issue', 'info'] },
    stripHeight: { control: { type: 'range', min: 2, max: 16, step: 1 } },
    dimmed: { control: 'boolean' },
    onPress: { action: 'press' },
  },
  decorators: [
    (Story) => (
      <View style={{ width: 246, backgroundColor: '#131313' }}>
        <Story />
      </View>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof ExerciseCardHeading>

const decay = (n: number, start: number, span = 0.4): number[] =>
  Array.from({ length: n }, (_, r) => +(start - (span * r) / Math.max(1, n - 1)).toFixed(3))

const inProgress: SetStripSet[] = [
  { status: 'done', velocities: decay(10, 0.72) },
  { status: 'active', velocities: decay(5, 0.62), planned: 10 },
  { status: 'todo', planned: 10 },
]

export const Default: Story = {
  args: {
    name: 'Cable Chest Press',
    sets: 3,
    reps: 10,
    load: 90,
    unit: 'lbs',
    tempo: [2, 1, 2, 0],
    indicator: 'info',
    setStates: inProgress,
    stripHeight: 8,
  },
}

export const Dimmed: Story = {
  args: {
    ...Default.args,
    dimmed: true,
    setStates: [1, 2, 3].map((): SetStripSet => ({ status: 'todo', planned: 18 })),
  },
  parameters: {
    docs: { description: { story: 'A not-yet-reached exercise — the whole heading dims.' } },
  },
}

export const WithoutStrip: Story = {
  args: {
    name: 'Standing Calf Raise',
    sets: 5,
    reps: 20,
    load: 25,
    unit: 'lbs',
    tempo: [2, 1, 2, 0],
    setStates: [],
  },
  parameters: {
    docs: {
      description: { story: 'An empty `setStates` list renders the heading with no strip.' },
    },
  },
}
