import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { View, Text, Pressable } from 'react-native'
import { Drawer, DrawerBody, DrawerFooter } from './Drawer'
import { Button, ButtonText } from '../button'

const meta: Meta<typeof Drawer> = {
  title: 'Components/Organisms/Drawer',
  component: Drawer,
  tags: ['autodocs'],
  argTypes: {
    placement: {
      control: 'select',
      options: ['left', 'right', 'top', 'bottom'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl', 'full'],
    },
    closeOnOverlayClick: {
      control: 'boolean',
    },
    showCloseButton: {
      control: 'boolean',
    },
  },
}

export default meta
type Story = StoryObj<typeof Drawer>

export const Default: Story = {
  render: function Render() {
    const [isOpen, setIsOpen] = useState(false)
    return (
      <View>
        <Button onPress={() => setIsOpen(true)}>
          <ButtonText>Open Drawer</ButtonText>
        </Button>
        <Drawer isOpen={isOpen} onClose={() => setIsOpen(false)} title="Drawer Title">
          <DrawerBody>
            <Text className="text-text-primary">
              This is the drawer content. You can put any content here.
            </Text>
          </DrawerBody>
        </Drawer>
      </View>
    )
  },
}

export const LeftPlacement: Story = {
  render: function Render() {
    const [isOpen, setIsOpen] = useState(false)
    return (
      <View>
        <Button onPress={() => setIsOpen(true)}>
          <ButtonText>Open Left Drawer</ButtonText>
        </Button>
        <Drawer
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          placement="left"
          title="Navigation"
        >
          <DrawerBody>
            <View className="gap-2">
              <Pressable className="p-3 rounded-lg web:hover:bg-interactive-hover">
                <Text className="text-text-primary">Dashboard</Text>
              </Pressable>
              <Pressable className="p-3 rounded-lg web:hover:bg-interactive-hover">
                <Text className="text-text-primary">Settings</Text>
              </Pressable>
              <Pressable className="p-3 rounded-lg web:hover:bg-interactive-hover">
                <Text className="text-text-primary">Profile</Text>
              </Pressable>
            </View>
          </DrawerBody>
        </Drawer>
      </View>
    )
  },
}

export const BottomPlacement: Story = {
  render: function Render() {
    const [isOpen, setIsOpen] = useState(false)
    return (
      <View>
        <Button onPress={() => setIsOpen(true)}>
          <ButtonText>Open Bottom Drawer</ButtonText>
        </Button>
        <Drawer
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          placement="bottom"
          size="md"
          title="Actions"
        >
          <DrawerBody>
            <View className="gap-3">
              <Button variant="outline" className="w-full">
                <ButtonText>Share</ButtonText>
              </Button>
              <Button variant="outline" className="w-full">
                <ButtonText>Download</ButtonText>
              </Button>
              <Button variant="outline" color="error" className="w-full">
                <ButtonText>Delete</ButtonText>
              </Button>
            </View>
          </DrawerBody>
        </Drawer>
      </View>
    )
  },
}

export const AllSizes: Story = {
  render: function Render() {
    const [openSize, setOpenSize] = useState<string | null>(null)
    const sizes = ['sm', 'md', 'lg', 'xl'] as const

    return (
      <View className="flex-row gap-2 flex-wrap">
        {sizes.map((size) => (
          <Button key={size} onPress={() => setOpenSize(size)}>
            <ButtonText>{size.toUpperCase()}</ButtonText>
          </Button>
        ))}
        {sizes.map((size) => (
          <Drawer
            key={size}
            isOpen={openSize === size}
            onClose={() => setOpenSize(null)}
            size={size}
            title={`${size.toUpperCase()} Drawer`}
          >
            <DrawerBody>
              <Text className="text-text-primary">This is a {size} size drawer.</Text>
            </DrawerBody>
          </Drawer>
        ))}
      </View>
    )
  },
}

export const WithFooter: Story = {
  render: function Render() {
    const [isOpen, setIsOpen] = useState(false)
    return (
      <View>
        <Button onPress={() => setIsOpen(true)}>
          <ButtonText>Open Form Drawer</ButtonText>
        </Button>
        <Drawer isOpen={isOpen} onClose={() => setIsOpen(false)} title="Edit Profile" size="lg">
          <DrawerBody>
            <View className="gap-4">
              <View>
                <Text className="text-sm font-medium text-text-secondary mb-1">Name</Text>
                <View className="border border-border-input rounded-md px-3 py-2 bg-surface-input">
                  <Text className="text-text-primary">John Doe</Text>
                </View>
              </View>
              <View>
                <Text className="text-sm font-medium text-text-secondary mb-1">Email</Text>
                <View className="border border-border-input rounded-md px-3 py-2 bg-surface-input">
                  <Text className="text-text-primary">john@example.com</Text>
                </View>
              </View>
              <View>
                <Text className="text-sm font-medium text-text-secondary mb-1">Bio</Text>
                <View className="border border-border-input rounded-md px-3 py-2 bg-surface-input h-24">
                  <Text className="text-text-primary">Software developer...</Text>
                </View>
              </View>
            </View>
          </DrawerBody>
          <DrawerFooter>
            <Button variant="ghost" onPress={() => setIsOpen(false)}>
              <ButtonText>Cancel</ButtonText>
            </Button>
            <Button onPress={() => setIsOpen(false)}>
              <ButtonText>Save Changes</ButtonText>
            </Button>
          </DrawerFooter>
        </Drawer>
      </View>
    )
  },
}

export const NoCloseButton: Story = {
  render: function Render() {
    const [isOpen, setIsOpen] = useState(false)
    return (
      <View>
        <Button onPress={() => setIsOpen(true)}>
          <ButtonText>Open Drawer</ButtonText>
        </Button>
        <Drawer
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title="Custom Header"
          showCloseButton={false}
        >
          <DrawerBody>
            <Text className="text-text-primary">
              This drawer has no close button. Click the overlay to close.
            </Text>
          </DrawerBody>
        </Drawer>
      </View>
    )
  },
}
