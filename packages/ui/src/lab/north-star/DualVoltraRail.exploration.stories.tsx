// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
/**
 * `Lab/North Star/Dual Voltra Rail` — DESIGN EXPLORATION (not a shipped component).
 *
 * Question: how should the session rail's per-set bar strip represent a DUAL-VOLTRA
 * (bilateral) exercise — one exercise driven by TWO cables (left + right), each with
 * its own per-rep velocity stream? Single-voltra rows encode one value per rep; dual
 * rows must encode TWO (L + R) inside the same narrow (~246–272px) rail slot.
 *
 * Six treatments are prototyped at REAL rail width with asymmetric sample data (LEFT
 * dominant, RIGHT lags ~10–15% — the clinically interesting imbalance). Each is shown
 * (a) in isolation and (b) sitting in a mini rail between single-voltra rows, so the
 * "doesn't look alien next to normal rows" test is visible.
 *
 * COLOR / CVD: the existing velocity-zone hue (red→orange→amber→green) is the ONLY hue
 * channel and is preserved unchanged. SIDE (L vs R) is encoded by POSITION (top/bottom,
 * left/right) and short text labels — never by hue — so nothing new depends on red/green
 * discrimination and the strips stay colorblind-safe.
 */
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import { SegmentedBar, type SegmentedBarSegment } from '../../components/custom/Workout/SegmentedBar'
import { SetStrip } from '../../components/custom/Workout/SetStrip'
import { velocityZoneColor, type SetStripSet } from '../../components/custom/Workout/SetBar'
import { ExerciseHeading } from '../../components/custom/Workout/ExerciseHeading'
import { getSemanticColors } from '../../theme/tokens/semantic'
import { primitiveColors } from '../../theme/tokens/primitives'

const T = getSemanticColors('dark')
const RAIL_WIDTH = 264
const PAD = 12
/** Grey placeholder for planned-but-unperformed reps — matches SetBar's TODO_COLOR. */
const GREY = primitiveColors.charcoal[300]
const LIST_BG = primitiveColors.charcoal[600]
const HEADER_BG = primitiveColors.charcoal[900]
const DIVIDER = T['border-subtle']

// --- Sample data: bilateral chest press, LEFT dominant / RIGHT lags -----------

interface DualSet {
  status: 'done' | 'active' | 'todo'
  /** Left-cable per-rep mean-concentric velocities (m/s). */
  L: number[]
  /** Right-cable per-rep mean-concentric velocities (m/s). */
  R: number[]
  /** Planned rep count (for active remainder / todo). */
  planned?: number
}

/** L hovers around the orange/red boundary; R sits a zone lower — asymmetry reads in hue too. */
const DUAL_SETS: DualSet[] = [
  { status: 'done', L: [0.55, 0.54, 0.52, 0.5, 0.48, 0.46, 0.44, 0.42], R: [0.5, 0.48, 0.46, 0.44, 0.42, 0.4, 0.38, 0.37] },
  { status: 'done', L: [0.53, 0.52, 0.5, 0.48, 0.46, 0.44, 0.42, 0.4], R: [0.48, 0.46, 0.44, 0.42, 0.4, 0.38, 0.37, 0.36] },
  { status: 'active', L: [0.52, 0.5, 0.48, 0.46, 0.44, 0.405], R: [0.47, 0.45, 0.43, 0.41, 0.39, 0.37], planned: 8 },
  { status: 'todo', L: [], R: [], planned: 8 },
]

const mean = (a: number[]) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : 0)

/** Per-rep segments: performed reps velocity-coloured, planned remainder grey. */
function repSegments(vels: number[], planned: number): SegmentedBarSegment[] {
  const performed = vels.map((v) => ({ color: velocityZoneColor(v) }))
  const remaining = Math.max(0, planned - vels.length)
  return [...performed, ...Array.from({ length: remaining }, () => ({ color: GREY }))]
}

function plannedOf(set: DualSet): number {
  return set.planned ?? Math.max(set.L.length, set.R.length, 1)
}

// --- Option A: AVERAGE — one bar per set = mean(L,R) per rep ------------------

