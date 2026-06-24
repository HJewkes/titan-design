import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { TempoDisplay } from './TempoDisplay'

// tempo = [eccentric, pauseBottom, concentric, pauseTop]
const meta: Meta<typeof TempoDisplay> = {
  title: 'Custom/Workout/TempoDisplay',
  component: TempoDisplay,
  tags: ['autodocs'],
  argTypes: {
    tempo: { control: 'object', description: 'Tempo values [eccentric, pauseBottom, concentric, pauseTop] in seconds' },
    size: { control: 'select', options: ['sm', 'md'], description: 'Size variant' },
    colored: { control: 'boolean', description: 'Colored vs mono display' },
    showInfo: { control: 'boolean', description: 'Show info tooltip on press' },
  },
}

export default meta
type Story = StoryObj<typeof TempoDisplay>

export const ColoredStandard: Story = {
  args: { tempo: [3, 1, 1, 0], colored: true },
}

export const MonoStandard: Story = {
  args: { tempo: [3, 1, 1, 0], colored: false },
}

export const ColoredExplosive: Story = {
  args: { tempo: [1, 0, 1, 0], colored: true },
}

export const MonoExplosive: Story = {
  args: { tempo: [1, 0, 1, 0], colored: false },
}

export const ColoredSlowEccentric: Story = {
  args: { tempo: [5, 2, 1, 1], colored: true },
}

export const SmallColored: Story = {
  args: { tempo: [3, 1, 1, 0], size: 'sm', colored: true },
}

export const SmallMono: Story = {
  args: { tempo: [3, 1, 1, 0], size: 'sm', colored: false },
}

export const AllVariants: Story = {
  render: () => (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <TempoDisplay tempo={[3, 1, 1, 0]} colored />
        <TempoDisplay tempo={[3, 1, 1, 0]} colored={false} />
      </View>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <TempoDisplay tempo={[1, 0, 1, 0]} colored />
        <TempoDisplay tempo={[1, 0, 1, 0]} colored={false} />
      </View>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <TempoDisplay tempo={[3, 1, 1, 0]} size="sm" colored />
        <TempoDisplay tempo={[3, 1, 1, 0]} size="sm" colored={false} />
      </View>
    </View>
  ),
}
