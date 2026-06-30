import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { WeightBadge } from './WeightBadge'

const meta: Meta<typeof WeightBadge> = {
  title: 'Custom/Workout/WeightBadge',
  component: WeightBadge,
  tags: ['autodocs'],
  argTypes: {
    value: { control: 'number', description: 'Weight value' },
    unit: { control: 'select', options: ['lbs', 'kg'], description: 'Unit system' },
    reps: {
      control: 'number',
      description: 'N-rep max context (omit for estimated 1RM)',
    },
    showIcon: { control: 'boolean', description: 'Show the weight icon' },
    isPr: { control: 'boolean', description: 'Apply PR styling (orange bg, star)' },
    size: { control: 'select', options: ['sm', 'md', 'lg'], description: 'Badge size' },
    delta: { control: 'number', description: 'Percentage change since last mesocycle' },
    onPress: { action: 'pressed', description: 'Callback when tapped' },
  },
}

export default meta
type Story = StoryObj<typeof WeightBadge>

export const Default: Story = {
  args: { value: 217, unit: 'lbs' },
}

export const WithoutIcon: Story = {
  args: { value: 217, unit: 'lbs', showIcon: false },
}

export const RepMax: Story = {
  args: { value: 275, unit: 'lbs', reps: 5 },
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
        <WeightBadge value={217} unit="lbs" size="sm" />
        <WeightBadge value={217} unit="lbs" size="md" />
        <WeightBadge value={217} unit="lbs" size="lg" />
      </View>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <WeightBadge value={217} unit="lbs" size="sm" showIcon={false} />
        <WeightBadge value={217} unit="lbs" size="md" showIcon={false} />
        <WeightBadge value={217} unit="lbs" size="lg" showIcon={false} />
      </View>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <WeightBadge value={275} unit="lbs" reps={5} />
        <WeightBadge value={315} unit="lbs" reps={3} />
        <WeightBadge value={185} unit="lbs" reps={8} />
      </View>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <WeightBadge value={217} unit="lbs" size="sm" isPr />
        <WeightBadge value={217} unit="lbs" size="md" isPr />
        <WeightBadge value={217} unit="lbs" size="lg" isPr />
      </View>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <WeightBadge value={217} unit="lbs" delta={3} />
        <WeightBadge value={217} unit="lbs" delta={-2} />
      </View>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <WeightBadge value={217} unit="lbs" isPr delta={3} size="lg" />
      </View>
    </View>
  ),
}
