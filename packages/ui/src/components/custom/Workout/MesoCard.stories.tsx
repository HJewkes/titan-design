import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { View } from 'react-native'
import { MesoCard } from './MesoCard'
import type { WeekRowProps } from './WeekRow'

const weeks: WeekRowProps[] = [
  {
    weekNumber: 1,
    totalWeeks: 4,
    workouts: [
      { name: 'Upper', status: 'completed' },
      { name: 'Lower', status: 'completed' },
    ],
    intensityLevel: 0.4,
    intensityThreshold: 0.85,
  },
  {
    weekNumber: 2,
    totalWeeks: 4,
    workouts: [
      { name: 'Upper', status: 'current' },
      { name: 'Lower', status: 'upcoming' },
    ],
    intensityLevel: 0.6,
    intensityThreshold: 0.85,
  },
  {
    weekNumber: 3,
    totalWeeks: 4,
    workouts: [
      { name: 'Upper', status: 'upcoming' },
      { name: 'Lower', status: 'upcoming' },
    ],
    intensityLevel: 0.8,
    intensityThreshold: 0.85,
  },
  {
    weekNumber: 4,
    totalWeeks: 4,
    workouts: [
      { name: 'Upper', status: 'upcoming' },
      { name: 'Lower', status: 'upcoming' },
    ],
    intensityLevel: 0.35,
    isDeload: true,
  },
]

const meta: Meta<typeof MesoCard> = {
  title: 'Workout/MesoCard',
  component: MesoCard,
  tags: ['autodocs'],
  argTypes: {
    goal: {
      control: 'select',
      options: ['Hypertrophy', 'Strength', 'Peaking'],
      description: 'Training goal shown in the badge',
    },
    expanded: {
      control: 'boolean',
      description: 'Whether the week list is revealed',
    },
    highlighted: {
      control: 'boolean',
      description: 'Synced highlight with the MesoProgressBar',
    },
  },
}

export default meta
type Story = StoryObj<typeof MesoCard>

export const Collapsed: Story = {
  args: {
    name: 'Accumulation',
    goal: 'Hypertrophy',
    split: 'Upper/Lower',
    weekRange: 'Weeks 1-4',
    currentWeek: 2,
    totalWeeks: 4,
    weeks,
    volumeHeatmap: [
      { group: 'chest', percentage: 80 },
      { group: 'back', percentage: 70 },
      { group: 'legs', percentage: 90 },
      { group: 'shoulders', percentage: 45 },
      { group: 'arms', percentage: 35 },
    ],
  },
}

export const Expanded: Story = {
  args: {
    ...Collapsed.args,
    expanded: true,
  },
}

export const Highlighted: Story = {
  args: {
    ...Collapsed.args,
    expanded: true,
    highlighted: true,
  },
}

export const StrengthBlock: Story = {
  args: {
    name: 'Intensification',
    goal: 'Strength',
    split: 'Push/Pull/Legs',
    weekRange: 'Weeks 5-8',
    currentWeek: 6,
    totalWeeks: 4,
    weeks: weeks.map((w) => ({ ...w, weekNumber: w.weekNumber + 4 })),
    volumeHeatmap: [
      { group: 'chest', percentage: 60 },
      { group: 'back', percentage: 65 },
      { group: 'legs', percentage: 75 },
    ],
    expanded: true,
  },
}

function InteractiveMesoCard() {
  const [expanded, setExpanded] = useState(false)
  return (
    <View style={{ maxWidth: 420, padding: 16 }}>
      <MesoCard
        name="Accumulation"
        goal="Hypertrophy"
        split="Upper/Lower"
        weekRange="Weeks 1-4"
        currentWeek={2}
        totalWeeks={4}
        weeks={weeks}
        volumeHeatmap={[
          { group: 'chest', percentage: 80 },
          { group: 'back', percentage: 70 },
          { group: 'legs', percentage: 90 },
        ]}
        expanded={expanded}
        onToggle={() => setExpanded((v) => !v)}
      />
    </View>
  )
}

export const Interactive: Story = {
  render: () => <InteractiveMesoCard />,
}
