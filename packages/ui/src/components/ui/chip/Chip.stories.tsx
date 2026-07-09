import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { Chip } from './Chip'

const meta: Meta<typeof Chip> = {
  title: 'Components/Atoms/Chip',
  component: Chip,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['solid', 'subtle', 'outline'],
    },
    color: {
      control: 'select',
      options: ['default', 'primary', 'secondary', 'success', 'error', 'warning', 'info'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    isDisabled: { control: 'boolean' },
  },
}

export default meta
type Story = StoryObj<typeof Chip>

export const Default: Story = {
  args: {
    children: 'Chip',
    variant: 'subtle',
    color: 'default',
    size: 'md',
  },
}

export const AllColors: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
      <Chip color="default">Default</Chip>
      <Chip color="primary">Primary</Chip>
      <Chip color="secondary">Secondary</Chip>
      <Chip color="success">Success</Chip>
      <Chip color="error">Error</Chip>
      <Chip color="warning">Warning</Chip>
      <Chip color="info">Info</Chip>
    </View>
  ),
}

export const AllVariants: Story = {
  render: () => (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Chip variant="solid" color="primary">Solid</Chip>
        <Chip variant="subtle" color="primary">Subtle</Chip>
        <Chip variant="outline" color="primary">Outline</Chip>
      </View>
    </View>
  ),
}

export const AllSizes: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
      <Chip size="sm">Small</Chip>
      <Chip size="md">Medium</Chip>
      <Chip size="lg">Large</Chip>
    </View>
  ),
}

export const Dismissible: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      <Chip onDelete={() => console.log('delete')}>Remove me</Chip>
      <Chip color="primary" onDelete={() => console.log('delete')}>Primary</Chip>
      <Chip color="error" onDelete={() => console.log('delete')}>Error</Chip>
    </View>
  ),
}

export const Clickable: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      <Chip onPress={() => console.log('clicked')}>Click me</Chip>
      <Chip color="primary" onPress={() => console.log('clicked')}>Primary</Chip>
    </View>
  ),
}

export const Disabled: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      <Chip isDisabled>Disabled</Chip>
      <Chip isDisabled onDelete={() => {}}>Disabled Dismissible</Chip>
      <Chip isDisabled onPress={() => {}}>Disabled Clickable</Chip>
    </View>
  ),
}

export const AsTagList: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', maxWidth: 300 }}>
      <Chip size="sm" color="primary" onDelete={() => {}}>React</Chip>
      <Chip size="sm" color="secondary" onDelete={() => {}}>TypeScript</Chip>
      <Chip size="sm" color="info" onDelete={() => {}}>Tailwind</Chip>
      <Chip size="sm" color="success" onDelete={() => {}}>NativeWind</Chip>
    </View>
  ),
}
