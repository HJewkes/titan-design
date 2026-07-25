/**
 * Set modalities — every per-rep strength set-type rendered by the REAL
 * {@link VelocityStrip}. One strip model for every set type: it defaults to the
 * target rep count as grey slots, overshoot grows the strip, and open-ended sets
 * (AMRAP · the myo tail) carry a persistent cyan "continue" slot. Each card
 * carries a `Collapse` accordion showing how to configure the `set` prop for that
 * view. Promoted from the Lab/Explorations "Set Modalities" specimen once the
 * vocabulary hardened into VelocityStrip's `set` descriptor.
 */
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import { VelocityStrip, type VelocitySet } from './VelocityStrip'
import { Collapse, CollapseButton, CollapseContent } from '../../ui/collapse/Collapse'
import { SET_STRIP_VARIABLE_COLOR as CYAN } from './SetStrip'
import {
  GREY,
  velColor,
  T_PRIMARY,
  T_SECONDARY,
  T_TERTIARY,
  INSET,
  BORDER_SUBTLE,
  Page,
} from './setHeadingKit'

const INTER = 'Inter, sans-serif'
const VAR_EDGE = '#22465F' // cyan-800 — the continue-slot outline
const CYAN_TEXT = '#22D3EE'

/** Pretty-print a value as a compact TS literal (single-line arrays). */
function formatValue(value: unknown): string {
  if (Array.isArray(value)) {
    if (value.length > 0 && Array.isArray(value[0])) {
      return `[${value.map((v) => formatValue(v)).join(', ')}]`
    }
    return `[${(value as number[]).join(', ')}]`
  }
  return typeof value === 'string' ? `'${value}'` : String(value)
}

/** The exact `set` prop, pretty-printed as a TS object for the accordion. */
function formatSet(set: VelocitySet): string {
  const body = Object.entries(set)
    .map(([key, value]) => `  ${key}: ${formatValue(value)},`)
    .join('\n')
  return `set={{\n${body}\n}}`
}

type Modality = {
  name: string
  alias: string
  tags: string[]
  def: string
  useWhen: string
  set: VelocitySet
}

// Representative velocities per colour bucket, matching the exploration's VEL map
// (g/a/o/r → the real velColor() ramp: fastest green → slowest red).
const G = 1.1
const A = 0.85
const O = 0.6
const R = 0.4

const MODS: Modality[] = [
  {
    name: 'Straight set',
    alias: '3 × 10',
    tags: ['fixed reps'],
    def: 'A fixed number of reps at a fixed load — the baseline every other type varies from. Done reps colour; the remainder to the planned count sits grey.',
    useWhen: 'A prescribed rep count at a fixed load — the default set.',
    set: { type: 'straight', velocities: [G, A, A, O, O, R], planned: 10 },
  },
  {
    name: 'Rep-range',
    alias: '8–12',
    tags: ['bounded reps'],
    def: 'A floor and a ceiling — committed reps to the floor (grey todo), then a variable window (cyan) to the ceiling. A done variable rep is a real rep and colours normally.',
    useWhen: 'A hypertrophy set prescribed as a range (e.g. 8–12) rather than a fixed count.',
    set: { type: 'range', velocities: [G, A, A, O, O, O, R, R, A], floor: 8, max: 12 },
  },
  {
    name: 'AMRAP',
    alias: 'as many reps as possible',
    tags: ['open-ended'],
    def: 'One set, no cap — the target is a floor to beat. Velocity decay is the story; the trailing cyan slot never closes.',
    useWhen: 'A final "leave nothing" set, or a rep-out test where the count is the outcome.',
    set: { type: 'amrap', velocities: [G, G, A, A, O, O, O, R, R, R], target: 8 },
  },
  {
    name: 'Drop set',
    alias: 'strip / dropset',
    tags: ['load drops', 'open-ended'],
    def: 'Reps to failure at a load, then DROP the load (no rest) and continue — 1–3 drops. Sub-loads split by a WIDE notch gap.',
    useWhen: 'Extending a set past failure by shedding load — the notch marks each weight drop.',
    set: { type: 'drop', subloads: [[G, A, O, O, R], [A, O, R], [O, R]] },
  },
  {
    name: 'Myo-reps',
    alias: 'rest-pause',
    tags: ['clusters', 'open-ended'],
    def: 'Activation set to near-failure, then rest-pause mini-clusters at the SAME load until a cluster fails. Open tail → cyan continue.',
    useWhen: 'High-density hypertrophy: one activation set milked for extra clusters.',
    set: { type: 'myo', activation: [G, A, A, O, O, R], clusters: [[A, O, R], [O, R]], open: true },
  },
  {
    name: 'Cluster set',
    alias: 'intra-set rest',
    tags: ['fixed reps', 'intra-rest'],
    def: 'A fixed rep count at a HIGH load, broken by short intra-set rests so every rep stays fast — power, not failure. Fixed count → no cyan tail.',
    useWhen: 'Strength/power work where each rep must stay fast; rests are planned, count is fixed.',
    set: { type: 'cluster', velocities: [G, G, G, A, G, G, A, G], groupSize: 2, planned: 10 },
  },
]

