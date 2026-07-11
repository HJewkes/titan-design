/**
 * SHEET · Workout Expansion (page 2) — what a rail item reveals when expanded.
 * Anchored on the REAL unexpanded rail row (`ExerciseCardHeading`) as the persistent header, then the
 * revealed body in two REAL-component directions so the fork is concrete:
 *   A — Table   (real `SetTableHeader` + real `SetRow`s — the current expanded body).
 *   C — Embed   (real `VelocityStrip` full/expanded per set + a compact caption — the bar IS the set).
 * B (drop PREV) is a trivial prop on the table, noted but not forked here. Same data across both: set 1 done
 * · set 2 LIVE 5/10 · set 3 upcoming, with velocities that DECAY within a set so the "shape" reading is real.
 * OPEN: A-vs-C · live-set treatment in the body · read-only density (drop TEMPO row? per-row strips?). DECISIONS doc.
 */
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import { ExerciseCardHeading } from './ExerciseCardHeading'
import { SetTableHeader } from './SetTableHeader'
import { SetRow, type SetRowProps } from './SetRow'
import { VelocityStrip } from './VelocityStrip'
import { type SetStripSet } from './SetStrip'
import {
  INSET,
  INSET_SHADOW,
  RAISED,
  BORDER_SUBTLE,
  GREEN,
  T_PRIMARY,
  T_SECONDARY,
  T_TERTIARY,
  Page,
  sectionTitle,
  monoTag,
} from './setHeadingKit'

// Per-rep mean velocity that DECAYS across a set (fast → slow) so bar height/color carries shape.
const decay = (n: number, start: number, span = 0.5) =>
  Array.from({ length: n }, (_, r) => +(start - (span * r) / Math.max(1, n - 1)).toFixed(3))

// ---- shared data (real prop shapes) ------------------------------------------------
// Heading strip (SetStripSet[]): set1 done · set2 active 5/10 · set3 todo.
const HEADING_STATES: SetStripSet[] = [
  { status: 'done', velocities: decay(10, 1.05) },
  { status: 'active', velocities: decay(5, 0.95, 0.3), planned: 10 },
  { status: 'todo', planned: 10 },
]
// Expanded-body per-set rows (real SetRowProps): set 1 done · set 2 LIVE · set 3 todo.
const BODY_SETS: SetRowProps[] = [
  {
    state: 'done',
    setNumber: 1,
    reps: 10,
    weight: 90,
    rpe: 7.5,
    unit: 'lbs',
    velocities: decay(10, 1.05),
  },
  {
    state: 'live',
    setNumber: 2,
    unit: 'lbs',
    target: { reps: 10, weight: 90 },
    reps: 10,
    weight: 90,
    velocities: decay(5, 0.95, 0.3),
  },
  { state: 'todo', setNumber: 3, unit: 'lbs', target: { reps: 10, weight: 90 } },
]

// ---- the real unexpanded rail row, used as the persistent expansion header ---------
function RailHeader() {
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
        setStates={HEADING_STATES}
      />
    </View>
  )
}

// ---- A · table body: real SetTableHeader + real SetRow (LOCKED: drop PREV, keep strips)
function TableBody() {
  return (
    <View>
      <SetTableHeader unit="lbs" showPrevious={false} />
      {BODY_SETS.map((s, i) => (
        <SetRow key={i} {...s} />
      ))}
    </View>
  )
}

