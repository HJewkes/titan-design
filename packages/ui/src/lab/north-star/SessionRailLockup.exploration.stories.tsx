// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
/**
 * `Lab/North Star/Session Rail Lockup` — DESIGN EXPLORATION (not shipped).
 *
 * A first-pass specimen locking the ONE flat-bar language across the two reading levels
 * the session UI needs, so the rail, the expanded table, and the dual layout all read as
 * the same material at different densities:
 *
 *   • SET-LEVEL — a thicker (~8px) {@link SegmentedBar}: one bar per set, its reps drawn as
 *     per-rep COLOR SEGMENTS (velocity zone). This is the rail's row and the expanded
 *     table's header. A DUAL set stacks TWO segmented halves at a shared axis (top = left
 *     arm, bottom = right arm).
 *   • REP-LEVEL — thinner per-rep INDIVIDUAL bars ({@link VelocityStrip}): `compact` = a
 *     thin flat resting strip, `expanded` (bare) = the value-height spotlight for the LIVE
 *     set, todo reps = thin dashed stubs. A DUAL rep row stacks TWO thin strips
 *     ({@link DualVelocityStrip} `compact`).
 *
 * Both levels share ONE canonical bar style: radius 2, ALL corners rounded, thin — the
 * `EqualSegments` pill look. Only the WALL HERO keeps the bolder top-rounded radius; it is
 * out of scope here and untouched.
 *
 * OPEN QUESTION surfaced (not solved) — dual REP-LEVEL height. At set-level two halves
 * split one ~8px track cleanly (each half ~3px reads fine as a solid segment). At
 * rep-level each half must carry per-rep VALUE bars with visible height variation, so two
 * stacked strips need MORE vertical room than the ~8px set-level track — a single 8px
 * split would crush the value read to noise. This specimen renders the dual rep row at a
 * deliberately taller `height` (two ~24px wings) to show the shape; the right resting
 * height, and whether the resting (flat) dual row can be shorter than the live one, is
 * left for the follow-up.
 */
import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ReactNode } from 'react'
import { View, Text } from 'react-native'
import { getSemanticColors } from '../../theme/tokens/semantic'
import { greyRamp } from '../../theme/tokens/primitives'
import { alpha } from '../../utils/colors'
import { WORKOUT_TOKENS } from '../../theme/workout-tokens'
import {
  SegmentedBar,
  type SegmentedBarSegment,
} from '../../components/custom/Workout/SegmentedBar'
import { VelocityStrip, DualVelocityStrip } from '../../components/custom/Workout/VelocityStrip'

const C = getSemanticColors('dark')

// Velocity → the canonical 4-band scale HEX (VelocityStrip's own thresholds). The exported
// `getVelocityZoneColor` returns a TOKEN NAME that SetBarChart resolves internally; a
// SegmentedBar takes a literal color, so resolve to hex here off the same source of truth.
const VEL = WORKOUT_TOKENS.scale
function velocityHex(v: number): string {
  if (v >= 1.0) return VEL.green
  if (v >= 0.75) return VEL.yellow
  if (v >= 0.5) return VEL.orange
  return VEL.red
}
const PAGE_BG = greyRamp[975]
const PANEL_BG = greyRamp[950]
const ROW_BG = greyRamp[850]
const FONT_HEAD = '"Space Grotesk", sans-serif'
const FONT_UI = '"Nunito Sans", sans-serif'
const FONT_MONO = 'monospace'

// The muted "planned / to-do" segment fill for a set that hasn't been performed.
const TODO_SEG = alpha(C['text-tertiary'], 0.28)

/** A set-level segmented bar for a performed set: one color segment per rep (velocity zone). */
function performedSegments(velocities: number[], liveIndex?: number): SegmentedBarSegment[] {
  return velocities.map((v, i) => ({
    color: velocityHex(v),
    fill: 1,
    ...(i === liveIndex ? { pulse: true } : null),
  }))
}

/** A set-level segmented bar for a not-yet-performed set: N equal muted planned segments. */
function plannedSegments(count: number): SegmentedBarSegment[] {
  return Array.from({ length: count }, () => ({ color: TODO_SEG, fill: 1 }))
}

// --- Mock session -----------------------------------------------------------

type SetFix = { velocities: number[]; live?: number; planned?: number }

const SQUAT_SETS: SetFix[] = [
  { velocities: [1.05, 0.98, 0.9, 0.82, 0.74] },
  { velocities: [1.02, 0.95, 0.86, 0.78, 0.7] },
  { velocities: [0.99, 0.92, 0.84], live: 2, planned: 5 },
  { velocities: [], planned: 5 },
  { velocities: [], planned: 5 },
]

const ROW_LEFT: SetFix[] = [
  { velocities: [0.86, 0.8, 0.74, 0.66] },
  { velocities: [0.82, 0.75, 0.68], live: 2, planned: 4 },
  { velocities: [], planned: 4 },
]
const ROW_RIGHT: SetFix[] = [
  { velocities: [0.82, 0.75, 0.7, 0.6] },
  { velocities: [0.78, 0.7, 0.61], live: 2, planned: 4 },
  { velocities: [], planned: 4 },
]