function AverageStrip({ sets }: { sets: DualSet[] }) {
  const averaged: SetStripSet[] = sets.map((s) => {
    if (s.status === 'todo') return { status: 'todo', planned: plannedOf(s) }
    const reps = s.L.map((l, i) => (l + (s.R[i] ?? l)) / 2)
    if (s.status === 'active') return { status: 'active', velocities: reps, planned: plannedOf(s) }
    return { status: 'done', velocities: reps }
  })
  return <SetStrip sets={averaged} height={8} />
}

// --- Option B: STACKED HALVES — L stripe over R stripe, one unit --------------

function StackedHalvesStrip({ sets }: { sets: DualSet[] }) {
  return (
    <View style={{ flexDirection: 'row', width: '100%', gap: 5 }}>
      {sets.map((s, i) => (
        <View key={i} style={{ flex: 1, gap: 1.5 }}>
          <SegmentedBar segments={repSegments(s.L, plannedOf(s))} height={3} gap={0} radius={1} style={{ borderRadius: 1, overflow: 'hidden' }} />
          <SegmentedBar segments={repSegments(s.R, plannedOf(s))} height={3} gap={0} radius={1} style={{ borderRadius: 1, overflow: 'hidden' }} />
        </View>
      ))}
    </View>
  )
}

// --- Option C: PAIRED MINI-BARS — L | R side by side inside each set slot -----

function PairedStrip({ sets }: { sets: DualSet[] }) {
  return (
    <View style={{ flexDirection: 'row', width: '100%', gap: 5 }}>
      {sets.map((s, i) => (
        <View key={i} style={{ flex: 1, flexDirection: 'row', gap: 2 }}>
          <SegmentedBar segments={repSegments(s.L, plannedOf(s))} height={8} gap={0} radius={1} style={{ flex: 1, minWidth: 0, borderRadius: 1, overflow: 'hidden' }} />
          <SegmentedBar segments={repSegments(s.R, plannedOf(s))} height={8} gap={0} radius={1} style={{ flex: 1, minWidth: 0, borderRadius: 1, overflow: 'hidden' }} />
        </View>
      ))}
    </View>
  )
}

// --- Option D: DIVERGING — L grows up, R grows down from a centre baseline ----

const DIV_H = 11 // px each direction
const norm = (v: number) => Math.max(0.12, Math.min(1, (v - 0.3) / 0.3))

function DivergingColumn({ l, r }: { l?: number; r?: number }) {
  return (
    <View style={{ flex: 1, minWidth: 0, alignItems: 'stretch' }}>
      <View style={{ height: DIV_H, justifyContent: 'flex-end' }}>
        <View style={{ height: l ? DIV_H * norm(l) : 0, backgroundColor: l ? velocityZoneColor(l) : 'transparent', borderTopLeftRadius: 1, borderTopRightRadius: 1 }} />
      </View>
      <View style={{ height: 1, backgroundColor: DIVIDER }} />
      <View style={{ height: DIV_H, justifyContent: 'flex-start' }}>
        <View style={{ height: r ? DIV_H * norm(r) : 0, backgroundColor: r ? velocityZoneColor(r) : 'transparent', borderBottomLeftRadius: 1, borderBottomRightRadius: 1, opacity: 0.85 }} />
      </View>
    </View>
  )
}

function DivergingStrip({ sets }: { sets: DualSet[] }) {
  return (
    <View style={{ flexDirection: 'row', width: '100%', gap: 5 }}>
      {sets.map((s, i) => {
        const n = plannedOf(s)
        return (
          <View key={i} style={{ flex: 1, flexDirection: 'row', gap: 1 }}>
            {Array.from({ length: n }, (_, r) => (
              <DivergingColumn key={r} l={s.L[r]} r={s.R[r]} />
            ))}
          </View>
        )
      })}
    </View>
  )
}

// --- Option E: PRIMARY + DEFICIT — dominant bar + weaker-side shortfall track --

