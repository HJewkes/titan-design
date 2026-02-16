import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { Avatar, AvatarBadge, AvatarGroup } from './Avatar'

const meta: Meta<typeof Avatar> = {
  title: 'Components/Avatar',
  component: Avatar,
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl', '2xl'],
      description: 'Avatar size',
    },
    fallback: {
      control: 'text',
      description: 'Fallback text (usually initials)',
    },
    alt: {
      control: 'text',
      description: 'Alt text for accessibility',
    },
  },
}

export default meta
type Story = StoryObj<typeof Avatar>

export const Default: Story = {
  args: {
    fallback: 'JD',
    size: 'md',
    alt: 'John Doe',
  },
}

export const AllSizes: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
      <Avatar size="xs" fallback="XS" />
      <Avatar size="sm" fallback="SM" />
      <Avatar size="md" fallback="MD" />
      <Avatar size="lg" fallback="LG" />
      <Avatar size="xl" fallback="XL" />
      <Avatar size="2xl" fallback="2X" />
    </View>
  ),
}

export const WithImage: Story = {
  args: {
    source: { uri: 'https://i.pravatar.cc/150?u=avatar-story' },
    alt: 'User avatar',
    size: 'lg',
  },
}

export const FallbackInitials: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      <Avatar fallback="AB" alt="Alice Brown" />
      <Avatar fallback="CD" alt="Charlie Davis" />
      <Avatar fallback="EF" alt="Eve Foster" />
    </View>
  ),
}

export const WithBadge: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', gap: 16 }}>
      <View>
        <Avatar fallback="JD" size="lg" />
        <AvatarBadge color="success" />
      </View>
      <View>
        <Avatar fallback="AB" size="lg" />
        <AvatarBadge color="error" />
      </View>
      <View>
        <Avatar fallback="CD" size="lg" />
        <AvatarBadge color="warning" />
      </View>
    </View>
  ),
}

export const Group: Story = {
  render: () => (
    <View style={{ gap: 16 }}>
      <AvatarGroup size="md">
        <Avatar fallback="A" />
        <Avatar fallback="B" />
        <Avatar fallback="C" />
        <Avatar fallback="D" />
      </AvatarGroup>
      <AvatarGroup size="md" max={3}>
        <Avatar fallback="A" />
        <Avatar fallback="B" />
        <Avatar fallback="C" />
        <Avatar fallback="D" />
        <Avatar fallback="E" />
      </AvatarGroup>
    </View>
  ),
}
