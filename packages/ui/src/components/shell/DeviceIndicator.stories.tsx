import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import { DeviceIndicator } from './DeviceIndicator'

const meta: Meta<typeof DeviceIndicator> = {
  title: 'Shell/Molecules/DeviceIndicator',
  component: DeviceIndicator,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '**Molecule.** Composes [BluetoothIcon](?path=/docs/shell-atoms-icons--docs), color-coded by ' +
          'connection state via a `text-status-*-vivid` token (the glyph color alone carries the fault — ' +
          'no separate badge).',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof DeviceIndicator>

export const States: Story = {
  render: () => (
    <View className="flex-row gap-8 items-start">
      {(['connected', 'degraded', 'lost'] as const).map((status) => (
        <View key={status} className="items-center gap-2">
          <DeviceIndicator status={status} />
          <Text className="font-mono text-[10px] text-text-tertiary">{status}</Text>
        </View>
      ))}
    </View>
  ),
}
