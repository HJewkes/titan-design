// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { useEffect, useState } from 'react'
import { View, Text, Pressable, Animated, type ViewProps } from 'react-native'
import { space } from '../../../theme/tokens/semantic'
import { useSurfaceMode } from '../../ui/surface'
import { formatVelocity } from '../../../utils/workout-format'
import {
  SetBarChart,
  type SetSlot,
  ChartSideRail,
  SET_BAR_DEFAULT_HEIGHT,
} from '../charts/SetBarChart'
import { ANIMATION_EASING } from '../charts/live-rep-growth'
import {
  classifyBand,
  makeBarColorFor,
  getLossStyle,
  normalizeLossThresholds,
  calculateMeanVelocity,
  velocityLossForRep,
  shownVelocityLoss,
  getVelocityLossColor,
  getVelocityZoneName,
  type VelocityLossThresholds,
} from './velocity-scale'
import {
  REP_GAP,
  buildSlots,
  deriveDoneVelocities,
  setAccessibilityLabel,
  type VelocitySet,
} from './velocity-slots'
import { velocityReferenceOverlay } from './VelocityLossBands'

export {
  getVelocityZoneColor,
  getVelocityZoneName,
  calculateVelocityLoss,
  calculateMeanVelocity,
  normalizeLossThresholds,
  velocityLossBand,
  getVelocityLossColor,
  velocityLossForRep,
  shownVelocityLoss,
  type VelocityLossThresholds,
  type VelocityLossBand,
} from './velocity-scale'
export type { VelocitySet } from './velocity-slots'
export { VelocityLossBands } from './VelocityLossBands'

/**
 * Structural velocity-zone band accepted from an upstream analytics source
 * (e.g. workout-analytics' `VelocityZones.bands`).
 *
 * Deliberately a plain structural shape — titan never imports the analytics
 * package (the same presentational-only policy the Workout family follows). Any object with
 * this shape can be passed, so `zones={waVelocityZones.bands}` works directly.
 * Bands are ordered slow → fast, contiguous, and cover `[0, ∞)` with the top
 * band's `max === null`. Bands carry NO color — color is a UI concern resolved
 * here via {@link zoneIdToScaleToken}.
 */
export interface VelocityZoneBandProp {
  /** Stable zone identity (e.g. WA's `VelocityZoneId`). Drives color mapping. */
  id: string
  /** Human-readable label shown in the summary row. */
  label: string
  /** Inclusive lower bound (m/s mean concentric velocity). */
  min: number
  /** Exclusive upper bound (m/s); `null` marks the open top band. */
  max: number | null
}

