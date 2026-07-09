import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { IntensityBar } from './IntensityBar'

const meta: Meta<typeof IntensityBar> = {
  title: 'Workout/DataViz/IntensityBar',
  component: IntensityBar,
  tags: ['autodocs'],
  argTypes: {
    level: {
      control: { type: 'range', min: 0, max: 1, step: 0.05 },
      description: 'Intensity level (0-1)',
    },
    threshold: {
      control: { type: 'range', min: 0, max: 1, step: 0.05 },
      description: 'MRV/overexertion threshold position (0-1)',
    },
    orientation: {
      control: { type: 'radio' },
      options: ['vertical', 'horizontal'],
      description: 'Bar orientation',
    },
    size: { control: 'number', description: 'Length along the fill axis (px)' },
    thickness: { control: 'number', description: 'Bar thickness (px)' },
    showThresholdLabel: { control: 'boolean', description: 'Show MRV label' },
  },
}

export default meta
type Story = StoryObj<typeof IntensityBar>

export const Low: Story = {
  args: { level: 0.3, threshold: 0.85, showThresholdLabel: true },
}

export const Moderate: Story = {
  args: { level: 0.55, threshold: 0.85, showThresholdLabel: true },
}

export const High: Story = {
  args: { level: 0.85, threshold: 0.85, showThresholdLabel: true },
}

export const Horizontal: Story = {
  args: { level: 0.6, threshold: 0.85, orientation: 'horizontal', size: 120 },
}

export const AllZones: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', gap: 16, alignItems: 'flex-end', padding: 16 }}>
      <IntensityBar level={0.2} threshold={0.85} showThresholdLabel />
      <IntensityBar level={0.35} threshold={0.85} showThresholdLabel />
      <IntensityBar level={0.5} threshold={0.85} showThresholdLabel />
      <IntensityBar level={0.65} threshold={0.85} showThresholdLabel />
      <IntensityBar level={0.75} threshold={0.85} showThresholdLabel />
      <IntensityBar level={0.9} threshold={0.85} showThresholdLabel />
      <IntensityBar level={1.0} threshold={0.85} showThresholdLabel />
    </View>
  ),
}
