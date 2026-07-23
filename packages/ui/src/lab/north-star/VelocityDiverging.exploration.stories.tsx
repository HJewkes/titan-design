// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
/**
 * `Lab/North Star/3 · Diverging Bars` — DESIGN EXPLORATION (not a shipped component).
 *
 * ONE cohesive DUAL-VOLTRA (bilateral) velocity language, built on DIVERGING, shown at
 * every scale so single→dual and hero↔rail all read as the same system:
 *
 *  - EXPANDED (hero + rail-expanded) = a DIVERGING per-rep chart: a horizontal centre
 *    axis, LEFT reps grow UP, RIGHT reps grow DOWN. Each rep is a mirrored L/R pair,
 *    rep index along x. Left-dominant / right-lagging reads as an asymmetric silhouette.
 *  - COLLAPSED (rail per-set) = STACKED HALVES: each set's bar becomes two stacked
 *    halves (top = Left, bottom = Right), and each half is the STANDARD segmented
 *    SetStrip bar — NOT re-split into per-rep sub-bars. Top-grows-up / bottom-grows-down
 *    of the expanded view collapses cleanly to top-half / bottom-half.
 *
 * COLOR / CVD: velocity zone (red→orange→amber→green) is the ONLY hue channel, taken
 * unchanged from the real VelocityStrip / SetStrip. SIDE (L vs R) is encoded purely by
 * POSITION (up/down, top/bottom half) and small text labels — never by hue — so nothing
 * new depends on red/green discrimination.
 *
 * Fixture: a bilateral cable chest press, LEFT dominant / RIGHT lagging, velocities
 * declining across the set (L 0.54→0.44, R 0.49→0.38), 6 of 8 reps done.
 */
import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ReactNode } from 'react'
import { View, Text } from 'react-native'
import { VelocityStrip } from '../../components/custom/Workout/VelocityStrip'
import { SetBar, velocityZoneColor, type SetStripSet } from '../../components/custom/Workout/SetBar'
import { getSemanticColors } from '../../theme/tokens/semantic'
import { primitiveColors } from '../../theme/tokens/primitives'
import { formatVelocity } from '../../utils/workout-format'

const T = getSemanticColors('dark')

const PAGE_BG = primitiveColors.charcoal[900]
const PANEL_BG = primitiveColors.charcoal[800]
const LIST_BG = primitiveColors.charcoal[600]
const HEADER_BG = primitiveColors.charcoal[900]
/** Grey placeholder for planned-but-unperformed reps — matches SetBar's TODO_COLOR. */
const GREY = primitiveColors.charcoal[300]

const FONT_HEAD = '"Space Grotesk", sans-serif'
const FONT_UI = '"Nunito Sans", sans-serif'

// --- Fixture: bilateral cable chest press, LEFT dominant / RIGHT lagging -------

interface DualSet {
  status: 'done' | 'active' | 'todo'
  /** Left-cable per-rep mean-concentric velocities (m/s). */
  L: number[]
  /** Right-cable per-rep mean-concentric velocities (m/s). */
  R: number[]
  /** Planned rep count (drives the todo / active remainder). */
  planned: number
}

/** The headline single set: 6 of 8 done, L 0.54→0.44, R 0.49→0.38. */
const ACTIVE_SET: DualSet = {
  status: 'active',
  L: [0.54, 0.52, 0.5, 0.48, 0.46, 0.44],
  R: [0.49, 0.47, 0.45, 0.42, 0.4, 0.38],
  planned: 8,
}

/** A full 4-set exercise (for the collapsed rail): two done, one active, one todo. */
const EXERCISE_SETS: DualSet[] = [
  {
    status: 'done',
    L: [0.57, 0.55, 0.53, 0.51, 0.49, 0.47, 0.45, 0.44],
    R: [0.52, 0.5, 0.48, 0.46, 0.43, 0.41, 0.39, 0.38],
    planned: 8,
  },
  {
    status: 'done',
    L: [0.55, 0.53, 0.51, 0.49, 0.47, 0.45, 0.44, 0.42],
    R: [0.5, 0.48, 0.46, 0.43, 0.41, 0.39, 0.38, 0.36],
    planned: 8,
  },
  ACTIVE_SET,
  { status: 'todo', L: [], R: [], planned: 8 },
]

