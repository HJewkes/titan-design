import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { View, Text, Pressable } from 'react-native'
import { PrHistoryModal, type PrRecord } from './PrHistoryModal'

const records: PrRecord[] = [
  { type: 'e1rm', value: 245, unit: 'lbs', date: 'Mar 14', isRecent: true },
  { type: 'weight', value: 225, unit: 'lbs', date: 'Mar 14', isRecent: true },
  { type: 'reps', value: '8 @ 185 lbs', date: 'Feb 28' },
  { type: 'volume', value: '12,400 lbs', date: 'Feb 14' },
  { type: 'velocity', value: '0.82 m/s', date: 'Jan 30' },
]

const meta: Meta<typeof PrHistoryModal> = {
  title: 'Custom/Workout/PrHistoryModal',
  component: PrHistoryModal,
  tags: ['autodocs'],
  argTypes: {
    exerciseId: {
      control: 'text',
      description: 'Identifier of the exercise whose PR history is shown',
    },
    exerciseName: {
      control: 'text',
      description: 'Human-readable name used in the title and a11y label',
    },
    isOpen: {
      control: 'boolean',
      description: 'Whether the bottom sheet is visible',
    },
    records: {
      control: 'object',
      description: 'PR records to display, newest-first',
    },
  },
}

export default meta
type Story = StoryObj<typeof PrHistoryModal>

export const Default: Story = {
  args: {
    exerciseId: 'bench-press',
    exerciseName: 'Bench Press',
    isOpen: true,
    records,
    onClose: () => {},
  },
}

export const RecentPrsHighlighted: Story = {
  args: {
    ...Default.args,
    records: records.map((r) => ({ ...r, isRecent: true })),
  },
}

export const SingleRecord: Story = {
  args: {
    ...Default.args,
    exerciseName: 'Barbell Row',
    records: [{ type: 'e1rm', value: 185, unit: 'lbs', date: 'Today', isRecent: true }],
  },
}

export const Empty: Story = {
  args: {
    ...Default.args,
    exerciseName: 'Overhead Press',
    records: [],
  },
}

export const FallsBackToExerciseId: Story = {
  args: {
    exerciseId: 'deadlift',
    exerciseName: undefined,
    isOpen: true,
    records,
    onClose: () => {},
  },
}

function InteractivePrHistoryModal() {
  const [open, setOpen] = useState(false)
  return (
    <View style={{ padding: 16 }}>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        style={{
          alignSelf: 'flex-start',
          backgroundColor: '#FF7900',
          paddingVertical: 10,
          paddingHorizontal: 20,
          borderRadius: 8,
        }}
      >
        <Text style={{ color: '#FFFFFF', fontWeight: '700', fontFamily: 'Inter, sans-serif' }}>
          Open PR history
        </Text>
      </Pressable>
      <PrHistoryModal
        exerciseId="bench-press"
        exerciseName="Bench Press"
        isOpen={open}
        onClose={() => setOpen(false)}
        records={records}
      />
    </View>
  )
}

export const Interactive: Story = {
  render: () => <InteractivePrHistoryModal />,
}
