import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { MetricTiles } from './MetricTiles'
import { getSemanticColors } from '../../../theme'

const AMBER = getSemanticColors('dark')['status-warning']

const meta: Meta<typeof MetricTiles> = {
  title: 'Workout/MetricTiles',
  component: MetricTiles,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '**Molecule.** An HStack of [Tile](?path=/docs/components-atoms-tile--docs). Used-by ↑ SessionHeader.',
      },
    },
  },
  decorators: [
    (Story) => (
      <View style={{ width: 246 }}>
        <Story />
      </View>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof MetricTiles>

export const SessionStats: Story = {
  args: {
    metrics: [
      { label: 'Volume', value: '76%' },
      { label: 'Load', value: '7.3k' },
      { label: 'Fatigue', value: 'MOD', valueColor: AMBER },
    ],
  },
}

export const TwoTiles: Story = {
  args: {
    metrics: [
      { label: 'Time', value: '6:30 PM' },
      { label: 'Until', value: '5h', valueColor: AMBER },
    ],
  },
}

export const FourTiles: Story = {
  args: {
    metrics: [
      { label: 'Sets', value: '7/12' },
      { label: 'Volume', value: '76%' },
      { label: 'Load', value: '7.3k' },
      { label: 'Fatigue', value: 'MOD', valueColor: AMBER },
    ],
  },
}