// ---- C · embed body: real VelocityStrip (full/expanded) per set + compact caption ---
const capText = {
  fontFamily: 'Inter, sans-serif',
  fontSize: 11,
  fontWeight: '600' as const,
  color: T_PRIMARY,
}
const dimText = { ...capText, color: T_SECONDARY, fontWeight: '500' as const }
function EmbedSetRow({ s }: { s: SetRowProps }) {
  const live = s.state === 'live'
  const todo = s.state === 'todo'
  const vels = s.state === 'done' || s.state === 'live' ? s.velocities : []
  const rpe = s.state === 'todo' ? null : s.rpe
  return (
    <View
      style={{
        paddingVertical: 7,
        paddingHorizontal: 10,
        marginHorizontal: 2,
        marginBottom: 4,
        borderRadius: 8,
        opacity: todo ? 0.55 : 1,
        ...(live
          ? {
              backgroundColor: 'rgba(46,213,115,0.06)',
              borderWidth: 1,
              borderColor: 'rgba(46,213,115,0.30)',
            }
          : {}),
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'baseline', marginBottom: 6 }}>
        <Text style={{ ...dimText, width: 22, color: T_TERTIARY }}>{s.setNumber}</Text>
        {s.state === 'live' ? (
          <Text style={{ ...capText, color: GREEN, fontWeight: '700' }}>
            {vels.length}/{s.target.reps} × {s.target.weight}
          </Text>
        ) : s.state === 'done' ? (
          <Text style={capText}>
            {s.reps} × {s.weight}
          </Text>
        ) : (
          <Text style={dimText}>
            {s.target.reps} × {s.target.weight}
          </Text>
        )}
        <View style={{ flex: 1 }} />
        {rpe != null && <Text style={dimText}>RPE {rpe}</Text>}
        {live && <Text style={{ ...capText, color: GREEN, fontWeight: '700' }}>live</Text>}
      </View>
      {vels.length > 0 ? (
        <VelocityStrip velocities={vels} variant="expanded" showInfo={false} />
      ) : (
        <View style={{ height: 24, flexDirection: 'row', gap: 2 }}>
          {Array.from({ length: s.state === 'todo' ? s.target.reps : 10 }).map((_, i) => (
            <View
              key={i}
              style={{
                flex: 1,
                height: 6,
                alignSelf: 'flex-end',
                backgroundColor: '#2C2C2C',
                borderRadius: 1,
                opacity: 0.5,
              }}
            />
          ))}
        </View>
      )}
    </View>
  )
}
function EmbedBody() {
  return (
    <View style={{ paddingTop: 6 }}>
      {BODY_SETS.map((s, i) => (
        <EmbedSetRow key={i} s={s} />
      ))}
    </View>
  )
}

// ---- expanded item = real rail header + revealed body ------------------------------
function ExpandedItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={{ ...monoTag, color: T_SECONDARY }}>{label}</Text>
      <View
        style={
          {
            width: 260,
            backgroundColor: INSET,
            boxShadow: INSET_SHADOW,
            borderRadius: 4,
            overflow: 'hidden',
          } as object
        }
      >
        <RailHeader />
        <View
          style={{
            backgroundColor: INSET,
            paddingBottom: 8,
            borderTopWidth: 1,
            borderTopColor: BORDER_SUBTLE,
          }}
        >
          {children}
        </View>
      </View>
    </View>
  )
}

const meta: Meta = {
  title: 'Lab/Explorations/Workout Expansion',
  parameters: { layout: 'fullscreen' },
}
export default meta
type Story = StoryObj

export const DirectionStudy: Story = {
  name: 'Expanded item · A table / C embed-in-bar (real components)',
  render: () => (
    <Page
      title="Workout expansion — direction study (page 2)"
      note="LOCKED (2026-07-10): body = direction A, the SetTableHeader+SetRow table, with PREV dropped (real showPrevious={false}) and the per-row velocity strips kept. C (per-rep VelocityStrip becomes the set row) shown for the record — rejected as too novel; the table already carries velocity shape via the per-row strip. Anchored on the REAL unexpanded rail row (ExerciseCardHeading) as the persistent header; data: set 1 done · set 2 live 5/10 · set 3 upcoming, velocities decaying within a set."
    >
      <View style={{ flexDirection: 'row', gap: 44, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <View style={{ gap: 12 }}>
          <Text style={sectionTitle}>A · Table (current body)</Text>
          <ExpandedItem label="real SetTableHeader + SetRow">
            <TableBody />
          </ExpandedItem>
        </View>
        <View style={{ gap: 12 }}>
          <Text style={sectionTitle}>C · Embed in the bar</Text>
          <ExpandedItem label="real VelocityStrip (full) + caption">
            <EmbedBody />
          </ExpandedItem>
        </View>
      </View>
    </Page>
  ),
}
