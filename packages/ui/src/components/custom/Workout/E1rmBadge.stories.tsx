import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { E1rmBadge } from './E1rmBadge'

const meta: Meta<typeof E1rmBadge> = {
  title: 'Custom/Workout/E1rmBadge',
  component: E1rmBadge,
  tags: ['autodocs'],
  argTypes: {
    value: { control: 'number', description: 'Estimated 1RM value' },
    unit: { control: 'select', options: ['lbs', 'kg'], description: 'Unit system' },
    showIcon: { control: 'boolean', description: 'Show crown icon' },
    isPr: { control: 'boolean', description: 'Apply PR styling (orange bg, star)' },
    size: { control: 'select', options: ['sm', 'md', 'lg'], description: 'Badge size' },
    delta: { control: 'number', description: 'Percentage change since last mesocycle' },
    onPress: { action: 'pressed', description: 'Callback when tapped' },
  },
}

export default meta
type Story = StoryObj<typeof E1rmBadge>

export const Default: Story = {
  args: { value: 217, unit: 'lbs' },
}

export const WithoutIcon: Story = {
  args: { value: 217, unit: 'lbs', showIcon: false },
}

export const WithPr: Story = {
  args: { value: 217, unit: 'lbs', isPr: true },
}

export const WithPositiveDelta: Story = {
  args: { value: 217, unit: 'lbs', delta: 3 },
}

export const WithNegativeDelta: Story = {
  args: { value: 217, unit: 'lbs', delta: -2 },
}

export const PrWithDelta: Story = {
  args: { value: 217, unit: 'lbs', isPr: true, delta: 3, size: 'lg' },
}

export const AllVariants: Story = {
  render: () => (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <E1rmBadge value={217} unit="lbs" size="sm" />
        <E1rmBadge value={217} unit="lbs" size="md" />
        <E1rmBadge value={217} unit="lbs" size="lg" />
      </View>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <E1rmBadge value={217} unit="lbs" size="sm" showIcon={false} />
        <E1rmBadge value={217} unit="lbs" size="md" showIcon={false} />
        <E1rmBadge value={217} unit="lbs" size="lg" showIcon={false} />
      </View>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <E1rmBadge value={217} unit="lbs" size="sm" isPr />
        <E1rmBadge value={217} unit="lbs" size="md" isPr />
        <E1rmBadge value={217} unit="lbs" size="lg" isPr />
      </View>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <E1rmBadge value={217} unit="lbs" delta={3} />
        <E1rmBadge value={217} unit="lbs" delta={-2} />
      </View>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <E1rmBadge value={217} unit="lbs" isPr delta={3} size="lg" />
      </View>
    </View>
  ),
}
