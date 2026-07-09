import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { DeviceRow } from './DeviceRow'

const meta: Meta<typeof DeviceRow> = {
  title: 'Shell/DeviceRow',
  component: DeviceRow,
  tags: ['autodocs'],
  args: {
    device: { id: 'Voltra-A3F2', nickname: 'Left Cable', slot: 'L', state: 'connected' },
  },
  argTypes: {
    device: { control: 'object' },
    onPress: { control: false },
  },
  decorators: [
    (Story) => (
      <View className="w-[320px] bg-surface-elevated rounded-lg p-1">
        <Story />
      </View>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          '**Molecule.** One device row: status dot · name · Bluetooth id. Composes ' +
          '[Indicator](?path=/docs/components-atoms-indicator--docs) (status dot) + ' +
          '[Typography](?path=/docs/foundations-typography--docs) (`body2` name, `mono` id). ' +
          'Edit the `device` control (set `state` to `lost` / `available`, `slot` to `null`) to explore.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof DeviceRow>

export const Default: Story = {}
