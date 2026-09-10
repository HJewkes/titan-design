import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { WorkoutShell } from './WorkoutShell'
import { Surface } from '../../ui/surface'
import { Typography } from '../../custom/Typography'

/**
 * `Pages/WorkoutShell` — the workout wall-dashboard chrome as one registered surface.
 * Composes the generic AppShell and fills its slots with the workout's own chrome, so
 * the dashboard app mounts a single component.
 */
const meta: Meta<typeof WorkoutShell> = {
  title: 'Pages/WorkoutShell',
  component: WorkoutShell,
  tags: ['autodocs', 'status:candidate', '!status:review'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '**Page shell (workout app).** Composes ' +
          '[AppShell](?path=/docs/pages-appshell--docs) and fills its top-bar slot with ' +
          '[WorkoutTopBar](?path=/docs/shell-workout-workouttopbar--docs) — which pulls in ' +
          'DeviceMenu, DeviceRow, DeviceIndicator and SessionStatePill — and its nav slot with ' +
          'the four workout categories. Mount this instead of re-assembling the chrome per ' +
          'view.\n\nThis is the AW-132 shape: the generic shell knows nothing about devices or ' +
          'session state; this component is the whole workout-specific surface.',
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
      <Surface level="base" style={{ height: '100vh' as unknown as number }}>
        <Story />
      </Surface>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof WorkoutShell>

export const Default: Story = {
  args: { activeKey: 'live', state: 'live' },
}

export const WithContent: Story = {
  args: { activeKey: 'review', state: 'rest', liveKey: 'live' },
  render: (args) => (
    <WorkoutShell {...args}>
      <View className="flex-1 gap-1.5 p-7">
        <Typography variant="h4" color="primary">
          Review
        </Typography>
        <Typography variant="body2" color="tertiary">
          A page mounts its content here; the shell keeps the nav + top-bar chrome persistent.
        </Typography>
      </View>
    </WorkoutShell>
  ),
  parameters: {
    docs: { description: { story: 'The shell with a page mounted in its content slot.' } },
  },
}
