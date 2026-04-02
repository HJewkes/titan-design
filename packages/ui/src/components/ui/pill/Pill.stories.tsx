import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { Pill } from './Pill'
import { Indicator } from '../indicator'

const meta: Meta<typeof Pill> = {
  title: 'Components/Pill',
  component: Pill,
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['subtle', 'outline'] },
    color: { control: 'select', options: ['default', 'primary', 'secondary', 'success', 'error', 'warning', 'info'] },
    size: { control: 'select', options: ['xs', 'sm', 'md'] },
    rounded: { control: 'boolean' },
  },
}
export default meta
type Story = StoryObj<typeof Pill>

export const Default: Story = { args: { children: 'Label', color: 'primary' } }

export const AllVariants: Story = {
  render: () => (
    <View className="flex-row gap-2">
      <Pill variant="subtle" color="primary">Subtle</Pill>
      <Pill variant="outline" color="primary">Outline</Pill>
    </View>
  ),
}

export const AllColors: Story = {
  render: () => (
    <View className="flex-row gap-2 flex-wrap">
      <Pill color="default">Default</Pill>
      <Pill color="primary">Primary</Pill>
      <Pill color="success">Success</Pill>
      <Pill color="error">Error</Pill>
      <Pill color="warning">Warning</Pill>
      <Pill color="info">Info</Pill>
    </View>
  ),
}

export const AllSizes: Story = {
  render: () => (
    <View className="flex-row gap-2 items-center">
      <Pill size="xs" color="primary">XS</Pill>
      <Pill size="sm" color="primary">SM</Pill>
      <Pill size="md" color="primary">MD</Pill>
    </View>
  ),
}

export const WithDot: Story = {
  render: () => (
    <View className="flex-row gap-2">
      <Pill color="success" leftElement={<Indicator size="xs" color="success" />}>Active</Pill>
      <Pill color="error" leftElement={<Indicator size="xs" color="error" />}>Failed</Pill>
      <Pill color="warning" leftElement={<Indicator size="xs" color="warning" />}>Pending</Pill>
    </View>
  ),
}

export const SquareCorners: Story = {
  render: () => (
    <View className="flex-row gap-2">
      <Pill rounded={false} color="primary">Tag</Pill>
      <Pill rounded={false} color="success">Done</Pill>
    </View>
  ),
}
