import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { IconBox } from './IconBox'

function StarIcon({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <View
      className={className}
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
          backgroundColor: 'currentColor',
        }}
      />
    </View>
  )
}

function BoltIcon({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <View
      className={className}
      style={{
        width: size,
        height: size,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <View
        style={{
          width: 0,
          height: 0,
          borderLeftWidth: size * 0.3,
          borderRightWidth: size * 0.3,
          borderBottomWidth: size * 0.6,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderBottomColor: 'currentColor',
        }}
      />
    </View>
  )
}

const meta: Meta<typeof IconBox> = {
  title: 'Components/IconBox',
  component: IconBox,
  tags: ['autodocs'],
  argTypes: {
    color: {
      control: 'select',
      options: ['primary', 'secondary', 'success', 'error', 'warning', 'info', 'neutral'],
      description: 'Color variant for the icon box',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size variant',
    },
  },
}

export default meta
type Story = StoryObj<typeof IconBox>

export const Default: Story = {
  args: {
    icon: StarIcon,
    color: 'neutral',
    size: 'md',
  },
}

export const Primary: Story = {
  args: {
    icon: StarIcon,
    color: 'primary',
    size: 'md',
  },
}

export const Small: Story = {
  args: {
    icon: StarIcon,
    color: 'primary',
    size: 'sm',
  },
}

export const Large: Story = {
  args: {
    icon: StarIcon,
    color: 'primary',
    size: 'lg',
  },
}

export const AllColors: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
      <IconBox icon={StarIcon} color="primary" />
      <IconBox icon={StarIcon} color="secondary" />
      <IconBox icon={StarIcon} color="success" />
      <IconBox icon={StarIcon} color="error" />
      <IconBox icon={StarIcon} color="warning" />
      <IconBox icon={StarIcon} color="info" />
      <IconBox icon={StarIcon} color="neutral" />
    </View>
  ),
}

export const AllSizes: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
      <IconBox icon={StarIcon} color="primary" size="sm" />
      <IconBox icon={StarIcon} color="primary" size="md" />
      <IconBox icon={StarIcon} color="primary" size="lg" />
    </View>
  ),
}

export const DifferentIcons: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', gap: 12 }}>
      <IconBox icon={StarIcon} color="success" />
      <IconBox icon={BoltIcon} color="warning" />
    </View>
  ),
}
