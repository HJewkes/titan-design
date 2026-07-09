import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { Spinner } from './Spinner'

const meta: Meta<typeof Spinner> = {
  title: 'Components/Atoms/Spinner',
  component: Spinner,
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl'],
      description: 'Spinner size',
    },
    color: {
      control: 'select',
      options: ['primary', 'secondary', 'white', 'default'],
      description: 'Color scheme',
    },
    label: {
      control: 'text',
      description: 'Accessibility label',
    },
  },
}

export default meta
type Story = StoryObj<typeof Spinner>

export const Default: Story = {
  args: {
    size: 'md',
    color: 'primary',
  },
}

export const AllSizes: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
      <Spinner size="sm" />
      <Spinner size="md" />
      <Spinner size="lg" />
      <Spinner size="xl" />
    </View>
  ),
}

export const AllColors: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
      <Spinner color="primary" />
      <Spinner color="secondary" />
      <Spinner color="default" />
      <View className="bg-surface-elevated p-2 rounded-md">
        <Spinner color="white" />
      </View>
    </View>
  ),
}

export const WithCustomLabel: Story = {
  args: {
    size: 'lg',
    color: 'primary',
    label: 'Fetching data...',
  },
}