function PrimaryDeficitStrip({ sets }: { sets: DualSet[] }) {
  return (
    <View style={{ flexDirection: 'row', width: '100%', gap: 5 }}>
      {sets.map((s, i) => {
        const ratio = mean(s.R) && mean(s.L) ? mean(s.R) / mean(s.L) : 1
        return (
          <View key={i} style={{ flex: 1, gap: 2 }}>
            <SegmentedBar segments={repSegments(s.L, plannedOf(s))} height={7} gap={0} radius={1} style={{ borderRadius: 1, overflow: 'hidden' }} />
            <View style={{ height: 3, backgroundColor: GREY, borderRadius: 1, overflow: 'hidden' }}>
              <View style={{ width: `${Math.round(ratio * 100)}%`, height: '100%', backgroundColor: s.status === 'todo' ? 'transparent' : T['text-tertiary'] }} />
            </View>
          </View>
        )
      })}
    </View>
  )
}

// --- Option F: SINGLE BAR + ROW-LEVEL IMBALANCE CHIP -------------------------

/** Whole-exercise mean L/R balance → a compact "R 88%" chip for the heading row. */
function ImbalanceChip({ sets }: { sets: DualSet[] }) {
  const done = sets.filter((s) => s.status !== 'todo')
  const l = mean(done.flatMap((s) => s.L))
  const r = mean(done.flatMap((s) => s.R))
  const pct = l ? Math.round((r / l) * 100) : 100
  const warn = pct < 90
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4, backgroundColor: warn ? T['status-warning-subtle'] : primitiveColors.charcoal[400] }}>
      <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: warn ? T['status-warning'] : T['text-tertiary'] }} />
      <Text style={{ fontSize: 9, fontWeight: '700', fontFamily: '"Nunito Sans", sans-serif', color: warn ? T['status-warning'] : T['text-secondary'] }}>
        R {pct}%
      </Text>
    </View>
  )
}

function SingleBarStrip({ sets }: { sets: DualSet[] }) {
  const dominant: SetStripSet[] = sets.map((s) =>
    s.status === 'todo'
      ? { status: 'todo', planned: plannedOf(s) }
      : s.status === 'active'
        ? { status: 'active', velocities: s.L, planned: plannedOf(s) }
        : { status: 'done', velocities: s.L }
  )
  return <SetStrip sets={dominant} height={8} />
}

// --- Layout scaffolding: a mini rail with single rows around the dual row -----

type StripRenderer = (p: { sets: DualSet[] }) => JSX.Element

const SINGLE_A: SetStripSet[] = [
  { status: 'done', velocities: [0.6, 0.58, 0.56, 0.54, 0.52, 0.5] },
  { status: 'done', velocities: [0.58, 0.56, 0.54, 0.52, 0.5, 0.48] },
  { status: 'todo', planned: 6 },
]
const SINGLE_B: SetStripSet[] = [
  { status: 'todo', planned: 10 },
  { status: 'todo', planned: 10 },
  { status: 'todo', planned: 10 },
]

function Row({ children, dimmed }: { children: React.ReactNode; dimmed?: boolean }) {
  return (
    <View style={{ paddingVertical: 9, paddingHorizontal: PAD, borderBottomWidth: 1, borderBottomColor: DIVIDER, opacity: dimmed ? 0.55 : 1 }}>
      {children}
    </View>
  )
}

function SingleRow({ name, sets, reps, load, dimmed }: { name: string; sets: SetStripSet[]; reps: number; load: number; dimmed?: boolean }) {
  return (
    <Row dimmed={dimmed}>
      <ExerciseHeading name={name} sets={sets.length} reps={reps} load={load} unit="lbs" tempo={[3, 1, 1, 0]} />
      <View style={{ marginTop: 7 }}>
        <SetStrip sets={sets} height={8} />
      </View>
    </Row>
  )
}

function DualRow({ Strip, chip }: { Strip: StripRenderer; chip?: boolean }) {
  return (
    <Row>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Text style={{ fontSize: 14, fontWeight: '700', fontFamily: '"Space Grotesk", sans-serif', color: T['text-primary'] }}>
          Cable Chest Press
        </Text>
        <DualTag />
        <View style={{ flex: 1 }} />
        {chip && <ImbalanceChip sets={DUAL_SETS} />}
      </View>
      <Text style={{ fontSize: 11, fontFamily: '"Nunito Sans", sans-serif', color: T['text-tertiary'], marginTop: 1 }}>
        4 × 8 @ 140 lbs
      </Text>
      <View style={{ marginTop: 7 }}>
        <Strip sets={DUAL_SETS} />
      </View>
    </Row>
  )
}

