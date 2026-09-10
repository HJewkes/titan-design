import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { Metric, MetricGroup } from './Metric'

const meta: Meta<typeof Metric> = {
  title: 'Custom/Metric',
  component: Metric,
  tags: ['autodocs'],
  argTypes: {
    value: {
      control: 'text',
      description: 'Formatted display value',
    },
    label: {
      control: 'text',
      description: 'Descriptive label below the value',
    },
    unit: {
      control: 'text',
      description: 'Optional unit suffix',
    },
    trend: {
      control: 'select',
      options: [undefined, 'up', 'down', 'neutral'],
      description: 'Optional trend indicator arrow',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size variant',
    },
  },
}

export default meta
type Story = StoryObj<typeof Metric>

export const Default: Story = {
  args: {
    value: '42',
    label: 'Total Reps',
  },
}

export const WithUnit: Story = {
  args: {
    value: '1.24',
    label: 'Peak Velocity',
    unit: 'm/s',
  },
}

export const WithTrendUp: Story = {
  args: {
    value: '85',
    label: 'Performance',
    trend: 'up',
  },
}

export const WithTrendDown: Story = {
  args: {
    value: '62',
    label: 'Fatigue Index',
    trend: 'down',
  },
}

export const WithTrendNeutral: Story = {
  args: {
    value: '70',
    label: 'Consistency',
    trend: 'neutral',
  },
}

export const FullMetric: Story = {
  args: {
    value: '0.98',
    label: 'Mean Velocity',
    unit: 'm/s',
    trend: 'up',
    size: 'lg',
  },
}

export const Small: Story = {
  args: {
    value: '12',
    label: 'Sets',
    size: 'sm',
  },
}

export const Large: Story = {
  args: {
    value: '315',
    label: 'Max Load',
    unit: 'lbs',
    size: 'lg',
  },
}

export const AllSizes: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', gap: 32, alignItems: 'flex-end' }}>
      <Metric value="42" label="Reps" size="sm" />
      <Metric value="42" label="Reps" size="md" />
      <Metric value="42" label="Reps" size="lg" />
    </View>
  ),
}

export const Group: StoryObj<typeof MetricGroup> = {
  render: () => (
    <MetricGroup>
      <Metric value="12" label="Sets" />
      <Metric value="42" label="Reps" />
      <Metric value="1.24" label="Avg Velocity" unit="m/s" trend="up" />
    </MetricGroup>
  ),
}

export const GroupSmall: StoryObj<typeof MetricGroup> = {
  render: () => (
    <MetricGroup>
      <Metric value="8" label="Sets" size="sm" />
      <Metric value="315" label="Load" unit="lbs" size="sm" />
      <Metric value="0.82" label="Velocity" unit="m/s" size="sm" trend="down" />
      <Metric value="92" label="Score" size="sm" trend="up" />
    </MetricGroup>
  ),
}
