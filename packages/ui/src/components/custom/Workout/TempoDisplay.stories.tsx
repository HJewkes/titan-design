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
    fontSize: {
      control: { type: 'range', min: 9, max: 48, step: 1 },
      description: 'Digit size (overrides `size`)',
    },
    showLabel: { control: 'boolean', description: 'Show the TEMPO caption' },
    showInfo: { control: 'boolean', description: 'Show info tooltip on press' },
    live: {
      control: 'object',
      description: 'Live phase-fill state (opt-in); omit for static prescription',
    },
  },
}

export default meta
type Story = StoryObj<typeof TempoDisplay>

// The static prescription — the base tempo lockup (phase-coloured), no live readout.
// Add the `live` prop (see the Live stories below) to turn it into the running tempo.
export const Prescription: Story = {
  args: { tempo: [3, 1, 2, 2] },
}

// --- Live tempo (opt-in via the `live` prop) --------------------------------

// A full rep cycle incl. a 2s rest at the top between reps.
const LIVE_CYCLE: { phase: TempoLivePhase; ms: number }[] = [
  { phase: 'eccentric', ms: 3000 },
  { phase: 'pauseBottom', ms: 1000 },
  { phase: 'concentric', ms: 2000 },
  { phase: 'pauseTop', ms: 2000 },
]

function LiveTempoDemo({
  fontSize,
  showLabel = false,
  liveReadout,
}: {
  fontSize?: number
  showLabel?: boolean
  liveReadout?: 'countdown' | 'countup'
}) {
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
  return (
    <TempoDisplay
      tempo={[3, 1, 2, 2]}
      live={live}
      fontSize={fontSize}
      showLabel={showLabel}
      showInfo={false}
      liveReadout={liveReadout}
    />
  )
}

// Self-driving demo cycling Ecc → Pause → Con → 2s rest, banking each phase as it completes.
export const LiveAnimated: Story = {
  render: () => <LiveTempoDemo />,
}

// Interactive: drag the size (form factor) and toggle the TEMPO label / readout mode live.
interface PlaygroundArgs {
  fontSize: number
  showLabel: boolean
  liveReadout: 'countdown' | 'countup'
}
export const LivePlayground: StoryObj<PlaygroundArgs> = {
  args: { fontSize: 26, showLabel: true, liveReadout: 'countdown' },
  argTypes: {
    fontSize: { control: { type: 'range', min: 12, max: 52, step: 2 }, description: 'Form factor' },
    showLabel: { control: 'boolean', description: 'Toggle the TEMPO label' },
    liveReadout: { control: 'inline-radio', options: ['countdown', 'countup'] },
  },
  render: (args) => (
    <LiveTempoDemo
      fontSize={args.fontSize}
      showLabel={args.showLabel}
      liveReadout={args.liveReadout}
    />
  ),
  parameters: {
    docs: {
      description: {
        story:
          'The live tempo is responsive — the whole chip (height, digits, padding, label) ' +
          'scales with the size. Drag **fontSize** to see any form factor, toggle **showLabel** ' +
          '(works at every size), and switch the readout mode.',
      },
    },
  },
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
      <Section title="Pacing — the number by time-to-target (yellow ahead → green ±0.1 → red slow)">
        <Condition
          caption="Ahead · 1.2s → 1.8 left (yellow)"
          tempo={TEMPO}
          live={{ activePhase: 'eccentric', phaseElapsedMs: 1200 }}
        />
        <Condition
          caption="On target · 2.9s → 0.1 left (green)"
          tempo={TEMPO}
          live={{ activePhase: 'eccentric', phaseElapsedMs: 2900 }}
        />
        <Condition
          caption="Slow · 3.8s → −0.8 over (red)"
          tempo={TEMPO}
          live={{ activePhase: 'eccentric', phaseElapsedMs: 3800 }}
        />
      </Section>

      <Section title="Through a rep — earlier phases bank their final time, semantically toned">
        <Condition
          caption="Eccentric active · nothing banked yet"
          tempo={TEMPO}
          live={{ activePhase: 'eccentric', phaseElapsedMs: 1500 }}
        />
        <Condition
          caption="Pause active · ecc banked slow (−0.5, red)"
          tempo={TEMPO}
          live={{ activePhase: 'pauseBottom', phaseElapsedMs: 500, completed: { eccentric: 3500 } }}
        />
        <Condition
          caption="Concentric active · ecc on-target, pause fast (+0.2, yellow)"
          tempo={TEMPO}
          live={{
            activePhase: 'concentric',
            phaseElapsedMs: 1000,
            completed: { eccentric: 3000, pauseBottom: 800 },
          }}
        />
        <Condition
          caption="Rest at top (2s) · whole rep banked (green/yellow/red)"
          tempo={TEMPO}
          live={{
            activePhase: 'pauseTop',
            phaseElapsedMs: 700,
            completed: { eccentric: 3000, pauseBottom: 800, concentric: 2200 },
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

      <Section title="Form factors — the view scales; the label toggles at any size">
        <Condition
          caption="Compact (14) · label off"
          tempo={TEMPO}
          fontSize={14}
          live={{
            activePhase: 'concentric',
            phaseElapsedMs: 900,
            completed: { eccentric: 3000, pauseBottom: 1000 },
          }}
        />
        <Condition
          caption="Default (22) · label on"
          tempo={TEMPO}
          fontSize={22}
          showLabel
          live={{
            activePhase: 'concentric',
            phaseElapsedMs: 900,
            completed: { eccentric: 3000, pauseBottom: 1000 },
          }}
        />
        <Condition
          caption="Wall (34) · label on"
          tempo={TEMPO}
          fontSize={34}
          showLabel
          live={{
            activePhase: 'concentric',
            phaseElapsedMs: 900,
            completed: { eccentric: 3000, pauseBottom: 1000 },
          }}
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
