import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ComponentProps } from 'react'
import { useEffect, useState } from 'react'
import { View, Text } from 'react-native'
import { TempoDisplay, type TempoLivePhase, type TempoLiveState } from './TempoDisplay'

// tempo = [eccentric, pauseBottom, concentric, pauseTop]
const meta: Meta<typeof TempoDisplay> = {
  title: 'Workout/TempoDisplay',
  component: TempoDisplay,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '**Molecule.** The eccentric/pause/concentric/pause tempo display. Composes ' +
          '[MetricCell](?path=/docs/workout-metriccell--docs) ' +
          '(shared value/separator cell). Used-by ↑ ' +
          '[ExerciseHeading](?path=/docs/workout-exerciseheading--docs) (`showLabel={false}`).',
      },
    },
  },
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

// A full rep cycle incl. a 2s rest at the top between reps.
const LIVE_CYCLE: { phase: TempoLivePhase; ms: number }[] = [
  { phase: 'eccentric', ms: 3000 },
  { phase: 'pauseBottom', ms: 1000 },
  { phase: 'concentric', ms: 2000 },
  { phase: 'pauseTop', ms: 2000 },
]

function LiveTempoDemo() {
  const [live, setLive] = useState<TempoLiveState>({
    activePhase: 'eccentric',
    phaseElapsedMs: 0,
    completed: {},
  })
  useEffect(() => {
    let idx = 0
    let start = Date.now()
    let completed: TempoLiveState['completed'] = {}
    const id = setInterval(() => {
      const step = LIVE_CYCLE[idx]
      const elapsed = Date.now() - start
      if (elapsed >= step.ms + 300) {
        // Bank the phase's actual duration, advance; a new rep (wrap to idx 0) resets the row.
        completed = { ...completed, [step.phase]: elapsed }
        idx = (idx + 1) % LIVE_CYCLE.length
        if (idx === 0) completed = {}
        start = Date.now()
      }
      setLive({
        activePhase: LIVE_CYCLE[idx].phase,
        phaseElapsedMs: Math.min(elapsed, step.ms + 300),
        completed,
      })
    }, 50)
    return () => clearInterval(id)
  }, [])
  return <TempoDisplay tempo={[3, 1, 2, 2]} live={live} />
}

// Self-driving demo cycling Ecc → Pause → Con → 2s rest, banking each phase as it completes.
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

// --- Active tempo conditions (the countdown/fill readout under different states) ----

/** One captioned live-tempo specimen at a larger scale so the fill + readout read clearly. */
function Condition({
  caption,
  ...props
}: { caption: string } & ComponentProps<typeof TempoDisplay>) {
  return (
    <View style={{ gap: 5 }}>
      <Text style={{ color: '#9CA3AF', fontFamily: 'Inter, sans-serif', fontSize: 11 }}>
        {caption}
      </Text>
      <TempoDisplay showLabel={false} showInfo={false} fontSize={26} {...props} />
    </View>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 12 }}>
      <Text
        style={{
          color: '#E5E7EB',
          fontFamily: 'Inter, sans-serif',
          fontSize: 12,
          fontWeight: '700',
          letterSpacing: 1,
          textTransform: 'uppercase',
        }}
      >
        {title}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 36, alignItems: 'flex-start' }}>
        {children}
      </View>
    </View>
  )
}

// tempo [3,1,2,2] — 3s eccentric, 1s bottom pause, 2s concentric, and a 2s rest at the top.
const TEMPO = [3, 1, 2, 2] as [number, number, number, number]

/**
 * The active tempo across the states it moves through: pacing (ahead → on-target →
 * behind), each phase active, the countdown vs count-up readout, and idle. Static
 * frames plus the self-driving animation, all in the one hyphenated display.
 */
export const ActiveTempoConditions: Story = {
  render: () => (
    <View style={{ gap: 28, padding: 8 }}>
      <Section title="Pacing — eccentric (3s target), countdown">
        <Condition
          caption="Ahead / in progress · 1.2s → 1.8 left"
          tempo={TEMPO}
          live={{ activePhase: 'eccentric', phaseElapsedMs: 1200 }}
        />
        <Condition
          caption="On target · 2.9s → 0.1 left (green)"
          tempo={TEMPO}
          live={{ activePhase: 'eccentric', phaseElapsedMs: 2900 }}
        />
        <Condition
          caption="Behind · 3.8s → −0.8 over (red)"
          tempo={TEMPO}
          live={{ activePhase: 'eccentric', phaseElapsedMs: 3800 }}
        />
      </Section>

      <Section title="Through a rep — earlier phases bank their final time (countdown)">
        <Condition
          caption="Eccentric active · nothing banked yet"
          tempo={TEMPO}
          live={{ activePhase: 'eccentric', phaseElapsedMs: 1500 }}
        />
        <Condition
          caption="Pause active · ecc banked at −0.1 (a touch long)"
          tempo={TEMPO}
          live={{ activePhase: 'pauseBottom', phaseElapsedMs: 500, completed: { eccentric: 3100 } }}
        />
        <Condition
          caption="Concentric active · ecc + pause banked"
          tempo={TEMPO}
          live={{
            activePhase: 'concentric',
            phaseElapsedMs: 1000,
            completed: { eccentric: 3000, pauseBottom: 900 },
          }}
        />
        <Condition
          caption="Rest at top (2s) · whole rep banked"
          tempo={TEMPO}
          live={{
            activePhase: 'pauseTop',
            phaseElapsedMs: 700,
            completed: { eccentric: 3000, pauseBottom: 900, concentric: 2050 },
          }}
        />
      </Section>

      <Section title="Readout mode — eccentric, 1.0s into a 3s phase">
        <Condition
          caption="Countdown → 0.0 · shows 2.0 left"
          tempo={TEMPO}
          liveReadout="countdown"
          live={{ activePhase: 'eccentric', phaseElapsedMs: 1000 }}
        />
        <Condition
          caption="Count-up → target · shows 1.0 elapsed"
          tempo={TEMPO}
          liveReadout="countup"
          live={{ activePhase: 'eccentric', phaseElapsedMs: 1000 }}
        />
      </Section>

      <Section title="Idle & animated">
        <Condition
          caption="Idle · no active phase (static)"
          tempo={TEMPO}
          live={{ activePhase: null, phaseElapsedMs: 0 }}
        />
        <View style={{ gap: 5 }}>
          <Text style={{ color: '#9CA3AF', fontFamily: 'Inter, sans-serif', fontSize: 11 }}>
            Animated · Ecc → Pause → Con → 2s rest, banking each phase
          </Text>
          <LiveTempoDemo />
        </View>
      </Section>
    </View>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'The active tempo under different conditions — pacing (ahead → on-target → behind), ' +
          'each phase active, the countdown vs count-up readout, and idle — all in the one ' +
          'hyphenated display with the vertical phase-progress fill.',
      },
    },
  },
}
