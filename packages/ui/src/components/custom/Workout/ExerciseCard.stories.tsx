import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { ExerciseCard } from './ExerciseCard'
import type { SetRowProps } from './SetRow'

const meta: Meta<typeof ExerciseCard> = {
  title: 'Shell/SessionRail/ExerciseCard',
  component: ExerciseCard,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '**Organism** (data-contract card; `state="collapsed" | "expanded" | "upcoming" | "rail"`). ' +
          'The `rail` heading representation composes ' +
          '[ExerciseIndicator](?path=/docs/shell-sessionrail-exercisecard-exerciseindicator--docs) + ' +
          '[SetsRepsLoad](?path=/docs/shell-sessionrail-exercisecard-setsrepsload--docs) + ' +
          '[TempoDisplay](?path=/docs/shell-sessionrail-exercisecard-tempodisplay--docs) + ' +
          '[SetStrip](?path=/docs/shell-sessionrail-exercisecard-setstrip--docs). ' +
          'Used-by ↑ [SessionRail](?path=/docs/shell-sessionrail--docs).',
      },
    },
  },
  argTypes: {
    state: {
      control: 'select',
      options: ['collapsed', 'expanded', 'upcoming', 'rail'],
      description: 'Card display state',
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

const sampleSets: SetRowProps[] = [
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
    velocities: [0.95, 0.88, 0.78, 0.65, 0.52, 0.45, 0.40, 0.35],
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
  {
    mode: 'active',
    setNumber: 4,
    reps: null,
    weight: null,
    unit: 'lbs',
    targets: { reps: 8, weight: 135 },
    previous: { reps: 8, weight: 135 },
  },
]

export const CollapsedWithVelocity: Story = {
  args: {
    name: 'Bench Press',
    state: 'collapsed',
    onToggle: () => {},
    summary: { sets: 4, reps: 8, weight: 135, unit: 'lbs' },
    setVelocities: [
      [1.1, 0.95, 0.82, 0.68, 0.55, 0.48, 0.42, 0.38],
      [0.95, 0.88, 0.78, 0.65, 0.52, 0.45, 0.40, 0.35],
    ],
    totalPlannedSets: 4,
    e1rm: { value: 225, unit: 'lbs' },
  },
}

export const CollapsedWithPR: Story = {
  args: {
    name: 'Squat',
    state: 'collapsed',
    onToggle: () => {},
    summary: { sets: 3, reps: 5, weight: 275, unit: 'lbs' },
    setVelocities: [
      [0.65, 0.55, 0.45, 0.38, 0.32],
      [0.60, 0.50, 0.42, 0.35, 0.30],
      [0.58, 0.48, 0.40, 0.33, 0.28],
    ],
    totalPlannedSets: 3,
    e1rm: { value: 365, unit: 'lbs' },
    isPR: true,
  },
}

export const ExpandedWithSets: Story = {
  args: {
    name: 'Bench Press',
    state: 'expanded',
    onToggle: () => {},
    summary: { sets: 4, reps: 8, weight: 135, unit: 'lbs' },
    sets: sampleSets,
    e1rm: { value: 225, unit: 'lbs' },
  },
}

export const ExpandedWithTempo: Story = {
  args: {
    name: 'Romanian Deadlift',
    state: 'expanded',
    onToggle: () => {},
    summary: { sets: 3, reps: 10, weight: 185, unit: 'lbs' },
    tempo: [2, 1, 3, 0],
    sets: [
      {
        mode: 'completed',
        setNumber: 1,
        reps: 10,
        weight: 185,
        unit: 'lbs',
        rpe: 7,
        previous: { reps: 10, weight: 175 },
      },
      {
        mode: 'active',
        setNumber: 2,
        reps: null,
        weight: null,
        unit: 'lbs',
        isNextSet: true,
        targets: { reps: 10, weight: 185 },
        previous: { reps: 10, weight: 185 },
      },
      {
        mode: 'active',
        setNumber: 3,
        reps: null,
        weight: null,
        unit: 'lbs',
        targets: { reps: 10, weight: 185 },
        previous: { reps: 10, weight: 185 },
      },
    ],
  },
}

export const Upcoming: Story = {
  args: {
    name: 'Lat Pulldown',
    state: 'upcoming',
    onToggle: () => {},
    prescription: '3\u00D78-12 @ RPE 8',
    previousBest: '135 lbs \u00D7 10',
  },
}

const railDecay = (n: number, start: number, span = 0.4): number[] =>
  Array.from({ length: n }, (_, r) => +(start - (span * r) / Math.max(1, n - 1)).toFixed(3))

export const RailHeading: Story = {
  args: {
    name: 'Cable Chest Press',
    state: 'rail',
    onToggle: () => {},
    summary: { sets: 3, reps: 10, weight: 90, unit: 'lbs' },
    tempo: [2, 1, 2, 0],
    indicator: 'info',
    setStates: [
      { status: 'done', velocities: railDecay(10, 0.72) },
      { status: 'active', velocities: railDecay(5, 0.62), planned: 10 },
      { status: 'todo', planned: 10 },
    ],
  },
  decorators: [
    (Story) => (
      <View style={{ width: 246, backgroundColor: '#131313' }}>
        <Story />
      </View>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'The session-rail heading representation: name + indicator row, the tight ' +
          'sets/reps/load line beside the real TempoDisplay, and the per-set SetStrip. ' +
          'Consumed by [SessionRail](?path=/docs/shell-sessionrail--docs).',
      },
    },
  },
}

export const SupersetFirst: Story = {
  args: {
    name: 'Bench Press',
    state: 'collapsed',
    onToggle: () => {},
    summary: { sets: 3, reps: 8, weight: 185, unit: 'lbs' },
    supersetPosition: 'first',
    setVelocities: [[1.0, 0.9, 0.8]],
    totalPlannedSets: 3,
  },
}

export const SupersetLast: Story = {
  args: {
    name: 'Barbell Row',
    state: 'collapsed',
    onToggle: () => {},
    summary: { sets: 3, reps: 8, weight: 155, unit: 'lbs' },
    supersetPosition: 'last',
    setVelocities: [[0.9, 0.8, 0.7]],
    totalPlannedSets: 3,
  },
}
