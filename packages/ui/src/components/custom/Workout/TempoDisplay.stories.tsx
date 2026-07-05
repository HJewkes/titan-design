import type { Meta, StoryObj } from '@storybook/react-vite'
import { useEffect, useState } from 'react'
import { View } from 'react-native'
import { TempoDisplay, type TempoLivePhase, type TempoLiveState } from './TempoDisplay'

// tempo = [eccentric, pauseBottom, concentric, pauseTop]
const meta: Meta<typeof TempoDisplay> = {
  title: 'Custom/Workout/TempoDisplay',
  component: TempoDisplay,
  tags: ['autodocs'],
  argTypes: {
    tempo: {
      control: 'object',
      description: 'Tempo values [eccentric, pauseBottom, concentric, pauseTop] in seconds',
    },
    size: { control: 'select', options: ['sm', 'md'], description: 'Size variant' },
    colored: { control: 'boolean', description: 'Colored vs mono display' },
    showInfo: { control: 'boolean', description: 'Show info tooltip on press' },
    live: {
      control: 'object',
      description: 'Live phase-fill state (opt-in); omit for static prescription',
    },
  },
}

export default meta
type Story = StoryObj<typeof TempoDisplay>

export const ColoredStandard: Story = {
  args: { tempo: [3, 1, 1, 0], colored: true },
}

export const MonoStandard: Story = {
  args: { tempo: [3, 1, 1, 0], colored: false },
}

export const ColoredExplosive: Story = {
  args: { tempo: [1, 0, 1, 0], colored: true },
}

export const MonoExplosive: Story = {
  args: { tempo: [1, 0, 1, 0], colored: false },
}

export const ColoredSlowEccentric: Story = {
  args: { tempo: [5, 2, 1, 1], colored: true },
}

export const SmallColored: Story = {
  args: { tempo: [3, 1, 1, 0], size: 'sm', colored: true },
}

export const SmallMono: Story = {
  args: { tempo: [3, 1, 1, 0], size: 'sm', colored: false },
}

export const AllVariants: Story = {
  render: () => (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <TempoDisplay tempo={[3, 1, 1, 0]} colored />
        <TempoDisplay tempo={[3, 1, 1, 0]} colored={false} />
      </View>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <TempoDisplay tempo={[1, 0, 1, 0]} colored />
        <TempoDisplay tempo={[1, 0, 1, 0]} colored={false} />
      </View>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <TempoDisplay tempo={[3, 1, 1, 0]} size="sm" colored />
        <TempoDisplay tempo={[3, 1, 1, 0]} size="sm" colored={false} />
      </View>
    </View>
  ),
}

// --- Live phase-fill (opt-in) ----------------------------------------------

// Deterministic mid-rep frames — the active phase digit fills against its target.
export const LiveEccentricInProgress: Story = {
  args: { tempo: [3, 1, 1, 0], live: { activePhase: 'eccentric', phaseElapsedMs: 1500 } },
}

// Concentric target is 1s; 1.6s elapsed is behind pace, so the digit turns red.
export const LiveBehindPace: Story = {
  args: { tempo: [3, 1, 1, 0], live: { activePhase: 'concentric', phaseElapsedMs: 1600 } },
}

const LIVE_CYCLE: { phase: TempoLivePhase; ms: number }[] = [
  { phase: 'eccentric', ms: 3000 },
  { phase: 'pauseBottom', ms: 1000 },
  { phase: 'concentric', ms: 1000 },
]

function LiveTempoDemo() {
  const [live, setLive] = useState<TempoLiveState>({ activePhase: 'eccentric', phaseElapsedMs: 0 })
  useEffect(() => {
    let idx = 0
    let start = Date.now()
    const id = setInterval(() => {
      const step = LIVE_CYCLE[idx]
      const elapsed = Date.now() - start
      if (elapsed >= step.ms + 400) {
        idx = (idx + 1) % LIVE_CYCLE.length
        start = Date.now()
      }
      setLive({
        activePhase: LIVE_CYCLE[idx].phase,
        phaseElapsedMs: Math.min(elapsed, step.ms + 400),
      })
    }, 50)
    return () => clearInterval(id)
  }, [])
  return <TempoDisplay tempo={[3, 1, 1, 0]} live={live} />
}

// Self-driving demo cycling Ecc → Pause → Con to show the fill animating.
export const LiveAnimated: Story = {
  render: () => <LiveTempoDemo />,
}

// Static and live side by side — the same prescription, two modes.
export const StaticVsLive: Story = {
  render: () => (
    <View style={{ gap: 12 }}>
      <TempoDisplay tempo={[3, 1, 1, 0]} />
      <TempoDisplay
        tempo={[3, 1, 1, 0]}
        live={{ activePhase: 'eccentric', phaseElapsedMs: 1500 }}
      />
      <LiveTempoDemo />
    </View>
  ),
}
