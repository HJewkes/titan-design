import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { IntensityBar } from './IntensityBar'

const meta: Meta<typeof IntensityBar> = {
  title: 'Custom/Workout/IntensityBar',
  component: IntensityBar,
  tags: ['autodocs'],
  argTypes: {
    level: {
      control: { type: 'range', min: 0, max: 140, step: 5 },
      description: 'Intensity percentage (0-140)',
    },
    target: {
      control: { type: 'range', min: 0, max: 100, step: 5 },
      description: 'Target percentage (blue line)',
    },
    height: { control: 'number', description: 'Bar height in pixels' },
    showLabel: { control: 'boolean', description: 'Show percentage label below bar' },
  },
}

export default meta
type Story = StoryObj<typeof IntensityBar>

export const Building: Story = {
  args: { level: 50, target: 85, showLabel: true },
}

export const Approaching: Story = {
  args: { level: 85, target: 85, showLabel: true },
}

export const AtTarget: Story = {
  args: { level: 96, target: 95, showLabel: true },
}

export const Over110: Story = {
  args: { level: 110, target: 85, showLabel: true },
}

export const Over120: Story = {
  args: { level: 120, target: 85, showLabel: true },
}

export const Over130: Story = {
  args: { level: 130, target: 85, showLabel: true },
}

export const AllLevels: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', gap: 16, alignItems: 'flex-end', padding: 16 }}>
      <IntensityBar level={30} target={85} showLabel />
      <IntensityBar level={60} target={85} showLabel />
      <IntensityBar level={80} target={85} showLabel />
      <IntensityBar level={90} target={85} showLabel />
      <IntensityBar level={97} target={95} showLabel />
      <IntensityBar level={110} target={85} showLabel />
      <IntensityBar level={120} target={85} showLabel />
      <IntensityBar level={130} target={85} showLabel />
    </View>
  ),
}
