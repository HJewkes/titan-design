import type { Meta, StoryObj } from '@storybook/react'
import { View } from 'react-native'
import { Toast, ToastProvider, useToast } from './Toast'
import { Button, ButtonText } from '../button'

const meta: Meta<typeof Toast> = {
  title: 'Components/Toast',
  component: Toast,
  argTypes: {
    status: {
      control: 'select',
      options: ['success', 'error', 'warning', 'info'],
    },
    showIcon: {
      control: 'boolean',
    },
    isClosable: {
      control: 'boolean',
    },
  },
}

export default meta
type Story = StoryObj<typeof Toast>

export const Default: Story = {
  args: {
    title: 'Notification',
    description: 'This is a toast notification.',
    status: 'info',
  },
}

export const Success: Story = {
  args: {
    title: 'Success!',
    description: 'Your changes have been saved successfully.',
    status: 'success',
  },
}

export const Error: Story = {
  args: {
    title: 'Error',
    description: 'There was a problem processing your request.',
    status: 'error',
  },
}

export const Warning: Story = {
  args: {
    title: 'Warning',
    description: 'Your session is about to expire.',
    status: 'warning',
  },
}

export const Info: Story = {
  args: {
    title: 'Information',
    description: 'A new version is available.',
    status: 'info',
  },
}

export const AllStatuses: Story = {
  render: () => (
    <View className="gap-3">
      <Toast title="Success" description="Operation completed successfully." status="success" />
      <Toast title="Error" description="Something went wrong." status="error" />
      <Toast title="Warning" description="Please review your input." status="warning" />
      <Toast title="Info" description="New features are available." status="info" />
    </View>
  ),
}

export const TitleOnly: Story = {
  render: () => (
    <View className="gap-3">
      <Toast title="File saved" status="success" />
      <Toast title="Connection lost" status="error" />
      <Toast title="Low storage" status="warning" />
    </View>
  ),
}

export const WithCloseButton: Story = {
  args: {
    title: 'Closable Toast',
    description: 'Click the X to dismiss this notification.',
    status: 'info',
    isClosable: true,
    onClose: () => console.log('Toast closed'),
  },
}

export const WithoutIcon: Story = {
  args: {
    title: 'No Icon',
    description: 'This toast has no status icon.',
    showIcon: false,
  },
}

// Interactive example with provider
function ToastDemo() {
  const { addToast, removeAllToasts } = useToast()

  return (
    <View className="gap-3">
      <View className="flex-row flex-wrap gap-2">
        <Button
          onPress={() =>
            addToast({
              title: 'Success!',
              description: 'Your changes have been saved.',
              status: 'success',
            })
          }
          color="success"
        >
          <ButtonText>Success Toast</ButtonText>
        </Button>

        <Button
          onPress={() =>
            addToast({
              title: 'Error',
              description: 'Something went wrong.',
              status: 'error',
            })
          }
          color="error"
        >
          <ButtonText>Error Toast</ButtonText>
        </Button>

        <Button
          onPress={() =>
            addToast({
              title: 'Warning',
              description: 'Please check your input.',
              status: 'warning',
            })
          }
          color="warning"
        >
          <ButtonText>Warning Toast</ButtonText>
        </Button>

        <Button
          onPress={() =>
            addToast({
              title: 'Info',
              description: 'New updates available.',
              status: 'info',
            })
          }
          color="info"
        >
          <ButtonText>Info Toast</ButtonText>
        </Button>
      </View>

      <Button variant="outline" onPress={removeAllToasts}>
        <ButtonText>Clear All</ButtonText>
      </Button>
    </View>
  )
}

export const Interactive: Story = {
  render: () => (
    <ToastProvider position="top-right" defaultDuration={3000}>
      <ToastDemo />
    </ToastProvider>
  ),
}

// Different positions
function PositionDemo() {
  const { addToast } = useToast()

  return (
    <Button
      onPress={() =>
        addToast({
          title: 'Toast at this position',
          status: 'info',
        })
      }
    >
      <ButtonText>Show Toast</ButtonText>
    </Button>
  )
}

export const TopPosition: Story = {
  render: () => (
    <ToastProvider position="top">
      <PositionDemo />
    </ToastProvider>
  ),
}

export const BottomPosition: Story = {
  render: () => (
    <ToastProvider position="bottom">
      <PositionDemo />
    </ToastProvider>
  ),
}

export const LongDuration: Story = {
  render: () => {
    function Demo() {
      const { addToast } = useToast()
      return (
        <View className="gap-2">
          <Button
            onPress={() =>
              addToast({
                title: 'Persistent Toast',
                description: 'This toast will stay for 10 seconds.',
                duration: 10000,
              })
            }
          >
            <ButtonText>10 Second Toast</ButtonText>
          </Button>
          <Button
            onPress={() =>
              addToast({
                title: 'Manual Close Only',
                description: 'This toast will not auto-dismiss.',
                duration: 0,
                isClosable: true,
              })
            }
            variant="outline"
          >
            <ButtonText>Non-Auto-Dismissing Toast</ButtonText>
          </Button>
        </View>
      )
    }

    return (
      <ToastProvider position="top-right">
        <Demo />
      </ToastProvider>
    )
  },
}
