import React, { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text, TextInput } from 'react-native'
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
} from './Modal'
import { Button, ButtonText } from '../button/Button'

const meta: Meta<typeof Modal> = {
  title: 'Components/Organisms/Modal',
  component: Modal,
  tags: ['autodocs'],
  argTypes: {
    isOpen: {
      control: 'boolean',
      description: 'Whether the modal is open',
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl', 'full'],
      description: 'Modal size',
    },
    scrollBehavior: {
      control: 'select',
      options: ['inside', 'outside'],
      description: 'Where scrolling happens',
    },
    closeOnOverlayClick: {
      control: 'boolean',
      description: 'Whether clicking backdrop closes modal',
    },
    backdropBlur: {
      control: 'boolean',
      description: 'Whether to blur the backdrop',
    },
    animationType: {
      control: 'select',
      options: ['none', 'fade', 'slide'],
      description: 'Animation type',
    },
  },
}

export default meta
type Story = StoryObj<typeof Modal>

/**
 * Interactive wrapper that manages open state for modal stories.
 */
function ModalDemo({
  children,
  buttonLabel = 'Open Modal',
  ...modalProps
}: Omit<React.ComponentProps<typeof Modal>, 'isOpen'> & { buttonLabel?: string }) {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <View>
      <Button variant="solid" color="primary" onPress={() => setIsOpen(true)}>
        <ButtonText>{buttonLabel}</ButtonText>
      </Button>
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} {...modalProps}>
        {typeof children === 'function'
          ? (children as (close: () => void) => React.ReactNode)(() => setIsOpen(false))
          : children}
      </Modal>
    </View>
  )
}

export const Default: Story = {
  render: () => (
    <ModalDemo>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>Modal Title</ModalTitle>
          <ModalCloseButton />
        </ModalHeader>
        <ModalBody>
          <Text className="text-text-primary">
            This is the default modal with medium size. It includes a header with title and close
            button, a body with content, and a footer with actions.
          </Text>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" color="secondary">
            <ButtonText>Cancel</ButtonText>
          </Button>
          <Button variant="solid" color="primary">
            <ButtonText>Confirm</ButtonText>
          </Button>
        </ModalFooter>
      </ModalContent>
    </ModalDemo>
  ),
}

export const Sizes: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
      {(['xs', 'sm', 'md', 'lg', 'xl', 'full'] as const).map((size) => (
        <ModalDemo key={size} size={size} buttonLabel={`Size: ${size}`}>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>{size.toUpperCase()} Modal</ModalTitle>
              <ModalCloseButton />
            </ModalHeader>
            <ModalBody>
              <Text className="text-text-primary">
                This modal uses size=&quot;{size}&quot;. The content width is constrained by the
                max-width of the selected size variant.
              </Text>
            </ModalBody>
            <ModalFooter>
              <Button variant="solid" color="primary">
                <ButtonText>Close</ButtonText>
              </Button>
            </ModalFooter>
          </ModalContent>
        </ModalDemo>
      ))}
    </View>
  ),
}

export const WithFormContent: Story = {
  render: () => (
    <ModalDemo size="md" buttonLabel="Open Form Modal">
      {(close: () => void) => (
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Create New Item</ModalTitle>
            <ModalCloseButton />
          </ModalHeader>
          <ModalBody>
            <View style={{ gap: 16 }}>
              <View style={{ gap: 4 }}>
                <Text className="text-sm font-medium text-text-secondary">Name</Text>
                <TextInput
                  placeholder="Enter item name"
                  className="px-3 py-2 rounded-md border border-border-input bg-surface-base text-text-primary"
                />
              </View>
              <View style={{ gap: 4 }}>
                <Text className="text-sm font-medium text-text-secondary">Description</Text>
                <TextInput
                  placeholder="Enter description"
                  multiline
                  numberOfLines={3}
                  className="px-3 py-2 rounded-md border border-border-input bg-surface-base text-text-primary"
                  style={{ minHeight: 80, textAlignVertical: 'top' }}
                />
              </View>
              <View style={{ gap: 4 }}>
                <Text className="text-sm font-medium text-text-secondary">Category</Text>
                <TextInput
                  placeholder="Enter category"
                  className="px-3 py-2 rounded-md border border-border-input bg-surface-base text-text-primary"
                />
              </View>
            </View>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" color="secondary" onPress={close}>
              <ButtonText>Cancel</ButtonText>
            </Button>
            <Button variant="solid" color="primary" onPress={close}>
              <ButtonText>Create</ButtonText>
            </Button>
          </ModalFooter>
        </ModalContent>
      )}
    </ModalDemo>
  ),
}

