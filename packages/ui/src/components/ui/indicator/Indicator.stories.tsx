import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { Indicator } from './Indicator'

const meta: Meta<typeof Indicator> = {
  title: 'Components/Indicator',
  component: Indicator,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['xs', 'sm', 'md', 'lg'] },
    color: {
      control: 'select',
      options: ['default', 'primary', 'success', 'live', 'error', 'warning', 'info'],
    },
    glow: { control: 'boolean' },
    ring: { control: 'boolean' },
  },
}
export default meta
type Story = StoryObj<typeof Indicator>

export const Default: Story = { args: { color: 'primary', size: 'md' } }

export const AllSizes: Story = {
  render: () => (
    <View className="flex-row gap-4 items-center">
      <Indicator size="xs" color="primary" />
      <Indicator size="sm" color="primary" />
      <Indicator size="md" color="primary" />
      <Indicator size="lg" color="primary" />
    </View>
  ),
}

export const AllColors: Story = {
  render: () => (
    <View className="flex-row gap-4 items-center">
      <Indicator size="md" color="default" />
      <Indicator size="md" color="primary" />
      <Indicator size="md" color="success" />
      <Indicator size="md" color="error" />
      <Indicator size="md" color="warning" />
      <Indicator size="md" color="info" />
    </View>
  ),
}

export const WithGlow: Story = {
  render: () => (
    <View className="flex-row gap-6 items-center p-4 bg-surface-base">
      <Indicator size="md" color="success" glow />
      <Indicator size="md" color="error" glow />
      <Indicator size="md" color="warning" glow />
      <Indicator size="md" color="primary" glow />
    </View>
  ),
}

export const WithRing: Story = {
  render: () => (
    <View className="flex-row gap-4 items-center">
      <Indicator size="md" color="success" ring />
      <Indicator size="md" color="error" ring />
      <Indicator size="lg" color="primary" ring />
    </View>
  ),
}

export const CustomColor: Story = {
  render: () => (
    <View className="flex-row gap-4 items-center">
      <Indicator size="md" customColor="#FF6B6B" />
      <Indicator size="md" customColor="#4ECDC4" />
      <Indicator size="md" customColor="#45B7D1" glow />
    </View>
  ),
}

export const Pulse: Story = {
  render: () => (
    <View className="flex-row gap-6 items-center">
      <Indicator size="md" color="success" pulse />
      <Indicator size="md" color="success" pulse="ping" />
      <Indicator size="md" color="warning" />
      <Indicator size="md" color="default" />
    </View>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Opacity pulse (default), expanding-ring pulse (`pulse="ping"`, green for live), solid, dim.',
      },
    },
  },
}

export const Vivid: Story = {
  render: () => (
    <View className="flex-row gap-4 items-center">
      <Indicator size="md" color="success" />
      <Indicator size="md" color="success" />
      <Indicator size="md" color="error" />
      <Indicator size="md" color="error-vivid" />
    </View>
  ),
  parameters: {
    docs: { description: { story: 'Standard status vs the vivid palette (success/error).' } },
  },
}
