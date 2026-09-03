import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import { Input, InputGroup, PasswordInput } from './Input'

const meta: Meta<typeof Input> = {
  title: 'Components/Molecules/Input',
  component: Input,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['outline', 'filled', 'underline'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    multiline: { control: 'boolean' },
    isDisabled: { control: 'boolean' },
    isInvalid: { control: 'boolean' },
    isReadOnly: { control: 'boolean' },
    isRequired: { control: 'boolean' },
  },
}

export default meta
type Story = StoryObj<typeof Input>

export const Default: Story = {
  args: {
    placeholder: 'Enter text...',
  },
}

export const WithLabel: Story = {
  args: {
    label: 'Email',
    placeholder: 'Enter your email',
  },
}

export const WithHelperText: Story = {
  args: {
    label: 'Password',
    placeholder: 'Enter your password',
    helperText: 'Must be at least 8 characters',
  },
}

export const WithError: Story = {
  args: {
    label: 'Email',
    placeholder: 'Enter your email',
    isInvalid: true,
    errorMessage: 'Please enter a valid email address',
    defaultValue: 'invalid-email',
  },
}

export const Required: Story = {
  args: {
    label: 'Username',
    placeholder: 'Choose a username',
    isRequired: true,
  },
}

export const Disabled: Story = {
  args: {
    label: 'Disabled Input',
    placeholder: 'This is disabled',
    isDisabled: true,
    defaultValue: 'Disabled value',
  },
}

export const ReadOnly: Story = {
  args: {
    label: 'Read Only',
    isReadOnly: true,
    defaultValue: 'This value cannot be changed',
  },
}

export const AllVariants: Story = {
  render: () => (
    <View style={{ gap: 16, width: 300 }}>
      <Input variant="outline" label="Outline" placeholder="Outline variant" />
      <Input variant="filled" label="Filled" placeholder="Filled variant" />
      <Input variant="underline" label="Underline" placeholder="Underline variant" />
    </View>
  ),
}

export const AllSizes: Story = {
  render: () => (
    <View style={{ gap: 16, width: 300 }}>
      <Input size="sm" placeholder="Small input" />
      <Input size="md" placeholder="Medium input" />
      <Input size="lg" placeholder="Large input" />
    </View>
  ),
}

export const Multiline: Story = {
  args: {
    label: 'Description',
    placeholder: 'Enter a description...',
    multiline: true,
    numberOfLines: 4,
    helperText: 'Maximum 500 characters',
  },
}

export const MultilineSizes: Story = {
  render: () => (
    <View style={{ gap: 16, width: 400 }}>
      <Input size="sm" multiline label="Small" placeholder="Small textarea" />
      <Input size="md" multiline label="Medium" placeholder="Medium textarea" />
      <Input size="lg" multiline label="Large" placeholder="Large textarea" />
    </View>
  ),
}

export const Password: Story = {
  render: () => (
    <View style={{ gap: 16, width: 300 }}>
      <PasswordInput
        label="Password"
        placeholder="Enter your password"
        helperText="Must be at least 8 characters"
      />
    </View>
  ),
}

export const PasswordWithError: Story = {
  render: () => (
    <View style={{ gap: 16, width: 300 }}>
      <PasswordInput
        label="Password"
        placeholder="Enter your password"
        isInvalid
        errorMessage="Password must be at least 8 characters"
        defaultValue="short"
      />
    </View>
  ),
}

// Simple search icon for demo
function SearchIcon() {
  return (
    <View className="w-4 h-4 items-center justify-center">
      <View className="w-3 h-3 rounded-full border-2 border-text-secondary" />
      <View className="absolute bottom-0 right-0 w-1.5 h-0.5 bg-text-secondary rotate-45 origin-left" />
    </View>
  )
}

export const WithLeftElement: Story = {
  render: () => (
    <View style={{ gap: 16, width: 300 }}>
      <Input placeholder="Search..." leftElement={<SearchIcon />} />
    </View>
  ),
}

export const FormExample: Story = {
  render: () => (
    <InputGroup>
      <Input label="First Name" placeholder="John" isRequired />
      <Input label="Last Name" placeholder="Doe" isRequired />
      <Input label="Email" placeholder="john@example.com" isRequired />
      <PasswordInput
        label="Password"
        placeholder="••••••••"
        helperText="Must be at least 8 characters"
        isRequired
      />
      <Input label="Bio" placeholder="Tell us about yourself..." multiline numberOfLines={3} />
    </InputGroup>
  ),
}