export const ScrollableContent: Story = {
  render: () => (
    <ModalDemo size="md" scrollBehavior="inside" buttonLabel="Scrollable Modal">
      <ModalContent>
        <ModalHeader>
          <ModalTitle>Terms of Service</ModalTitle>
          <ModalCloseButton />
        </ModalHeader>
        <ModalBody maxHeight={300}>
          <View style={{ gap: 12 }}>
            {Array.from({ length: 15 }).map((_, i) => (
              <View key={i}>
                <Text className="text-text-primary font-semibold mb-1">Section {i + 1}</Text>
                <Text className="text-text-secondary text-sm">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
                  incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
                  exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                </Text>
              </View>
            ))}
          </View>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" color="secondary">
            <ButtonText>Decline</ButtonText>
          </Button>
          <Button variant="solid" color="primary">
            <ButtonText>Accept</ButtonText>
          </Button>
        </ModalFooter>
      </ModalContent>
    </ModalDemo>
  ),
}

export const BackdropBlur: Story = {
  render: () => (
    <View style={{ gap: 16 }}>
      <Text className="text-text-secondary text-sm">
        The backdrop blur variant uses a lighter overlay with a blur effect behind the modal.
      </Text>
      <ModalDemo backdropBlur buttonLabel="Blurred Backdrop">
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Blurred Backdrop</ModalTitle>
            <ModalCloseButton />
          </ModalHeader>
          <ModalBody>
            <Text className="text-text-primary">
              This modal uses backdropBlur which applies a CSS backdrop-filter blur on web and a
              lighter overlay opacity.
            </Text>
          </ModalBody>
          <ModalFooter>
            <Button variant="solid" color="primary">
              <ButtonText>Got it</ButtonText>
            </Button>
          </ModalFooter>
        </ModalContent>
      </ModalDemo>
    </View>
  ),
}

export const NoOverlayClose: Story = {
  render: () => (
    <ModalDemo closeOnOverlayClick={false} buttonLabel="Persistent Modal">
      <ModalContent>
        <ModalHeader>
          <ModalTitle>Persistent Modal</ModalTitle>
          <ModalCloseButton />
        </ModalHeader>
        <ModalBody>
          <Text className="text-text-primary">
            This modal does not close when clicking the overlay. You must use the close button or
            footer actions to dismiss it. This is useful for important confirmations.
          </Text>
        </ModalBody>
        <ModalFooter>
          <Button variant="solid" color="primary">
            <ButtonText>I Understand</ButtonText>
          </Button>
        </ModalFooter>
      </ModalContent>
    </ModalDemo>
  ),
}

export const DeleteConfirmation: Story = {
  render: () => (
    <ModalDemo size="sm" buttonLabel="Delete Item">
      {(close: () => void) => (
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Delete Item</ModalTitle>
            <ModalCloseButton />
          </ModalHeader>
          <ModalBody>
            <Text className="text-text-primary">
              Are you sure you want to delete this item? This action cannot be undone.
            </Text>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" color="secondary" onPress={close}>
              <ButtonText>Cancel</ButtonText>
            </Button>
            <Button variant="solid" color="error" onPress={close}>
              <ButtonText>Delete</ButtonText>
            </Button>
          </ModalFooter>
        </ModalContent>
      )}
    </ModalDemo>
  ),
}

export const SlideAnimation: Story = {
  render: () => (
    <ModalDemo animationType="slide" buttonLabel="Slide Modal">
      <ModalContent>
        <ModalHeader>
          <ModalTitle>Slide Animation</ModalTitle>
          <ModalCloseButton />
        </ModalHeader>
        <ModalBody>
          <Text className="text-text-primary">
            This modal uses animationType=&quot;slide&quot; instead of the default fade animation.
          </Text>
        </ModalBody>
        <ModalFooter>
          <Button variant="solid" color="primary">
            <ButtonText>Close</ButtonText>
          </Button>
        </ModalFooter>
      </ModalContent>
    </ModalDemo>
  ),
}

export const LargeWithScrollOutside: Story = {
  render: () => (
    <ModalDemo size="lg" scrollBehavior="outside" buttonLabel="Large Scrollable (Outside)">
      <ModalContent>
        <ModalHeader>
          <ModalTitle>Large Modal - Outside Scroll</ModalTitle>
          <ModalCloseButton />
        </ModalHeader>
        <ModalBody>
          <View style={{ gap: 12 }}>
            {Array.from({ length: 20 }).map((_, i) => (
              <Text key={i} className="text-text-primary text-sm">
                Paragraph {i + 1}: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
                eiusmod tempor incididunt ut labore et dolore magna aliqua.
              </Text>
            ))}
          </View>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" color="secondary">
            <ButtonText>Cancel</ButtonText>
          </Button>
          <Button variant="solid" color="primary">
            <ButtonText>Save</ButtonText>
          </Button>
        </ModalFooter>
      </ModalContent>
    </ModalDemo>
  ),
}