// --- Small presentational atoms ---------------------------------------------

function Panel({ title, sub, children }: { title: string; sub?: string; children: ReactNode }) {
  return (
    <View
      style={{
        backgroundColor: PANEL_BG,
        borderRadius: 12,
        padding: 14,
        gap: 12,
        width: 340,
        borderWidth: 1,
        borderColor: alpha(greyRamp[600], 0.06),
      }}
    >
      <View style={{ gap: 2 }}>
        <Text
          style={{
            fontFamily: FONT_HEAD,
            fontSize: 13,
            fontWeight: '700',
            color: C['text-primary'],
          }}
        >
          {title}
        </Text>
        {sub ? (
          <Text style={{ fontFamily: FONT_MONO, fontSize: 10, color: C['text-tertiary'] }}>
            {sub}
          </Text>
        ) : null}
      </View>
      {children}
    </View>
  )
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: ROW_BG,
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 10,
        gap: 2,
      }}
    >
      <Text
        style={{
          fontFamily: FONT_MONO,
          fontSize: 9,
          color: C['text-tertiary'],
          letterSpacing: 0.5,
        }}
      >
        {label}
      </Text>
      <Text
        style={{ fontFamily: FONT_HEAD, fontSize: 15, fontWeight: '700', color: C['text-primary'] }}
      >
        {value}
      </Text>
    </View>
  )
}

/** A rail row: exercise name + one SET-LEVEL segmented bar per set (reps = color segments). */
function RailRow({ name, sets, meta }: { name: string; sets: SetFix[]; meta: string }) {
  return (
    <View style={{ gap: 6 }}>
      <View
        style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}
      >
        <Text
          style={{ fontFamily: FONT_UI, fontSize: 12, fontWeight: '600', color: C['text-primary'] }}
        >
          {name}
        </Text>
        <Text style={{ fontFamily: FONT_MONO, fontSize: 9, color: C['text-tertiary'] }}>
          {meta}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {sets.map((s, i) => (
          <View key={i} style={{ flex: 1 }}>
            <SegmentedBar
              style={{ width: '100%' }}
              height={8}
              radius={2}
              gap={3}
              segments={
                s.velocities.length > 0
                  ? performedSegments(s.velocities, s.live)
                  : plannedSegments(s.planned ?? 5)
              }
            />
          </View>
        ))}
      </View>
    </View>
  )
}

// --- Stories: the three lockup pieces ---------------------------------------

/** (a) The session rail — set-level segmented bars, one row per exercise. */
function SessionRailPanel() {
  return (
    <Panel title="Push A · Hypertrophy" sub="rail · set-level segmented bars">
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <MetricTile label="VOLUME" value="12.4k" />
        <MetricTile label="LOAD" value="8/12" />
        <MetricTile label="FATIGUE" value="22%" />
      </View>
      <View style={{ gap: 14 }}>
        <RailRow name="Back Squat" meta="3/5 sets" sets={SQUAT_SETS} />
        <RailRow name="Single-Arm Row" meta="1/3 sets" sets={ROW_LEFT} />
        <RailRow
          name="RDL"
          meta="0/4 sets"
          sets={[
            { velocities: [], planned: 6 },
            { velocities: [], planned: 6 },
            { velocities: [], planned: 6 },
            { velocities: [], planned: 6 },
          ]}
        />
      </View>
    </Panel>
  )
}

/** One table row: set number + load + a rep-level velocity strip. */
function TableRow({ setNo, load, children }: { setNo: string; load: string; children: ReactNode }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 7,
        borderTopWidth: 1,
        borderTopColor: alpha(greyRamp[600], 0.06),
      }}
    >
      <Text style={{ width: 18, fontFamily: FONT_MONO, fontSize: 11, color: C['text-secondary'] }}>
        {setNo}
      </Text>
      <Text style={{ width: 54, fontFamily: FONT_MONO, fontSize: 11, color: C['text-secondary'] }}>
        {load}
      </Text>
      <View style={{ flex: 1 }}>{children}</View>
    </View>
  )
}

