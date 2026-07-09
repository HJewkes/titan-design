import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import { EmptyState } from './EmptyState'

const meta: Meta<typeof EmptyState> = {
  title: 'Components/Molecules/EmptyState',
  component: EmptyState,
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: 'text',
      description: 'Title text',
    },
    description: {
      control: 'text',
      description: 'Description text',
    },
  },
}

export default meta
type Story = StoryObj<typeof EmptyState>

export const Default: Story = {
  args: {
    title: 'No results found',
  },
}

export const WithDescription: Story = {
  args: {
    title: 'No messages',
    description: 'You don\'t have any messages yet. Start a conversation to see them here.',
  },
}

// Simple placeholder icon for story demos
function PlaceholderIcon({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <View
        style={{
          width: size * 0.8,
          height: size * 0.8,
          borderRadius: size * 0.4,
          borderWidth: 2,
          borderColor: 'var(--color-text-tertiary)',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <View style={{ width: size * 0.3, height: 2, backgroundColor: 'var(--color-text-tertiary)', borderRadius: 1 }} />
      </View>
    </View>
  )
}

export const WithIcon: Story = {
  args: {
    icon: PlaceholderIcon,
    title: 'Inbox is empty',
    description: 'No new notifications at this time.',
  },
}

// Simple action button for story demos
function ActionButton() {
  return (
    <View
      className="bg-brand-primary px-4 py-2 rounded-md"
    >
      <Text className="text-white font-semibold text-sm">
        Create New
      </Text>
    </View>
  )
}

export const WithAction: Story = {
  args: {
    icon: PlaceholderIcon,
    title: 'No projects yet',
    description: 'Get started by creating your first project.',
    action: <ActionButton />,
  },
}

export const TitleOnly: Story = {
  args: {
    title: 'Nothing here',
  },
}