// --- Diverging geometry -------------------------------------------------------

/**
 * Map a mean-concentric velocity (m/s) to a 0..1 bar length. A floor offset (0.30)
 * amplifies the small deltas that matter at press speeds so the L/R asymmetry reads
 * as length, not just hue. Length is a magnitude channel only — never colour.
 */
const V_FLOOR = 0.3
const V_CEIL = 0.6
const lengthOf = (v: number): number => Math.max(0.07, Math.min(1, (v - V_FLOOR) / (V_CEIL - V_FLOOR)))

interface DivergingChartProps {
  set: DualSet
  /** Total plot height (px) — split evenly into the up (L) and down (R) wings. */
  height: number
  /** `hero` = wall scale (per-rep value labels, best-reference lines); `rail` = compact. */
  scale: 'hero' | 'rail'
}

/** Scale-dependent chart chrome. */
const CHROME = {
  hero: { gap: 10, maxCol: 84, barPct: '66%', labelBand: 18, valueFont: 13, radius: 4, minBar: 5, showValues: true, showBest: true, sideFont: 12 },
  rail: { gap: 3, maxCol: 26, barPct: '82%', labelBand: 0, valueFont: 0, radius: 2, minBar: 3, showValues: false, showBest: false, sideFont: 9 },
} as const

/**
 * The DIVERGING per-rep velocity chart — the SINGLE dual language at every expanded
 * scale. A horizontal centre axis; LEFT reps grow UP, RIGHT reps grow DOWN, mirrored
 * per rep. Colour = velocity zone (shared with VelocityStrip); side = position only.
 */
