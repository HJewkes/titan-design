import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import { DashboardShell } from './DashboardShell'

/**
 * `Pages/DashboardShell` — the wall-dashboard chrome as one registered surface.
 * Composes the shell-nav island (SideNav + TopBar and everything they pull in) over a
 * `children` content slot, so the dashboard app mounts a single component.
 */
const meta: Meta<typeof DashboardShell> = {
  title: 'Pages/DashboardShell',
  component: DashboardShell,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '**Page shell.** The wall-dashboard chrome. Composes ' +
          '[SideNav](?path=/docs/shell-sidenav--docs) + ' +
          '[TopBar](?path=/docs/shell-topbar--docs) — which pulls in DeviceMenu, DeviceRow, ' +
          'DeviceIndicator, SessionStatePill, BrandLockup, DateTime and Divider — over a ' +
          '`children` content slot. Mount this instead of re-assembling the chrome per view.',
      },
    },
  },
  argTypes: {
    state: { control: 'select', options: ['live', 'rest', 'idle'] },
    activeKey: { control: 'select', options: ['live', 'review', 'program', 'body'] },
    liveKey: { control: 'select', options: [null, 'live', 'review', 'program', 'body'] },
    onNavigate: { control: false },
    onSelectDevice: { control: false },
  },
  decorators: [
    (Story) => (
      <View style={{ height: '100vh' as unknown as number, backgroundColor: '#0E0E0E' }}>
        <Story />
      </View>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof DashboardShell>

export const Default: Story = {
  args: { activeKey: 'live', state: 'live' },
}

export const WithContent: Story = {
  args: { activeKey: 'review', state: 'rest', liveKey: 'live' },
  render: (args) => (
    <DashboardShell {...args}>
      <View style={{ flex: 1, padding: 28 }}>
        <Text style={{ color: '#E5E5E5', fontSize: 22, fontWeight: '700' }}>Review</Text>
        <Text style={{ color: '#8A8A8A', fontSize: 13, marginTop: 6 }}>
          A page mounts its content here; the shell keeps the nav + top-bar chrome persistent.
        </Text>
      </View>
    </DashboardShell>
  ),
  parameters: {
    docs: { description: { story: 'The shell with a page mounted in its content slot.' } },
  },
}
