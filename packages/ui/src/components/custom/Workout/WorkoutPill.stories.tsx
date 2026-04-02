import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { WorkoutPill } from './WorkoutPill'

const meta: Meta<typeof WorkoutPill> = {
  title: 'Custom/Workout/WorkoutPill',
  component: WorkoutPill,
  tags: ['autodocs'],
  argTypes: {
    name: { control: 'text', description: 'Workout name' },
    status: {
      control: 'select',
      options: ['completed', 'active', 'next', 'upcoming', 'missed', 'deload'],
      description: 'Pill status',
    },
    pulse: { control: 'boolean', description: 'Pulsing animation (independent of status)' },
    highlighted: { control: 'boolean', description: 'Highlighted with thicker border and slight scale' },
  },
}

export default meta
type Story = StoryObj<typeof WorkoutPill>

export const Completed: Story = {
  args: { name: 'Upper A', status: 'completed' },
}

export const Active: Story = {
  args: { name: 'Lower B', status: 'active' },
}

export const ActivePulsing: Story = {
  args: { name: 'Lower B', status: 'active', pulse: true },
}

export const Next: Story = {
  args: { name: 'Upper B', status: 'next' },
}

export const Upcoming: Story = {
  args: { name: 'Lower A', status: 'upcoming' },
}

export const Missed: Story = {
  args: { name: 'Rest Day', status: 'missed' },
}

export const Deload: Story = {
  args: { name: 'Deload Week', status: 'deload' },
}

export const AllStatuses: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
      <WorkoutPill name="Upper A" status="completed" />
      <WorkoutPill name="Lower B" status="active" pulse />
      <WorkoutPill name="Upper B" status="next" />
      <WorkoutPill name="Lower A" status="upcoming" />
      <WorkoutPill name="Rest Day" status="missed" />
      <WorkoutPill name="Recovery" status="deload" />
    </View>
  ),
}
