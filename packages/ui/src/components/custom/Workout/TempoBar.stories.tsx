import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { TempoBar } from './TempoBar'

const meta: Meta<typeof TempoBar> = {
  title: 'Workout/TempoBar',
  component: TempoBar,
  tags: ['autodocs'],
  argTypes: {
    activePhase: {
      control: 'select',
      options: [null, 'concentric', 'hold', 'eccentric'],
      description: 'Phase currently in progress (null = idle)',
    },
    phaseElapsedMs: { control: 'number', description: 'Elapsed ms in the active phase' },
    completed: { control: 'object', description: 'Completed phase durations (ms)' },
    target: { control: 'object', description: 'Per-phase target durations (seconds)' },
    size: {
      control: 'inline-radio',
      options: ['default', 'wall'],
      description: 'Density: default (compact) or wall (across-the-room dashboard scale)',
    },
    activeDisplay: {
      control: 'inline-radio',
      options: ['time', 'delta'],
      description: 'Active readout: time (elapsed/target) or delta (countdown). Tap to toggle.',
    },
  },
  decorators: [
    (Story) => (
      <View style={{ width: 240 }}>
        <Story />
      </View>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof TempoBar>

// tempo target: 1s concentric, 1s hold-top, 3s eccentric
const TARGET = { concentric: 1, hold: 1, eccentric: 3 }

export const Idle: Story = {
  args: { activePhase: null, phaseElapsedMs: 0, target: TARGET },
}

export const ConcentricActive: Story = {
  args: { activePhase: 'concentric', phaseElapsedMs: 600, target: TARGET },
}

export const EccentricMidRep: Story = {
  args: {
    activePhase: 'eccentric',
    phaseElapsedMs: 1500,
    completed: { concentric: 900, hold: 1000 },
    target: TARGET,
  },
}

export const BehindPace: Story = {
  args: {
    activePhase: 'eccentric',
    phaseElapsedMs: 4200,
    completed: { concentric: 1600, hold: 1000 },
    target: TARGET,
  },
}

export const RepComplete: Story = {
  args: {
    activePhase: null,
    phaseElapsedMs: 0,
    completed: { concentric: 950, hold: 1050, eccentric: 3100 },
    target: TARGET,
  },
}

export const NoTarget: Story = {
  args: {
    activePhase: 'concentric',
    phaseElapsedMs: 800,
  },
}

export const AllStates: Story = {
  render: () => (
    <View style={{ gap: 20 }}>
      <TempoBar activePhase={null} phaseElapsedMs={0} target={TARGET} />
      <TempoBar activePhase="concentric" phaseElapsedMs={600} target={TARGET} />
      <TempoBar
        activePhase="eccentric"
        phaseElapsedMs={1500}
        completed={{ concentric: 900, hold: 1000 }}
        target={TARGET}
      />
      <TempoBar
        activePhase={null}
        phaseElapsedMs={0}
        completed={{ concentric: 950, hold: 1050, eccentric: 3100 }}
        target={TARGET}
      />
    </View>
  ),
}

/**
 * The across-the-room wall scale — bigger bar, full phase words, and colour-coded
 * pacing (a missed target reads red). Here the eccentric ran long → red.
 */
export const Wall: Story = {
  args: {
    activePhase: null,
    phaseElapsedMs: 0,
    completed: { concentric: 950, hold: 1000, eccentric: 4200 },
    target: TARGET,
    size: 'wall',
  },
  decorators: [
    (Story) => (
      <View style={{ width: 460, padding: 28, backgroundColor: '#0E0E0E' }}>
        <Story />
      </View>
    ),
  ],
}

/** Wall, mid-rep — the eccentric is active, showing the delta countdown (1.5s to target). Tap to switch to elapsed/target. */
export const WallActiveDelta: Story = {
  args: {
    activePhase: 'eccentric',
    phaseElapsedMs: 1500,
    completed: { concentric: 950, hold: 1000 },
    target: TARGET,
    size: 'wall',
    activeDisplay: 'delta',
  },
  decorators: [
    (Story) => (
      <View style={{ width: 460, padding: 28, backgroundColor: '#0E0E0E' }}>
        <Story />
      </View>
    ),
  ],
}

/** Wall, over target — the eccentric ran 1.2s past its target, so the delta is negative and red. */
export const WallActiveOver: Story = {
  args: {
    activePhase: 'eccentric',
    phaseElapsedMs: 4200,
    completed: { concentric: 950, hold: 1000 },
    target: TARGET,
    size: 'wall',
    activeDisplay: 'delta',
  },
  decorators: [
    (Story) => (
      <View style={{ width: 460, padding: 28, backgroundColor: '#0E0E0E' }}>
        <Story />
      </View>
    ),
  ],
}
