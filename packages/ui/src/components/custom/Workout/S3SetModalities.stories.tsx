/**
 * SHEET · Set modalities — the velocity rep-strip vocabulary (page-2 R&D, throwaway).
 * One strip model, every set type: (1) defaults to the target rep count as grey slots, (2) overshoot grows
 * the strip, (3) open-ended sets (AMRAP · myo tail · VBT velocity-stop) carry a persistent cyan "continue"
 * slot. Real velocity ramp colours + the cyan variable token; per-rep modalities only (set-level types —
 * pyramid / superset / iso / tempo — belong to the heading or set list, not the strip). Feeds the harden of
 * VelocityStrip/SetRow set-type modes (TD-03.50 built the SetBar variants; this is the velocity-strip read).
 */
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import { SET_STRIP_VARIABLE_COLOR as CYAN } from './SetStrip'
import { GREY, velColor, T_PRIMARY, T_SECONDARY, T_TERTIARY, INSET, BORDER_SUBTLE, Page, monoTag } from './setHeadingKit'

const INTER = 'Inter, sans-serif'
const VAR_EDGE = '#22465F' // cyan-800 — the continue-slot outline
const REP_GAP = 2
const WIDE_GAP = 7 // sub-load (drop) / cluster (myo) boundary — wider than the rep gap

// Representative velocities per colour bucket, so the strip uses the real velColor() mapping.
const VEL: Record<string, number> = { g: 1.1, a: 0.85, o: 0.6, r: 0.4 }

/**
 * Strip spec = space-separated tokens. Colour char: g/a/o/r (velocity), t (todo grey), c (cyan variable).
 * Prefix '|' = wide gap before the slot (sub-load / cluster boundary). Suffix '*' = the open-ended
 * "continue" slot (cyan, outlined). e.g. "g a a o o r |a o r c*"
 */
function Strip({ spec, height = 10 }: { spec: string; height?: number }) {
  const tokens = spec.trim().split(/\s+/).filter(Boolean)
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', height }}>
      {tokens.map((tok, i) => {
        let wide = false
        let cont = false
        let ch = tok
        if (ch[0] === '|') {
          wide = true
          ch = ch.slice(1)
        }
        if (ch.endsWith('*')) {
          cont = true
          ch = ch.slice(0, -1)
        }
        const color = ch === 't' ? GREY : ch === 'c' || cont ? CYAN : velColor(VEL[ch] ?? 0.4)
        return (
          <View
            key={i}
            style={{
              flex: 1,
              height: '100%',
              marginLeft: wide ? WIDE_GAP : i ? REP_GAP : 0,
              backgroundColor: color,
              borderRadius: 1.5,
              ...(cont ? { borderWidth: 1, borderColor: VAR_EDGE } : {}),
            }}
          />
        )
      })}
    </View>
  )
}

type Modality = { name: string; alias: string; tags: string[]; def: string; strips: [string, string][] }
const MODS: Modality[] = [
  {
    name: 'Straight set',
    alias: '3 × 10',
    tags: ['fixed reps'],
    def: 'A fixed number of reps at a fixed load — the baseline every other type varies from.',
    strips: [['in progress', 'g a a o o r t t t t'], ['planned', 't t t t t t t t t t']],
  },
  {
    name: 'Rep-range',
    alias: '8–12',
    tags: ['bounded reps'],
    def: 'A floor and a ceiling — committed reps to the floor, then a variable window (cyan) to the ceiling. A done variable rep is a real rep and colours normally.',
    strips: [['done 10 / 8–12', 'g a a o o o r r a c'], ['planned', 't t t t t t t t c c c c']],
  },
  {
    name: 'AMRAP',
    alias: 'as many reps as possible',
    tags: ['open-ended'],
    def: 'One set, no cap — the target is a floor to beat. Velocity decay is the story; the trailing cyan slot never closes.',
    strips: [['in progress', 'g g a a o o o r r r c*'], ['planned 8+', 't t t t t t t t c*']],
  },
  {
    name: 'Drop set',
    alias: 'strip / dropset',
    tags: ['load drops', 'open-ended'],
    def: 'Reps to failure at a load, then DROP the load (no rest) and continue — 1–3 drops. Load changes; reps run to failure. Sub-loads split by a wide gap (weight-drop signal still open).',
    strips: [['done · 3 loads', 'g a o o r |a o r |o r'], ['loads', '120 → 100 → 80 lb']],
  },
  {
    name: 'Myo-reps',
    alias: 'rest-pause',
    tags: ['clusters', 'open-ended'],
    def: 'Activation set to near-failure, then rest-pause mini-clusters (≈5 reps) at the SAME load until you can’t finish a cluster. Open tail → cyan continue.',
    strips: [['in progress', 'g a a o o r |a o r |o r c*'], ['planned', 't t t t t t |t t t t t c*']],
  },
  {
    name: 'Cluster set',
    alias: 'intra-set rest',
    tags: ['fixed reps', 'intra-rest'],
    def: 'A fixed rep count at a HIGH load, broken by short intra-set rests so every rep stays fast — power, not failure. Fixed count → no cyan tail.',
    strips: [['done', 'g g |g a |g g |a g |g a'], ['planned', 't t |t t |t t |t t |t t']],
  },
  {
    name: 'VBT velocity-stop',
    alias: 'velocity-loss cutoff',
    tags: ['velocity-terminated', 'open-ended'],
    def: 'A straight set that ENDS when rep velocity drops below a % of the set’s best (e.g. −20%). The device calls the stop; the crossing rep (slow / red) is the terminus.',
    strips: [['in progress', 'g g a a o o r c*'], ['stops at −20%', 'g g a a o o r r ✕']],
  },
]