function DivergingChart({ set, height, scale }: DivergingChartProps) {
  const c = CHROME[scale]
  const plotHalf = height / 2
  const maxBar = plotHalf - c.labelBand
  const done = set.L.length
  const total = Math.max(set.planned, done)
  const pending = Math.max(0, total - done)

  const bestL = set.L.length ? Math.max(...set.L) : 0
  const bestR = set.R.length ? Math.max(...set.R) : 0

  const barPx = (v?: number): number =>
    v == null ? 0 : Math.max(c.minBar, lengthOf(v) * maxBar)

  const RefLine = ({ y }: { y: number }) => (
    <View
      style={{ position: 'absolute', left: 0, right: 0, top: y, borderTopWidth: 1, borderStyle: 'dashed', borderColor: T['border-default'] }}
      pointerEvents="none"
    />
  )

  return (
    <View style={{ height, position: 'relative' }}>
      {/* Per-side running-best reference lines (hero only) — how far velocity has fallen. */}
      {c.showBest && bestL > 0 && <RefLine y={plotHalf - lengthOf(bestL) * maxBar} />}
      {c.showBest && bestR > 0 && <RefLine y={plotHalf + lengthOf(bestR) * maxBar} />}

      {/* The centre axis — the anchor the whole language mirrors around. */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: plotHalf - 1,
          height: 2,
          backgroundColor: T['text-secondary'],
          borderRadius: 1,
        }}
        pointerEvents="none"
      />

      {/* Small L / R side tags flush to the axis. */}
      <Text style={{ position: 'absolute', left: 0, top: plotHalf - c.labelBand - 14, fontSize: c.sideFont, fontWeight: '800', letterSpacing: 0.5, fontFamily: FONT_UI, color: T['text-tertiary'] }}>
        L ▲
      </Text>
      <Text style={{ position: 'absolute', left: 0, top: plotHalf + c.labelBand + 2, fontSize: c.sideFont, fontWeight: '800', letterSpacing: 0.5, fontFamily: FONT_UI, color: T['text-tertiary'] }}>
        R ▼
      </Text>

      {/* Mirrored per-rep columns. */}
      <View style={{ flexDirection: 'row', gap: c.gap, height: '100%', alignItems: 'stretch' }}>
        {Array.from({ length: total }, (_, i) => {
          const l = set.L[i]
          const r = set.R[i]
          const isPending = i >= done

          return (
            <View key={i} style={{ flex: 1, maxWidth: c.maxCol, height: '100%' }}>
              {/* Up wing — LEFT. */}
              <View style={{ height: plotHalf, justifyContent: 'flex-end', alignItems: 'center' }}>
                {c.showValues && (
                  <View style={{ height: c.labelBand, justifyContent: 'flex-end' }}>
                    {!isPending && (
                      <Text style={{ fontSize: c.valueFont, fontWeight: '800', fontFamily: FONT_UI, color: T['text-primary'] }}>
                        {formatVelocity(l)}
                      </Text>
                    )}
                  </View>
                )}
                {isPending ? (
                  <View style={{ width: c.barPct, height: c.minBar * 2, borderWidth: 1, borderStyle: 'dashed', borderColor: GREY, borderTopLeftRadius: c.radius, borderTopRightRadius: c.radius }} />
                ) : (
                  <View style={{ width: c.barPct, height: barPx(l), backgroundColor: velocityZoneColor(l), borderTopLeftRadius: c.radius, borderTopRightRadius: c.radius }} />
                )}
              </View>

              {/* Down wing — RIGHT. */}
              <View style={{ height: plotHalf, justifyContent: 'flex-start', alignItems: 'center' }}>
                {isPending ? (
                  <View style={{ width: c.barPct, height: c.minBar * 2, borderWidth: 1, borderStyle: 'dashed', borderColor: GREY, borderBottomLeftRadius: c.radius, borderBottomRightRadius: c.radius }} />
                ) : (
                  <View style={{ width: c.barPct, height: barPx(r), backgroundColor: velocityZoneColor(r), borderBottomLeftRadius: c.radius, borderBottomRightRadius: c.radius }} />
                )}
                {c.showValues && (
                  <View style={{ height: c.labelBand, justifyContent: 'flex-start' }}>
                    {!isPending && (
                      <Text style={{ fontSize: c.valueFont, fontWeight: '800', fontFamily: FONT_UI, color: T['text-secondary'] }}>
                        {formatVelocity(r)}
                      </Text>
                    )}
                  </View>
                )}
              </View>
            </View>
          )
        })}
      </View>
    </View>
  )
}

// --- Collapsed: STACKED HALVES (top = L, bottom = R, each a standard SetBar) ---

/** One side of a dual set as a standard SetStrip set descriptor (segmented, not per-rep-split). */
function halfSet(set: DualSet, side: 'L' | 'R'): SetStripSet {
  const v = side === 'L' ? set.L : set.R
  if (set.status === 'todo') return { status: 'todo', planned: set.planned }
  if (set.status === 'active') return { status: 'active', velocities: v, planned: set.planned }
  return { status: 'done', velocities: v }
}

/** The collapsed rail encoding: each set = two stacked STANDARD segmented halves. */
function StackedHalvesStrip({ sets, height = 4 }: { sets: DualSet[]; height?: number }) {
  // SetBar's SegmentedBar sets `flex: 1` (it's built to lay out in a ROW inside SetStrip);
  // stacked in a column that needs a definite height wrapper so the flex resolves.
  return (
    <View style={{ flexDirection: 'row', width: '100%', gap: 5 }}>
      {sets.map((s, i) => (
        <View key={i} style={{ flex: 1, gap: 1.5 }}>
          <View style={{ height }}>
            <SetBar set={halfSet(s, 'L')} height={height} />
          </View>
          <View style={{ height }}>
            <SetBar set={halfSet(s, 'R')} height={height} />
          </View>
        </View>
      ))}
    </View>
  )
}

// --- Presentation scaffolding -------------------------------------------------

