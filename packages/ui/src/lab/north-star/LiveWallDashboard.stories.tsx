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
 * Tier-C slots render their BASE component as an explicit stub (velocity hero, wall
 * tempo bar, rest ring, cue flag) pending their Gate-1 variant.
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
    variant: { control: 'inline-radio', options: ['live', 'rest'] },
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
