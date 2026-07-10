import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { ExpandedDrawer } from './ExpandedDrawer'
import type { SetRowProps } from './SetRow'

/**
 * 🚧 WIP / placeholder — `ExpandedDrawer`: the expanded-workout drawer that opens when
 * a rail exercise expands. A `SetTableHeader` above a list of real `SetRow`s. The shell
 * (surface, spacing) is a rough placeholder pending the responsive-unification ticket;
 * the header + rows are the real components so the composition is exercised for real.
 */
const meta: Meta<typeof ExpandedDrawer> = {
  title: 'Shell/SessionRail/ExpandedDrawer',
  component: ExpandedDrawer,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '**🚧 WIP / placeholder.** **Organism** (shell S3). The expanded-workout drawer: a ' +
          'header over a list of set rows, opened when a rail exercise expands. Composes ' +
          '[TableHeader](?path=/docs/shell-sessionrail-expandeddrawer-tableheader--docs) + ' +
          '[SetRow](?path=/docs/workout-setrow--docs) × N. ' +
          'Used-by ↑ [SessionRail](?path=/docs/shell-sessionrail--docs). ' +
          'Surface / spacing provisional — to be refined with TD-03.56 responsive unification.',
      },
    },
  },
  argTypes: {
    unit: { control: 'select', options: ['lbs', 'kg'] },
  },
  decorators: [
    (Story) => (
      <View style={{ width: 340, backgroundColor: '#0A0A0A', padding: 16 }}>
        <Story />
      </View>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof ExpandedDrawer>

const sets: SetRowProps[] = [
  {
    mode: 'completed',
    setNumber: 1,
    reps: 8,
    weight: 135,
    unit: 'lbs',
    rpe: 7,
    previous: { reps: 8, weight: 130 },
    velocities: [1.1, 0.95, 0.82, 0.68, 0.55, 0.48, 0.42, 0.38],
  },
  {
    mode: 'completed',
    setNumber: 2,
    reps: 8,
    weight: 135,
    unit: 'lbs',
    rpe: 8.5,
    previous: { reps: 8, weight: 135 },
  },
  {
    mode: 'active',
    setNumber: 3,
    reps: null,
    weight: null,
    unit: 'lbs',
    isNextSet: true,
    targets: { reps: 8, weight: 135 },
    previous: { reps: 8, weight: 135 },
  },
]

export const Default: Story = {
  args: { name: 'Bench Press', sets },
}

export const Kg: Story = {
  args: {
    name: 'Back Squat',
    unit: 'kg',
    sets: [
      {
        mode: 'completed',
        setNumber: 1,
        reps: 5,
        weight: 100,
        unit: 'kg',
        rpe: 7,
        previous: { reps: 5, weight: 95 },
      },
      {
        mode: 'active',
        setNumber: 2,
        reps: null,
        weight: null,
        unit: 'kg',
        isNextSet: true,
        targets: { reps: 5, weight: 100 },
      },
    ],
  },
  parameters: {
    docs: { description: { story: 'Metric units — the header weight column reads KG.' } },
  },
}