function tagStyle(open: boolean) {
  return {
    fontFamily: INTER,
    fontSize: 10,
    fontWeight: '600' as const,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
    color: open ? CYAN_TEXT : T_TERTIARY,
    borderWidth: 1,
    borderColor: open ? VAR_EDGE : '#2A2A2E',
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: 8,
    overflow: 'hidden' as const,
  }
}

function ConfigAccordion({ set, useWhen }: { set: VelocitySet; useWhen: string }) {
  return (
    <Collapse>
      <CollapseButton className="px-0 py-2 rounded-none">
        <Text style={{ fontFamily: INTER, fontSize: 11, fontWeight: '700', letterSpacing: 0.4, color: CYAN_TEXT }}>
          How to configure this view
        </Text>
      </CollapseButton>
      <CollapseContent className="px-0">
        <View style={{ backgroundColor: '#0A0A0A', borderWidth: 1, borderColor: '#2A2A2E', borderRadius: 8, padding: 12, gap: 8 }}>
          <Text style={{ fontFamily: 'monospace', fontSize: 11, lineHeight: 17, color: T_SECONDARY }}>
            {`<VelocityStrip\n  variant="compact"\n  ${formatSet(set).replace(/\n/g, '\n  ')}\n/>`}
          </Text>
          <Text style={{ fontFamily: INTER, fontSize: 12, color: T_TERTIARY, lineHeight: 17 }}>
            Use when: {useWhen}
          </Text>
        </View>
      </CollapseContent>
    </Collapse>
  )
}

function Card({ m }: { m: Modality }) {
  return (
    <View style={{ backgroundColor: INSET, borderWidth: 1, borderColor: '#2A2A2E', borderRadius: 12, padding: 18, gap: 12, width: 460 }}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <Text style={{ fontFamily: INTER, fontSize: 16, fontWeight: '700', color: T_PRIMARY }}>
          {m.name} <Text style={{ fontSize: 12, fontWeight: '500', color: T_TERTIARY }}>{m.alias}</Text>
        </Text>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {m.tags.map((t) => {
            const open = /open-ended/.test(t)
            return (
              <Text key={t} style={tagStyle(open)}>
                {t}
              </Text>
            )
          })}
        </View>
      </View>
      <Text style={{ fontFamily: INTER, fontSize: 13, color: T_SECONDARY, lineHeight: 19 }}>{m.def}</Text>
      <View style={{ paddingVertical: 6 }}>
        <VelocityStrip variant="compact" set={m.set} />
      </View>
      <View style={{ height: 1, backgroundColor: BORDER_SUBTLE }} />
      <ConfigAccordion set={m.set} useWhen={m.useWhen} />
    </View>
  )
}

