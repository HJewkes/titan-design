import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { StatusDot } from './StatusDot'

const meta: Meta<typeof StatusDot> = {
  title: 'Components/Atoms/StatusDot',
  component: StatusDot,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['success', 'warning', 'error', 'neutral', 'on-track', 'deviation', 'future'],
      description: 'Status variant',
    },
    icon: {
      control: 'select',
      options: [undefined, 'check', 'exclamation', 'dash'],
      description: 'Icon character inside the dot',
    },
    size: {
      control: 'select',
      options: ['sm', 'md'],
      description: 'Dot size',
    },
    glow: {
      control: 'boolean',
      description: 'Subtle glow effect in variant color',
    },
    label: {
      control: 'text',
      description: 'Optional label text next to dot',
    },
  },
}

export default meta
type Story = StoryObj<typeof StatusDot>

export const Success: Story = {
  args: {
    variant: 'success',
    size: 'md',
    icon: 'check',
  },
}

export const Warning: Story = {
  args: {
    variant: 'warning',
    size: 'md',
    icon: 'exclamation',
  },
}

export const Error: Story = {
  args: {
    variant: 'error',
    size: 'md',
    icon: 'dash',
  },
}

export const Neutral: Story = {
  args: {
    variant: 'neutral',
    size: 'sm',
  },
}

export const OnTrack: Story = {
  args: {
    variant: 'on-track',
    size: 'md',
    icon: 'check',
  },
}

export const Deviation: Story = {
  args: {
    variant: 'deviation',
    size: 'md',
    icon: 'exclamation',
  },
}

export const Future: Story = {
  args: {
    variant: 'future',
    size: 'md',
  },
}

export const WithGlow: Story = {
  args: {
    variant: 'success',
    size: 'md',
    icon: 'check',
    glow: true,
  },
}

export const WithLabel: Story = {
  args: {
    variant: 'success',
    size: 'md',
    icon: 'check',
    label: 'On track',
  },
}

export const SmallWithLabel: Story = {
  args: {
    variant: 'warning',
    size: 'sm',
    label: 'Needs attention',
  },
}

export const AllVariants: Story = {
  render: () => (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
        <StatusDot variant="success" size="sm" />
        <StatusDot variant="warning" size="sm" />
        <StatusDot variant="error" size="sm" />
        <StatusDot variant="neutral" size="sm" />
        <StatusDot variant="on-track" size="sm" />
        <StatusDot variant="deviation" size="sm" />
        <StatusDot variant="future" size="sm" />
      </View>
      <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
        <StatusDot variant="success" size="md" icon="check" />
        <StatusDot variant="warning" size="md" icon="exclamation" />
        <StatusDot variant="error" size="md" icon="dash" />
        <StatusDot variant="neutral" size="md" />
        <StatusDot variant="on-track" size="md" icon="check" />
        <StatusDot variant="deviation" size="md" icon="exclamation" />
        <StatusDot variant="future" size="md" />
      </View>
      <View style={{ gap: 8 }}>
        <StatusDot variant="success" size="md" icon="check" label="On track" />
        <StatusDot variant="on-track" size="md" icon="check" label="On track (ring)" glow />
        <StatusDot variant="deviation" size="md" icon="exclamation" label="Deviation" glow />
        <StatusDot variant="future" size="sm" label="Planned" />
        <StatusDot variant="error" size="md" icon="dash" label="Failed" />
        <StatusDot variant="neutral" size="sm" label="Planned" />
      </View>
    </View>
  ),
}
