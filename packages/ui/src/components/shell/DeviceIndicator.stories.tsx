import type { Meta, StoryObj } from '@storybook/react-vite'
import { DeviceIndicator } from './DeviceIndicator'

const meta: Meta<typeof DeviceIndicator> = {
  title: 'Shell/DeviceIndicator',
  component: DeviceIndicator,
  tags: ['autodocs'],
  args: { status: 'connected' },
  argTypes: {
    status: { control: 'select', options: ['connected', 'degraded', 'lost'] },
    label: { control: 'text' },
    onPress: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component:
          '**Molecule.** Composes [BluetoothIcon](?path=/docs/foundations-icons--docs), color-coded by ' +
          'connection state via a `text-status-*-vivid` token — the glyph color alone carries the fault ' +
          '(no separate badge). Switch the `status` control to see connected / degraded / lost.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof DeviceIndicator>

export const Default: Story = {}
