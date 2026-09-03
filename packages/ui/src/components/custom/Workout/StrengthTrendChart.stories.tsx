import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { View, Text } from 'react-native'
import { StrengthTrendChart } from './StrengthTrendChart'
import type { StrengthTrendDataPoint } from './StrengthTrendChart'

const actual: StrengthTrendDataPoint[] = [
  { date: '2026-01-06', e1rm: 215, sessionLabel: 'Jan 6' },
  { date: '2026-01-20', e1rm: 222, sessionLabel: 'Jan 20' },
  { date: '2026-02-03', e1rm: 228, isPR: true, sessionLabel: 'Feb 3' },
  { date: '2026-02-17', e1rm: 226, sessionLabel: 'Feb 17' },
  { date: '2026-03-03', e1rm: 235, sessionLabel: 'Mar 3' },
  { date: '2026-03-17', e1rm: 244, isPR: true, sessionLabel: 'Mar 17' },
]

const projection: StrengthTrendDataPoint[] = [
  { date: '2026-03-17', e1rm: 244 },
  { date: '2026-03-31', e1rm: 252 },
  { date: '2026-04-14', e1rm: 261 },
]

const mesoBoundaries = [
  { date: '2026-02-03', label: 'Intensify' },
  { date: '2026-03-17', label: 'Peak' },
]

const decline: StrengthTrendDataPoint[] = [
  { date: '2026-03-03', e1rm: 248 },
  { date: '2026-03-10', e1rm: 244 },
  { date: '2026-03-17', e1rm: 239 },
  { date: '2026-03-24', e1rm: 235 },
]

const meta: Meta<typeof StrengthTrendChart> = {
  title: 'Workout/DataViz/StrengthTrendChart',
  component: StrengthTrendChart,
  tags: ['autodocs'],
  argTypes: {
    width: {
      control: { type: 'range', min: 160, max: 480, step: 10 },
      description: 'Plot width in px',
    },
    height: {
      control: { type: 'range', min: 100, max: 220, step: 10 },
      description: 'Plot height in px (120-160 for compact)',
    },
    unit: { control: 'inline-radio', options: ['lbs', 'kg'], description: 'Display unit' },
    animateOnMount: { control: 'boolean', description: 'Left-to-right draw animation on mount' },
  },
}

export default meta
type Story = StoryObj<typeof StrengthTrendChart>

export const Default: Story = {
  args: {
    data: actual,
    projection,
    mesoBoundaries,
    width: 340,
    height: 150,
    unit: 'lbs',
    animateOnMount: false,
  },
}

export const Compact: Story = {
  args: {
    ...Default.args,
    width: 240,
    height: 120,
  },
}

export const WithoutProjection: Story = {
  args: {
    ...Default.args,
    projection: undefined,
    mesoBoundaries: undefined,
  },
}

export const Declining: Story = {
  args: {
    data: decline,
    width: 340,
    height: 150,
    unit: 'lbs',
    animateOnMount: false,
  },
}

export const SinglePoint: Story = {
  args: {
    data: [{ date: '2026-03-17', e1rm: 244, isPR: true, sessionLabel: 'Mar 17' }],
    width: 340,
    height: 150,
    unit: 'kg',
    animateOnMount: false,
  },
}

export const Empty: Story = {
  args: {
    data: [],
    width: 340,
    height: 150,
    unit: 'lbs',
  },
}

function InteractiveChart() {
  const [selected, setSelected] = useState<StrengthTrendDataPoint | null>(null)
  return (
    <View style={{ maxWidth: 380, padding: 16 }}>
      <StrengthTrendChart
        data={actual}
        projection={projection}
        mesoBoundaries={mesoBoundaries}
        width={340}
        height={150}
        unit="lbs"
        onPointPress={setSelected}
      />
      <Text style={{ marginTop: 12, fontSize: 12, color: '#9CA3AF' }}>
        {selected
          ? `Tapped ${selected.sessionLabel ?? selected.date}: ${selected.e1rm} lbs`
          : 'Tap a point on the chart.'}
      </Text>
    </View>
  )
}

export const Interactive: Story = {
  render: () => <InteractiveChart />,
}