/** (b) One expanded exercise in table-A layout: set-level header + rep-level rows. */
function ExerciseTablePanel() {
  return (
    <Panel title="Back Squat" sub="5 × 5 · 185 lb · set-level header + rep-level rows">
      {/* SET-LEVEL header: one segment per SET, colored by that set's mean rep (planned = muted). */}
      <SegmentedBar
        style={{ width: '100%' }}
        height={10}
        radius={2}
        gap={5}
        segments={SQUAT_SETS.map((s) =>
          s.velocities.length > 0
            ? { color: velocityHex(s.velocities[s.velocities.length - 1]), fill: 1 }
            : { color: TODO_SEG, fill: 1 }
        )}
      />
      <View>
        {/* resting done sets — thin flat compact */}
        <TableRow setNo="1" load="185 lb">
          <VelocityStrip
            variant="compact"
            height={12}
            hideBaseline
            velocities={SQUAT_SETS[0].velocities}
          />
        </TableRow>
        <TableRow setNo="2" load="185 lb">
          <VelocityStrip
            variant="compact"
            height={12}
            hideBaseline
            velocities={SQUAT_SETS[1].velocities}
          />
        </TableRow>
        {/* LIVE set — value-height spotlight (bare expanded), slightly taller */}
        <TableRow setNo="3" load="185 lb">
          <VelocityStrip
            variant="expanded"
            showNumbers={false}
            showInfo={false}
            height={30}
            hideBaseline
            velocities={SQUAT_SETS[2].velocities}
            liveRepIndex={SQUAT_SETS[2].live}
            targetReps={SQUAT_SETS[2].planned}
          />
        </TableRow>
        {/* todo sets — thin dashed stubs */}
        <TableRow setNo="4" load="185 lb">
          <VelocityStrip
            variant="compact"
            height={12}
            hideBaseline
            velocities={[]}
            targetReps={5}
          />
        </TableRow>
        <TableRow setNo="5" load="185 lb">
          <VelocityStrip
            variant="compact"
            height={12}
            hideBaseline
            velocities={[]}
            targetReps={5}
          />
        </TableRow>
      </View>
    </Panel>
  )
}

/** A dual set-level cell: two stacked segmented halves (top = left arm, bottom = right arm). */
function DualSetCell({ left, right }: { left: SetFix; right: SetFix }) {
  const seg = (s: SetFix): SegmentedBarSegment[] =>
    s.velocities.length > 0
      ? performedSegments(s.velocities, s.live)
      : plannedSegments(s.planned ?? 4)
  return (
    <View style={{ flex: 1, gap: 2 }}>
      <SegmentedBar style={{ width: '100%' }} height={4} radius={2} gap={3} segments={seg(left)} />
      <SegmentedBar style={{ width: '100%' }} height={4} radius={2} gap={3} segments={seg(right)} />
    </View>
  )
}

/** (c) A dual exercise: stacked halves at set-level AND rep-level. */
function DualExercisePanel() {
  return (
    <Panel title="Single-Arm Row · DUAL" sub="two devices · L over R at a shared axis">
      <Text style={{ fontFamily: FONT_MONO, fontSize: 9, color: C['text-tertiary'] }}>
        SET-LEVEL · two segmented halves per set
      </Text>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {ROW_LEFT.map((l, i) => (
          <DualSetCell key={i} left={l} right={ROW_RIGHT[i]} />
        ))}
      </View>

      <Text style={{ fontFamily: FONT_MONO, fontSize: 9, color: C['text-tertiary'], marginTop: 4 }}>
        REP-LEVEL · two thin strips stacked (live set)
      </Text>
      {/* rep-level dual — value-height wings; see OPEN QUESTION on height in the file header. */}
      <TableRow setNo="2" load="70 lb">
        <DualVelocityStrip
          variant="compact"
          height={48}
          left={{ velocities: ROW_LEFT[1].velocities, label: 'L' }}
          right={{ velocities: ROW_RIGHT[1].velocities, label: 'R' }}
          targetReps={ROW_LEFT[1].planned}
        />
      </TableRow>
      <Text style={{ fontFamily: FONT_MONO, fontSize: 8, color: alpha(C['status-warning'], 0.9) }}>
        ? open: rep-level dual needs more height than the 8px set-level track — two value strips
        cannot split 8px. Shown at 2×24px; resting-vs-live height TBD.
      </Text>
    </Panel>
  )
}

// --- Meta -------------------------------------------------------------------

const meta: Meta = {
  title: 'Lab/North Star/Session Rail Lockup',
  parameters: { layout: 'fullscreen' },
}
export default meta
type Story = StoryObj

function Stage({ children }: { children: ReactNode }) {
  return (
    <View style={{ backgroundColor: PAGE_BG, padding: 24, minHeight: '100%' }}>{children}</View>
  )
}

/** The full lockup: rail + expanded table + dual, side by side, one language. */
export const Lockup: Story = {
  render: () => (
    <Stage>
      <View style={{ flexDirection: 'row', gap: 20, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <SessionRailPanel />
        <ExerciseTablePanel />
        <DualExercisePanel />
      </View>
    </Stage>
  ),
}

export const SessionRail: Story = {
  render: () => (
    <Stage>
      <SessionRailPanel />
    </Stage>
  ),
}

export const ExerciseTable: Story = {
  render: () => (
    <Stage>
      <ExerciseTablePanel />
    </Stage>
  ),
}

export const DualExercise: Story = {
  render: () => (
    <Stage>
      <DualExercisePanel />
    </Stage>
  ),
}
