/**
 * SHEET · Unified exercise card (page 2) — the LOCKED rail-expansion, hardened onto the
 * REAL {@link ExerciseCard}. The collapsed rail item and the expanded card are ONE object: the
 * persistent header is the real {@link ExerciseCardHeading}, and expanding reveals the body on the
 * SAME surface — PREV dropped, done + upcoming sets share ONE muted treatment, the ACTIVE set
 * stands out by brightness. Every per-row strip is the REAL {@link VelocityStrip} via its `set`
 * descriptor: `mini` (flat 3px) for done/upcoming, and the `compact` velocity-height variant as
 * the active-set SPOTLIGHT (option B, locked). No hand-built prototype strip remains.
 */
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import { ExerciseCard } from './ExerciseCard'
import { ExerciseCardHeading } from './ExerciseCardHeading'
import { VelocityStrip } from './VelocityStrip'
import { type SetRowProps } from './SetRow'
import { type SetStripSet } from './SetStrip'
import { INSET, BORDER_SUBTLE, T_PRIMARY, T_SECONDARY, Page, monoTag } from './setHeadingKit'

const INTER = 'Inter, sans-serif'

/** Per-rep mean velocity that DECAYS across a set (fast → slow). */
const decay = (n: number, start: number, span = 0.5) =>
  Array.from({ length: n }, (_, r) => +(start - (span * r) / Math.max(1, n - 1)).toFixed(3))

// The exercise: a flat straight set (Cable Chest Press, 3 × 10 @ 90 lb).
const DONE = decay(10, 1.05)
const ACTIVE = decay(5, 0.95, 0.3)

// One data source drives both representations. Set 1 done · set 2 LIVE · set 3 upcoming.
const SETS: SetRowProps[] = [
  { state: 'done', setNumber: 1, unit: 'lbs', reps: 10, weight: 90, rpe: 7.5, velocities: DONE },
  {
    state: 'live',
    setNumber: 2,
    unit: 'lbs',
    target: { reps: 10, weight: 90 },
    reps: 5,
    weight: 90,
    velocities: ACTIVE,
  },
  { state: 'todo', setNumber: 3, unit: 'lbs', target: { reps: 10, weight: 90 } },
]

// The header's per-set strip: the same lifecycle the card derives internally, built here
// so the collapsed rail item (ExerciseCardHeading) reads from the same source as the body.
const HEADER_STATES: SetStripSet[] = [
  { status: 'done', velocities: DONE },
  { status: 'active', velocities: ACTIVE, planned: 10 },
  { status: 'todo', planned: 10 },
]

const CARD_PROPS = {
  name: 'Cable Chest Press',
  summary: { sets: 3, reps: 10, weight: 90, unit: 'lbs' as const },
  tempo: [2, 1, 2, 0] as [number, number, number, number],
  indicator: 'info' as const,
  sets: SETS,
}

function Surface({ children, width = 260 }: { children: React.ReactNode; width?: number }) {
  return (
    <View style={{ width, backgroundColor: INSET, borderRadius: 8, overflow: 'hidden' }}>
      {children}
    </View>
  )
}

const meta: Meta = {
  title: 'Lab/Explorations/Unified Exercise Card',
  parameters: { layout: 'fullscreen' },
}
export default meta
type Story = StoryObj

export const Unified: Story = {
  name: 'One object · rail header → expanded body (real ExerciseCard)',
  render: () => (
    <Page
      title="Unified exercise card — the rail heading IS the header"
      note="The LOCKED rail-expansion, hardened onto the real ExerciseCard. Collapsed, it's the rail item (the real ExerciseCardHeading); expanded, the SAME surface reveals the table body — PREV dropped, done + upcoming sets share ONE muted treatment, the ACTIVE set stands out by brightness. Every per-row strip is the real VelocityStrip: `mini` for done/upcoming, the `compact` velocity-height variant as the active-set spotlight (B, locked). No hand-built prototype strip remains."
    >
      <View style={{ flexDirection: 'row', gap: 40, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <View style={{ gap: 8 }}>
          <Text style={{ ...monoTag, color: T_SECONDARY }}>
            collapsed · rail item (ExerciseCardHeading)
          </Text>
          <Surface>
            <ExerciseCardHeading
              name={CARD_PROPS.name}
              sets={3}
              reps={10}
              load={90}
              unit="lbs"
              tempo={CARD_PROPS.tempo}
              indicator={CARD_PROPS.indicator}
              setStates={HEADER_STATES}
            />
          </Surface>
        </View>

        <View style={{ gap: 8 }}>
          <Text style={{ ...monoTag, color: T_SECONDARY }}>
            expanded · same header + revealed body
          </Text>
          <Surface>
            <ExerciseCard {...CARD_PROPS} defaultExpanded />
          </Surface>
        </View>
      </View>

      <View style={{ height: 1, backgroundColor: BORDER_SUBTLE, marginVertical: 8 }} />

      <View style={{ gap: 10, maxWidth: 320 }}>
        <Text style={{ ...monoTag, color: T_SECONDARY }}>
          the locked active-set spotlight · VelocityStrip variant=&quot;compact&quot;
        </Text>
        <View style={{ backgroundColor: INSET, borderRadius: 8, padding: 12 }}>
          <VelocityStrip
            variant="compact"
            set={{ type: 'straight', velocities: ACTIVE, planned: 10 }}
          />
        </View>
        <Text style={{ fontFamily: INTER, fontSize: 12.5, color: T_SECONDARY, lineHeight: 19 }}>
          A small fixed-height (~24px) velocity-HEIGHT strip: bar height ∝ velocity against a fixed
          1.15 m/s ceiling, planned reps as grey stubs, set-type aware — none of the full
          variant&apos;s labels, info row, or mount animation. It reads as the same object as the
          flat `mini` strips above it, just taller and brighter to mark the live set.
        </Text>
      </View>

      <Text
        style={{
          fontFamily: INTER,
          fontSize: 12.5,
          color: T_PRIMARY,
          lineHeight: 19,
          maxWidth: 780,
          marginTop: 6,
        }}
      >
        The header is the same molecule collapsed and expanded — the card reads as one object, the
        body flowing out of the rail row rather than a separate panel. The expanded card is the real
        ExerciseCard; its header per-set strip is derived from the same rows the body renders.
      </Text>
    </Page>
  ),
}
