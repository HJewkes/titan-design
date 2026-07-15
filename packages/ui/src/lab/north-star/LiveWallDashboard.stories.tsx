import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { DashboardShell, type Device } from '../../components'
import { LivePage, type LivePageVariant } from './LivePage'

/**
 * `Lab/North Star/Live Wall Dashboard` — the north-star wall-dashboard specimen.
 *
 * A LAB specimen: it COMPOSES existing production components ({@link DashboardShell}
 * around a lab-scoped `LivePage`) into the target surface. It is NOT a published
 * library component — nothing here is added to a package barrel.
 *
 * The live-stage slots render their REAL treatments: the VelocityStrip hero, the live
 * TempoDisplay (running tempo, folded into the head), the consolidated status cue, and
 * the RestTimer ring. `live-dual` stacks two live layers, one per voltra.
 */
const DEVICES: Device[] = [
  { id: 'Voltra-A3F2', nickname: 'Left Cable', slot: 'L', state: 'connected' },
  { id: 'Voltra-9B1C', nickname: 'Right Cable', slot: 'R', state: 'connected' },
]

interface WallArgs {
  variant: LivePageVariant
}

const meta: Meta<WallArgs> = {
  title: 'Lab/North Star/Live Wall Dashboard',
  args: { variant: 'live' },
  argTypes: {
    variant: { control: 'inline-radio', options: ['live', 'live-dual', 'rest'] },
  },
  render: ({ variant }) => (
    <DashboardShell
      activeKey="live"
      state={variant === 'rest' ? 'rest' : 'live'}
      liveKey={variant === 'rest' ? 'live' : null}
      devices={DEVICES}
      subtitle="wall dashboard"
    >
      <LivePage variant={variant} />
    </DashboardShell>
  ),
  decorators: [
    (Story) => (
      <View style={{ height: '100vh' as unknown as number, backgroundColor: '#0E0E0E' }}>
        <Story />
      </View>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '**North Star wall dashboard** (lab specimen). Composes ' +
          '[DashboardShell](?path=/docs/pages-dashboardshell--docs) around a lab `LivePage` ' +
          '(SessionRail + a Live/Rest stage). Toggle **variant** to switch between the ' +
          'mid-set live read-out and the between-sets rest read-out. Tier-C slots render ' +
          'their base component as a labelled stub.',
      },
    },
  },
}

export default meta
type Story = StoryObj<WallArgs>

/** Mid-set: velocity hero, live metrics, verdict pill + amber threshold aura. */
export const Live: Story = {
  args: { variant: 'live' },
  parameters: {
    docs: {
      description: { story: 'The live (mid-set) stage — ~22% velocity loss, threshold verdict.' },
    },
  },
}

/** Dual-mode (bilateral): two stacked live layers, one per voltra — left dominant, right lags. */
export const LiveDual: Story = {
  args: { variant: 'live-dual' },
  parameters: {
    docs: {
      description: {
        story:
          'A dual-mode (bilateral) exercise — the stage stacks two live layers, one per ' +
          'voltra. The RIGHT voltra shows a realistic left-dominant deficit (slower reps, ' +
          'more velocity loss). v1 renders the two sides independently; a unified split-bar ' +
          'treatment is a later exploration.',
      },
    },
  },
}

/** Between sets: rest countdown, completed-set recap, verdict metrics + next-set mock. */
export const Rest: Story = {
  args: { variant: 'rest' },
  parameters: {
    docs: {
      description: {
        story: 'The rest stage — countdown, set recap, verdict, and a mock next-set preview.',
      },
    },
  },
}
