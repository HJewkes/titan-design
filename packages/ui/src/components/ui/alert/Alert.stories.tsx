import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { Alert, AlertTitle, AlertDescription } from './Alert'

const meta: Meta<typeof Alert> = {
  title: 'Components/Molecules/Alert',
  component: Alert,
  tags: ['autodocs'],
  argTypes: {
    status: {
      control: 'select',
      options: ['success', 'info', 'warning', 'error'],
    },
    variant: {
      control: 'select',
      options: ['subtle', 'outline', 'solid'],
    },
    showIcon: { control: 'boolean' },
  },
}

export default meta
type Story = StoryObj<typeof Alert>

export const Default: Story = {
  args: {
    status: 'info',
    variant: 'subtle',
  },
  render: (args) => (
    <Alert {...args}>
      <AlertTitle>Information</AlertTitle>
      <AlertDescription>This is an informational alert message.</AlertDescription>
    </Alert>
  ),
}

export const Success: Story = {
  render: () => (
    <Alert status="success">
      <AlertTitle>Success!</AlertTitle>
      <AlertDescription>Your changes have been saved successfully.</AlertDescription>
    </Alert>
  ),
}

export const Warning: Story = {
  render: () => (
    <Alert status="warning">
      <AlertTitle>Warning</AlertTitle>
      <AlertDescription>Please review before proceeding.</AlertDescription>
    </Alert>
  ),
}

export const Error: Story = {
  render: () => (
    <Alert status="error">
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>Something went wrong. Please try again.</AlertDescription>
    </Alert>
  ),
}

export const WithCloseButton: Story = {
  render: () => (
    <Alert status="info" onClose={() => console.log('closed')}>
      <AlertTitle>Dismissable Alert</AlertTitle>
      <AlertDescription>Click the X to close this alert.</AlertDescription>
    </Alert>
  ),
}

export const AllStatuses: Story = {
  render: () => (
    <View style={{ gap: 12 }}>
      <Alert status="success">
        <AlertTitle>Success</AlertTitle>
        <AlertDescription>Operation completed successfully.</AlertDescription>
      </Alert>
      <Alert status="info">
        <AlertTitle>Info</AlertTitle>
        <AlertDescription>Here is some useful information.</AlertDescription>
      </Alert>
      <Alert status="warning">
        <AlertTitle>Warning</AlertTitle>
        <AlertDescription>Please be careful with this action.</AlertDescription>
      </Alert>
      <Alert status="error">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>An error occurred.</AlertDescription>
      </Alert>
    </View>
  ),
}

export const AllVariants: Story = {
  render: () => (
    <View style={{ gap: 12 }}>
      <Alert status="info" variant="subtle">
        <AlertTitle>Subtle Variant</AlertTitle>
        <AlertDescription>Light background with colored text.</AlertDescription>
      </Alert>
      <Alert status="info" variant="outline">
        <AlertTitle>Outline Variant</AlertTitle>
        <AlertDescription>Border with transparent background.</AlertDescription>
      </Alert>
      <Alert status="info" variant="solid">
        <AlertTitle>Solid Variant</AlertTitle>
        <AlertDescription>Solid background color.</AlertDescription>
      </Alert>
    </View>
  ),
}

export const SolidVariants: Story = {
  render: () => (
    <View style={{ gap: 12 }}>
      <Alert status="success" variant="solid">
        <AlertDescription>Success solid alert</AlertDescription>
      </Alert>
      <Alert status="info" variant="solid">
        <AlertDescription>Info solid alert</AlertDescription>
      </Alert>
      <Alert status="warning" variant="solid">
        <AlertDescription>Warning solid alert</AlertDescription>
      </Alert>
      <Alert status="error" variant="solid">
        <AlertDescription>Error solid alert</AlertDescription>
      </Alert>
    </View>
  ),
}

export const WithoutIcon: Story = {
  args: {
    showIcon: false,
    status: 'info',
  },
  render: (args) => (
    <Alert {...args}>
      <AlertTitle>No Icon</AlertTitle>
      <AlertDescription>This alert has no icon.</AlertDescription>
    </Alert>
  ),
}

export const DescriptionOnly: Story = {
  render: () => (
    <Alert status="info">
      <AlertDescription>Simple alert with description only, no title.</AlertDescription>
    </Alert>
  ),
}
