import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import { Popover, PopoverTrigger, PopoverContent, PopoverCloseButton } from './Popover'
import { Button, ButtonText } from '../button/Button'

const meta: Meta<typeof Popover> = {
  title: 'Components/Popover',
  component: Popover,
  tags: ['autodocs'],
  argTypes: {
    placement: {
      control: 'select',
      options: ['top', 'bottom', 'left', 'right'],
      description: 'Popover placement relative to trigger',
    },
    isOpen: {
      control: 'boolean',
      description: 'Controlled open state',
    },
    closeOnClickOutside: {
      control: 'boolean',
      description: 'Whether clicking outside closes the popover',
    },
  },
  decorators: [
    (Story) => (
      <View style={{ minHeight: 300, padding: 100, alignItems: 'flex-start' }}>
        <Story />
      </View>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof Popover>

export const Default: Story = {
  args: {
    placement: 'bottom',
  },
  render: (args) => (
    <Popover {...args}>
      <PopoverTrigger>
        <Button variant="solid" color="primary">
          <ButtonText>Open Popover</ButtonText>
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <Text className="text-text-primary text-sm font-semibold">Popover Title</Text>
        <Text className="text-text-secondary text-sm mt-1">
          This is a popover with some basic content.
        </Text>
      </PopoverContent>
    </Popover>
  ),
}

export const PlacementTop: Story = {
  render: () => (
    <Popover placement="top">
      <PopoverTrigger>
        <Button variant="outline" color="primary">
          <ButtonText>Top Placement</ButtonText>
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <Text className="text-text-primary text-sm">This popover appears above the trigger.</Text>
      </PopoverContent>
    </Popover>
  ),
}

export const PlacementBottom: Story = {
  render: () => (
    <Popover placement="bottom">
      <PopoverTrigger>
        <Button variant="outline" color="primary">
          <ButtonText>Bottom Placement</ButtonText>
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <Text className="text-text-primary text-sm">This popover appears below the trigger.</Text>
      </PopoverContent>
    </Popover>
  ),
}

export const PlacementLeft: Story = {
  render: () => (
    <Popover placement="left">
      <PopoverTrigger>
        <Button variant="outline" color="primary">
          <ButtonText>Left Placement</ButtonText>
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <Text className="text-text-primary text-sm">This popover appears to the left.</Text>
      </PopoverContent>
    </Popover>
  ),
}

export const PlacementRight: Story = {
  render: () => (
    <Popover placement="right">
      <PopoverTrigger>
        <Button variant="outline" color="primary">
          <ButtonText>Right Placement</ButtonText>
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <Text className="text-text-primary text-sm">This popover appears to the right.</Text>
      </PopoverContent>
    </Popover>
  ),
}

export const WithCloseButton: Story = {
  render: () => (
    <Popover placement="bottom">
      <PopoverTrigger>
        <Button variant="solid" color="primary">
          <ButtonText>With Close</ButtonText>
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text className="text-text-primary text-sm font-semibold">Settings</Text>
          <PopoverCloseButton>
            <Text className="text-text-secondary text-lg">&#10005;</Text>
          </PopoverCloseButton>
        </View>
        <Text className="text-text-secondary text-sm mt-2">
          Configure your preferences here.
        </Text>
      </PopoverContent>
    </Popover>
  ),
}

export const WithFormContent: Story = {
  render: () => (
    <Popover placement="bottom">
      <PopoverTrigger>
        <Button variant="solid" color="primary">
          <ButtonText>Edit Name</ButtonText>
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <View style={{ gap: 12 }}>
          <Text className="text-text-primary text-sm font-semibold">Edit Display Name</Text>
          <Text className="text-text-secondary text-xs">
            Enter your new display name below.
          </Text>
          <View className="bg-surface-inset border border-border-default rounded-md px-3 py-2">
            <Text className="text-text-secondary text-sm">John Doe</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'flex-end' }}>
            <PopoverCloseButton>
              <View className="px-3 py-1.5 rounded-md bg-surface-elevated border border-border-default">
                <Text className="text-text-primary text-sm">Cancel</Text>
              </View>
            </PopoverCloseButton>
            <View className="px-3 py-1.5 rounded-md bg-brand-primary">
              <Text className="text-white text-sm font-medium">Save</Text>
            </View>
          </View>
        </View>
      </PopoverContent>
    </Popover>
  ),
}

export const Controlled: Story = {
  render: () => (
    <Popover isOpen placement="bottom">
      <PopoverTrigger>
        <Button variant="outline" color="primary">
          <ButtonText>Always Open</ButtonText>
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <Text className="text-text-primary text-sm font-semibold">Controlled Popover</Text>
        <Text className="text-text-secondary text-sm mt-1">
          This popover is controlled and always visible.
        </Text>
      </PopoverContent>
    </Popover>
  ),
}
