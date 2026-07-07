import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { DeviceRow, type Device } from './DeviceRow'

const meta: Meta<typeof DeviceRow> = {
  title: 'Shell/Molecules/DeviceRow',
  component: DeviceRow,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '**Molecule.** One device row: status dot · name · Bluetooth id. Composes ' +
          '[Indicator](?path=/docs/components-indicator--docs) (status dot) + ' +
          '[Typography](?path=/docs/custom-typography--docs) (`body2` name, `mono` id).',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof DeviceRow>

const DEVICES: Device[] = [
  { id: 'Voltra-A3F2', nickname: 'Left Cable', slot: 'L', state: 'connected' },
  { id: 'Voltra-9B1C', nickname: 'Right Cable', slot: 'R', state: 'connected' },
  { id: 'Voltra-77E0', nickname: 'Spare', slot: null, state: 'available' },
  { id: 'Voltra-5D4A', nickname: 'Left Cable', slot: 'L', state: 'lost' },
]

export const AllStates: Story = {
  render: () => (
    <View className="w-[320px] bg-surface-elevated rounded-lg p-1">
      {DEVICES.map((d) => (
        <DeviceRow key={d.id} device={d} />
      ))}
    </View>
  ),
}
