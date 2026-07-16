import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { DashboardShell, type Device } from '../../components'
import { LivePage, type LivePageVariant } from './LivePage'
import { dashboardFixture } from './fixtures'

/** The fixture with its prescribed tempo stripped — a set with no tempo (hidden readout). */
const noTempoModel = {
  ...dashboardFixture,
  session: { ...dashboardFixture.session, tempo: undefined },
}

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
  /** Whether the current set has a prescribed tempo; off hides the tempo readout. */
  tempo: boolean
}

const meta: Meta<WallArgs> = {
  title: 'Lab/North Star/Live Wall Dashboard',
  args: { variant: 'live', tempo: true },
  argTypes: {
    variant: {
      control: 'inline-radio',
      options: ['live', 'live-dual', 'rest', 'ready', 'idle', 'no-device'],
    },
    tempo: { control: 'boolean' },
  },
  render: ({ variant, tempo }) => {
    // Idle stages (VW-68) map onto the shell's `idle` session pill; `no-device` also drops the
    // TopBar's connected Voltras so the shell chrome tells the same disconnected story.
    const empty = variant === 'idle' || variant === 'ready' || variant === 'no-device'
    const state = empty ? 'idle' : variant === 'rest' ? 'rest' : 'live'
    return (
      <DashboardShell
        activeKey="live"
        state={state}
        liveKey={variant === 'rest' ? 'live' : null}
        devices={variant === 'no-device' ? [] : DEVICES}
        subtitle="wall dashboard"
      >
        <LivePage variant={variant} model={tempo ? dashboardFixture : noTempoModel} />
      </DashboardShell>
    )
  },
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

/** Mid-set with NO prescribed tempo — the tempo readout is hidden; the alert takes the row. */
export const LiveNoTempo: Story = {
  args: { variant: 'live', tempo: false },
  parameters: {
    docs: {
      description: {
        story:
          'The live stage for a set with no prescribed tempo (coach left it unset and no ' +
          'exercise default). The tempo card is hidden entirely — no invented placeholder — ' +
          'and the alert cue simply pins to the right of the row.',
      },
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

/**
 * IDLE — a session is open but its first set has not begun (VW-68). The stage shows a
 * "Ready · {exercise}" hero with the real loaded weight; the header + rail context stay.
 */
export const SessionReady: Story = {
  args: { variant: 'ready' },
  parameters: {
    docs: {
      description: {
        story:
          'A session is open but no set has begun. The stage is the designed EmptyLiveView — ' +
          '"Ready · Cable Chest Press" with the real loaded weight — not a blank box. The header ' +
          'and rail keep their context because a session exists.',
      },
    },
  },
}

/**
 * IDLE — connected, no session, no plan (VW-68). The barren view the operator hit, redesigned:
 * a "Waiting for a set" hero and an EMPTY rail (no `— × — @ 0 lbs` stub row).
 */
export const NoSession: Story = {
  args: { variant: 'idle' },
  parameters: {
    docs: {
      description: {
        story:
          'Connected but no session — the state that motivated VW-68. The stage shows an honest ' +
          '"Waiting for a set" empty state, the rail is empty (no stubbed placeholder row), and ' +
          'the shell pill reads IDLE. Sets start on the machine / via MCP, so there is no button.',
      },
    },
  },
}

/** IDLE — no Voltra connected (VW-68): a "connect a Voltra" hero; the TopBar drops its devices. */
export const NoDevice: Story = {
  args: { variant: 'no-device' },
  parameters: {
    docs: {
      description: {
        story:
          'No Voltra connected. The stage copy shifts to "No Voltra connected" and the shell ' +
          'TopBar shows no devices — the content and chrome tell the same disconnected story.',
      },
    },
  },
}
