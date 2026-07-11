import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { SetRow } from './SetRow'
import { SetTableHeader } from './SetTableHeader'

const meta: Meta<typeof SetRow> = {
  title: 'Workout/SetRow',
  component: SetRow,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '**Molecule** — one row of the unified expanded exercise table (SET · REPS · LBS · RPE ' +
          'over a per-row velocity strip), as a lifecycle discriminated union on `state`: `done` ' +
          '(logged), `live` (performing now — brightened, compact velocity-height spotlight), `todo` ' +
          '(planned — muted grey stub). Done + upcoming share one muted treatment; only `live` is ' +
          'brightened. No PREV column. Composed by ' +
          '[ExerciseCard](?path=/docs/workout-exercisecard--docs) (expanded).',
      },
    },
  },
  argTypes: {
    state: {
      control: 'select',
      options: ['done', 'live', 'todo'],
      description: 'Set lifecycle',
    },
    unit: {
      control: 'select',
      options: ['lbs', 'kg'],
      description: 'Weight unit',
    },
    setType: {
      control: 'text',
      description: 'Optional set-type marker shown in the SET cell (e.g. "W", "DROP")',
    },
  },
}

export default meta
type Story = StoryObj<typeof SetRow>

export const Done: Story = {
  args: {
    state: 'done',
    setNumber: 1,
    unit: 'lbs',
    reps: 8,
    weight: 135,
    rpe: 7.5,
    velocities: [1.1, 0.95, 0.82, 0.68, 0.55, 0.48, 0.42, 0.38],
  },
}

export const Live: Story = {
  args: {
    state: 'live',
    setNumber: 2,
    unit: 'lbs',
    target: { reps: 10, weight: 150 },
    reps: 5,
    weight: 150,
    velocities: [0.95, 0.9, 0.86, 0.8, 0.72],
  },
}

export const Todo: Story = {
  args: {
    state: 'todo',
    setNumber: 3,
    unit: 'lbs',
    target: { reps: 10, weight: 150 },
  },
}

export const WithTypeBadge: Story = {
  args: {
    state: 'done',
    setNumber: 1,
    unit: 'lbs',
    reps: 5,
    weight: 95,
    setType: 'W',
    velocities: [1.05, 0.98, 0.9, 0.84, 0.78],
  },
}

/** The lifecycle in context: header + done → live → todo, as the expanded card lays it out. */
export const TableInContext: Story = {
  render: () => (
    <View style={{ padding: 16, maxWidth: 400 }}>
      <SetTableHeader unit="lbs" showPrevious={false} />
      <SetRow
        state="done"
        setNumber={1}
        unit="lbs"
        reps={8}
        weight={135}
        rpe={7.5}
        velocities={[1.1, 0.95, 0.82, 0.68, 0.55, 0.48, 0.42, 0.38]}
      />
      <SetRow
        state="live"
        setNumber={2}
        unit="lbs"
        target={{ reps: 8, weight: 135 }}
        reps={5}
        weight={135}
        velocities={[0.95, 0.88, 0.78, 0.65, 0.52]}
      />
      <SetRow state="todo" setNumber={3} unit="lbs" target={{ reps: 8, weight: 135 }} />
    </View>
  ),
}
