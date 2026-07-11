/**
 * SHEET · Unified exercise card (page 2) — tying the LOCKED rail-expansion together with
 * the rest of the exercise card, now on the REAL hardened components. The persistent
 * header is the real {@link ExerciseCardHeading} (the collapsed rail item); the expanded
 * body drops PREV, fades done + upcoming sets to one muted treatment, and spotlights the
 * ACTIVE set by brightness. Every per-row strip is now the REAL {@link VelocityStrip} via
 * its `set` descriptor (mini for done/todo, its set-type encodings for advanced sets) —
 * replacing the hand-built prototype strip in Lab/Explorations/Workout Expansion.
 *
 * OPEN DECISION shown here: the active-set SPOTLIGHT strip. The real VelocityStrip has
 * flat 3px `mini` and the full 60px `expanded` (labels + info). This page renders the
 * whole card three ways so the spotlight treatment can be chosen in context:
 *   A · full VelocityStrip `expanded` (showInfo off)   — richest, tallest
 *   B · a compact ~24px velocity-height strip           — the locked prototype's look
 *   C · mini, brightened only (no height encoding)      — lightest
 * B/C are candidates for a new compact VelocityStrip variant if chosen.
 */
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import { ExerciseCardHeading } from './ExerciseCardHeading'
import { SetTableHeader } from './SetTableHeader'
import { VelocityStrip } from './VelocityStrip'
import { type SetStripSet } from './SetStrip'
import {
  INSET,
  INSET_SHADOW,
  RAISED,
  BORDER_SUBTLE,
  GREY,
  velColor,
  T_PRIMARY,
  T_SECONDARY,
  Page,
  monoTag,
} from './setHeadingKit'

const INTER = 'Inter, sans-serif'

/** Per-rep mean velocity that DECAYS across a set (fast → slow). */
const decay = (n: number, start: number, span = 0.5) =>
  Array.from({ length: n }, (_, r) => +(start - (span * r) / Math.max(1, n - 1)).toFixed(3))

// The exercise: a flat straight set (Cable Chest Press, 3 × 10 @ 90 lb).
const DONE = decay(10, 1.05)
const ACTIVE = decay(5, 0.95, 0.3)
const PLANNED = 10

// The rail heading's per-set performance strip (collapsed representation).
const SET_STATES: SetStripSet[] = [
  { status: 'done', velocities: DONE },
  { status: 'active', velocities: ACTIVE, planned: PLANNED },
  { status: 'todo', planned: PLANNED },
]

type RowState = 'done' | 'live' | 'todo'
type Row = { n: number; state: RowState; reps: number; load: number; rpe: number | null; velocities: number[] }
const ROWS: Row[] = [
  { n: 1, state: 'done', reps: 10, load: 90, rpe: 7.5, velocities: DONE },
  { n: 2, state: 'live', reps: PLANNED, load: 90, rpe: null, velocities: ACTIVE },
  { n: 3, state: 'todo', reps: PLANNED, load: 90, rpe: null, velocities: [] },
]

// Columns mirror SetTableHeader(showPrevious=false): SET · REPS · LBS · RPE, distributed.
const COLS = { set: 36, reps: 44, load: 56, rpe: 36 }
const cell = (w: number) => ({ width: w, alignItems: 'center' as const, justifyContent: 'center' as const })
const txt = { fontFamily: INTER, fontSize: 13, fontWeight: '600' as const }

type Spotlight = 'A' | 'B' | 'C'

/** Candidate B: a compact ~24px velocity-height strip (the locked prototype's spotlight). */
function CompactSpotlight({ velocities, planned }: { velocities: number[]; planned: number }) {
  const H = 24
  const maxV = 1.15
  return (
    <View style={{ flexDirection: 'row', gap: 2, height: H, alignItems: 'flex-end' }}>
      {Array.from({ length: planned }).map((_, i) => {
        const v = velocities[i]
        const done = v != null
        const h = done ? Math.max(3, Math.min(1, v / maxV) * H) : 3
        return (
          <View key={i} style={{ flex: 1, height: h, backgroundColor: done ? velColor(v) : GREY, borderRadius: 1 }} />
        )
      })}
    </View>
  )
}

function ActiveStrip({ velocities, spotlight }: { velocities: number[]; spotlight: Spotlight }) {
  if (spotlight === 'A') {
    return (
      <VelocityStrip
        set={{ type: 'straight', velocities, planned: PLANNED }}
        expanded
        showInfo={false}
      />
    )
  }
  if (spotlight === 'B') return <CompactSpotlight velocities={velocities} planned={PLANNED} />
  // C · mini, brightened only — the same flat strip as done/todo, no height encoding.
  return <VelocityStrip variant="mini" set={{ type: 'straight', velocities, planned: PLANNED }} />
}

