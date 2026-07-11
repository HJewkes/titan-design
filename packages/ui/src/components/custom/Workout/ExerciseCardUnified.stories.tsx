/**
 * SHEET · Unified exercise card (page 2) — the LOCKED rail-expansion, now hardened onto the
 * REAL {@link ExerciseCard}. The collapsed rail item and the expanded card are ONE object: the
 * persistent header is the real {@link ExerciseCardHeading} (via `ExerciseCard` state `rail`),
 * and expanding reveals the body on the SAME surface — PREV dropped, done + upcoming sets share
 * ONE muted treatment, the ACTIVE set stands out by brightness. Every per-row strip is the REAL
 * {@link VelocityStrip} via its `set` descriptor: `mini` (flat 3px) for done/upcoming, and the
 * new `compact` velocity-height variant as the active-set SPOTLIGHT (option B, locked).
 *
 * The hand-built `CompactSpotlight` prototype this sheet used to fork three ways (A/B/C) is
 * retired: B won and is now `VelocityStrip variant="compact"`, so the card is on real components
 * end to end. A standalone row of the compact variant is shown for the record.
 */
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import { ExerciseCard } from './ExerciseCard'
import { VelocityStrip } from './VelocityStrip'
import { type SetRowProps } from './SetRow'
import { INSET, BORDER_SUBTLE, T_PRIMARY, T_SECONDARY, Page, monoTag } from './setHeadingKit'

const INTER = 'Inter, sans-serif'

/** Per-rep mean velocity that DECAYS across a set (fast → slow). */
const decay = (n: number, start: number, span = 0.5) =>
  Array.from({ length: n }, (_, r) => +(start - (span * r) / Math.max(1, n - 1)).toFixed(3))

// The exercise: a flat straight set (Cable Chest Press, 3 × 10 @ 90 lb).
const DONE = decay(10, 1.05)
const ACTIVE = decay(5, 0.95, 0.3)

// One data source drives both representations. Set 1 done · set 2 LIVE (5/10) · set 3 upcoming.
// The expanded header's per-set strip is DERIVED from these rows by ExerciseCard.
const SETS: SetRowProps[] = [
  {
    mode: 'completed',
    setNumber: 1,
    reps: 10,
    weight: 90,
    rpe: 7.5,
    unit: 'lbs',
    velocities: DONE,
  },
  {
    mode: 'active',
    setNumber: 2,
    reps: null,
    weight: null,
    unit: 'lbs',
    isLive: true,
    targets: { reps: 10, weight: 90 },
    velocities: ACTIVE,
  },
  {
    mode: 'active',
    setNumber: 3,
    reps: null,
    weight: null,
    unit: 'lbs',
    targets: { reps: 10, weight: 90 },
  },
]

const CARD_PROPS = {
  name: 'Cable Chest Press',
  summary: { sets: 3, reps: 10, weight: 90, unit: 'lbs' as const },
  tempo: [2, 1, 2, 0] as [number, number, number, number],
  indicator: 'info' as const,
  sets: SETS,
  onToggle: () => {},
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
      note="The LOCKED rail-expansion, hardened onto the real ExerciseCard. Collapsed, it's the rail item (state `rail`); expanded (state `expanded`), the SAME surface reveals the table body — PREV dropped, done + upcoming sets share ONE muted treatment, the ACTIVE set stands out by brightness. Every per-row strip is the real VelocityStrip: `mini` for done/upcoming, the new `compact` velocity-height variant as the active-set spotlight (B, locked). No hand-built prototype strip remains."
    >
      <View style={{ flexDirection: 'row', gap: 40, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <View style={{ gap: 8 }}>
          <Text style={{ ...monoTag, color: T_SECONDARY }}>
            collapsed · rail item (the header on its own)
          </Text>
          <Surface>
            <ExerciseCard state="rail" {...CARD_PROPS} />
          </Surface>
        </View>

        <View style={{ gap: 8 }}>
          <Text style={{ ...monoTag, color: T_SECONDARY }}>
            expanded · same header + revealed body
          </Text>
          <Surface>
            <ExerciseCard state="expanded" {...CARD_PROPS} />
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
        body flowing out of the rail row rather than a separate panel. Both cards are the real
        ExerciseCard driven by one set of props; the expanded header&apos;s per-set strip is derived
        from the same rows the body renders.
      </Text>
    </Page>
  ),
}
