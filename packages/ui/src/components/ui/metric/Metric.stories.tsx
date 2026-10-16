import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { Metric } from './Metric'

const meta: Meta<typeof Metric> = {
  title: 'Components/Molecules/Metric',
  component: Metric,
  tags: ['autodocs', 'status:candidate', '!status:review'],
  args: { value: '76', label: 'Volume', unit: '%', size: 'md', align: 'center' },
  argTypes: {
    value: { control: 'text', description: 'Formatted display value' },
    label: { control: 'text', description: 'Descriptive label below the value' },
    unit: { control: 'text', description: 'Optional unit suffix' },
    trend: {
      control: 'select',
      options: [undefined, 'up', 'down', 'neutral'],
      description: 'Optional trend indicator arrow',
    },
    size: { control: 'select', options: ['sm', 'md', 'lg'], description: 'Size variant' },
    align: {
      control: 'inline-radio',
      options: ['start', 'center', 'end'],
      description: 'Cross-axis placement of the figure and label',
    },
    tone: {
      control: 'select',
      options: [undefined, 'neutral', 'brand', 'success', 'warning', 'error', 'info'],
      description: 'Semantic colour of the value',
    },
  },
  decorators: [
    (Story) => (
      <View className="w-64">
        <Story />
      </View>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          '**Molecule**. Composes RN primitives only. `MetricGroup` arranges several with a ' +
          'divider rule between them. Use the `align`, `tone`, `size` and `trend` controls to switch.',
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof Metric>

export const Default: Story = {}