export interface VelocityStripProps extends ViewProps {
  /**
   * Per-rep MEAN concentric velocity (m/s), one entry per rep (brain WA-D02).
   * Drives both bar height and — in the default path — zone color. Callers must
   * feed mean (not peak) concentric velocity so bar color, height, and the
   * summary label all describe one metric.
   *
   * Optional: provide exactly one of `velocities` or {@link VelocityStripProps.set}.
   * When neither is given the strip renders nothing.
   */
  velocities?: number[]
  /**
   * Optional structured strength-training set descriptor (see {@link VelocitySet}).
   * When present it supersedes `velocities`: the done-velocity array is derived
   * from the set (so mean / loss / zone summaries still work) and the strip is
   * drawn as a typed slot list — grey todo, cyan variable / continue windows and
   * the wide-gap chunking that distinguishes drop / myo / cluster sets. Provide
   * exactly one of `velocities` or `set`.
   */
  set?: VelocitySet
  /**
   * Optional velocity-zone bands (shape-compatible with WA's
   * `VelocityZones.bands`). When provided, bar color and the summary zone label
   * come from these bands via {@link zoneIdToScaleToken}. When omitted, the
   * built-in default scale (≥1.0 / ≥0.75 / ≥0.5) is used — identical to prior
   * releases. Colors NEVER come from the bands themselves.
   */
  zones?: readonly VelocityZoneBandProp[]
  /**
   * Bar-fill coloring mode. `loss` (DEFAULT) — color each performed bar by its
   * velocity LOSS from the set's OWN best (see {@link getVelocityLossColor}), so a
   * fatiguing set reads green→red by loss regardless of its absolute speed; ignores
   * {@link zones} (it is a wholly separate scale). `zone` — color from the absolute
   * velocity-zone scale ({@link zones} when provided, else the built-in
   * ≥1.0/≥0.75/≥0.5 default). `todo`/`variable`/`continue` slots are unaffected either way.
   */
  barColor?: 'zone' | 'loss'
  /**
   * `barColor="loss"` only: the loss (%) where bars turn yellow, orange and red, and where the
   * hero's amber and red decision bands start. Default `[10, 20, 30]`.
   */
  lossThresholds?: VelocityLossThresholds
  /**
   * `hero` only: draw the VL20 / VL30 velocity-loss decision bands behind the bars
   * (see {@link VelocityLossBands}). Defaults to on when {@link barColor} is `loss`
   * (the default), off for `zone` — the bands and the loss bar-fill are the two
   * halves of the same loss-relative language.
   */
  showLossBands?: boolean
  /**
   * `hero` only: `up` (default) grows bars UP from a bottom baseline; `down` mirrors
   * the whole plot (bars grow DOWN from a top baseline, text upright). The diverging
   * dual is just an `up` hero over a `down` hero sharing one axis — so any hero
   * improvement reaches the dual for free.
   */
  orientation?: 'up' | 'down'
  /**
   * `hero` only: OVERRIDE the height-scaling denominator with `scaleMax * headroom` instead of
   * this strip's own `peak`/`fixed` scale. Affects BAR HEIGHT ONLY — velocity-LOSS coloring and
   * the running-best reference line still measure off THIS strip's own velocities. The diverging
   * dual passes the pair's shared max here so a stronger arm's bars read TALLER against one common
   * scale while each arm still colors by its own loss.
   */
  scaleMax?: number
  /**
   * `hero` only (internal): suppress this strip's own 2px baseline border. The diverging dual sets
   * it on BOTH composed wings and draws ONE shared centre axis where they meet, so the axis is a
   * single crisp line rather than two abutting baselines reading as a double-thick rule.
   */
  hideBaseline?: boolean
  /**
   * `hero` only (internal): the EXACT rendered column structure, overriding this strip's own
   * slot-building. The diverging dual builds ONE index-locked structure shared by both wings (same
   * rep indices, same WIDE-gap positions, same column count; a column a side didn't log renders
   * `empty`) and passes it here so bars line up column-for-column across the centre axis. Bar
   * height / color / the running-best reference still read this strip's own `velocities`.
   */
  columnSlots?: SetSlot[]
  /**
   * `hero` only: an optional stream / slot NAME (e.g. "Left Arm"), rendered as a rotated vertical
   * edge label down the chart's left gutter — the same treatment the diverging dual gives each wing,
   * so a single hero and a dual read consistently. Omitted → no gutter.
   */
  label?: string
  /**
   * Live mode: index of the most-recently-completed rep. That bar GROWS UP FROM
   * THE BASELINE to its full height as it enters, tracking the rep as it lands;
   * if it is also the current set peak (a new best) the growth slightly
   * overshoots then settles, reading as a small bounce. Only the latest bar
   * animates. Honors `prefers-reduced-motion`. Framed `expanded` chart and
   * `hero` only (interactive tap-to-expand use).
   */
  liveRepIndex?: number
  /**
   * `expanded` variant: whether the chart is OPEN. Default true (the variant shows
   * its chart). Toggle it (with {@link onToggle}) for the interactive tap-to-expand
   * collapse↔chart animation; a static open chart (no `onToggle`) does not animate.
   */
  expanded?: boolean
  onToggle?: () => void
  onRepPress?: (index: number, velocity: number) => void
  /**
   * `compact` — the flat resting strip: {@link SetBarChart} in FLAT mode (uniform short bars, no
   * value labels), sharing hero's exact geometry (colors, paper, spacing, chunk-notch, slots, gutter).
   * `expanded` — the velocity-HEIGHT bar chart (rounded tops), whose chrome is prop-driven: with
   * {@link showNumbers} or {@link showInfo} on it's the framed chart (raised surface, padding, per-bar
   * m/s labels, mean/loss info row, interactive collapse); with both off it's a bare strip — the
   * active-set "spotlight" of {@link ExerciseCard}. `hero` — the across-the-room, single-set wall
   * treatment: tall bars, a per-bar m/s value label, a dashed running-best reference line, and dashed
   * placeholders for the reps still to come (see {@link targetReps}). All three share SetBarChart, so
   * bars align across compact / expanded / hero.
   */
  variant?: 'compact' | 'expanded' | 'hero'
  /** `expanded` / `hero` plot height in px (bars scale to this). Default 60 (`expanded`) / 220 (`hero`). */
  height?: number
  /**
   * `hero` only: the set's planned rep count. Reps beyond {@link velocities} draw as
   * dashed placeholder stubs so the wall reads "3 of 8 done" at a glance. Ignored
   * (and no placeholders drawn) when absent or ≤ the performed-rep count.
   */
  targetReps?: number
  /**
   * `expanded` / `hero` bar scaling. `peak` (default) scales to the set's own max
   * (+15% headroom). `fixed` scales to a fixed velocity ceiling so bar heights read
   * the same absolute velocity across sets (the spotlight).
   */
  scale?: 'peak' | 'fixed'
  /** `expanded` framed chart: per-bar m/s labels. Default true. */
  showNumbers?: boolean
  /** `expanded` framed chart: the mean/loss info row. Default true. */
  showInfo?: boolean
  className?: string
}

// The 4-color performance scale as the dataviz-sequential tokens PinnedLiveStrip uses; dark mode equals WORKOUT_TOKENS.scale.
/** Default framed `expanded` chart height (px). */
const EXPANDED_HEIGHT = 60
/** Default `compact` (flat resting strip) height (px) — a THIN radius-2 pill row, the resting glance. */
const COMPACT_HEIGHT = 8

/** Framed expanded collapse-animation duration (ms). */
const ANIMATION_DURATION = 400

