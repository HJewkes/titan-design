import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { DeviceMenu } from './DeviceMenu'
import { type Device } from './DeviceRow'

const DEVICES: Device[] = [
  { id: 'Voltra-A3F2', nickname: 'Left Cable', slot: 'L', state: 'connected' },
  { id: 'Voltra-9B1C', nickname: 'Right Cable', slot: 'R', state: 'connected' },
  { id: 'Voltra-77E0', nickname: 'Spare', slot: null, state: 'available' },
]

const meta: Meta<typeof DeviceMenu> = {
  title: 'Shell/TopBar/DeviceMenu',
  component: DeviceMenu,
  tags: ['autodocs'],
  args: { devices: DEVICES, isOpen: false },
  argTypes: {
    devices: { control: 'object' },
    isOpen: { control: 'boolean' },
    onOpenChange: { control: false },
    onSelectDevice: { control: false },
  },
  decorators: [
    (Story) => (
      <View className="flex-row p-4 pb-48">
        <Story />
      </View>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          '**Organism.** The device glyph + its dropdown. Composes ' +
          '[Popover](?path=/docs/components-popover--docs) + ' +
          '[DeviceIndicator](?path=/docs/shell-topbar-devicemenu-deviceindicator--docs) (trigger) + ' +
          '[DeviceRow](?path=/docs/shell-topbar-devicemenu-devicerow--docs) (list) + ' +
          '[Typography](?path=/docs/custom-typography--docs) (header). Aggregates the bound devices ' +
          '(worst-of) for the glyph state. Click the glyph, or toggle the `isOpen` control.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof DeviceMenu>

export const Default: Story = {}
