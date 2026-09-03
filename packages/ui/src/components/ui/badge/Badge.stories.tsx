import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { Badge, BadgeText } from './Badge'

const meta: Meta<typeof Badge> = {
  title: 'Components/Atoms/Badge',
  component: Badge,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['solid', 'subtle', 'outline'],
      description: 'Visual variant',
    },
    color: {
      control: 'select',
      options: ['default', 'primary', 'secondary', 'success', 'error', 'warning', 'info'],
      description: 'Color scheme',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Badge size',
    },
  },
}

export default meta
type Story = StoryObj<typeof Badge>

export const Default: Story = {
  args: {
    variant: 'subtle',
    color: 'default',
    size: 'md',
    children: 'Badge',
  },
}

export const AllVariants: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
      <Badge variant="solid" color="primary">
        Solid
      </Badge>
      <Badge variant="subtle" color="primary">
        Subtle
      </Badge>
      <Badge variant="outline" color="primary">
        Outline
      </Badge>
    </View>
  ),
}

export const AllColors: Story = {
  render: () => (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        <Badge variant="solid" color="default">
          Default
        </Badge>
        <Badge variant="solid" color="primary">
          Primary
        </Badge>
        <Badge variant="solid" color="secondary">
          Secondary
        </Badge>
        <Badge variant="solid" color="success">
          Success
        </Badge>
        <Badge variant="solid" color="error">
          Error
        </Badge>
        <Badge variant="solid" color="warning">
          Warning
        </Badge>
        <Badge variant="solid" color="info">
          Info
        </Badge>
      </View>
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        <Badge variant="subtle" color="default">
          Default
        </Badge>
        <Badge variant="subtle" color="primary">
          Primary
        </Badge>
        <Badge variant="subtle" color="secondary">
          Secondary
        </Badge>
        <Badge variant="subtle" color="success">
          Success
        </Badge>
        <Badge variant="subtle" color="error">
          Error
        </Badge>
        <Badge variant="subtle" color="warning">
          Warning
        </Badge>
        <Badge variant="subtle" color="info">
          Info
        </Badge>
      </View>
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        <Badge variant="outline" color="default">
          Default
        </Badge>
        <Badge variant="outline" color="primary">
          Primary
        </Badge>
        <Badge variant="outline" color="secondary">
          Secondary
        </Badge>
        <Badge variant="outline" color="success">
          Success
        </Badge>
        <Badge variant="outline" color="error">
          Error
        </Badge>
        <Badge variant="outline" color="warning">
          Warning
        </Badge>
        <Badge variant="outline" color="info">
          Info
        </Badge>
      </View>
    </View>
  ),
}

export const AllSizes: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
      <Badge size="sm" color="primary">
        Small
      </Badge>
      <Badge size="md" color="primary">
        Medium
      </Badge>
      <Badge size="lg" color="primary">
        Large
      </Badge>
    </View>
  ),
}

export const WithBadgeText: Story = {
  render: () => (
    <Badge variant="solid" color="success">
      <BadgeText>Active</BadgeText>
    </Badge>
  ),
}