// --- Dual (bilateral) diverging chart ----------------------------------------
// The two-device (LEFT + RIGHT voltra) treatment. Instead of two stacked single
// heroes with independent baselines, ONE diverging chart shares a horizontal centre
// axis: LEFT reps grow UP, RIGHT reps grow DOWN, one mirrored pair per rep index. The
// asymmetry (left-dominant / right-lagging) reads pre-attentively as the silhouette.
// It reuses VelocityStrip's slot model ({@link buildSlots}/{@link VelocitySlot}), its
// zone color scale ({@link makeBarColorFor}), the hero geometry constants, and the
// live-rep entrance ({@link useLiveRepGrowth}) — side is POSITION only, never hue.
//
// LIVE-REP ENTRANCE — do NOT re-add a dual-only one. The dual used to hand-roll its wing bars and
// drive them from its own scale-pop hook, so the newest-rep animation existed TWICE and the two
// copies drifted. Composing single strips retired that hook: `liveRepIndex` is now an ordinary
// prop on each wing, so both wings animate through the same code path as a single hero and an
// entrance that fires on one wing only is not expressible. Whether the wings should POP (a
// whole-bar scale) rather than GROW from the axis is a live design question — but it belongs in
// SetBarChart's shared entrance, applied to the single hero and the wings together. Reintroducing
// it here would rebuild exactly the divergence this composition removed.

/** One voltra's velocity stream — the SAME shape VelocityStrip accepts (one of these). */
export interface DualVelocityStream {
  /** Per-rep MEAN concentric velocity (m/s) for this side. */
  velocities?: number[]
  /** A structured set descriptor for this side (drives the typed slot vocabulary). */
  set?: VelocitySet
  /**
   * The side's SLOT NAME (e.g. "Left Arm"), rendered as the vertical edge label. This is
   * the slot's identity supplied by data — there is no hardcoded LEFT/RIGHT fallback. When
   * absent or empty, that side renders no label.
   */
  label?: string
  /** Fade this side's wing, e.g. once its voltra has disconnected mid-set. */
  isDimmed?: boolean
}

const DIMMED_WING_OPACITY = 0.35

/** A wing's own opacity; a scrim would paint its empty plot area over the parent's surface. */
const wingStyle = (stream: DualVelocityStream | undefined) =>
  stream?.isDimmed ? { opacity: DIMMED_WING_OPACITY } : undefined

export interface DualVelocityStripProps extends ViewProps {
  /** The up-wing stream — drawn growing UP from the centre axis; its edge name comes from `left.label`. */
  left: DualVelocityStream
  /** The down-wing stream — drawn growing DOWN from the centre axis; its edge name comes from `right.label`. */
  right: DualVelocityStream
  /**
   * Optional velocity-zone bands (shape-compatible with WA's `VelocityZones.bands`),
   * shared with {@link VelocityStrip}. Colors the reps by zone on BOTH sides; side is
   * never encoded by hue. When omitted the built-in default scale is used.
   */
  zones?: readonly VelocityZoneBandProp[]
  /**
   * Bar-fill coloring mode, matching {@link VelocityStrip}. `loss` (DEFAULT) — each
   * wing colors by its velocity LOSS from THAT arm's own best (per-wing, since arms
   * fatigue independently). `zone` — the shared absolute zone scale. Side is never
   * encoded by hue either way.
   */
  barColor?: 'zone' | 'loss'
  /** `loss` only: the thresholds both wings band at, as on {@link VelocityStrip}. Default 10/20/30. */
  lossThresholds?: VelocityLossThresholds
  /**
   * Planned rep count. Reps beyond a side's performed count draw as mirrored dashed
   * todo stubs (same "3 of 8 done" read as the single hero), on both wings.
   */
  targetReps?: number
  /** Index of the most-recently-completed rep; that mirrored pair animates in (hero only). */
  liveRepIndex?: number
  /**
   * `hero` — the across-the-room wall scale: tall wings, per-rep m/s value labels, and a dashed
   * running-best reference line per side. `compact` — the flat resting form: dual-hero but flat +
   * no labels (both wings are the `compact` VelocityStrip variant), same aligned structure + shared
   * gutter + axis. `dual-expanded` — the compact rail-expanded lean renderer, no labels / reference
   * lines (VW-97: `rail` was a verified misnomer — this variant is the value-height strip a session
   * rail row expands into, not the rail itself).
   *
   * `rail` is a **deprecated alias** for `dual-expanded` (same renderer, same output) — kept for one
   * release so existing call sites keep working; see the Workout README.
   */
  variant?: 'hero' | 'compact' | 'dual-expanded' | 'rail'
  /**
   * Bar-height scaling, shared across BOTH wings so the L/R asymmetry reads as bar
   * length against one scale. `peak` (default) = the pair's max +headroom; `fixed` =
   * a fixed velocity ceiling.
   */
  scale?: 'peak' | 'fixed'
  /** Total plot height (px), split evenly into the up (L) and down (R) wings. */
  height?: number
  className?: string
}

