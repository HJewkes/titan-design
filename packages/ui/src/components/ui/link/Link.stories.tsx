import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { Link } from './Link'

const meta: Meta<typeof Link> = {
  title: 'Components/Link',
  component: Link,
  tags: ['autodocs'],
  argTypes: {
    color: {
      control: 'select',
      options: ['default', 'primary', 'secondary', 'inherit'],
      description: 'Link color',
    },
    underline: {
      control: 'select',
      options: ['always', 'hover', 'none'],
      description: 'Underline behavior',
    },
    isExternal: {
      control: 'boolean',
      description: 'Whether the link opens externally',
    },
    isDisabled: {
      control: 'boolean',
      description: 'Whether the link is disabled',
    },
  },
}

export default meta
type Story = StoryObj<typeof Link>

export const Default: Story = {
  args: {
    children: 'Click here',
    color: 'default',
    underline: 'hover',
    onPress: () => {},
  },
}

export const AllColors: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', gap: 16 }}>
      <Link color="default" onPress={() => {}}>Default</Link>
      <Link color="primary" onPress={() => {}}>Primary</Link>
      <Link color="secondary" onPress={() => {}}>Secondary</Link>
    </View>
  ),
}

export const UnderlineStyles: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', gap: 16 }}>
      <Link underline="always" onPress={() => {}}>Always</Link>
      <Link underline="hover" onPress={() => {}}>Hover</Link>
      <Link underline="none" onPress={() => {}}>None</Link>
    </View>
  ),
}

export const External: Story = {
  args: {
    children: 'Visit Example',
    href: 'https://example.com',
    isExternal: true,
    onPress: () => {},
  },
}

export const Disabled: Story = {
  args: {
    children: 'Disabled Link',
    isDisabled: true,
    onPress: () => {},
  },
}
