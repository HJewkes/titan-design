import type { Meta, StoryObj } from '@storybook/react'
import { View, Text, TextInput } from 'react-native'
import { FormField, FormSection, FormActions, FormRow } from './FormField'
import { Button, ButtonText } from '../button'
import { Input } from '../input'

const meta: Meta<typeof FormField> = {
  title: 'Components/FormField',
  component: FormField,
  argTypes: {
    labelSize: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    orientation: {
      control: 'select',
      options: ['vertical', 'horizontal'],
    },
    isRequired: {
      control: 'boolean',
    },
    isDisabled: {
      control: 'boolean',
    },
  },
}

export default meta
type Story = StoryObj<typeof FormField>

// Simple input for stories
function SimpleInput({ isInvalid, isDisabled, ...props }: any) {
  return (
    <View
      className={`border rounded-md px-3 py-2 bg-surface-input ${
        isInvalid ? 'border-status-error' : 'border-border-input'
      } ${isDisabled ? 'opacity-50' : ''}`}
    >
      <TextInput
        className="text-text-primary"
        placeholderTextColor="#6b7280"
        editable={!isDisabled}
        {...props}
      />
    </View>
  )
}

export const Default: Story = {
  render: () => (
    <View className="w-80">
      <FormField label="Email Address">
        <SimpleInput placeholder="Enter your email" />
      </FormField>
    </View>
  ),
}

export const Required: Story = {
  render: () => (
    <View className="w-80">
      <FormField label="Email Address" isRequired>
        <SimpleInput placeholder="Enter your email" />
      </FormField>
    </View>
  ),
}

export const WithHelperText: Story = {
  render: () => (
    <View className="w-80">
      <FormField
        label="Username"
        helperText="Choose a unique username between 3-20 characters"
      >
        <SimpleInput placeholder="Enter username" />
      </FormField>
    </View>
  ),
}

export const WithError: Story = {
  render: () => (
    <View className="w-80">
      <FormField
        label="Password"
        isRequired
        errorMessage="Password must be at least 8 characters"
      >
        <SimpleInput placeholder="Enter password" isInvalid />
      </FormField>
    </View>
  ),
}

export const Disabled: Story = {
  render: () => (
    <View className="w-80">
      <FormField label="Email Address" isDisabled>
        <SimpleInput placeholder="Enter your email" isDisabled />
      </FormField>
    </View>
  ),
}

export const LabelSizes: Story = {
  render: () => (
    <View className="gap-6 w-80">
      <FormField label="Small Label" labelSize="sm">
        <SimpleInput placeholder="Small" />
      </FormField>
      <FormField label="Medium Label" labelSize="md">
        <SimpleInput placeholder="Medium" />
      </FormField>
      <FormField label="Large Label" labelSize="lg">
        <SimpleInput placeholder="Large" />
      </FormField>
    </View>
  ),
}

export const HorizontalLayout: Story = {
  render: () => (
    <View className="gap-4 w-96">
      <FormField label="Name" orientation="horizontal" labelWidth={100}>
        <SimpleInput placeholder="Enter name" />
      </FormField>
      <FormField label="Email" orientation="horizontal" labelWidth={100} isRequired>
        <SimpleInput placeholder="Enter email" />
      </FormField>
      <FormField
        label="Bio"
        orientation="horizontal"
        labelWidth={100}
        helperText="Brief description about yourself"
      >
        <SimpleInput placeholder="Enter bio" />
      </FormField>
    </View>
  ),
}

export const FormRowExample: Story = {
  render: () => (
    <View className="w-full max-w-lg">
      <FormRow>
        <FormField label="First Name" isRequired className="flex-1">
          <SimpleInput placeholder="John" />
        </FormField>
        <FormField label="Last Name" isRequired className="flex-1">
          <SimpleInput placeholder="Doe" />
        </FormField>
      </FormRow>
    </View>
  ),
}

export const FormSectionExample: Story = {
  render: () => (
    <View className="w-full max-w-lg">
      <FormSection
        title="Personal Information"
        description="Please provide your personal details"
      >
        <FormRow>
          <FormField label="First Name" isRequired className="flex-1">
            <SimpleInput placeholder="John" />
          </FormField>
          <FormField label="Last Name" isRequired className="flex-1">
            <SimpleInput placeholder="Doe" />
          </FormField>
        </FormRow>
        <FormField label="Email" isRequired helperText="We'll use this for notifications">
          <SimpleInput placeholder="john@example.com" />
        </FormField>
      </FormSection>
    </View>
  ),
}

export const CompleteFormExample: Story = {
  render: () => (
    <View className="w-full max-w-lg p-6 bg-surface-base rounded-lg">
      <FormSection title="Create Account" description="Fill in the details to create your account">
        <FormRow>
          <FormField label="First Name" isRequired className="flex-1">
            <SimpleInput placeholder="John" />
          </FormField>
          <FormField label="Last Name" isRequired className="flex-1">
            <SimpleInput placeholder="Doe" />
          </FormField>
        </FormRow>

        <FormField label="Email" isRequired>
          <SimpleInput placeholder="john@example.com" />
        </FormField>

        <FormField
          label="Password"
          isRequired
          helperText="At least 8 characters with one uppercase and number"
        >
          <SimpleInput placeholder="••••••••" secureTextEntry />
        </FormField>

        <FormField label="Confirm Password" isRequired>
          <SimpleInput placeholder="••••••••" secureTextEntry />
        </FormField>
      </FormSection>

      <FormSection title="Preferences" description="Customize your experience">
        <FormField label="Company (optional)">
          <SimpleInput placeholder="Acme Inc." />
        </FormField>

        <FormField label="Timezone" helperText="Select your local timezone">
          <SimpleInput placeholder="America/New_York" />
        </FormField>
      </FormSection>

      <FormActions align="right">
        <Button variant="ghost">
          <ButtonText>Cancel</ButtonText>
        </Button>
        <Button>
          <ButtonText>Create Account</ButtonText>
        </Button>
      </FormActions>
    </View>
  ),
}

export const ValidationStates: Story = {
  render: () => (
    <View className="gap-6 w-80">
      <FormField label="Valid Input" helperText="This field is valid">
        <View className="border border-status-success rounded-md px-3 py-2 bg-surface-input">
          <Text className="text-text-primary">valid@email.com</Text>
        </View>
      </FormField>

      <FormField
        label="Invalid Input"
        isRequired
        errorMessage="Please enter a valid email address"
      >
        <View className="border border-status-error rounded-md px-3 py-2 bg-surface-input">
          <Text className="text-text-primary">not-an-email</Text>
        </View>
      </FormField>

      <FormField label="Disabled Input" isDisabled>
        <View className="border border-border-input rounded-md px-3 py-2 bg-surface-input opacity-50">
          <Text className="text-text-tertiary">Disabled value</Text>
        </View>
      </FormField>
    </View>
  ),
}
