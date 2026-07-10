import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { View, Text } from 'react-native'
import { CapacityBandChart } from './CapacityBandChart'
import type {
  CapacityBandDataPoint,
  CapacityBandProjection,
  WorkoutDot,
} from './CapacityBandChart'

const band: CapacityBandDataPoint[] = [
  { date: '2026-06-01', bandLow: 40, bandHigh: 70 },
  { date: '2026-06-05', bandLow: 44, bandHigh: 74 },
  { date: '2026-06-09', bandLow: 50, bandHigh: 80 },
  { date: '2026-06-13', bandLow: 54, bandHigh: 86 },
  { date: '2026-06-17', bandLow: 58, bandHigh: 90 },
  { date: '2026-06-21', bandLow: 60, bandHigh: 94 },
  { date: '2026-06-25', bandLow: 62, bandHigh: 96 },
]

const workouts: WorkoutDot[] = [
  { date: '2026-06-02', load: 58, status: 'within' },
  { date: '2026-06-06', load: 80, status: 'above' },
  { date: '2026-06-10', load: 66, status: 'within' },
  { date: '2026-06-14', load: 48, status: 'below' },
  { date: '2026-06-18', load: 76, status: 'within' },
  { date: '2026-06-23', load: 100, status: 'above' },
]

const projection: CapacityBandProjection = {
  withTraining: [
    { date: '2026-06-27', bandLow: 64, bandHigh: 99 },
    { date: '2026-06-29', bandLow: 67, bandHigh: 104 },
  ],
  withRest: [
    { date: '2026-06-27', bandLow: 56, bandHigh: 88 },
    { date: '2026-06-29', bandLow: 48, bandHigh: 78 },
  ],
}

const meta: Meta<typeof CapacityBandChart> = {
  title: 'Workout/DataViz/CapacityBandChart',
  component: CapacityBandChart,
  tags: ['autodocs'],
  argTypes: {
    width: { control: { type: 'range', min: 240, max: 480, step: 10 }, description: 'Chart width in px' },
    height: { control: { type: 'range', min: 120, max: 280, step: 10 }, description: 'Chart height in px' },
    band: { description: 'Capacity band shape over time' },
    workouts: { description: 'Workout sessions plotted as load dots' },
    projection: { description: 'Optional dashed forward projection (training vs rest)' },
    onWorkoutPress: { description: 'Called when a workout dot is tapped' },
  },
}

export default meta
type Story = StoryObj<typeof CapacityBandChart>

export const Default: Story = {
  args: {
    band,
    workouts,
    projection,
    width: 340,
    height: 200,
  },
}

export const WithoutProjection: Story = {
  args: {
    ...Default.args,
    projection: undefined,
  },
}

export const Compact: Story = {
  args: {
    ...Default.args,
    width: 260,
    height: 140,
  },
}

export const SparseData: Story = {
  args: {
    band: band.slice(0, 3),
    workouts: workouts.slice(0, 2),
    projection: undefined,
    width: 300,
    height: 180,
  },
}

export const Empty: Story = {
  args: {
    band: [],
    workouts: [],
    width: 300,
    height: 180,
  },
}

function InteractiveCapacityBandChart() {
  const [selected, setSelected] = useState<WorkoutDot | null>(null)
  return (
    <View style={{ maxWidth: 380, padding: 16, gap: 10 }}>
      <CapacityBandChart
        band={band}
        workouts={workouts}
        projection={projection}
        width={340}
        height={200}
        onWorkoutPress={setSelected}
      />
      <Text style={{ fontSize: 12, fontFamily: 'Inter, sans-serif', color: '#9CA3AF' }}>
        {selected
          ? `Selected ${selected.date}: load ${selected.load} (${selected.status})`
          : 'Tap a workout dot to inspect the session.'}
      </Text>
    </View>
  )
}

export const Interactive: Story = {
  render: () => <InteractiveCapacityBandChart />,
}
