import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import { DataRow } from './DataRow'

const meta: Meta<typeof DataRow> = {
  title: 'Components/DataRow',
  component: DataRow,
  tags: ['autodocs'],
  argTypes: {
    label: {
      control: 'text',
      description: 'Descriptive label shown on the left',
    },
    value: {
      control: 'text',
      description: 'Value shown on the right (string or ReactNode)',
    },
  },
}

export default meta
type Story = StoryObj<typeof DataRow>

export const Default: Story = {
  args: {
    label: 'Weight',
    value: '185 lbs',
  },
}

export const WithNumber: Story = {
  args: {
    label: 'Sets Completed',
    value: '5',
  },
}

export const WithCustomValue: Story = {
  render: () => (
    <DataRow
      label="Status"
      value={
        <View style={{ backgroundColor: '#22c55e', borderRadius: 9999, paddingHorizontal: 8, paddingVertical: 2 }}>
          <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>Active</Text>
        </View>
      }
    />
  ),
}

export const WithValueClassName: Story = {
  args: {
    label: 'Peak Velocity',
    value: '1.25 m/s',
    valueClassName: 'text-brand-primary font-bold',
  },
}

export const MultipleRows: Story = {
  render: () => (
    <View style={{ gap: 0 }}>
      <DataRow label="Exercise" value="Back Squat" />
      <DataRow label="Weight" value="185 lbs" />
      <DataRow label="Sets" value="5" />
      <DataRow label="Reps" value="5" />
      <DataRow label="Mean Velocity" value="0.75 m/s" />
      <DataRow label="Peak Velocity" value="1.25 m/s" valueClassName="font-bold" />
    </View>
  ),
}

export const CustomClassName: Story = {
  args: {
    label: 'Bordered Row',
    value: 'With custom styles',
    className: 'border-b border-border-primary px-4',
  },
}