/** The small "DUAL" badge marking a bilateral row (side-neutral, no hue). */
function DualTag() {
  return (
    <View style={{ paddingHorizontal: 4, paddingVertical: 1, borderRadius: 3, borderWidth: 1, borderColor: DIVIDER }}>
      <Text style={{ fontSize: 8, fontWeight: '800', letterSpacing: 0.5, fontFamily: '"Nunito Sans", sans-serif', color: T['text-tertiary'] }}>
        DUAL
      </Text>
    </View>
  )
}

function MiniRail({ Strip, chip }: { Strip: StripRenderer; chip?: boolean }) {
  return (
    <View style={{ width: RAIL_WIDTH, backgroundColor: LIST_BG, borderRadius: 10, overflow: 'hidden' }}>
      <View style={{ backgroundColor: HEADER_BG, paddingVertical: 8, paddingHorizontal: PAD }}>
        <Text style={{ fontSize: 12, fontWeight: '700', fontFamily: '"Space Grotesk", sans-serif', color: T['text-secondary'] }}>
          Push A · Hypertrophy
        </Text>
      </View>
      <SingleRow name="Barbell Bench" sets={SINGLE_A} reps={6} load={185} />
      <DualRow Strip={Strip} chip={chip} />
      <SingleRow name="Incline DB Press" sets={SINGLE_B} reps={10} load={55} dimmed />
    </View>
  )
}

// --- Story presentation -------------------------------------------------------

function Caption({ title, pro, con }: { title: string; pro: string; con: string }) {
  return (
    <View style={{ maxWidth: RAIL_WIDTH + 40, gap: 3 }}>
      <Text style={{ fontSize: 13, fontWeight: '800', fontFamily: '"Space Grotesk", sans-serif', color: T['text-primary'] }}>{title}</Text>
      <Text style={{ fontSize: 11, fontFamily: '"Nunito Sans", sans-serif', color: T['result-improve'] }}>+ {pro}</Text>
      <Text style={{ fontSize: 11, fontFamily: '"Nunito Sans", sans-serif', color: T['result-degrade'] }}>− {con}</Text>
    </View>
  )
}

function IsolationCard({ Strip }: { Strip: StripRenderer }) {
  return (
    <View style={{ width: RAIL_WIDTH - PAD * 2 + 24, backgroundColor: LIST_BG, borderRadius: 8, padding: PAD }}>
      <Text style={{ fontSize: 9, fontFamily: 'monospace', color: T['text-tertiary'], marginBottom: 8 }}>ISOLATED · rail-content width</Text>
      <View style={{ width: RAIL_WIDTH - PAD * 2 }}>
        <Strip sets={DUAL_SETS} />
      </View>
    </View>
  )
}

function OptionView({ title, pro, con, Strip, chip }: { title: string; pro: string; con: string; Strip: StripRenderer; chip?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', gap: 28, alignItems: 'flex-start', flexWrap: 'wrap' }}>
      <View style={{ gap: 14 }}>
        <Caption title={title} pro={pro} con={con} />
        <IsolationCard Strip={Strip} />
      </View>
      <View style={{ gap: 6 }}>
        <Text style={{ fontSize: 9, fontFamily: 'monospace', color: T['text-tertiary'] }}>IN A RAIL · single rows above/below</Text>
        <MiniRail Strip={Strip} chip={chip} />
      </View>
    </View>
  )
}

function Page({ children }: { children: React.ReactNode }) {
  return <View style={{ padding: 28, backgroundColor: primitiveColors.charcoal[900], minHeight: '100%', gap: 24 }}>{children}</View>
}

const meta: Meta = {
  title: 'Lab/North Star/Dual Voltra Rail',
  parameters: { layout: 'fullscreen' },
}
export default meta
type Story = StoryObj