function SectionTitle({ children }: { children: ReactNode }) {
  return <Text style={{ fontSize: 16, fontWeight: '800', fontFamily: FONT_HEAD, color: T['text-primary'] }}>{children}</Text>
}

function Caption({ children }: { children: ReactNode }) {
  return <Text style={{ fontSize: 12, fontFamily: FONT_UI, color: T['text-secondary'], maxWidth: 560, lineHeight: 17 }}>{children}</Text>
}

function Kicker({ children }: { children: ReactNode }) {
  return <Text style={{ fontSize: 9, letterSpacing: 1, fontFamily: 'monospace', color: T['text-tertiary'] }}>{children}</Text>
}

function Panel({ children, width }: { children: ReactNode; width?: number }) {
  return <View style={{ width, backgroundColor: PANEL_BG, borderRadius: 12, padding: 20, gap: 12 }}>{children}</View>
}

function Page({ children }: { children: ReactNode }) {
  return <View style={{ padding: 28, backgroundColor: PAGE_BG, minHeight: '100%', gap: 26 }}>{children}</View>
}

/** The exercise heading strip used above rail specimens. */
function DualHeading({ metaLine }: { metaLine: string }) {
  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Text style={{ fontSize: 14, fontWeight: '700', fontFamily: FONT_HEAD, color: T['text-primary'] }}>Cable Chest Press</Text>
        <View style={{ paddingHorizontal: 4, paddingVertical: 1, borderRadius: 3, borderWidth: 1, borderColor: T['border-subtle'] }}>
          <Text style={{ fontSize: 8, fontWeight: '800', letterSpacing: 0.5, fontFamily: FONT_UI, color: T['text-tertiary'] }}>DUAL</Text>
        </View>
      </View>
      <Text style={{ fontSize: 11, fontFamily: FONT_UI, color: T['text-tertiary'], marginTop: 1 }}>{metaLine}</Text>
    </View>
  )
}

const RAIL_WIDTH = 264
const RAIL_CONTENT = RAIL_WIDTH - 24

// --- Stories ------------------------------------------------------------------

const meta: Meta = {
  title: 'Lab/North Star/3 · Diverging Bars',
  parameters: { layout: 'fullscreen' },
}
export default meta
type Story = StoryObj

/** 1 — HERO: the headline bilateral live-panel chart, L up / R down from centre. */
export const HeroDual: Story = {
  name: '1 · Hero — dual diverging',
  render: () => (
    <Page>
      <View style={{ gap: 4 }}>
        <SectionTitle>Hero — dual diverging velocity</SectionTitle>
        <Caption>
          The live-panel headline for a bilateral set. LEFT reps grow up, RIGHT grow down from the centre axis; each rep a
          mirrored pair. Left-dominant / right-lagging reads pre-attentively as a top-heavy silhouette — and the shared floor
          means both sides are measured against one scale. Colour = velocity zone (unchanged); side = position only.
        </Caption>
      </View>
      <Panel width={720}>
        <Kicker>LIVE HERO · bilateral cable chest press · 6 of 8</Kicker>
        <DivergingChart set={ACTIVE_SET} height={280} scale="hero" />
      </Panel>
    </Page>
  ),
}

