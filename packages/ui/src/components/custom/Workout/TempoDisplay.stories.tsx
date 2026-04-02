import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { TempoDisplay } from './TempoDisplay'

const meta: Meta<typeof TempoDisplay> = {
  title: 'Custom/Workout/TempoDisplay',
  component: TempoDisplay,
  tags: ['autodocs'],
  argTypes: {
    concentric: { control: 'number', description: 'Concentric phase duration (seconds)' },
    hold: { control: 'number', description: 'Hold at top (seconds)' },
    eccentric: { control: 'number', description: 'Eccentric phase duration (seconds)' },
    idle: { control: 'number', description: 'Idle between reps (seconds)' },
    size: { control: 'select', options: ['sm', 'md'], description: 'Size variant' },
    colored: { control: 'boolean', description: 'Colored vs mono display' },
  },
}

export default meta
type Story = StoryObj<typeof TempoDisplay>

export const ColoredStandard: Story = {
  args: { concentric: 1, hold: 1, eccentric: 3, idle: 0, colored: true },
}

export const MonoStandard: Story = {
  args: { concentric: 1, hold: 1, eccentric: 3, idle: 0, colored: false },
}

export const ColoredExplosive: Story = {
  args: { concentric: 1, hold: 0, eccentric: 1, idle: 0, colored: true },
}

export const MonoExplosive: Story = {
  args: { concentric: 1, hold: 0, eccentric: 1, idle: 0, colored: false },
}

export const ColoredSlowEccentric: Story = {
  args: { concentric: 1, hold: 2, eccentric: 5, idle: 1, colored: true },
}

export const SmallColored: Story = {
  args: { concentric: 1, hold: 1, eccentric: 3, idle: 0, size: 'sm', colored: true },
}

export const SmallMono: Story = {
  args: { concentric: 1, hold: 1, eccentric: 3, idle: 0, size: 'sm', colored: false },
}

export const AllVariants: Story = {
  render: () => (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <TempoDisplay concentric={1} hold={1} eccentric={3} idle={0} colored />
        <TempoDisplay concentric={1} hold={1} eccentric={3} idle={0} colored={false} />
      </View>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <TempoDisplay concentric={1} hold={0} eccentric={1} idle={0} colored />
        <TempoDisplay concentric={1} hold={0} eccentric={1} idle={0} colored={false} />
      </View>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <TempoDisplay concentric={1} hold={1} eccentric={3} idle={0} size="sm" colored />
        <TempoDisplay concentric={1} hold={1} eccentric={3} idle={0} size="sm" colored={false} />
      </View>
    </View>
  ),
}
