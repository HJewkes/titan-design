import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { WeekRow } from './WeekRow'

const meta: Meta<typeof WeekRow> = {
  title: 'Workout/WeekRow',
  component: WeekRow,
  tags: ['autodocs'],
  argTypes: {
    weekNumber: { control: 'number', description: 'Week index (1-based)' },
    totalWeeks: { control: 'number', description: 'Weeks in the mesocycle' },
    intensityLevel: {
      control: { type: 'range', min: 0, max: 1, step: 0.05 },
      description: 'Planned intensity, 0-1',
    },
    intensityThreshold: {
      control: { type: 'range', min: 0, max: 1, step: 0.05 },
      description: 'MRV/overexertion threshold, 0-1',
    },
    isCurrent: { control: 'boolean', description: 'Active week highlight' },
    isDeload: { control: 'boolean', description: 'Deload week styling' },
  },
}

export default meta
type Story = StoryObj<typeof WeekRow>

export const Default: Story = {
  args: {
    weekNumber: 1,
    totalWeeks: 4,
    workouts: [
      { name: 'Upper', status: 'completed' },
      { name: 'Lower', status: 'completed' },
      { name: 'Full', status: 'upcoming' },
    ],
    intensityLevel: 0.45,
    intensityThreshold: 0.8,
  },
}

export const CurrentWeek: Story = {
  args: {
    weekNumber: 3,
    totalWeeks: 4,
    workouts: [
      { name: 'Push', status: 'completed' },
      { name: 'Pull', status: 'current' },
      { name: 'Legs', status: 'upcoming' },
    ],
    intensityLevel: 0.75,
    intensityThreshold: 0.8,
    isCurrent: true,
  },
}

export const DeloadWeek: Story = {
  args: {
    weekNumber: 4,
    totalWeeks: 4,
    workouts: [
      { name: 'Upper', status: 'upcoming' },
      { name: 'Lower', status: 'upcoming' },
    ],
    intensityLevel: 0.3,
    intensityThreshold: 0.8,
    isDeload: true,
  },
}

export const MesocycleProgression: Story = {
  render: () => (
    <View style={{ gap: 2, padding: 16, maxWidth: 420 }}>
      <WeekRow
        weekNumber={1}
        totalWeeks={4}
        workouts={[
          { name: 'Upper', status: 'completed' },
          { name: 'Lower', status: 'completed' },
          { name: 'Full', status: 'completed' },
        ]}
        intensityLevel={0.45}
        intensityThreshold={0.8}
      />
      <WeekRow
        weekNumber={2}
        totalWeeks={4}
        workouts={[
          { name: 'Upper', status: 'completed' },
          { name: 'Lower', status: 'completed' },
          { name: 'Full', status: 'completed' },
        ]}
        intensityLevel={0.6}
        intensityThreshold={0.8}
      />
      <WeekRow
        weekNumber={3}
        totalWeeks={4}
        workouts={[
          { name: 'Upper', status: 'completed' },
          { name: 'Lower', status: 'current' },
          { name: 'Full', status: 'upcoming' },
        ]}
        intensityLevel={0.78}
        intensityThreshold={0.8}
        isCurrent
      />
      <WeekRow
        weekNumber={4}
        totalWeeks={4}
        workouts={[
          { name: 'Upper', status: 'upcoming' },
          { name: 'Lower', status: 'upcoming' },
        ]}
        intensityLevel={0.3}
        intensityThreshold={0.8}
        isDeload
      />
    </View>
  ),
}