function Principle({ k, title, body }: { k: string; title: string; body: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: INSET, borderWidth: 1, borderColor: '#2A2A2E', borderRadius: 10, padding: 16, gap: 7, minWidth: 220 }}>
      <Text style={{ fontFamily: INTER, fontSize: 10, fontWeight: '600', letterSpacing: 1.2, textTransform: 'uppercase', color: CYAN_TEXT }}>{k}</Text>
      <Text style={{ fontFamily: INTER, fontSize: 14, fontWeight: '600', color: T_PRIMARY }}>{title}</Text>
      <Text style={{ fontFamily: INTER, fontSize: 12.5, color: T_SECONDARY, lineHeight: 18 }}>{body}</Text>
    </View>
  )
}

function Swatch({ color, label, outlined }: { color: string; label: string; outlined?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
      <View style={{ width: 22, height: 10, borderRadius: 2, backgroundColor: color, ...(outlined ? { borderWidth: 1, borderColor: VAR_EDGE } : {}) }} />
      <Text style={{ fontFamily: INTER, fontSize: 12, color: T_SECONDARY }}>{label}</Text>
    </View>
  )
}

const meta: Meta = {
  title: 'Workout/DataViz/VelocityStrip/Set Modalities',
  parameters: { layout: 'fullscreen' },
}
export default meta
type Story = StoryObj

export const StripVocabulary: Story = {
  name: 'One strip vocabulary · every set type',
  render: () => (
    <Page
      title="Set modalities — the VelocityStrip set-type vocabulary"
      note="Every per-rep strength set-type, rendered by the real VelocityStrip via its `set` prop. One strip model: defaults to the target rep count (grey slots) · overshoot grows the strip · open-ended sets (AMRAP · the myo tail) carry a persistent cyan 'continue' slot. Real velocity colours + the cyan variable token. Open each card's accordion for the exact `set` configuration and a 'use when' note."
    >
      <View style={{ flexDirection: 'row', gap: 14, flexWrap: 'wrap', maxWidth: 940 }}>
        <Principle k="default" title="Target reps as slots" body="A set opens as N grey placeholder slots — the prescribed count. Each done rep fills its slot with its velocity colour." />
        <Principle k="overshoot" title="Extra reps grow it" body="Beat the prescription and the strip keeps adding slots. The plan is a floor to draw against, not a cap." />
        <Principle k="open-ended" title="A cyan continue tail" body="AMRAP and the myo tail carry a persistent cyan slot; new reps insert before it — it argues 'there's more'." />
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14, alignItems: 'center', marginTop: 4 }}>
        <Swatch color={velColor(G)} label="fastest" />
        <Swatch color={velColor(A)} label="fast" />
        <Swatch color={velColor(O)} label="moderate" />
        <Swatch color={velColor(R)} label="slow" />
        <Swatch color={GREY} label="planned / to-do" />
        <Swatch color={CYAN} label="variable · continue" outlined />
      </View>

      <View style={{ height: 1, backgroundColor: BORDER_SUBTLE, marginVertical: 4 }} />

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
        {MODS.map((m) => (
          <Card key={m.name} m={m} />
        ))}
      </View>
    </Page>
  ),
}

export const ActiveSetExpanded: Story = {
  name: 'Straight set · expanded spotlight',
  render: () => (
    <Page
      title="Straight set — the expanded active-set spotlight"
      note="The expanded VelocityStrip for a live straight set: done reps as velocity-height bars, the planned remainder as short grey stubs, and the mean · loss summary derived from the done reps."
    >
      <View style={{ width: 520, gap: 10 }}>
        <VelocityStrip set={{ type: 'straight', velocities: [1.12, 1.05, 0.98, 0.9, 0.82, 0.7], planned: 10 }} expanded />
      </View>
    </Page>
  ),
}
