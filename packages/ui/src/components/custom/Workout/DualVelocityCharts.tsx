import { View, type ViewProps } from 'react-native'
import { type SetSlot, ChartSideRail } from '../charts/SetBarChart'
import type { VelocityLossThresholds, VelocityZoneBandProp } from './velocity-scale'
import { alignDualSlots, streamNaturalSlots, type DualVelocityStream } from './dual-velocity-slots'
import { VelocityStrip, type VelocityStripProps } from './VelocityStrip'

const DIMMED_WING_OPACITY = 0.35

/** A wing's own opacity; a scrim would paint its empty plot area over the parent's surface. */
const wingStyle = (stream: DualVelocityStream | undefined) =>
  stream?.isDimmed ? { opacity: DIMMED_WING_OPACITY } : undefined

/** Default `compact` diverging height (px) — two 5px rounded L/R sub-segments + the 1.5px fold gap. */
export const DUAL_COMPACT_HEIGHT = 11.5

// --- Rail geometry (the compact dedicated path) ------------------------------
// The `hero` variant COMPOSES two single VelocityStrip heroes, so it inherits the
// hero geometry for free. The `rail` variant is far smaller than a hero (no value
// labels, reference lines, paper, or label headroom), so composing the hero would
// drag all of that in; it keeps a lean dedicated renderer at these compact metrics.
/** The vertical gap between the up/down wings on the axis-less rail (value-height dual-expanded). */
const DUAL_WING_GAP = 2
/** The centre gap (px) splitting the folded compact dual's L (top) and R (bottom) halves — a gap, no line. */
const COMPACT_FOLD_GAP = 1.5
/** Each folded-compact sub-segment's height (px) — a rounded pill per side, above/below the fold gap. */
const COMPACT_FOLD_HALF = 5

/** Shared inputs for both dual renderers — the resolved per-side done arrays + presentation props. */
export interface DualChartProps {
  leftDone: number[]
  rightDone: number[]
  /**
   * The raw per-side streams. The `hero` renderer passes each side's `set` (or `velocities`)
   * straight through to its composed VelocityStrip hero so a side's set-type WINDOWS (the range
   * cyan variable window, the AMRAP/myo "continue", drop/myo chunk-notch gaps) render on the dual
   * — not just the flattened reps. The lean `rail` renderer ignores them (it only takes velocities).
   */
  leftStream?: DualVelocityStream
  rightStream?: DualVelocityStream
  leftLabel?: string
  rightLabel?: string
  zones?: readonly VelocityZoneBandProp[]
  barColor: 'zone' | 'loss'
  lossThresholds?: VelocityLossThresholds
  /** Shared across BOTH wings: `peak` (the pair's max +headroom) or `fixed` (a cross-set ceiling). */
  scale: 'peak' | 'fixed'
  targetReps?: number
  height: number
  className?: string
  label: string
  viewProps: ViewProps
}

/** The per-variant wing props the value-height duals (`hero`, `dual-expanded`) pass each composed strip. */
type ValueHeightWingProps = Pick<
  VelocityStripProps,
  'variant' | 'showNumbers' | 'showInfo' | 'hideBaseline'
>

/**
 * The two composed wings both value-height duals share. ONE shared height scale across both wings,
 * so an L/R asymmetry reads as bar length rather than as two independent scales; each composed strip
 * still colors by its OWN loss and draws its OWN best reference. `peak` shares the pair max via
 * `scaleMax`; `fixed` shares the cross-set ceiling (both wings resolve the same fixed ceiling), so
 * `scaleMax` is left off and `scale` carries it. ONE index-locked column structure (`columnSlots`):
 * a column a side did not log renders `empty`, so a lagging side's next rep lands at the SAME column
 * index as its partner's, never shifted or re-spaced. The wings' own labels would duplicate the
 * dual's summary label, so they are a11y-hidden.
 */
