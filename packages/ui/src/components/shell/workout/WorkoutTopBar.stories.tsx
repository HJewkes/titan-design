import type { Meta, StoryObj } from '@storybook/react-vite'
import { WorkoutTopBar } from './WorkoutTopBar'
import { type Device } from './DeviceRow'

const DEVICES: Device[] = [
  { id: 'Voltra-A3F2', nickname: 'Left Cable', slot: 'L', state: 'connected' },
  { id: 'Voltra-9B1C', nickname: 'Right Cable', slot: 'R', state: 'connected' },
  { id: 'Voltra-77E0', nickname: 'Spare', slot: null, state: 'available' },
]

const meta: Meta<typeof WorkoutTopBar> = {
  title: 'Shell/Workout/WorkoutTopBar',
  component: WorkoutTopBar,
  tags: ['autodocs', 'status:candidate', '!status:review'],
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
          '**Organism (workout app).** The generic ' +
          "[TopBar](?path=/docs/shell-topbar--docs) with the workout's own chrome in its " +
          '`trailing` slot: [SessionStatePill](?path=/docs/shell-workout-sessionstatepill--docs) ' +
          'then [DeviceMenu](?path=/docs/shell-workout-devicemenu--docs). The bar adds the ' +
          'dividers and the edge-pinned clock; this component only supplies the items ' +
          '(AW-132).\n\n' +
          '**Try it:** use the **Controls** to change `state`, edit `devices` (set one to ' +
          '`lost` to see the fault), or toggle `showSubtitle` / `showClock`. **Resize the ' +
          'canvas** to watch the container-responsive collapse (SIZE-D01). Click the device ' +
          'glyph to open the menu.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof WorkoutTopBar>

export const Default: Story = {}

/** A lost device — the glyph alone carries the fault. */
export const DeviceLost: Story = {
  args: {
    state: 'rest',
    devices: [
      { id: 'Voltra-A3F2', nickname: 'Left Cable', slot: 'L', state: 'connected' },
      { id: 'Voltra-9B1C', nickname: 'Right Cable', slot: 'R', state: 'lost' },
    ],
  },
}