const tag = (open: boolean) => ({
  fontFamily: INTER,
  fontSize: 10,
  fontWeight: '600' as const,
  letterSpacing: 0.5,
  textTransform: 'uppercase' as const,
  color: open ? '#22D3EE' : T_TERTIARY,
  borderWidth: 1,
  borderColor: open ? VAR_EDGE : '#2A2A2E',
  borderRadius: 999,
  paddingVertical: 3,
  paddingHorizontal: 8,
  overflow: 'hidden' as const,
})

function Card({ m }: { m: Modality }) {
  return (
    <View style={{ backgroundColor: INSET, borderWidth: 1, borderColor: '#2A2A2E', borderRadius: 12, padding: 18, gap: 12, width: 460 }}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <Text style={{ fontFamily: INTER, fontSize: 16, fontWeight: '700', color: T_PRIMARY }}>
          {m.name} <Text style={{ fontSize: 12, fontWeight: '500', color: T_TERTIARY }}>{m.alias}</Text>
        </Text>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {m.tags.map((t) => {
            const open = /open-ended|velocity-term/.test(t)
            return <Text key={t} style={tag(open)}>{t}</Text>
          })}
        </View>
      </View>
      <Text style={{ fontFamily: INTER, fontSize: 13, color: T_SECONDARY, lineHeight: 19 }}>{m.def}</Text>
      <View style={{ gap: 8, marginTop: 2 }}>
        {m.strips.map(([label, spec], i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Text style={{ ...monoTag, color: T_TERTIARY, width: 92, textAlign: 'right' }}>{label}</Text>
            {spec.includes('→') && !spec.match(/[goart]/) ? (
              <Text style={{ ...monoTag, color: T_SECONDARY }}>{spec}</Text>
            ) : spec.includes('✕') ? (
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 7 }}>
                <Strip spec={spec.replace(' ✕', '')} />
                <Text style={{ ...monoTag, color: velColor(0.4), fontWeight: '700' }}>✕</Text>
              </View>
            ) : (
              <View style={{ flex: 1 }}><Strip spec={spec} /></View>
            )}
          </View>
        ))}
      </View>
    </View>
  )
}

function Principle({ k, title, body }: { k: string; title: string; body: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: INSET, borderWidth: 1, borderColor: '#2A2A2E', borderRadius: 10, padding: 16, gap: 7, minWidth: 220 }}>
      <Text style={{ fontFamily: INTER, fontSize: 10, fontWeight: '600', letterSpacing: 1.2, textTransform: 'uppercase', color: '#22D3EE' }}>{k}</Text>
      <Text style={{ fontFamily: INTER, fontSize: 14, fontWeight: '650', color: T_PRIMARY }}>{title}</Text>
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

const meta: Meta = { title: 'Lab/Explorations/Set Modalities', parameters: { layout: 'fullscreen' } }
export default meta
type Story = StoryObj

export const StripVocabulary: Story = {
  name: 'One strip vocabulary · every set type',
  render: () => (
    <Page
      title="Set modalities — the velocity rep-strip vocabulary"
      note="One strip model for every per-rep set type: defaults to the target rep count (grey slots) · overshoot grows the strip · open-ended sets (AMRAP · myo tail · VBT velocity-stop) carry a persistent cyan 'continue' slot. Real velocity colours + the cyan variable token. Set-level types (pyramid · superset · iso hold · tempo · eccentric-overload) belong to the heading or set list, not the strip. PROTOTYPE for the VelocityStrip/SetRow set-type harden."
    >
      <View style={{ flexDirection: 'row', gap: 14, flexWrap: 'wrap', maxWidth: 940 }}>
        <Principle k="default" title="Target reps as slots" body="A set opens as N grey placeholder slots — the prescribed count. Each done rep fills its slot with its velocity colour." />
        <Principle k="overshoot" title="Extra reps grow it" body="Beat the prescription and the strip keeps adding slots. The plan is a floor to draw against, not a cap." />
        <Principle k="open-ended" title="A cyan continue tail" body="AMRAP · the myo tail · a VBT velocity-stop carry a persistent cyan slot; new reps insert before it — it argues 'there's more'." />
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14, alignItems: 'center', marginTop: 4 }}>
        <Swatch color={velColor(1.1)} label="fastest" />
        <Swatch color={velColor(0.85)} label="fast" />
        <Swatch color={velColor(0.6)} label="moderate" />
        <Swatch color={velColor(0.4)} label="slow" />
        <Swatch color={GREY} label="planned / to-do" />
        <Swatch color={CYAN} label="variable · continue" outlined />
      </View>

      <View style={{ height: 1, backgroundColor: BORDER_SUBTLE, marginVertical: 4 }} />

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
        {MODS.map((m) => <Card key={m.name} m={m} />)}
      </View>

      <Text style={{ fontFamily: INTER, fontSize: 12.5, color: T_TERTIARY, maxWidth: 820, marginTop: 8 }}>
        Open calls: how a drop set shows the WEIGHT drop (baseline step vs marker vs load labels) · AMRAP (single trailing cyan) vs rep-range (bounded cyan window) distinctness · cluster (stays fast, no cyan) vs myo (decays, open cyan) · and which of these Voltras actually drives today.
      </Text>
    </Page>
  ),
}
