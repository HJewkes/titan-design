import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { View } from 'react-native'
import { MesoProgressBar, type Meso } from './MesoProgressBar'

const meta: Meta<typeof MesoProgressBar> = {
  title: 'Custom/Workout/MesoProgressBar',
  component: MesoProgressBar,
  tags: ['autodocs'],
  argTypes: {
    activeMesoId: {
      control: 'text',
      description: 'Id of the highlighted meso, synced with MesoCard selection',
    },
  },
}

export default meta
type Story = StoryObj<typeof MesoProgressBar>

const sampleMesos: Meso[] = [
  { id: 'm1', name: 'Accumulation', weekCount: 4, status: 'completed' },
  { id: 'm2', name: 'Intensification', weekCount: 3, status: 'current', currentWeek: 2 },
  { id: 'm3', name: 'Peak', weekCount: 2, status: 'upcoming' },
  { id: 'm4', name: 'Deload', weekCount: 1, status: 'upcoming' },
]

export const Default: Story = {
  args: {
    mesos: sampleMesos,
    activeMesoId: null,
    onMesoPress: () => {},
  },
  render: (args) => (
    <View style={{ paddingVertical: 24, width: 480 }}>
      <MesoProgressBar {...args} />
    </View>
  ),
}

export const ActiveCurrent: Story = {
  args: {
    mesos: sampleMesos,
    activeMesoId: 'm2',
    onMesoPress: () => {},
  },
  render: (args) => (
    <View style={{ paddingVertical: 24, width: 480 }}>
      <MesoProgressBar {...args} />
    </View>
  ),
}

export const FirstWeekProgress: Story = {
  args: {
    mesos: [
      { id: 'a', name: 'Base', weekCount: 5, status: 'current', currentWeek: 1 },
      { id: 'b', name: 'Build', weekCount: 4, status: 'upcoming' },
    ],
    activeMesoId: 'a',
    onMesoPress: () => {},
  },
  render: (args) => (
    <View style={{ paddingVertical: 24, width: 480 }}>
      <MesoProgressBar {...args} />
    </View>
  ),
}

function InteractiveDemo() {
  const [activeMesoId, setActiveMesoId] = useState<string | null>('m2')
  return (
    <View style={{ paddingVertical: 24, width: 480 }}>
      <MesoProgressBar
        mesos={sampleMesos}
        activeMesoId={activeMesoId}
        onMesoPress={setActiveMesoId}
      />
    </View>
  )
}

export const Interactive: Story = {
  render: () => <InteractiveDemo />,
}