function ExpandRow({ r, spotlight }: { r: Row; spotlight: Spotlight }) {
  const live = r.state === 'live'
  const muted = T_SECONDARY
  const valColor = live ? T_PRIMARY : muted
  return (
    <View style={{ paddingVertical: 6, paddingHorizontal: 8 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={cell(COLS.set)}>
          <Text style={{ ...txt, color: valColor, fontWeight: live ? '700' : '600' }}>{r.n}</Text>
        </View>
        <View style={cell(COLS.reps)}>
          <Text style={{ ...txt, color: valColor }}>{r.reps}</Text>
        </View>
        <View style={cell(COLS.load)}>
          <Text style={{ ...txt, color: valColor }}>{r.load}</Text>
        </View>
        <View style={cell(COLS.rpe)}>
          <Text style={{ ...txt, color: muted }}>{r.rpe ?? '—'}</Text>
        </View>
      </View>
      <View style={{ marginTop: live ? 6 : 4 }}>
        {r.state === 'todo' ? (
          <VelocityStrip variant="mini" set={{ type: 'straight', velocities: [], planned: PLANNED }} />
        ) : r.state === 'done' ? (
          <VelocityStrip variant="mini" set={{ type: 'straight', velocities: r.velocities, planned: r.velocities.length }} />
        ) : (
          <ActiveStrip velocities={r.velocities} spotlight={spotlight} />
        )}
      </View>
    </View>
  )
}

function Surface({ children, width = 260 }: { children: React.ReactNode; width?: number }) {
  return (
    <View style={{ width, backgroundColor: INSET, boxShadow: INSET_SHADOW, borderRadius: 8, overflow: 'hidden' } as object}>
      {children}
    </View>
  )
}

function Header() {
  return (
    <View style={{ position: 'relative', zIndex: 2, backgroundColor: RAISED }}>
      <ExerciseCardHeading
        name="Cable Chest Press"
        sets={3}
        reps={10}
        load={90}
        unit="lbs"
        tempo={[2, 1, 2, 0]}
        indicator="info"
        setStates={SET_STATES}
      />
    </View>
  )
}

function UnifiedCard({ spotlight }: { spotlight: Spotlight }) {
  return (
    <Surface>
      <Header />
      <View style={{ backgroundColor: INSET, paddingBottom: 8, borderTopWidth: 1, borderTopColor: BORDER_SUBTLE }}>
        <SetTableHeader unit="lbs" showPrevious={false} />
        {ROWS.map((r) => (
          <ExpandRow key={r.n} r={r} spotlight={spotlight} />
        ))}
      </View>
    </Surface>
  )
}

const SPOTLIGHTS: { key: Spotlight; label: string }[] = [
  { key: 'A', label: 'A · full VelocityStrip expanded (60px, labels)' },
  { key: 'B', label: 'B · compact 24px velocity-height (locked look)' },
  { key: 'C', label: 'C · mini, brightened only (flat 3px)' },
]

const meta: Meta = { title: 'Lab/Explorations/Unified Exercise Card', parameters: { layout: 'fullscreen' } }
export default meta
type Story = StoryObj

export const Unified: Story = {
  name: 'One object · rail header → expanded body (real components)',
  render: () => (
    <Page
      title="Unified exercise card — the rail heading IS the header"
      note="Tying the locked rail-expansion together with the rest of the exercise card, on the REAL hardened components. The persistent header is the real ExerciseCardHeading (the collapsed rail item, top); expanded, the same surface reveals the table body — PREV dropped, done + upcoming sets share ONE muted treatment, the ACTIVE set stands out by brightness. Every per-row strip is now the REAL VelocityStrip via its `set` descriptor (no more hand-built prototype strip). OPEN: the active-set spotlight strip — the whole card is shown three ways below so it can be chosen in context."
    >
      <View style={{ gap: 10 }}>
        <Text style={{ ...monoTag, color: T_SECONDARY }}>collapsed · rail item (the header on its own)</Text>
        <Surface>
          <Header />
        </Surface>
      </View>

      <View style={{ height: 1, backgroundColor: BORDER_SUBTLE, marginVertical: 8 }} />

      <Text style={{ ...monoTag, color: T_SECONDARY }}>expanded · active-set spotlight options (pick one)</Text>
      <View style={{ flexDirection: 'row', gap: 28, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {SPOTLIGHTS.map((s) => (
          <View key={s.key} style={{ gap: 8 }}>
            <Text style={{ fontFamily: INTER, fontSize: 12, fontWeight: '600', color: T_PRIMARY }}>{s.label}</Text>
            <UnifiedCard spotlight={s.key} />
          </View>
        ))}
      </View>

      <Text style={{ fontFamily: INTER, fontSize: 12.5, color: T_SECONDARY, lineHeight: 19, maxWidth: 780, marginTop: 6 }}>
        The header is the same molecule collapsed and expanded — the card reads as one object, the body flowing
        out of the rail row rather than a separate panel. The only thing that changes across the three cards is
        the ACTIVE row&apos;s strip. A shows the real expanded VelocityStrip at full height (richest, but tall for
        a row); B is the locked prototype&apos;s compact velocity-height look; C keeps the flat mini and leans on
        brightness alone. If B or C wins, it becomes a new compact VelocityStrip variant so the card stays on real
        components end to end.
      </Text>
    </Page>
  ),
}