/** Default `hero` diverging height (px) — matches the single hero. */
const DUAL_HERO_HEIGHT = SET_BAR_DEFAULT_HEIGHT
/** Default `rail` diverging height (px) — compact enough to sit inside a rail slot. */
const DUAL_RAIL_HEIGHT = 96
/** Default `compact` diverging height (px) — two 5px rounded L/R sub-segments + the 1.5px fold gap. */
const DUAL_COMPACT_HEIGHT = 11.5

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

/** One side's performed per-rep velocities — flattened from a `set` descriptor, or the raw array. */
function streamDone(stream: DualVelocityStream): number[] {
  return stream.set ? deriveDoneVelocities(stream.set) : (stream.velocities ?? [])
}

/** A side's NATURAL slot list — its `set` slot vocabulary, or bare rep slots + a `targetReps` remainder. */
function streamNaturalSlots(stream: DualVelocityStream, targetReps?: number): SetSlot[] {
  if (stream.set) {
    return buildSlots(stream.set).map((s) => ({
      kind: s.kind,
      value: s.velocity,
      leadingGap: s.leadingGap,
    }))
  }
  const reps: SetSlot[] = (stream.velocities ?? []).map((v, i) => ({
    kind: 'rep',
    value: v,
    leadingGap: i === 0 ? 0 : REP_GAP,
  }))
  const pad = Math.max(0, (targetReps ?? 0) - reps.length)
  return [...reps, ...Array.from({ length: pad }, () => ({ kind: 'todo' as const }))]
}

/**
 * The window-kind precedence when merging two sides' cells at a column: a set-type window (variable /
 * continue) that either side has wins; else if either logged (or plans) a rep there it's a REP column;
 * else it's a shared to-do. So a lagging side's not-yet-logged rep column stays a REP column (rendered
 * `empty` for that side), index-locked to the other side's rep — never shifted or re-spaced.
 */
function mergeColumnKind(l: SetSlot | undefined, r: SetSlot | undefined): SetSlot['kind'] {
  const kinds = [l?.kind, r?.kind]
  if (kinds.includes('variable')) return 'variable'
  if (kinds.includes('continue')) return 'continue'
  if (kinds.includes('rep')) return 'rep'
  return 'todo'
}

/** One side's cell at a merged column: its logged rep (with value), else `empty` for a rep column, else the shared window kind. */
function sideColumnCell(
  slot: SetSlot | undefined,
  kind: SetSlot['kind'],
  leadingGap: number
): SetSlot {
  if (kind !== 'rep') return { kind, leadingGap }
  return slot?.kind === 'rep'
    ? { kind: 'rep', value: slot.value, leadingGap }
    : { kind: 'empty', leadingGap }
}

/**
 * Build ONE index-locked column structure shared by both diverging wings from their natural slot
 * lists: same column count, same rep indices, same WIDE-gap positions. Each column resolves to a
 * shared kind ({@link mergeColumnKind}); per side it's that side's rep value, or `empty` when the
 * side hasn't logged that rep (assumes symmetric bilateral reps — both sides step together).
 */
function alignDualSlots(left: SetSlot[], right: SetSlot[]): { left: SetSlot[]; right: SetSlot[] } {
  const n = Math.max(left.length, right.length)
  const L: SetSlot[] = []
  const R: SetSlot[] = []
  for (let i = 0; i < n; i++) {
    const lt = left[i]
    const rt = right[i]
    const kind = mergeColumnKind(lt, rt)
    const gap = Math.max(lt?.leadingGap ?? REP_GAP, rt?.leadingGap ?? REP_GAP)
    L.push(sideColumnCell(lt, kind, gap))
    R.push(sideColumnCell(rt, kind, gap))
  }
  return { left: L, right: R }
}

