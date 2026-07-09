import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import { Progress, CircularProgress, ProgressSteps } from './Progress'

const meta: Meta<typeof Progress> = {
  title: 'Components/Molecules/Progress',
  component: Progress,
  tags: ['autodocs'],
  argTypes: {
    value: {
      control: { type: 'range', min: 0, max: 100, step: 1 },
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    color: {
      control: 'select',
      options: ['primary', 'secondary', 'success', 'error', 'warning', 'info'],
    },
    isIndeterminate: {
      control: 'boolean',
    },
    showValue: {
      control: 'boolean',
    },
  },
}

export default meta
type Story = StoryObj<typeof Progress>

export const Default: Story = {
  args: {
    value: 60,
    size: 'md',
    color: 'primary',
  },
}

export const WithLabel: Story = {
  args: {
    value: 45,
    label: 'Uploading files...',
    showValue: true,
  },
}

export const AllSizes: Story = {
  render: () => (
    <View className="gap-6 w-64">
      <View>
        <Text className="text-text-secondary text-sm mb-2">Small</Text>
        <Progress value={60} size="sm" />
      </View>
      <View>
        <Text className="text-text-secondary text-sm mb-2">Medium</Text>
        <Progress value={60} size="md" />
      </View>
      <View>
        <Text className="text-text-secondary text-sm mb-2">Large</Text>
        <Progress value={60} size="lg" />
      </View>
    </View>
  ),
}

export const AllColors: Story = {
  render: () => (
    <View className="gap-4 w-64">
      <Progress value={75} color="primary" label="Primary" showValue />
      <Progress value={75} color="secondary" label="Secondary" showValue />
      <Progress value={75} color="success" label="Success" showValue />
      <Progress value={75} color="error" label="Error" showValue />
      <Progress value={75} color="warning" label="Warning" showValue />
      <Progress value={75} color="info" label="Info" showValue />
    </View>
  ),
}

export const Indeterminate: Story = {
  args: {
    isIndeterminate: true,
    label: 'Loading...',
  },
}

export const CustomFormat: Story = {
  args: {
    value: 750,
    max: 1000,
    showValue: true,
    label: 'Storage used',
    formatValue: (value, max) => `${value} MB / ${max} MB`,
  },
}

export const Circular: Story = {
  render: () => (
    <View className="flex-row gap-6 items-center">
      <CircularProgress value={25} showValue />
      <CircularProgress value={50} showValue />
      <CircularProgress value={75} showValue />
      <CircularProgress value={100} showValue />
    </View>
  ),
}

export const CircularSizes: Story = {
  render: () => (
    <View className="flex-row gap-6 items-center">
      <CircularProgress value={60} size={32} strokeWidth={3} showValue />
      <CircularProgress value={60} size={48} strokeWidth={4} showValue />
      <CircularProgress value={60} size={64} strokeWidth={5} showValue />
      <CircularProgress value={60} size={80} strokeWidth={6} showValue />
    </View>
  ),
}

export const Steps: Story = {
  render: () => (
    <View className="gap-8">
      <ProgressSteps
        currentStep={1}
        totalSteps={4}
        labels={['Cart', 'Shipping', 'Payment', 'Done']}
      />
      <ProgressSteps
        currentStep={2}
        totalSteps={4}
        color="success"
        labels={['Step 1', 'Step 2', 'Step 3', 'Step 4']}
      />
      <ProgressSteps
        currentStep={0}
        totalSteps={5}
        size="lg"
      />
    </View>
  ),
}

export const UsageExamples: Story = {
  render: () => (
    <View className="gap-6">
      {/* File upload */}
      <View className="p-4 bg-surface-elevated rounded-lg">
        <Text className="text-text-primary font-medium mb-3">File Upload</Text>
        <Progress value={67} label="document.pdf" showValue />
      </View>

      {/* Storage quota */}
      <View className="p-4 bg-surface-elevated rounded-lg">
        <Text className="text-text-primary font-medium mb-3">Storage</Text>
        <Progress
          value={8.5}
          max={10}
          color="warning"
          label="8.5 GB of 10 GB used"
        />
      </View>

      {/* Checkout steps */}
      <View className="p-4 bg-surface-elevated rounded-lg">
        <Text className="text-text-primary font-medium mb-3">Checkout Progress</Text>
        <ProgressSteps
          currentStep={2}
          totalSteps={4}
          labels={['Cart', 'Shipping', 'Payment', 'Confirm']}
        />
      </View>

      {/* Loading stats */}
      <View className="p-4 bg-surface-elevated rounded-lg flex-row gap-4">
        <View className="items-center">
          <CircularProgress value={87} size={56} showValue color="success" />
          <Text className="text-xs text-text-secondary mt-1">Success Rate</Text>
        </View>
        <View className="items-center">
          <CircularProgress value={45} size={56} showValue color="warning" />
          <Text className="text-xs text-text-secondary mt-1">Performance</Text>
        </View>
        <View className="items-center">
          <CircularProgress value={12} size={56} showValue color="error" />
          <Text className="text-xs text-text-secondary mt-1">Error Rate</Text>
        </View>
      </View>
    </View>
  ),
}
