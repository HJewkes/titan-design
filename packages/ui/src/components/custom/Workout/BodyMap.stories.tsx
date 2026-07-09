import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { View } from 'react-native'
import { BodyMap, type BodyMapData } from './BodyMap'
import { MuscleGroup } from './muscleTaxonomy'

const sampleData: BodyMapData[] = [
  { muscleGroup: MuscleGroup.CHEST, intensity: 0.7, volumeStatus: 'productive', weeklySets: 12 },
  {
    muscleGroup: MuscleGroup.FRONT_DELTS,
    intensity: 0.5,
    volumeStatus: 'maintenance',
    weeklySets: 5,
  },
  {
    muscleGroup: MuscleGroup.SIDE_DELTS,
    intensity: 0.6,
    volumeStatus: 'productive',
    weeklySets: 10,
  },
  { muscleGroup: MuscleGroup.BICEPS, intensity: 0.3, volumeStatus: 'under', weeklySets: 3 },
  { muscleGroup: MuscleGroup.TRICEPS, intensity: 0.65, volumeStatus: 'productive', weeklySets: 8 },
  { muscleGroup: MuscleGroup.ABS, intensity: 0.4, volumeStatus: 'maintenance', weeklySets: 6 },
  {
    muscleGroup: MuscleGroup.OBLIQUES,
    intensity: 0.35,
    volumeStatus: 'maintenance',
    weeklySets: 4,
  },
  { muscleGroup: MuscleGroup.QUADS, intensity: 0.95, volumeStatus: 'over', weeklySets: 20 },
]

const backData: BodyMapData[] = [
  { muscleGroup: MuscleGroup.LATS, intensity: 0.6, volumeStatus: 'productive', weeklySets: 11 },
  {
    muscleGroup: MuscleGroup.UPPER_BACK,
    intensity: 0.5,
    volumeStatus: 'maintenance',
    weeklySets: 8,
  },
  { muscleGroup: MuscleGroup.REAR_DELTS, intensity: 0.3, volumeStatus: 'under', weeklySets: 4 },
  { muscleGroup: MuscleGroup.TRICEPS, intensity: 0.65, volumeStatus: 'productive', weeklySets: 8 },
  { muscleGroup: MuscleGroup.GLUTES, intensity: 0.7, volumeStatus: 'productive', weeklySets: 10 },
  {
    muscleGroup: MuscleGroup.HAMSTRINGS,
    intensity: 0.55,
    volumeStatus: 'productive',
    weeklySets: 9,
  },
  { muscleGroup: MuscleGroup.CALVES, intensity: 0.2, volumeStatus: 'under', weeklySets: 3 },
]

const meta: Meta<typeof BodyMap> = {
  title: 'Workout/DataViz/BodyMap',
  component: BodyMap,
  tags: ['autodocs'],
  argTypes: {
    view: { control: 'inline-radio', options: ['front', 'back'] },
    mode: { control: 'inline-radio', options: ['simple', 'detailed'] },
  },
  decorators: [
    (Story) => (
      <View style={{ padding: 16, maxWidth: 320 }}>
        <Story />
      </View>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof BodyMap>

export const Front: Story = {
  args: { data: sampleData, view: 'front', mode: 'detailed' },
}

export const Back: Story = {
  args: { data: backData, view: 'back', mode: 'detailed' },
}

export const Simple: Story = {
  args: { data: sampleData, view: 'front', mode: 'simple' },
}

export const Detailed: Story = {
  args: { data: sampleData, view: 'front', mode: 'detailed' },
}

export const Highlighted: Story = {
  args: {
    data: sampleData,
    view: 'front',
    mode: 'detailed',
    highlightedMuscle: MuscleGroup.QUADS,
  },
}

export const Empty: Story = {
  args: { data: [], view: 'front' },
}

function InteractiveBodyMap() {
  const [view, setView] = useState<'front' | 'back'>('front')
  const [selected, setSelected] = useState<MuscleGroup | null>(null)
  return (
    <View style={{ maxWidth: 320 }}>
      <BodyMap
        data={view === 'front' ? sampleData : backData}
        view={view}
        onViewChange={setView}
        onMusclePress={(m) => setSelected((cur) => (cur === m ? null : m))}
        highlightedMuscle={selected}
        mode="detailed"
      />
    </View>
  )
}

export const Interactive: Story = {
  render: () => <InteractiveBodyMap />,
}