/** Shared inputs for both dual renderers — the resolved per-side done arrays + presentation props. */
interface DualChartProps {
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
function DualVelocityHero({
  leftDone,
  rightDone,
  leftStream,
  rightStream,
  leftLabel,
  rightLabel,
  zones,
  barColor,
  lossThresholds,
  scale,
  targetReps,
  liveRepIndex,
  height,
  className,
  label,
  viewProps,
}: DualChartProps & { liveRepIndex?: number }) {
  // The two wings are separated by the SAME small gap as the expanded/rail dual (no centre-axis rule).
  const plotHalf = (height - DUAL_WING_GAP) / 2
  // ONE shared height scale across both wings so the L/R asymmetry reads as bar length, not two
  // scales; each composed strip still colors by its OWN loss and draws its OWN best reference.
  // `peak` shares the pair max via `scaleMax`; `fixed` shares the cross-set ceiling (both wings
  // resolve the same fixed ceiling), so `scaleMax` is left off and `scale` carries it.
  const sharedMax = Math.max(...leftDone, ...rightDone, 0)
  // ONE index-locked column structure shared by both wings: same rep indices, same WIDE-gap
  // positions, same column count. A column a side didn't log renders `empty` there — so a lagging
  // side's next rep lands at the SAME column index as the other side, never shifted or re-spaced.
  const aligned = alignDualSlots(
    leftStream ? streamNaturalSlots(leftStream, targetReps) : [],
    rightStream ? streamNaturalSlots(rightStream, targetReps) : []
  )
  const { style: externalStyle, ...restProps } = viewProps

  // Each wing renders the SHARED aligned structure (`columnSlots`); its own `velocities` still drive
  // bar height / per-side loss color / the running-best reference.
  const wing = (orientation: 'up' | 'down', columns: SetSlot[], done: number[]) => (
    <VelocityStrip
      variant="hero"
      orientation={orientation}
      velocities={done}
      columnSlots={columns}
      scale={scale}
      scaleMax={scale === 'fixed' ? undefined : sharedMax}
      barColor={barColor}
      lossThresholds={lossThresholds}
      zones={zones}
      liveRepIndex={liveRepIndex}
      height={plotHalf}
      hideBaseline
    />
  )

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

      {/* The two composed heroes, separated by the shared wing gap (no centre-axis rule). Their own
          labels are redundant with the dual's summary label, so the wings are a11y-hidden. */}
      <View style={{ flex: 1, gap: DUAL_WING_GAP }}>
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
function DualVelocityRail({
  leftDone,
  rightDone,
  leftStream,
  rightStream,
  zones,
  barColor,
  lossThresholds,
  scale,
  targetReps,
  liveRepIndex,
  height,
  className,
  label,
  viewProps,
}: DualChartProps & { liveRepIndex?: number }) {
  // The lean dual-EXPANDED. Composed from two bare `expanded` strips exactly as the hero composes
  // two heroes, rather than drawing its own bars: composing is what makes the dual inherit the
  // single's bar widths, gaps, chunk-notch, set-type slot windows, paper and live-rep growth. The
  // bespoke renderer this replaces took only velocities, so the dual silently dropped every
  // set-type window and let a lagging side render fewer bars than its partner.
  const plotHalf = (height - DUAL_WING_GAP) / 2
  // ONE shared height scale across both wings, so an L/R asymmetry reads as bar length rather than
  // as two independent scales.
  const sharedMax = Math.max(...leftDone, ...rightDone, 0)
  // ONE index-locked column structure. A column a side did not log renders as an aligned empty, so
  // the lagging side's next rep lands at the SAME column index as its partner's.
  const aligned = alignDualSlots(
    leftStream ? streamNaturalSlots(leftStream, targetReps) : [],
    rightStream ? streamNaturalSlots(rightStream, targetReps) : []
  )
  const { style: externalStyle, ...restProps } = viewProps

  const wing = (orientation: 'up' | 'down', columns: SetSlot[], done: number[]) => (
    <VelocityStrip
      variant="expanded"
      showNumbers={false}
      showInfo={false}
      orientation={orientation}
      velocities={done}
      columnSlots={columns}
      scale={scale}
      scaleMax={scale === 'fixed' ? undefined : sharedMax}
      barColor={barColor}
      lossThresholds={lossThresholds}
      zones={zones}
      liveRepIndex={liveRepIndex}
      height={plotHalf}
    />
  )

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
          shared gap alone. Their own labels would duplicate the dual's summary label. */}
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

/**
 * The `compact` diverging chart — the resting dual FOLDED into ONE 8px strip. Because the compact
 * bars are flat (colour-encoded, not height-encoded), the diverging pair need not stack into two
 * rows: each rep column splits at the centre into an L (top) and R (bottom) flat half (≈3.25px each,
 * a {@link COMPACT_FOLD_GAP}px gap between — a gap, not a line), so the pair occupies the SAME 8px as
 * the single compact — the per-rep analogue of the north-star stacked-halves. Index-locked (a lagging
 * side's un-logged reps render as faint empties); no gutter / labels / axis (no room at 8px). The
 * value-height diverging (where bar length must encode velocity) lives in `hero` / `rail`.
 */
function DualVelocityCompactStrip({
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

/**
 * The dual-voltra (bilateral) DIVERGING per-rep velocity chart. The up-wing stream grows UP, the
 * down-wing stream grows DOWN from one shared centre axis. The `hero` variant COMPOSES two single
 * {@link VelocityStrip} heroes (see {@link DualVelocityHero}) so any hero improvement reaches the
 * dual for free; `rail` uses a lean value-height renderer ({@link DualVelocityRail}); `compact` folds
 * the pair into one 8px strip ({@link DualVelocityCompactStrip}). Single-voltra sets keep using
 * {@link VelocityStrip} (`variant="hero"`) — unchanged.
 */
export function DualVelocityStrip({
  left,
  right,
  zones,
  barColor = 'loss',
  lossThresholds,
  targetReps,
  liveRepIndex,
  variant = 'hero',
  scale = 'peak',
  height,
  className,
  ...props
}: DualVelocityStripProps) {
  // `rail` is the deprecated alias for `dual-expanded` — normalize once so every branch below
  // reads one canonical value instead of re-checking both spellings.
  const resolvedVariant = variant === 'rail' ? 'dual-expanded' : variant
  const resolvedHeight =
    height ??
    (resolvedVariant === 'hero'
      ? DUAL_HERO_HEIGHT
      : resolvedVariant === 'compact'
        ? DUAL_COMPACT_HEIGHT
        : DUAL_RAIL_HEIGHT)
  // The done arrays drive the shared max + per-side best + the summary counts; the raw streams
  // flow to the hero wings so a side's set-type WINDOWS render (the `rail` renderer uses `*Done`).
  const leftDone = streamDone(left)
  const rightDone = streamDone(right)

  const label =
    `Dual velocity chart, left ${leftDone.length} of ${Math.max(leftDone.length, targetReps ?? leftDone.length)} reps, ` +
    `right ${rightDone.length} of ${Math.max(rightDone.length, targetReps ?? rightDone.length)} reps`

  const shared: DualChartProps = {
    leftDone,
    rightDone,
    leftStream: left,
    rightStream: right,
    leftLabel: left.label,
    rightLabel: right.label,
    zones,
    barColor,
    lossThresholds,
    scale,
    targetReps,
    height: resolvedHeight,
    className,
    label,
    viewProps: props,
  }

  // `liveRepIndex` reaches dual-expanded too: its wings are composed strips, so the newest rep
  // grows from the midline on BOTH sides. Compact is flat, so a grow animation has nothing to animate.
  if (resolvedVariant === 'dual-expanded')
    return <DualVelocityRail {...shared} liveRepIndex={liveRepIndex} />
  if (resolvedVariant === 'compact') return <DualVelocityCompactStrip {...shared} />
  return <DualVelocityHero {...shared} liveRepIndex={liveRepIndex} />
}

export function VelocityStrip({
  velocities,
  set,
  zones,
  barColor = 'loss',
  lossThresholds: lossThresholdsInput,
  showLossBands,
  orientation = 'up',
  scaleMax,
  hideBaseline,
  columnSlots,
  label,
  liveRepIndex,
  expanded = true,
  onToggle,
  onRepPress,
  variant = 'expanded',
  height = EXPANDED_HEIGHT,
  targetReps,
  scale = 'peak',
  showNumbers = true,
  showInfo = true,
  className,
  ...props
}: VelocityStripProps) {
  // Bands default on with the loss bar-fill (the two halves of the loss language),
  // off for the absolute zone scale; an explicit prop always wins.
  const lossBandsOn = showLossBands ?? barColor === 'loss'
  const lossThresholds = normalizeLossThresholds(lossThresholdsInput)
  // A `set` descriptor derives its own done-velocity array; the legacy
  // `velocities` path stays the source of truth otherwise. Every summary calc
  // (mean / loss / zone) runs on this one array so the info row works either way.
  const doneVelocities = set ? deriveDoneVelocities(set) : (velocities ?? [])

  const maxVelocity = Math.max(...doneVelocities, 0)
  const meanVelocity = calculateMeanVelocity(doneVelocities)
  // The colour bands the last rep's exact loss, like its bar; the number is that loss rounded down.
  const lastLoss = velocityLossForRep(doneVelocities[doneVelocities.length - 1] ?? 0, maxVelocity)
  const loss = shownVelocityLoss(lastLoss)

  // The framed chart (raised box, labels, info) vs the bare spotlight strip is the
  // only fork in the `expanded` variant — keyed by whether any chrome is requested.
  const framed = showNumbers || showInfo

  const hasZones = zones != null && zones.length > 0
  // Single-sourced zone resolver (diverging-hero) wrapped with the loss-relative mode: `barColor="loss"`
  // colors each rep by its velocity loss from the set's own best, else the shared zone scale. Every
  // variant hands this `colorFor` to SetBarChart, so all variants color identically.
  const mode = useSurfaceMode()
  const zoneColorFor = makeBarColorFor(zones, mode)
  const barColorFor = (v: number): string =>
    barColor === 'loss'
      ? getVelocityLossColor(velocityLossForRep(v, maxVelocity), lossThresholds, mode)
      : zoneColorFor(v)
  const meanZone = hasZones
    ? (classifyBand(meanVelocity, zones)?.label ?? '')
    : getVelocityZoneName(meanVelocity)

  // The framed collapse is now an IN-PLACE bar-height morph: `expandProgress` (0 collapsed → 1 open)
  // drives SetBarChart's bars flat↔value (no reflow), replacing the old collapse-to-3px height anim.
  // `infoOpacity` fades the info row; the per-bar labels fade with `expandProgress` in the overlay.
  const [expandProgress] = useState(() => new Animated.Value(expanded ? 1 : 0))
  const [infoOpacity] = useState(() => new Animated.Value(expanded ? 1 : 0))

  // Newest-rep animation: pop for a normal rep, bounce when it sets a new peak.
  const liveVelocity = liveRepIndex != null ? doneVelocities[liveRepIndex] : undefined
  const isNewPeak = liveVelocity != null && maxVelocity > 0 && liveVelocity === maxVelocity

  useEffect(() => {
    if (variant !== 'expanded' || !framed) return
    Animated.parallel([
      Animated.timing(expandProgress, {
        toValue: expanded ? 1 : 0,
        duration: ANIMATION_DURATION,
        easing: ANIMATION_EASING,
        useNativeDriver: false,
      }),
      Animated.timing(infoOpacity, {
        toValue: expanded ? 1 : 0,
        duration: 300,
        delay: expanded ? 200 : 0,
        useNativeDriver: false,
      }),
    ]).start()
  }, [expanded, variant, framed, expandProgress, infoOpacity])

  // Nothing to draw: neither a legacy velocity array nor a set descriptor.
  if (set == null && velocities == null) return null

  const repCount = doneVelocities.length
  const miniLabel = set ? setAccessibilityLabel(set, repCount) : `Velocity strip, ${repCount} reps`

  if (variant === 'hero') {
    // Hero's plot is far taller than the expanded chart; apply its own default when the caller left
    // `height` at the shared 60px default. The diverging dual (which passes `columnSlots`) sets an
    // explicit per-wing height — exempt it, so a dual whose wing height happens to be 60px (a 120px
    // dual) isn't mistaken for "unset" and blown up to 220.
    const heroHeight =
      height === EXPANDED_HEIGHT && columnSlots == null ? SET_BAR_DEFAULT_HEIGHT : height
    // `columnSlots` (the diverging dual's shared index-locked structure) wins; else a `set` builds
    // its own typed slots, and the plain `velocities` path is bare rep slots + a `targetReps` remainder.
    const heroSlots: SetSlot[] =
      columnSlots ??
      (set
        ? buildSlots(set).map((s) => ({
            kind: s.kind,
            value: s.velocity,
            leadingGap: s.leadingGap,
          }))
        : doneVelocities.map((v) => ({ kind: 'rep', value: v })))
    const total = Math.max(repCount, targetReps ?? repCount)
    const heroLabel =
      maxVelocity > 0
        ? `Velocity chart, ${repCount} of ${total} reps, best ${formatVelocity(maxVelocity)} meters per second`
        : `Velocity chart, ${repCount} of ${total} reps`
    return (
      <SetBarChart
        slots={heroSlots}
        colorFor={barColorFor}
        height={heroHeight}
        scale={scale}
        scaleMax={scaleMax}
        orientation={orientation}
        liveRepIndex={liveRepIndex}
        isNewPeak={isNewPeak}
        targetReps={set || columnSlots ? undefined : targetReps}
        label={label}
        showValueLabels
        formatValue={formatVelocity}
        // Only the diverging dual's composed wings opt in (TD-07.10) — the standalone single
        // hero is unchanged, per columnSlots being the dual-only signal (see the comment above).
        flipEdgeLabel={columnSlots != null}
        renderReference={(g) => velocityReferenceOverlay(g, lossBandsOn, lossThresholds)}
        hideBaseline
        testID="velocity-strip-hero"
        testIDPrefix="velocity"
        accessibilityLabel={heroLabel}
        className={className}
        viewProps={props}
      />
    )
  }

  if (variant === 'compact') {
    // `compact` = the flat resting form: SetBarChart in FLAT mode (uniform short bars, no value
    // labels), sharing hero's geometry — same colors, paper, 0.08 spacing, proportional chunk-notch,
    // todo/variable/continue slots, and gutter — so a compact↔expanded toggle only changes bar HEIGHT.
    // `columnSlots` (the diverging dual-compact's shared index-locked structure) wins, like the hero.
    const compactSlots: SetSlot[] =
      columnSlots ??
      (set
        ? buildSlots(set).map((s) => ({
            kind: s.kind,
            value: s.velocity,
            leadingGap: s.leadingGap,
          }))
        : doneVelocities.map((v) => ({ kind: 'rep', value: v })))
    const compactHeight = height === EXPANDED_HEIGHT ? COMPACT_HEIGHT : height
    return (
      <SetBarChart
        slots={compactSlots}
        colorFor={barColorFor}
        height={compactHeight}
        scale={scale}
        scaleMax={scaleMax}
        orientation={orientation}
        flat
        barRadius={2}
        cornerStyle="all"
        targetReps={set || columnSlots ? undefined : targetReps}
        label={label}
        hideBaseline
        testID="velocity-strip-compact"
        testIDPrefix="velocity"
        accessibilityLabel={miniLabel}
        className={className}
        viewProps={props}
      />
    )
  }

  // Bare `expanded` strip (both chrome flags off): the velocity-HEIGHT spotlight — now
  // FOLDED onto SetBarChart (value mode, no labels), so its bars share the SAME geometry
  // (widths / gaps / chunk-notch / slots / paper) as compact + hero. Only the height-mode
  // (value here, flat in compact) differs, so a compact↔spotlight toggle never reflows.
  if (!framed) {
    // `columnSlots` wins, exactly as it does for compact and hero. The diverging dual passes the
    // index-locked shared structure through here; ignoring it gave the expanded dual its own
    // per-side columns, so a lagging side rendered FEWER bars instead of an aligned empty cell.
    const spotlightSlots: SetSlot[] =
      columnSlots ??
      (set
        ? buildSlots(set).map((s) => ({
            kind: s.kind,
            value: s.velocity,
            leadingGap: s.leadingGap,
          }))
        : doneVelocities.map((v) => ({ kind: 'rep', value: v })))
    return (
      <SetBarChart
        slots={spotlightSlots}
        colorFor={barColorFor}
        height={height}
        scale={scale}
        scaleMax={scaleMax}
        orientation={orientation}
        liveRepIndex={liveRepIndex}
        isNewPeak={isNewPeak}
        barRadius={2}
        cornerStyle="top"
        targetReps={set ? undefined : targetReps}
        label={label}
        hideBaseline
        testID="velocity-strip-spotlight"
        testIDPrefix="velocity"
        accessibilityLabel={miniLabel}
        className={className}
        viewProps={props}
      />
    )
  }

  const stripLabel = set
    ? `${setAccessibilityLabel(set, repCount)}, tap to ${expanded ? 'collapse' : 'expand'}`
    : `Velocity chart for set, ${repCount} reps, tap to ${expanded ? 'collapse' : 'expand'}`
  // When onToggle wraps the strip or individual reps are interactive, the container itself is not a button
  const hasInteractiveContainer = onToggle != null
  const hasInteractiveReps = onRepPress != null && expanded

  const framedSlots: SetSlot[] = set
    ? buildSlots(set).map((sl) => ({
        kind: sl.kind,
        value: sl.velocity,
        leadingGap: sl.leadingGap,
      }))
    : doneVelocities.map((v) => ({ kind: 'rep', value: v }))

  // Per-bar overlay handed to SetBarChart so the framed chart keeps its m/s label (fading with the
  // expand) + its onRepPress hit-target WITHOUT re-rolling bars — one bar-rendering path remains.
  const needsBarOverlay = showNumbers || onRepPress != null
  const renderFramedBarOverlay = needsBarOverlay
    ? (repIndex: number, value: number) => (
        <>
          {showNumbers && (
            <Animated.View
              style={{
                opacity: expandProgress,
                position: 'absolute',
                top: -13,
                left: 0,
                right: 0,
                alignItems: 'center',
              }}
              accessibilityElementsHidden
              pointerEvents="none"
            >
              <Text
                className="text-text-secondary"
                style={{ fontSize: 8, fontWeight: '600' }}
                testID={`velocity-label-${repIndex}`}
              >
                {formatVelocity(value)}
              </Text>
            </Animated.View>
          )}
          {onRepPress && expanded && (
            <Pressable
              style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}
              onPress={() => onRepPress(repIndex, value)}
              accessibilityRole="button"
              accessibilityLabel={`Rep ${repIndex + 1}: ${formatVelocity(value)} meters per second, tap for details`}
              testID={`velocity-bar-pressable-${repIndex}`}
            />
          )}
        </>
      )
    : undefined

  // The framed chrome is a WRAPPER (raised box + info row + tap-to-collapse) around ONE SetBarChart
  // in value mode; the collapse is the in-place `expandProgress` bar-height morph, not a height strip.
  const stripContent = (
    <Animated.View
      className={[className, 'bg-surface-raised'].filter(Boolean).join(' ')}
      // NativeWind does not compile className on an `Animated.View` — verified in
      // Storybook, where the element renders `class="css-view-175oi2r"` and nothing
      // else — so this chrome reads the inset tokens through the JS export.
      style={{
        width: '100%',
        borderRadius: 6,
        paddingTop: space.inset.lg,
        paddingBottom: showInfo ? space.inset.sm : space.inset.xs,
      }}
      accessibilityRole={hasInteractiveContainer || hasInteractiveReps ? 'none' : 'button'}
      accessibilityLabel={hasInteractiveContainer || hasInteractiveReps ? undefined : stripLabel}
      testID="velocity-strip"
      {...props}
    >
      <SetBarChart
        slots={framedSlots}
        colorFor={barColorFor}
        height={height}
        scale={scale}
        scaleMax={scaleMax}
        expandProgress={expandProgress}
        renderBarOverlay={renderFramedBarOverlay}
        targetReps={set ? undefined : targetReps}
        barRadius={2}
        cornerStyle="top"
        hideBaseline
        testIDPrefix="velocity"
      />
      {expanded && showInfo && (
        <Animated.View
          // Same `Animated.View` limitation as the strip above: style, not className.
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            opacity: infoOpacity,
            // eslint-disable-next-line titan/no-raw-spacing -- chart geometry
            marginTop: 6,
            // eslint-disable-next-line titan/no-raw-spacing -- chart geometry
            paddingHorizontal: 6,
          }}
          testID="velocity-info-row"
        >
          <Text
            className="text-text-secondary"
            style={{ fontSize: 10, fontFamily: 'Inter, sans-serif' }}
          >
            {meanZone} {'·'} {formatVelocity(meanVelocity)} m/s
          </Text>
          <Text
            className="text-text-secondary"
            style={{
              fontSize: 10,
              fontFamily: 'Inter, sans-serif',
              ...getLossStyle(lastLoss, lossThresholds, mode),
            }}
          >
            Loss: {loss}%
          </Text>
        </Animated.View>
      )}
    </Animated.View>
  )

  if (onToggle) {
    return (
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityLabel={stripLabel}
        testID="velocity-strip-pressable"
      >
        {stripContent}
      </Pressable>
    )
  }

  return stripContent
}
