import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { PlaceholderStrip } from './PlaceholderStrip'

const meta: Meta<typeof PlaceholderStrip> = {
  title: 'Workout/PlaceholderStrip',
  component: PlaceholderStrip,
  tags: ['autodocs'],
  argTypes: {
    width: {
      control: 'text',
      description: 'Fixed width or flex:1 (default)',
    },
    mode: {
      control: 'select',
      options: ['single', 'segmented'],
      description: 'Render as single dashed strip or segmented mini-strip',
    },
    segments: {
      control: 'number',
      description: 'Number of segments in segmented mode',
    },
  },
}

export default meta
type Story = StoryObj<typeof PlaceholderStrip>

export const Default: Story = {
  args: {},
  decorators: [
    (Story) => (
      <View style={{ width: 300 }}>
        <Story />
      </View>
    ),
  ],
}

export const FixedWidth: Story = {
  args: {
    width: 200,
  },
}

export const Segmented: Story = {
  args: {
    mode: 'segmented',
    segments: 5,
  },
  decorators: [
    (Story) => (
      <View style={{ width: 300 }}>
        <Story />
      </View>
    ),
  ],
}

export const SegmentedThree: Story = {
  args: {
    mode: 'segmented',
    segments: 3,
  },
  decorators: [
    (Story) => (
      <View style={{ width: 200 }}>
        <Story />
      </View>
    ),
  ],
}

export const MultipleStrips: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', gap: 4, width: 300 }}>
      <View style={{ flex: 1, height: 3, backgroundColor: '#2ed573', borderRadius: 1 }} />
      <View style={{ flex: 1, height: 3, backgroundColor: '#ffd43b', borderRadius: 1 }} />
      <View style={{ flex: 1, height: 3, backgroundColor: '#ffa502', borderRadius: 1 }} />
      <PlaceholderStrip />
      <PlaceholderStrip />
    </View>
  ),
}

export const MixedModes: Story = {
  render: () => (
    <View style={{ gap: 12, width: 300 }}>
      <PlaceholderStrip mode="single" />
      <PlaceholderStrip mode="segmented" segments={5} />
      <PlaceholderStrip mode="segmented" segments={8} />
    </View>
  ),
}
