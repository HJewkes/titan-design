import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { PrBadge } from './PrBadge'

const meta: Meta<typeof PrBadge> = {
  title: 'Custom/Workout/PrBadge',
  component: PrBadge,
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['e1rm', 'weight', 'reps', 'volume', 'velocity'],
      description: 'PR type determines auto-generated label',
    },
    label: {
      control: 'text',
      description: 'Custom label (overrides auto-generated)',
    },
    compact: {
      control: 'boolean',
      description: 'Show only star icon, no text',
    },
    animate: {
      control: 'boolean',
      description: 'Trigger pop animation on mount',
    },
  },
}

export default meta
type Story = StoryObj<typeof PrBadge>

export const Animated: Story = {
  args: {
    animate: true,
    type: 'e1rm',
  },
}

export const Static: Story = {
  args: {
    animate: false,
    type: 'e1rm',
  },
}

export const WeightPr: Story = {
  args: {
    type: 'weight',
    animate: false,
  },
}

export const RepsPr: Story = {
  args: {
    type: 'reps',
    animate: false,
  },
}

export const VelocityPr: Story = {
  args: {
    type: 'velocity',
    animate: false,
  },
}

export const CustomLabel: Story = {
  args: {
    label: 'PR 5RM',
    animate: false,
  },
}

export const Compact: Story = {
  args: {
    compact: true,
    animate: false,
  },
}

export const CompactAnimated: Story = {
  args: {
    compact: true,
    animate: true,
  },
}

export const AllTypes: Story = {
  render: () => (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
        <PrBadge type="e1rm" animate={false} />
        <PrBadge type="weight" animate={false} />
        <PrBadge type="reps" animate={false} />
        <PrBadge type="volume" animate={false} />
        <PrBadge type="velocity" animate={false} />
      </View>
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
        <PrBadge compact animate={false} />
        <PrBadge label="PR 5RM" animate={false} />
      </View>
    </View>
  ),
}