/** 2 — RAIL EXPANDED: the SAME diverging language, scaled down to a rail slot. */
export const RailExpandedDual: Story = {
  name: '2 · Rail expanded — dual diverging',
  render: () => (
    <Page>
      <View style={{ gap: 4 }}>
        <SectionTitle>Rail expanded — same language, smaller</SectionTitle>
        <Caption>
          When a set is expanded inside the session rail it uses the identical diverging form at rail-content width — no
          per-rep value labels, no reference lines, but the same centre axis and mirrored L/R wings. Proves the language
          scales down without becoming a different chart.
        </Caption>
      </View>
      <View style={{ flexDirection: 'row', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <Panel width={RAIL_WIDTH + 40}>
          <Kicker>RAIL SLOT · expanded set</Kicker>
          <View style={{ backgroundColor: LIST_BG, borderRadius: 8, padding: 12, gap: 8 }}>
            <DualHeading metaLine="Set 3 · 6 of 8 @ 140 lbs" />
            <View style={{ width: RAIL_CONTENT }}>
              <DivergingChart set={ACTIVE_SET} height={72} scale="rail" />
            </View>
          </View>
        </Panel>
        <Panel width={420}>
          <Kicker>SIDE BY SIDE · hero vs rail (same system)</Kicker>
          <DivergingChart set={ACTIVE_SET} height={150} scale="hero" />
          <View style={{ height: 1, backgroundColor: T['border-subtle'] }} />
          <View style={{ width: RAIL_CONTENT }}>
            <DivergingChart set={ACTIVE_SET} height={64} scale="rail" />
          </View>
        </Panel>
      </View>
    </Page>
  ),
}

/** 3 — RAIL COLLAPSED: stacked segmented halves (top = L, bottom = R). */
export const RailCollapsedStacked: Story = {
  name: '3 · Rail collapsed — stacked halves',
  render: () => (
    <Page>
      <View style={{ gap: 4 }}>
        <SectionTitle>Rail collapsed — stacked segmented halves</SectionTitle>
        <Caption>
          Collapsed, each set becomes two stacked halves — top = Left, bottom = Right — and each half is the STANDARD
          segmented SetStrip bar (per-rep colour segments, not re-split into individual bars). The expanded view's
          top-grows-up / bottom-grows-down folds directly into top-half / bottom-half, so collapsed and expanded are one system.
        </Caption>
      </View>
      <View style={{ flexDirection: 'row', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <Panel width={RAIL_WIDTH + 40}>
          <Kicker>RAIL ROW · 4 sets collapsed</Kicker>
          <View style={{ width: RAIL_WIDTH, backgroundColor: LIST_BG, borderRadius: 10, overflow: 'hidden' }}>
            <View style={{ backgroundColor: HEADER_BG, paddingVertical: 8, paddingHorizontal: 12 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', fontFamily: FONT_HEAD, color: T['text-secondary'] }}>Push A · Hypertrophy</Text>
            </View>
            <View style={{ paddingVertical: 9, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: T['border-subtle'] }}>
              <DualHeading metaLine="4 × 8 @ 140 lbs" />
              <View style={{ marginTop: 8 }}>
                <StackedHalvesStrip sets={EXERCISE_SETS} height={4} />
              </View>
            </View>
          </View>
        </Panel>
        <Panel width={360}>
          <Kicker>ENLARGED · L half over R half</Kicker>
          <StackedHalvesStrip sets={EXERCISE_SETS} height={9} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 10, fontFamily: FONT_UI, color: T['text-tertiary'] }}>▲ top = Left</Text>
            <Text style={{ fontSize: 10, fontFamily: FONT_UI, color: T['text-tertiary'] }}>▼ bottom = Right</Text>
          </View>
        </Panel>
      </View>
    </Page>
  ),
}

/** 4 — COMPARISON: naive two-strip stack vs the diverging proposal. */
export const Comparison: Story = {
  name: '4 · Comparison — naive vs diverging',
  render: () => (
    <Page>
      <View style={{ gap: 4 }}>
        <SectionTitle>Why diverging — vs the naive stack</SectionTitle>
        <Caption>
          The naive dual rendering is just two independent single-voltra hero strips stacked. Each has its OWN baseline and
          grows the same direction, so comparing L to R means eye-tracking between two separate charts — and it costs double
          the height. Diverging shares one axis: the asymmetry is a single silhouette, in half the vertical space.
        </Caption>
      </View>
      <View style={{ flexDirection: 'row', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <Panel width={430}>
          <Kicker>NAIVE · two stacked single-voltra heroes</Kicker>
          <View style={{ gap: 10 }}>
            <View>
              <Text style={{ fontSize: 10, fontWeight: '700', fontFamily: FONT_UI, color: T['text-tertiary'], marginBottom: 2 }}>LEFT</Text>
              <VelocityStrip variant="hero" velocities={ACTIVE_SET.L} targetReps={ACTIVE_SET.planned} height={120} />
            </View>
            <View>
              <Text style={{ fontSize: 10, fontWeight: '700', fontFamily: FONT_UI, color: T['text-tertiary'], marginBottom: 2 }}>RIGHT</Text>
              <VelocityStrip variant="hero" velocities={ACTIVE_SET.R} targetReps={ACTIVE_SET.planned} height={120} />
            </View>
          </View>
        </Panel>
        <Panel width={430}>
          <Kicker>PROPOSED · one diverging chart, shared axis</Kicker>
          <DivergingChart set={ACTIVE_SET} height={280} scale="hero" />
        </Panel>
      </View>
    </Page>
  ),
}

/** 5 — OVERVIEW: the full cohesive system at a glance. */
export const Overview: Story = {
  name: 'Overview · one language, every scale',
  render: () => (
    <Page>
      <View style={{ gap: 4 }}>
        <SectionTitle>Dual-voltra diverging — one language, every scale</SectionTitle>
        <Caption>
          Bilateral cable chest press, LEFT dominant / RIGHT lagging. Expanded (hero + rail) = diverging from a centre axis;
          collapsed (rail per-set) = stacked segmented halves. Side = position everywhere; velocity zone = hue, unchanged.
        </Caption>
      </View>

      <View style={{ flexDirection: 'row', gap: 20, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <Panel width={560}>
          <Kicker>1 · HERO — dual diverging</Kicker>
          <DivergingChart set={ACTIVE_SET} height={240} scale="hero" />
        </Panel>

        <View style={{ gap: 20 }}>
          <Panel width={RAIL_WIDTH + 40}>
            <Kicker>2 · RAIL EXPANDED — same language</Kicker>
            <View style={{ backgroundColor: LIST_BG, borderRadius: 8, padding: 12, gap: 8 }}>
              <DualHeading metaLine="Set 3 · 6 of 8 @ 140 lbs" />
              <View style={{ width: RAIL_CONTENT }}>
                <DivergingChart set={ACTIVE_SET} height={70} scale="rail" />
              </View>
            </View>
          </Panel>

          <Panel width={RAIL_WIDTH + 40}>
            <Kicker>3 · RAIL COLLAPSED — stacked halves</Kicker>
            <View style={{ backgroundColor: LIST_BG, borderRadius: 8, padding: 12, gap: 8 }}>
              <DualHeading metaLine="4 × 8 @ 140 lbs" />
              <View style={{ marginTop: 2 }}>
                <StackedHalvesStrip sets={EXERCISE_SETS} height={4} />
              </View>
            </View>
          </Panel>
        </View>
      </View>

      <Panel width={860}>
        <Kicker>4 · WHY DIVERGING — naive two-strip stack (left) vs shared-axis diverging (right)</Kicker>
        <View style={{ flexDirection: 'row', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <View style={{ gap: 8, width: 360 }}>
            <View>
              <Text style={{ fontSize: 9, fontWeight: '700', fontFamily: FONT_UI, color: T['text-tertiary'] }}>LEFT</Text>
              <VelocityStrip variant="hero" velocities={ACTIVE_SET.L} targetReps={ACTIVE_SET.planned} height={92} />
            </View>
            <View>
              <Text style={{ fontSize: 9, fontWeight: '700', fontFamily: FONT_UI, color: T['text-tertiary'] }}>RIGHT</Text>
              <VelocityStrip variant="hero" velocities={ACTIVE_SET.R} targetReps={ACTIVE_SET.planned} height={92} />
            </View>
          </View>
          <View style={{ width: 360 }}>
            <DivergingChart set={ACTIVE_SET} height={216} scale="hero" />
          </View>
        </View>
      </Panel>
    </Page>
  ),
}
