import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import { Divider } from './Divider'

const meta: Meta<typeof Divider> = {
  title: 'Components/Atoms/Divider',
  component: Divider,
  tags: ['autodocs'],
  argTypes: {
    orientation: {
      control: 'select',
      options: ['horizontal', 'vertical'],
      description: 'Divider orientation',
    },
  },
}

export default meta
type Story = StoryObj<typeof Divider>

export const Default: Story = {
  args: {
    orientation: 'horizontal',
  },
  render: (args) => (
    <View style={{ width: 300 }}>
      <Text className="text-text-primary mb-3">Content above</Text>
      <Divider {...args} />
      <Text className="text-text-primary mt-3">Content below</Text>
    </View>
  ),
}

export const Horizontal: Story = {
  render: () => (
    <View style={{ width: 300, gap: 12 }}>
      <Text className="text-text-primary">Section One</Text>
      <Divider />
      <Text className="text-text-primary">Section Two</Text>
      <Divider />
      <Text className="text-text-primary">Section Three</Text>
    </View>
  ),
}

export const Vertical: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', alignItems: 'center', height: 40, gap: 12 }}>
      <Text className="text-text-primary">Left</Text>
      <Divider orientation="vertical" />
      <Text className="text-text-primary">Center</Text>
      <Divider orientation="vertical" />
      <Text className="text-text-primary">Right</Text>
    </View>
  ),
}

export const InList: Story = {
  render: () => (
    <View style={{ width: 300 }}>
      {['Item One', 'Item Two', 'Item Three', 'Item Four'].map((item, index, arr) => (
        <View key={item}>
          <View style={{ paddingVertical: 12 }}>
            <Text className="text-text-primary">{item}</Text>
          </View>
          {index < arr.length - 1 && <Divider />}
        </View>
      ))}
    </View>
  ),
}
