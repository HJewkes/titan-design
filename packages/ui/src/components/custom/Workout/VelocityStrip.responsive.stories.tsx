/**
 * Notch across widths — the between-group notch (drop sub-loads / myo clusters /
 * cluster intra-rests) is a fixed 8px gap, held constant at every strip width. This
 * page renders the real {@link VelocityStrip} across a ladder of widths (session-rail
 * → wall dashboard) and across rep / rep-grouping counts, so the notch can be judged
 * at the size it will actually ship at. Same set, stacked and left-aligned across
 * widths: the notch stays put while the bars grow, so it reads as a group break at
 * rail scale without ballooning at wall scale.
 */
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import { VelocityStrip, type VelocitySet } from './VelocityStrip'
import { T_PRIMARY, T_SECONDARY, T_TERTIARY, INSET, BORDER_SUBTLE, Page } from './setHeadingKit'

const INTER = 'Inter, sans-serif'
const MONO = 'monospace'

// The width ladder: a session-rail row, two mid app widths, a modality card, a wall
// dashboard. These bracket everywhere the strip renders.
const WIDTHS = [130, 200, 300, 440, 620] as const

// Preview height — the production mini strip is 3px tall; shown a touch taller here so
// the horizontal notch is legible on screen. Width (the axis under test) is untouched.
const PREVIEW_HEIGHT = 8

// Velocity colour buckets (match the modalities exploration: fastest green → slowest red).
const G = 1.1
const A = 0.85
const O = 0.6
const R = 0.4

/** A descending velocity ramp of length n (1.15 → 0.40), for realistic fatigue. */
function ramp(n: number): number[] {
  if (n <= 1) return [G]
  return Array.from({ length: n }, (_, i) => {
    const t = i / (n - 1)
    return Math.round((1.15 - t * 0.75) * 100) / 100
  })
}

type Config = { name: string; detail: string; set: VelocitySet }

const CONFIGS: Config[] = [
  {
    name: 'Straight · 5',
    detail: '5 reps · one group · no notch',
    set: { type: 'straight', velocities: [G, A, A, O, R], planned: 5 },
  },
  {
    name: 'Straight · 12',
    detail: '12 reps · one group · no notch',
    set: { type: 'straight', velocities: ramp(12), planned: 12 },
  },
  {
    name: 'Drop · 3 loads',
    detail: '3 groups (5 / 3 / 2) · 2 notches',
    set: { type: 'drop', subloads: [[G, A, O, O, R], [A, O, R], [O, R]] },
  },
  {
    name: 'Cluster · groups of 2',
    detail: '10 reps · 5 groups · 4 notches',
    set: { type: 'cluster', velocities: ramp(10), groupSize: 2, planned: 10 },
  },
  {
    name: 'Cluster · groups of 3',
    detail: '15 reps · 5 groups · 4 notches (dense)',
    set: { type: 'cluster', velocities: ramp(15), groupSize: 3, planned: 15 },
  },
  {
    name: 'Myo · open',
    detail: 'activation + 2 clusters · 2 notches + cyan tail',
    set: { type: 'myo', activation: [G, A, A, O, O, R], clusters: [[A, O, R], [O, R]], open: true },
  },
]

function WidthRow({ set, width }: { set: VelocitySet; width: number }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <Text style={{ fontFamily: MONO, fontSize: 10, color: T_TERTIARY, width: 44, textAlign: 'right' }}>
        {width}px
      </Text>
      <View style={{ width }}>
        <VelocityStrip variant="mini" set={set} style={{ height: PREVIEW_HEIGHT }} />
      </View>
    </View>
  )
}

function ConfigPanel({ c }: { c: Config }) {
  return (
    <View
      style={{
        backgroundColor: INSET,
        borderWidth: 1,
        borderColor: '#2A2A2E',
        borderRadius: 12,
        padding: 18,
        gap: 14,
        width: 620 + 44 + 12 + 36, // widest strip + label col + gap + panel padding
      }}
    >
      <View style={{ gap: 3 }}>
        <Text style={{ fontFamily: INTER, fontSize: 15, fontWeight: '700', color: T_PRIMARY }}>{c.name}</Text>
        <Text style={{ fontFamily: INTER, fontSize: 12, color: T_TERTIARY }}>{c.detail}</Text>
      </View>
      <View style={{ height: 1, backgroundColor: BORDER_SUBTLE }} />
      <View style={{ gap: 12 }}>
        {WIDTHS.map((w) => (
          <WidthRow key={w} set={c.set} width={w} />
        ))}
      </View>
    </View>
  )
}

const meta: Meta = {
  title: 'Workout/DataViz/VelocityStrip/Responsive Width',
  parameters: { layout: 'fullscreen' },
}
export default meta
type Story = StoryObj

export const NotchAcrossWidths: Story = {
  name: 'Between-group notch · across widths',
  render: () => (
    <Page
      title="Notch across widths — a fixed 8px group break"
      note="The notch that separates drop sub-loads, myo clusters and cluster intra-rests is a fixed 8px gap, held constant at every strip width — so it reads as a group break at session-rail scale AND at wall-dashboard scale without ballooning as the strip grows. Each panel is one set type, stacked and left-aligned across the width ladder (130px rail → 620px wall); both the 2px rep gap and the 8px notch hold fixed while only the bars grow. Straight sets carry no notch (baseline). Preview strips are shown at 8px tall for legibility; the production mini strip is 3px."
    >
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 18 }}>
        {CONFIGS.map((c) => (
          <ConfigPanel key={c.name} c={c} />
        ))}
      </View>

      <Text style={{ fontFamily: INTER, fontSize: 12.5, color: T_SECONDARY, lineHeight: 19, maxWidth: 760, marginTop: 4 }}>
        Reading the ladder: the notch holds at 8px everywhere, so at rail scale it is a clear group break
        (4× the rep gap) and at wall scale it stays a tidy break rather than a canyon. Watch the dense
        cluster (groups of 3, 15 reps): even where the bars are thin, the 8px notch separates groups without
        a proportional gap swallowing the strip at large sizes. The single knob is WIDE_GAP in
        VelocityStrip.tsx.
      </Text>
    </Page>
  ),
}
