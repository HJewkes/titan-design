import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { View, Text } from 'react-native'
import { Radio, RadioGroup } from './Radio'

const meta: Meta<typeof RadioGroup> = {
  title: 'Components/Molecules/Radio',
  component: RadioGroup,
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    color: {
      control: 'select',
      options: ['primary', 'secondary', 'success', 'error'],
    },
    orientation: {
      control: 'select',
      options: ['horizontal', 'vertical'],
    },
    isDisabled: {
      control: 'boolean',
    },
  },
}

export default meta
type Story = StoryObj<typeof RadioGroup>

export const Default: Story = {
  render: function Render() {
    const [value, setValue] = useState<string | null>('option1')
    return (
      <RadioGroup value={value} onChange={setValue}>
        <Radio value="option1">Option 1</Radio>
        <Radio value="option2">Option 2</Radio>
        <Radio value="option3">Option 3</Radio>
      </RadioGroup>
    )
  },
}

export const WithLabel: Story = {
  render: function Render() {
    const [value, setValue] = useState<string | null>('email')
    return (
      <RadioGroup value={value} onChange={setValue} label="Notification Preference">
        <Radio value="email">Email</Radio>
        <Radio value="sms">SMS</Radio>
        <Radio value="push">Push Notification</Radio>
        <Radio value="none">None</Radio>
      </RadioGroup>
    )
  },
}

export const Horizontal: Story = {
  render: function Render() {
    const [value, setValue] = useState<string | null>('monthly')
    return (
      <RadioGroup value={value} onChange={setValue} orientation="horizontal" label="Billing Cycle">
        <Radio value="monthly">Monthly</Radio>
        <Radio value="quarterly">Quarterly</Radio>
        <Radio value="yearly">Yearly</Radio>
      </RadioGroup>
    )
  },
}

export const AllSizes: Story = {
  render: function Render() {
    const [small, setSmall] = useState<string | null>('a')
    const [medium, setMedium] = useState<string | null>('a')
    const [large, setLarge] = useState<string | null>('a')

    return (
      <View className="gap-6">
        <View>
          <Text className="text-text-secondary text-sm mb-2">Small</Text>
          <RadioGroup value={small} onChange={setSmall} size="sm" orientation="horizontal">
            <Radio value="a">Option A</Radio>
            <Radio value="b">Option B</Radio>
          </RadioGroup>
        </View>
        <View>
          <Text className="text-text-secondary text-sm mb-2">Medium (default)</Text>
          <RadioGroup value={medium} onChange={setMedium} size="md" orientation="horizontal">
            <Radio value="a">Option A</Radio>
            <Radio value="b">Option B</Radio>
          </RadioGroup>
        </View>
        <View>
          <Text className="text-text-secondary text-sm mb-2">Large</Text>
          <RadioGroup value={large} onChange={setLarge} size="lg" orientation="horizontal">
            <Radio value="a">Option A</Radio>
            <Radio value="b">Option B</Radio>
          </RadioGroup>
        </View>
      </View>
    )
  },
}

export const AllColors: Story = {
  render: function Render() {
    const [primary, setPrimary] = useState<string | null>('a')
    const [secondary, setSecondary] = useState<string | null>('a')
    const [success, setSuccess] = useState<string | null>('a')
    const [error, setError] = useState<string | null>('a')

    return (
      <View className="gap-6">
        <RadioGroup
          value={primary}
          onChange={setPrimary}
          color="primary"
          orientation="horizontal"
          label="Primary"
        >
          <Radio value="a">Option A</Radio>
          <Radio value="b">Option B</Radio>
        </RadioGroup>
        <RadioGroup
          value={secondary}
          onChange={setSecondary}
          color="secondary"
          orientation="horizontal"
          label="Secondary"
        >
          <Radio value="a">Option A</Radio>
          <Radio value="b">Option B</Radio>
        </RadioGroup>
        <RadioGroup
          value={success}
          onChange={setSuccess}
          color="success"
          orientation="horizontal"
          label="Success"
        >
          <Radio value="a">Option A</Radio>
          <Radio value="b">Option B</Radio>
        </RadioGroup>
        <RadioGroup
          value={error}
          onChange={setError}
          color="error"
          orientation="horizontal"
          label="Error"
        >
          <Radio value="a">Option A</Radio>
          <Radio value="b">Option B</Radio>
        </RadioGroup>
      </View>
    )
  },
}

export const Disabled: Story = {
  render: function Render() {
    const [value, setValue] = useState<string | null>('option1')
    return (
      <View className="gap-6">
        <View>
          <Text className="text-text-secondary text-sm mb-2">Entire group disabled</Text>
          <RadioGroup value={value} onChange={setValue} isDisabled>
            <Radio value="option1">Option 1</Radio>
            <Radio value="option2">Option 2</Radio>
          </RadioGroup>
        </View>
        <View>
          <Text className="text-text-secondary text-sm mb-2">Individual option disabled</Text>
          <RadioGroup value={value} onChange={setValue}>
            <Radio value="option1">Option 1 (enabled)</Radio>
            <Radio value="option2" isDisabled>
              Option 2 (disabled)
            </Radio>
            <Radio value="option3">Option 3 (enabled)</Radio>
          </RadioGroup>
        </View>
      </View>
    )
  },
}

export const FormExample: Story = {
  render: function Render() {
    const [plan, setPlan] = useState<string | null>('pro')
    const [billing, setBilling] = useState<string | null>('monthly')

    return (
      <View className="gap-6 p-4 bg-surface-base rounded-lg max-w-md">
        <Text className="text-lg font-semibold text-text-primary">Subscription Settings</Text>

        <RadioGroup value={plan} onChange={setPlan} label="Select Plan">
          <Radio value="free">Free - Basic features</Radio>
          <Radio value="pro">Pro - Advanced features</Radio>
          <Radio value="enterprise">Enterprise - Custom solutions</Radio>
        </RadioGroup>

        <RadioGroup
          value={billing}
          onChange={setBilling}
          orientation="horizontal"
          label="Billing Frequency"
        >
          <Radio value="monthly">Monthly</Radio>
          <Radio value="yearly">Yearly (save 20%)</Radio>
        </RadioGroup>

        <View className="pt-4 border-t border-hairline">
          <Text className="text-sm text-text-secondary">
            Selected: {plan} plan, billed {billing}
          </Text>
        </View>
      </View>
    )
  },
}