function valueHeightWings(
  chart: DualChartProps & { liveRepIndex?: number },
  wingProps: ValueHeightWingProps
) {
  const { leftDone, rightDone, leftStream, rightStream, scale, targetReps, height } = chart
  const plotHalf = (height - DUAL_WING_GAP) / 2
  const sharedMax = Math.max(...leftDone, ...rightDone, 0)
  const aligned = alignDualSlots(
    leftStream ? streamNaturalSlots(leftStream, targetReps) : [],
    rightStream ? streamNaturalSlots(rightStream, targetReps) : []
  )

  const wing = (orientation: 'up' | 'down', columns: SetSlot[], done: number[]) => (
    <VelocityStrip
      {...wingProps}
      orientation={orientation}
      velocities={done}
      columnSlots={columns}
      scale={scale}
      scaleMax={scale === 'fixed' ? undefined : sharedMax}
      barColor={chart.barColor}
      lossThresholds={chart.lossThresholds}
      zones={chart.zones}
      liveRepIndex={chart.liveRepIndex}
      height={plotHalf}
    />
  )

  const wings = (
    <>
      <View
        accessibilityElementsHidden
        testID="dual-velocity-wing-up"
        style={wingStyle(leftStream)}
      >
        {wing('up', aligned.left, leftDone)}
      </View>
      <View
        accessibilityElementsHidden
        testID="dual-velocity-wing-down"
        style={wingStyle(rightStream)}
      >
        {wing('down', aligned.right, rightDone)}
      </View>
    </>
  )
  return { plotHalf, wings }
}

/**
 * The `hero` diverging chart — COMPOSED from two single {@link VelocityStrip} heroes: an `up` hero
 * over a `down` (vertically-mirrored) hero, sharing ONE height scale via {@link
 * VelocityStripProps.scaleMax} and meeting at one shared centre axis. Each wing hides its own
 * baseline ({@link VelocityStripProps.hideBaseline}) so the axis is a single crisp line. Because it
 * is literally two heroes, every hero improvement — paper, loss bands, grow-from-bottom, the
 * running-best reference, surface-relative placeholders, per-side loss coloring — reaches the dual
 * for free. Side is POSITION only: both wings color reps by the SAME `barColor` scale; the shared
 * `scaleMax` makes a stronger arm read TALLER while each wing still colors off its own best.
 */
export function DualVelocityHero(props: DualChartProps & { liveRepIndex?: number }) {
  const { leftLabel, rightLabel, height, className, label, viewProps } = props
  // The two wings are separated by the SAME small gap as the expanded/rail dual (no centre-axis rule).
  const { plotHalf, wings } = valueHeightWings(props, { variant: 'hero', hideBaseline: true })
  const { style: externalStyle, ...restProps } = viewProps

  return (
    <View
      className={className}
      style={[{ height, flexDirection: 'row' }, externalStyle]}
      accessibilityRole="image"
      accessibilityLabel={label}
      testID="dual-velocity-strip"
      {...restProps}
    >
      {/* The SHARED gutter/side-rail (34px, no hairline) — one section per wing. A single hero renders
          the same rail with ONE section, so it's pixel-identical to this upper half. */}
      <ChartSideRail
        sectionExtent={plotHalf}
        variant="hero"
        sections={[
          { label: leftLabel, testID: 'dual-velocity-side-label-L' },
          { label: rightLabel, testID: 'dual-velocity-side-label-R' },
        ]}
      />

      {/* The two composed heroes, separated by the shared wing gap (no centre-axis rule). */}
      <View style={{ flex: 1, gap: DUAL_WING_GAP }}>{wings}</View>
    </View>
  )
}

/**
 * The `dual-expanded` diverging chart (formerly `rail`) — a lean, compact dedicated renderer.
 * Composing the hero here would drag in its value labels, reference lines, paper, and label
 * headroom, none of which belong at this scale; instead it draws mirrored per-side bars at the
 * compact metrics. Same shared height scale + per-side loss coloring + mirrored radius + shared
 * axis as the hero, but no labels / reference lines / paper. (Set-type slot windows are a
 * hero-composition concern; this renderer only ever takes plain velocities.)
 */
