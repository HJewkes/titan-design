import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { StatusPill } from './StatusPill'

const meta: Meta<typeof StatusPill> = {
  title: 'Workout/StatusPill',
  component: StatusPill,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Auto-regulation verdict pill — a glowing status dot plus colored verdict text in a ' +
          'tinted capsule. Composes `StatusDot`; tint, border, text, and dot all derive from the ' +
          'same semantic status token (success / warning / error).',
      },
    },
  },
  argTypes: {
    status: {
      control: 'select',
      options: ['productive', 'threshold', 'stop'],
      description: 'Auto-regulation verdict',
    },
    label: {
      control: 'text',
      description: 'Overrides the default verdict text',
    },
  },
}

export default meta
type Story = StoryObj<typeof StatusPill>

export const Productive: Story = {
  args: { status: 'productive' },
}

export const Threshold: Story = {
  args: { status: 'threshold' },
}

export const Stop: Story = {
  args: { status: 'stop' },
}

export const WithCustomLabel: Story = {
  args: { status: 'stop', label: 'Stop · velocity loss 31%' },
}

export const AllStates: Story = {
  render: () => (
    <View style={{ gap: 10, alignItems: 'flex-start' }}>
      <StatusPill status="productive" label="Productive · in the band" />
      <StatusPill status="threshold" label="Threshold · VL20 reached" />
      <StatusPill status="stop" label="Stop · velocity loss 31%" />
    </View>
  ),
}
