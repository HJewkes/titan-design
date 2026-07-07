import type { Meta, StoryObj } from '@storybook/react-vite'
import { TopBar } from './TopBar'
import { type Device } from './DeviceRow'

const DEVICES: Device[] = [
  { id: 'Voltra-A3F2', nickname: 'Left Cable', slot: 'L', state: 'connected' },
  { id: 'Voltra-9B1C', nickname: 'Right Cable', slot: 'R', state: 'connected' },
  { id: 'Voltra-77E0', nickname: 'Spare', slot: null, state: 'available' },
]

const meta: Meta<typeof TopBar> = {
  title: 'Shell/TopBar',
  component: TopBar,
  tags: ['autodocs'],
  args: { state: 'live', devices: DEVICES },
  argTypes: {
    state: { control: 'select', options: ['live', 'rest', 'idle'] },
    devices: { control: 'object' },
    subtitle: { control: 'text' },
    showSubtitle: { control: 'boolean' },
    showClock: { control: 'boolean' },
    time: { control: false },
    onSelectDevice: { control: false },
  },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '**Organism** — the persistent shell chrome band, and the root of the top-bar family ' +
          '(see `shell/README.md` for the full dependency map). Composes ' +
          '[BrandLockup](?path=/docs/shell-topbar-brandlockup--docs) + ' +
          '[SessionStatePill](?path=/docs/shell-topbar-sessionstatepill--docs) + ' +
          '[Divider](?path=/docs/components-divider--docs) (`bg-border-prominent`) + ' +
          '[DeviceMenu](?path=/docs/shell-topbar-devicemenu--docs) + ' +
          '[DateTime](?path=/docs/custom-datetime--docs) (`variant="mono"` live clock). ' +
          'Background = the shared `surfaceGradient.chrome` primitive.\n\n' +
          '**Try it:** use the **Controls** to change `state`, edit `devices` (set one to `lost` to see the ' +
          'fault), or toggle `showSubtitle` / `showClock`. **Resize the canvas** to watch the ' +
          'container-responsive collapse (SIZE-D01) — subtitle drops < 1024px, clock < 720px. ' +
          'Click the device glyph to open the menu.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof TopBar>

export const Default: Story = {}
