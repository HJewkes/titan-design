import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { DeviationBar } from './DeviationBar'

const meta: Meta<typeof DeviationBar> = {
  title: 'Workout/DataViz/DeviationBar',
  component: DeviationBar,
  tags: ['autodocs'],
  argTypes: {
    deviation: {
      control: { type: 'range', min: -1, max: 1, step: 0.1 },
      description: 'Deviation from plan (-1 to +1)',
    },
    width: {
      control: 'number',
      description: 'Width of the bar in pixels',
    },
  },
}

export default meta
type Story = StoryObj<typeof DeviationBar>

export const OnPlan: Story = {
  args: { deviation: 0 },
}

export const SlightlyLighter: Story = {
  args: { deviation: -0.2 },
}

export const MuchLighter: Story = {
  args: { deviation: -0.8 },
}

export const SlightlyHarder: Story = {
  args: { deviation: 0.3 },
}

export const MuchHarder: Story = {
  args: { deviation: 0.9 },
}

export const FullRange: Story = {
  render: () => (
    <View style={{ gap: 8 }}>
      {[-1, -0.7, -0.3, 0, 0.3, 0.7, 1].map((d) => (
        <View key={d} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <DeviationBar deviation={d} />
        </View>
      ))}
    </View>
  ),
}

export const WideBar: Story = {
  args: { deviation: 0.5, width: 80 },
}