export function DualVelocityRail(props: DualChartProps & { liveRepIndex?: number }) {
  const { height, className, label, viewProps } = props
  // The lean dual-EXPANDED. Composed from two bare `expanded` strips exactly as the hero composes
  // two heroes, rather than drawing its own bars: composing is what makes the dual inherit the
  // single's bar widths, gaps, chunk-notch, set-type slot windows, paper and live-rep growth. The
  // bespoke renderer this replaces took only velocities, so the dual silently dropped every
  // set-type window and let a lagging side render fewer bars than its partner.
  const { wings } = valueHeightWings(props, {
    variant: 'expanded',
    showNumbers: false,
    showInfo: false,
  })
  const { style: externalStyle, ...restProps } = viewProps

  return (
    <View
      className={className}
      style={[{ height, flexDirection: 'column', gap: DUAL_WING_GAP }, externalStyle]}
      accessibilityRole="image"
      accessibilityLabel={label}
      testID="dual-velocity-strip"
      {...restProps}
    >
      {/* No gutter, side labels or centre axis at rail scale — the wings read as two rows via the
          shared gap alone. */}
      {wings}
    </View>
  )
}

/**
 * The `compact` diverging chart — the resting dual FOLDED into ONE 8px strip. Because the compact
 * bars are flat (colour-encoded, not height-encoded), the diverging pair need not stack into two
 * rows: each rep column splits at the centre into an L (top) and R (bottom) flat half (≈3.25px each,
 * a {@link COMPACT_FOLD_GAP}px gap between — a gap, not a line), so the pair occupies the SAME 8px as
 * the single compact — the per-rep analogue of the north-star stacked-halves. Index-locked (a lagging
 * side's un-logged reps render as faint empties); no gutter / labels / axis (no room at 8px). The
 * value-height diverging (where bar length must encode velocity) lives in `hero` / `rail`.
 */
export function DualVelocityCompactStrip({
  leftDone,
  rightDone,
  leftStream,
  rightStream,
  zones,
  barColor,
  lossThresholds,
  targetReps,
  height,
  className,
  label,
  viewProps,
}: DualChartProps) {
  // COMPOSED, like the hero and rail: two `compact` strips at COMPACT_FOLD_HALF each, separated by
  // COMPACT_FOLD_GAP (5 + 1.5 + 5 = DUAL_COMPACT_HEIGHT exactly). Because a compact bar FILLS its
  // plot, each column reads as an L top pill over an R bottom pill — the folded design, but drawn
  // by the same SetBarChart the single uses. Composing rather than hand-rolling is what makes the
  // set-type vocabulary (to-do, the cyan variable/continue windows, drop chunk-notch) and the
  // index-locked empty arrive for free, and keeps them from drifting apart later.
  const half = height === DUAL_COMPACT_HEIGHT ? COMPACT_FOLD_HALF : (height - COMPACT_FOLD_GAP) / 2
  const aligned = alignDualSlots(
    leftStream ? streamNaturalSlots(leftStream, targetReps) : [],
    rightStream ? streamNaturalSlots(rightStream, targetReps) : []
  )
  const { style: externalStyle, ...restProps } = viewProps

  const wing = (orientation: 'up' | 'down', columns: SetSlot[], done: number[]) => (
    <VelocityStrip
      variant="compact"
      orientation={orientation}
      velocities={done}
      columnSlots={columns}
      barColor={barColor}
      lossThresholds={lossThresholds}
      zones={zones}
      height={half}
    />
  )

  return (
    <View
      className={className}
      style={[{ height, flexDirection: 'column', gap: COMPACT_FOLD_GAP }, externalStyle]}
      accessibilityRole="image"
      accessibilityLabel={label}
      testID="dual-velocity-strip"
      {...restProps}
    >
      <View
        accessibilityElementsHidden
        testID="dual-velocity-wing-up"
        style={wingStyle(leftStream)}
      >
        {wing('up', aligned.left, leftDone)}
      </View>
      <View
        accessibilityElementsHidden
        testID="dual-velocity-wing-down"
        style={wingStyle(rightStream)}
      >
        {wing('down', aligned.right, rightDone)}
      </View>
    </View>
  )
}
