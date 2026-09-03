import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { ExerciseCard } from './ExerciseCard'
import type { SetRowProps } from './SetRow'

const meta: Meta<typeof ExerciseCard> = {
  title: 'Workout/ExerciseCard',
  component: ExerciseCard,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '**Organism** (data-contract card). Three representations: `upcoming` (a dimmed, ' +
          'not-yet-reached row), collapsed (name + summary + per-set velocity strips), and expanded ' +
          '— the unified card whose persistent header is the real ' +
          '[ExerciseCardHeading](?path=/docs/workout-exercisecardheading--docs) over a SET · REPS · ' +
          'LBS · RPE body of [SetRow](?path=/docs/workout-setrow--docs)s (compact spotlight on the ' +
          'live set). Expand is controlled (`expanded` + `onExpandedChange`) or uncontrolled ' +
          '(`defaultExpanded`); `upcoming` overrides expand.',
      },
    },
  },
  argTypes: {
    upcoming: { control: 'boolean', description: 'Dimmed, not-yet-reached representation' },
    expanded: { control: 'boolean', description: 'Controlled expand state' },
    defaultExpanded: { control: 'boolean', description: 'Uncontrolled initial expand state' },
    indicator: {
      control: 'select',
      options: [undefined, 'pr', 'issue', 'info'],
      description: 'Chip in the expanded header title line',
    },
  },
  decorators: [
    (Story) => (
      <View style={{ maxWidth: 400, padding: 16, backgroundColor: '#121212' }}>
        <Story />
      </View>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof ExerciseCard>

// Done · done · LIVE · todo — the unified body's full lifecycle.
const sampleSets: SetRowProps[] = [
  {
    state: 'done',
    setNumber: 1,
    unit: 'lbs',
    reps: 8,
    weight: 135,
    rpe: 7,
    velocities: [1.1, 0.95, 0.82, 0.68, 0.55, 0.48, 0.42, 0.38],
  },
  {
    state: 'done',
    setNumber: 2,
    unit: 'lbs',
    reps: 8,
    weight: 135,
    rpe: 8.5,
    velocities: [0.95, 0.88, 0.78, 0.65, 0.52, 0.45, 0.4, 0.35],
  },
  {
    state: 'live',
    setNumber: 3,
    unit: 'lbs',
    target: { reps: 8, weight: 135 },
    reps: 4,
    weight: 135,
    velocities: [0.92, 0.86, 0.8, 0.74],
  },
  { state: 'todo', setNumber: 4, unit: 'lbs', target: { reps: 8, weight: 135 } },
]

export const CollapsedWithVelocity: Story = {
  args: {
    name: 'Bench Press',
    summary: { sets: 4, reps: 8, weight: 135, unit: 'lbs' },
    setVelocities: [
      [1.1, 0.95, 0.82, 0.68, 0.55, 0.48, 0.42, 0.38],
      [0.95, 0.88, 0.78, 0.65, 0.52, 0.45, 0.4, 0.35],
    ],
    totalPlannedSets: 4,
  },
}

export const CollapsedWithPR: Story = {
  args: {
    name: 'Squat',
    summary: { sets: 3, reps: 5, weight: 275, unit: 'lbs' },
    setVelocities: [
      [0.65, 0.55, 0.45, 0.38, 0.32],
      [0.6, 0.5, 0.42, 0.35, 0.3],
      [0.58, 0.48, 0.4, 0.33, 0.28],
    ],
    totalPlannedSets: 3,
    isPR: true,
  },
}

export const ExpandedWithSets: Story = {
  args: {
    name: 'Bench Press',
    defaultExpanded: true,
    summary: { sets: 4, reps: 8, weight: 135, unit: 'lbs' },
    indicator: 'info',
    sets: sampleSets,
  },
}

export const ExpandedWithTempo: Story = {
  args: {
    name: 'Romanian Deadlift',
    defaultExpanded: true,
    summary: { sets: 3, reps: 10, weight: 185, unit: 'lbs' },
    tempo: [2, 1, 3, 0],
    sets: [
      {
        state: 'done',
        setNumber: 1,
        unit: 'lbs',
        reps: 10,
        weight: 185,
        rpe: 7,
        velocities: [0.9, 0.82, 0.74, 0.66],
      },
      {
        state: 'live',
        setNumber: 2,
        unit: 'lbs',
        target: { reps: 10, weight: 185 },
        reps: 3,
        weight: 185,
        velocities: [0.88, 0.8, 0.72],
      },
      { state: 'todo', setNumber: 3, unit: 'lbs', target: { reps: 10, weight: 185 } },
    ],
  },
}

export const Upcoming: Story = {
  args: {
    name: 'Lat Pulldown',
    upcoming: true,
    prescription: '3×8-12 @ RPE 8',
    previousBest: '135 lbs × 10',
  },
}

export const SupersetFirst: Story = {
  args: {
    name: 'Bench Press',
    summary: { sets: 3, reps: 8, weight: 185, unit: 'lbs' },
    supersetPosition: 'first',
    setVelocities: [[1.0, 0.9, 0.8]],
    totalPlannedSets: 3,
  },
}

export const SupersetLast: Story = {
  args: {
    name: 'Barbell Row',
    summary: { sets: 3, reps: 8, weight: 155, unit: 'lbs' },
    supersetPosition: 'last',
    setVelocities: [[0.9, 0.8, 0.7]],
    totalPlannedSets: 3,
  },
}
