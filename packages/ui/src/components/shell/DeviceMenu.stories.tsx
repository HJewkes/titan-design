import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { DeviceMenu } from './DeviceMenu'
import { type Device } from './DeviceRow'

const meta: Meta<typeof DeviceMenu> = {
  title: 'Shell/Organisms/DeviceMenu',
  component: DeviceMenu,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '**Organism.** The device glyph + its dropdown. Composes ' +
          '[Popover](?path=/docs/components-popover--docs) + ' +
          '[DeviceIndicator](?path=/docs/shell-molecules-deviceindicator--docs) (trigger) + ' +
          '[DeviceRow](?path=/docs/shell-molecules-devicerow--docs) (list) + ' +
          '[Typography](?path=/docs/custom-typography--docs) (header). Aggregates the bound devices ' +
          '(worst-of) for the glyph state.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof DeviceMenu>

const DEVICES: Device[] = [
  { id: 'Voltra-A3F2', nickname: 'Left Cable', slot: 'L', state: 'connected' },
  { id: 'Voltra-9B1C', nickname: 'Right Cable', slot: 'R', state: 'connected' },
  { id: 'Voltra-77E0', nickname: 'Spare', slot: null, state: 'available' },
]

/** Click the glyph to open. */
export const Default: Story = {
  render: () => (
    <View className="flex-row p-4">
      <DeviceMenu devices={DEVICES} />
    </View>
  ),
}

/** Opened (controlled). */
export const Open: Story = {
  render: () => (
    <View className="flex-row p-4 pb-40">
      <DeviceMenu devices={DEVICES} isOpen />
    </View>
  ),
}
