import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { Pill } from './Pill'
import { Indicator } from '../indicator'

const meta: Meta<typeof Pill> = {
  title: 'Components/Atoms/Pill',
  component: Pill,
  tags: ['autodocs', 'status:stable', '!status:review'],
  argTypes: {
    variant: { control: 'select', options: ['solid', 'subtle', 'outline'] },
    tone: {
      control: 'select',
      options: ['neutral', 'brand', 'brand-secondary', 'success', 'warning', 'error', 'info'],
    },
    size: { control: 'select', options: ['xs', 'sm', 'md', 'lg', 'xl'] },
    leading: { control: 'select', options: [undefined, 'dot'] },
    rounded: { control: 'boolean' },
    isDisabled: { control: 'boolean' },
  },
}
export default meta
type Story = StoryObj<typeof Pill>

export const Default: Story = { args: { children: 'Label', tone: 'brand' } }

export const AllVariants: Story = {
  render: () => (
    <View className="flex-row gap-2">
      <Pill variant="solid" tone="brand">
        Solid
      </Pill>
      <Pill variant="subtle" tone="brand">
        Subtle
      </Pill>
      <Pill variant="outline" tone="brand">
        Outline
      </Pill>
    </View>
  ),
}

export const AllTones: Story = {
  render: () => (
    <View className="flex-row gap-2 flex-wrap">
      <Pill tone="neutral">Neutral</Pill>
      <Pill tone="brand">Brand</Pill>
      <Pill tone="brand-secondary">Accent</Pill>
      <Pill tone="success">Success</Pill>
      <Pill tone="warning">Warning</Pill>
      <Pill tone="error">Error</Pill>
      <Pill tone="info">Info</Pill>
    </View>
  ),
}

export const AllSizes: Story = {
  render: () => (
    <View className="flex-row gap-2 items-center">
      <Pill size="xs" tone="brand">
        XS
      </Pill>
      <Pill size="sm" tone="brand">
        SM
      </Pill>
      <Pill size="md" tone="brand">
        MD
      </Pill>
      <Pill size="lg" tone="brand">
        LG
      </Pill>
      <Pill size="xl" tone="brand">
        XL
      </Pill>
    </View>
  ),
}

export const LeadingSlot: Story = {
  render: () => (
    <View className="flex-row gap-2">
      <Pill tone="success" leading="dot">
        Active
      </Pill>
      <Pill tone="error" leading="dot">
        Failed
      </Pill>
      <Pill tone="warning" leading={<Indicator size="xs" color="warning" />}>
        Pending
      </Pill>
    </View>
  ),
}

export const SquareCorners: Story = {
  render: () => (
    <View className="flex-row gap-2">
      <Pill rounded={false} tone="brand">
        Tag
      </Pill>
      <Pill rounded={false} tone="success">
        Done
      </Pill>
    </View>
  ),
}
