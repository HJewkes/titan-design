import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { Button, ButtonText, ButtonIcon } from './Button'

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['solid', 'outline', 'ghost', 'link'],
      description: 'Visual style variant',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Button size',
    },
    color: {
      control: 'select',
      options: ['primary', 'secondary', 'accent', 'success', 'error', 'warning', 'info'],
      description: 'Color scheme',
    },
    isIconButton: {
      control: 'boolean',
      description: 'Whether this is an icon-only button (square aspect ratio)',
    },
    isDisabled: {
      control: 'boolean',
      description: 'Whether the button is disabled',
    },
    isLoading: {
      control: 'boolean',
      description: 'Whether the button is in a loading state',
    },
    fullWidth: {
      control: 'boolean',
      description: 'Whether the button should take full width',
    },
  },
}

export default meta
type Story = StoryObj<typeof Button>

export const Primary: Story = {
  args: {
    variant: 'solid',
    color: 'primary',
    size: 'md',
  },
  render: (args) => (
    <Button {...args}>
      <ButtonText>Primary Button</ButtonText>
    </Button>
  ),
}

export const Secondary: Story = {
  args: {
    variant: 'solid',
    color: 'secondary',
    size: 'md',
  },
  render: (args) => (
    <Button {...args}>
      <ButtonText>Secondary Button</ButtonText>
    </Button>
  ),
}

export const Outline: Story = {
  args: {
    variant: 'outline',
    color: 'primary',
  },
  render: (args) => (
    <Button {...args}>
      <ButtonText>Outline Button</ButtonText>
    </Button>
  ),
}

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    color: 'primary',
  },
  render: (args) => (
    <Button {...args}>
      <ButtonText>Ghost Button</ButtonText>
    </Button>
  ),
}

export const Link: Story = {
  args: {
    variant: 'link',
    color: 'primary',
  },
  render: (args) => (
    <Button {...args}>
      <ButtonText>Link Button</ButtonText>
    </Button>
  ),
}

export const Loading: Story = {
  args: {
    isLoading: true,
    loadingText: 'Saving...',
    variant: 'solid',
    color: 'primary',
  },
  render: (args) => (
    <Button {...args}>
      <ButtonText>Save</ButtonText>
    </Button>
  ),
}

export const Disabled: Story = {
  args: {
    isDisabled: true,
    variant: 'solid',
    color: 'primary',
  },
  render: (args) => (
    <Button {...args}>
      <ButtonText>Disabled Button</ButtonText>
    </Button>
  ),
}

export const AllVariants: Story = {
  render: () => (
    <View style={{ gap: 16 }}>
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        <Button variant="solid" color="primary">
          <ButtonText>Solid</ButtonText>
        </Button>
        <Button variant="outline" color="primary">
          <ButtonText>Outline</ButtonText>
        </Button>
        <Button variant="ghost" color="primary">
          <ButtonText>Ghost</ButtonText>
        </Button>
        <Button variant="link" color="primary">
          <ButtonText>Link</ButtonText>
        </Button>
      </View>
    </View>
  ),
}

export const AllColors: Story = {
  render: () => (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        <Button color="primary"><ButtonText>Primary</ButtonText></Button>
        <Button color="secondary"><ButtonText>Secondary</ButtonText></Button>
        <Button color="success"><ButtonText>Success</ButtonText></Button>
        <Button color="error"><ButtonText>Error</ButtonText></Button>
        <Button color="warning"><ButtonText>Warning</ButtonText></Button>
        <Button color="info"><ButtonText>Info</ButtonText></Button>
      </View>
    </View>
  ),
}

export const AllSizes: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
      <Button size="sm"><ButtonText>Small</ButtonText></Button>
      <Button size="md"><ButtonText>Medium</ButtonText></Button>
      <Button size="lg"><ButtonText>Large</ButtonText></Button>
    </View>
  ),
}

// Simple plus icon component for demos
function PlusIcon({ size = 16 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <View style={{ position: 'absolute', width: size * 0.6, height: 2, backgroundColor: 'currentColor', borderRadius: 1 }} />
      <View style={{ position: 'absolute', width: 2, height: size * 0.6, backgroundColor: 'currentColor', borderRadius: 1 }} />
    </View>
  )
}

export const IconButton: Story = {
  render: () => (
    <View style={{ gap: 16 }}>
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
        <Button isIconButton size="sm" color="primary">
          <ButtonIcon as={PlusIcon} size={14} />
        </Button>
        <Button isIconButton size="md" color="primary">
          <ButtonIcon as={PlusIcon} size={16} />
        </Button>
        <Button isIconButton size="lg" color="primary">
          <ButtonIcon as={PlusIcon} size={20} />
        </Button>
      </View>
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
        <Button isIconButton variant="outline" color="primary">
          <ButtonIcon as={PlusIcon} />
        </Button>
        <Button isIconButton variant="ghost" color="primary">
          <ButtonIcon as={PlusIcon} />
        </Button>
      </View>
    </View>
  ),
}
