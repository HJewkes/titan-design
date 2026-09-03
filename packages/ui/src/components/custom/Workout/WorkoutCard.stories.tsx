import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { WorkoutCard } from './WorkoutCard'
import type { ExerciseCardProps } from './ExerciseCard'

const meta: Meta<typeof WorkoutCard> = {
  title: 'Workout/WorkoutCard',
  component: WorkoutCard,
  tags: ['autodocs'],
  argTypes: {
    status: {
      control: 'select',
      options: ['completed', 'today', 'upcoming'],
      description: 'Drives left-border color, tint, and opacity',
    },
    unit: {
      control: 'select',
      options: ['lbs', 'kg'],
      description: 'Weight unit',
    },
    expanded: {
      control: 'boolean',
      description: 'Whether contained ExerciseCards are shown',
    },
  },
  decorators: [
    (Story) => (
      <View style={{ padding: 16, maxWidth: 420 }}>
        <Story />
      </View>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof WorkoutCard>

const sampleExercises: ExerciseCardProps[] = [
  {
    name: 'Bench Press',
    summary: { sets: 3, reps: 8, weight: 175, unit: 'lbs' },
    setVelocities: [
      [1.1, 0.95, 0.82],
      [0.95, 0.88, 0.78],
    ],
    totalPlannedSets: 3,
  },
  {
    name: 'Incline DB Press',
    upcoming: true,
    prescription: '3×10-12 @ RPE 8',
    previousBest: '70 lbs × 11',
  },
]

const muscleGroups = [
  { group: 'chest', label: 'Chest', volumeStatus: 'productive' as const },
  { group: 'front-delts', label: 'Front Delts', volumeStatus: 'maintenance' as const },
  { group: 'triceps', label: 'Triceps', volumeStatus: 'under' as const },
]

export const Today: Story = {
  args: {
    name: 'Upper A',
    date: 'Mon, Jun 23',
    duration: '45 min',
    status: 'today',
    muscleGroups,
    totalSets: 18,
    totalVolume: 12450,
    unit: 'lbs',
  },
}

export const Completed: Story = {
  args: {
    name: 'Lower B',
    date: 'Sat, Jun 21',
    duration: '52 min',
    status: 'completed',
    muscleGroups: [
      { group: 'quads', label: 'Quads', volumeStatus: 'over' },
      { group: 'hamstrings', label: 'Hamstrings', volumeStatus: 'productive' },
      { group: 'glutes', label: 'Glutes', volumeStatus: 'maintenance' },
    ],
    totalSets: 20,
    totalVolume: 18200,
    unit: 'lbs',
  },
}

export const Upcoming: Story = {
  args: {
    name: 'Push B',
    date: 'Wed, Jun 25',
    status: 'upcoming',
    muscleGroups,
    totalSets: 16,
    unit: 'lbs',
  },
}

export const Expanded: Story = {
  args: {
    name: 'Upper A',
    date: 'Mon, Jun 23',
    duration: '45 min',
    status: 'today',
    muscleGroups,
    totalSets: 18,
    totalVolume: 12450,
    unit: 'lbs',
    expanded: true,
    onToggle: () => {},
    exercises: sampleExercises,
  },
}

export const NoToggle: Story = {
  args: {
    name: 'Pull A',
    date: 'Thu, Jun 26',
    status: 'upcoming',
    muscleGroups: [
      { group: 'back', label: 'Back', volumeStatus: 'productive' },
      { group: 'biceps', label: 'Biceps', volumeStatus: 'maintenance' },
    ],
    totalSets: 17,
    unit: 'kg',
  },
}
