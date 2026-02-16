import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import { Tooltip } from './Tooltip'
import { Button, ButtonText } from '../button'

const meta: Meta<typeof Tooltip> = {
  title: 'Components/Tooltip',
  component: Tooltip,
  tags: ['autodocs'],
  argTypes: {
    placement: {
      control: 'select',
      options: ['top', 'top-start', 'top-end', 'bottom', 'bottom-start', 'bottom-end', 'left', 'right'],
    },
    hasArrow: { control: 'boolean' },
    isDisabled: { control: 'boolean' },
  },
}

export default meta
type Story = StoryObj<typeof Tooltip>

export const Default: Story = {
  render: () => (
    <View style={{ padding: 100 }}>
      <Tooltip label="This is a tooltip">
        <Button>
          <ButtonText>Hover me</ButtonText>
        </Button>
      </Tooltip>
    </View>
  ),
}

export const AllPlacements: Story = {
  render: () => (
    <View style={{ padding: 100, gap: 24 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 16 }}>
        <Tooltip label="Top Start" placement="top-start">
          <Button variant="outline" size="sm">
            <ButtonText>Top Start</ButtonText>
          </Button>
        </Tooltip>
        <Tooltip label="Top" placement="top">
          <Button variant="outline" size="sm">
            <ButtonText>Top</ButtonText>
          </Button>
        </Tooltip>
        <Tooltip label="Top End" placement="top-end">
          <Button variant="outline" size="sm">
            <ButtonText>Top End</ButtonText>
          </Button>
        </Tooltip>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Tooltip label="Left" placement="left">
          <Button variant="outline" size="sm">
            <ButtonText>Left</ButtonText>
          </Button>
        </Tooltip>
        <Tooltip label="Right" placement="right">
          <Button variant="outline" size="sm">
            <ButtonText>Right</ButtonText>
          </Button>
        </Tooltip>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 16 }}>
        <Tooltip label="Bottom Start" placement="bottom-start">
          <Button variant="outline" size="sm">
            <ButtonText>Bottom Start</ButtonText>
          </Button>
        </Tooltip>
        <Tooltip label="Bottom" placement="bottom">
          <Button variant="outline" size="sm">
            <ButtonText>Bottom</ButtonText>
          </Button>
        </Tooltip>
        <Tooltip label="Bottom End" placement="bottom-end">
          <Button variant="outline" size="sm">
            <ButtonText>Bottom End</ButtonText>
          </Button>
        </Tooltip>
      </View>
    </View>
  ),
}

export const WithDelay: Story = {
  render: () => (
    <View style={{ padding: 100 }}>
      <Tooltip label="Appears after 500ms" openDelay={500}>
        <Button>
          <ButtonText>Hover (with delay)</ButtonText>
        </Button>
      </Tooltip>
    </View>
  ),
}

export const WithoutArrow: Story = {
  render: () => (
    <View style={{ padding: 100 }}>
      <Tooltip label="No arrow" hasArrow={false}>
        <Button>
          <ButtonText>Hover me</ButtonText>
        </Button>
      </Tooltip>
    </View>
  ),
}

export const OnText: Story = {
  render: () => (
    <View style={{ padding: 100 }}>
      <Text className="text-text-primary">
        Hover over the{' '}
        <Tooltip label="This is helpful information">
          <Text className="text-brand-primary underline">underlined text</Text>
        </Tooltip>
        {' '}to see a tooltip.
      </Text>
    </View>
  ),
}