export const Overview: Story = {
  name: 'Overview · all six side by side',
  render: () => (
    <Page>
      <View style={{ gap: 4 }}>
        <Text style={{ fontSize: 16, fontWeight: '800', fontFamily: '"Space Grotesk", sans-serif', color: T['text-primary'] }}>
          Dual-voltra rail — six per-set treatments
        </Text>
        <Text style={{ fontSize: 12, fontFamily: '"Nunito Sans", sans-serif', color: T['text-secondary'], maxWidth: 560 }}>
          Bilateral chest press, LEFT dominant / RIGHT lags. Side = position (never hue); velocity zone = hue (unchanged).
        </Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 20, flexWrap: 'wrap' }}>
        {[
          { t: 'A · Average', S: AverageStrip },
          { t: 'B · Stacked halves', S: StackedHalvesStrip },
          { t: 'C · Paired mini-bars', S: PairedStrip },
          { t: 'D · Diverging', S: DivergingStrip },
          { t: 'E · Primary + deficit', S: PrimaryDeficitStrip },
          { t: 'F · Single + chip', S: SingleBarStrip },
        ].map(({ t, S }) => (
          <View key={t} style={{ gap: 6 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', fontFamily: '"Space Grotesk", sans-serif', color: T['text-primary'] }}>{t}</Text>
            <MiniRail Strip={S} chip={t.startsWith('F')} />
          </View>
        ))}
      </View>
    </Page>
  ),
}

export const OptionA_Average: Story = {
  name: 'A · Average (mean L/R)',
  render: () => (
    <Page>
      <OptionView
        title="A · Average — one bar = mean(L, R) per rep"
        pro="Zero new visual language; identical to single-voltra rows — never looks alien."
        con="Erases the asymmetry entirely — a 15% weaker right side is invisible. Defeats the point of bilateral tracking."
        Strip={AverageStrip}
      />
    </Page>
  ),
}

export const OptionB_StackedHalves: Story = {
  name: 'B · Stacked halves (L over R)',
  render: () => (
    <Page>
      <OptionView
        title="B · Stacked halves — L stripe over R stripe, one unit"
        pro="Both sides + full per-rep detail in the same footprint; reads as one bar. Asymmetry visible as the lower stripe running redder."
        con="Two 3px stripes lose colour fidelity; needs a legend for which stripe is which. Busy at 4 sets."
        Strip={StackedHalvesStrip}
      />
    </Page>
  ),
}

export const OptionC_PairedMiniBars: Story = {
  name: 'C · Paired mini-bars (L | R)',
  render: () => (
    <Page>
      <OptionView
        title="C · Paired mini-bars — L and R side by side per set"
        pro="Full 8px height per side; clean L|R reading; per-rep preserved."
        con="Halves each bar's width → reps get very thin; doubles the bar count so a 4-set row reads like 8. Busiest option."
        Strip={PairedStrip}
      />
    </Page>
  ),
}

export const OptionD_Diverging: Story = {
  name: 'D · Diverging (L up / R down)',
  render: () => (
    <Page>
      <OptionView
        title="D · Diverging — L grows up, R grows down from a centre line"
        pro="Asymmetry IS the silhouette — an uneven top/bottom is read pre-attentively. Bar length also encodes magnitude."
        con="Needs vertical room (taller row); abandons the flat per-rep colour-strip language; thin columns at 8 reps × 4 sets."
        Strip={DivergingStrip}
      />
    </Page>
  ),
}

export const OptionE_PrimaryDeficit: Story = {
  name: 'E · Primary + deficit',
  render: () => (
    <Page>
      <OptionView
        title="E · Primary + deficit — dominant bar + weaker-side shortfall track"
        pro="Looks almost like a single-voltra row; the thin track's empty right edge = the imbalance. Surfaces the clinical signal cleanly."
        con="Only the dominant side gets per-rep detail; the weaker side is a per-set aggregate, not per-rep."
        Strip={PrimaryDeficitStrip}
      />
    </Page>
  ),
}

export const OptionF_RowChip: Story = {
  name: 'F · Single bar + imbalance chip',
  render: () => (
    <Page>
      <OptionView
        title="F · Single bar + row-level imbalance chip"
        pro="Rail stays byte-for-byte single-voltra; imbalance surfaced once per row as 'R 88%'. Scales to many rows without clutter."
        con="Per-SET imbalance trend is lost — you see the exercise average, not which set drifted."
        Strip={SingleBarStrip}
        chip
      />
    </Page>
  ),
}
