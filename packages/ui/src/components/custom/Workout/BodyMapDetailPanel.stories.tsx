import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { View, Text, Pressable } from 'react-native'
import {
  BodyMapDetailPanel,
  type ContributingExercise,
  type UpcomingExercise,
} from './BodyMapDetailPanel'
import { MuscleGroup } from './muscleTaxonomy'

const contributing: ContributingExercise[] = [
  { name: 'Barbell Bench Press', sets: 4, contributionWeight: 1 },
  { name: 'Incline Dumbbell Press', sets: 3, contributionWeight: 1 },
  { name: 'Cable Fly', sets: 3, contributionWeight: 0.75 },
  { name: 'Overhead Press', sets: 2, contributionWeight: 0.33 },
]

const upcoming: UpcomingExercise[] = [
  { name: 'Dips', workoutName: 'Push B', sets: 3 },
  { name: 'Machine Chest Press', workoutName: 'Push B', sets: 3 },
]

const meta: Meta<typeof BodyMapDetailPanel> = {
  title: 'Workout/DataViz/BodyMapDetailPanel',
  component: BodyMapDetailPanel,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <View style={{ position: 'relative', height: 640, width: 380, backgroundColor: '#0E0E0E' }}>
        <Story />
      </View>
    ),
  ],
  argTypes: {
    displayName: { control: 'text', description: 'Human-readable muscle name' },
    weeklySets: { control: 'number', description: 'Weekly effective sets logged' },
    volumeStatus: {
      control: 'select',
      options: ['under', 'maintenance', 'productive', 'over'],
      description: 'Volume status relative to landmarks',
    },
    isOpen: { control: 'boolean', description: 'Whether the bottom sheet is visible' },
    lastTrained: { control: 'text', description: 'Last trained label' },
  },
}

export default meta
type Story = StoryObj<typeof BodyMapDetailPanel>

export const Default: Story = {
  args: {
    muscleGroup: MuscleGroup.CHEST,
    displayName: 'Chest',
    weeklySets: 14,
    landmarks: { mev: 8, mav: 14, mrv: 20 },
    volumeStatus: 'productive',
    lastTrained: '2 days ago',
    weeklyHistory: [8, 10, 12, 11, 13, 14],
    contributingExercises: contributing,
    upcomingExercises: upcoming,
    isOpen: true,
    onClose: () => {},
    onViewExercises: () => {},
  },
}

export const UnderTrained: Story = {
  args: {
    ...Default.args,
    displayName: 'Rear Delts',
    muscleGroup: MuscleGroup.REAR_DELTS,
    weeklySets: 4,
    landmarks: { mev: 6, mav: 12, mrv: 18 },
    volumeStatus: 'under',
    weeklyHistory: [2, 3, 3, 4],
  },
}

export const Maintenance: Story = {
  args: {
    ...Default.args,
    displayName: 'Biceps',
    muscleGroup: MuscleGroup.BICEPS,
    weeklySets: 8,
    landmarks: { mev: 4, mav: 10, mrv: 18 },
    volumeStatus: 'maintenance',
  },
}

export const Productive: Story = {
  args: { ...Default.args },
}

export const OverReaching: Story = {
  args: {
    ...Default.args,
    displayName: 'Quads',
    muscleGroup: MuscleGroup.QUADS,
    weeklySets: 20,
    landmarks: { mev: 6, mav: 12, mrv: 18 },
    volumeStatus: 'over',
    weeklyHistory: [12, 14, 16, 18, 20],
  },
}

export const Minimal: Story = {
  args: {
    muscleGroup: MuscleGroup.CALVES,
    displayName: 'Calves',
    weeklySets: 10,
    landmarks: { mev: 6, mav: 10, mrv: 16 },
    volumeStatus: 'maintenance',
    isOpen: true,
    onClose: () => {},
  },
}

export const WithoutHistory: Story = {
  args: {
    ...Default.args,
    weeklyHistory: undefined,
  },
}

export const WithoutUpcoming: Story = {
  args: {
    ...Default.args,
    upcomingExercises: [],
  },
}

function InteractiveBodyMapDetailPanel() {
  const [open, setOpen] = useState(false)
  return (
    <View style={{ position: 'relative', height: 640, width: 380, backgroundColor: '#0E0E0E', padding: 16 }}>
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
          Tap Chest
        </Text>
      </Pressable>
      <BodyMapDetailPanel
        muscleGroup={MuscleGroup.CHEST}
        displayName="Chest"
        weeklySets={14}
        landmarks={{ mev: 8, mav: 14, mrv: 20 }}
        volumeStatus="productive"
        lastTrained="2 days ago"
        weeklyHistory={[8, 10, 12, 11, 13, 14]}
        contributingExercises={contributing}
        upcomingExercises={upcoming}
        isOpen={open}
        onClose={() => setOpen(false)}
        onViewExercises={() => {}}
      />
    </View>
  )
}

export const Interactive: Story = {
  render: () => <InteractiveBodyMapDetailPanel />,
}
