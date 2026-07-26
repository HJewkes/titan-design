// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { useEffect, useState } from 'react'
import { View, Text, Pressable, Animated, type ViewProps, type ViewStyle } from 'react-native'
import { WORKOUT_TOKENS } from '../../../theme/workout-tokens'
import { primitiveColors, sequentialEffort } from '../../../theme/tokens/primitives'
import { getSemanticColors } from '../../../theme/tokens/semantic'
import { useOnSurfaceColor } from '../../ui/surface/SurfaceContext'
import { alpha } from '../../../utils/colors'
import { formatVelocity } from '../../../utils/workout-format'
import {
  SetBarChart,
  type SetSlot,
  VARIABLE_FILL,
  CONTINUE_OUTLINE,
  type SetBarGeometry,
  ChartSideRail,
  SET_BAR_DEFAULT_HEIGHT,
  BAR_MAX_WIDTH,
  computeBarLayout,
} from '../charts/SetBarChart'
import type { LayoutChangeEvent } from 'react-native'
import { ANIMATION_EASING } from '../charts/live-rep-growth'

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

// Canonical 4-color performance scale shared with SetRow's RPE color
// (see theme/workout-tokens.ts). green = fastest, red = slowest/grinding.
const VEL_COLORS = WORKOUT_TOKENS.scale

/**
 * Map a velocity-zone id (WA's 5-band taxonomy) directly onto the 6-stop
 * `sequentialEffort` ramp. The default strip uses the 4-color {@link VEL_COLORS}
 * scale (a subsample of the same ramp), but the 5-band taxonomy has one more
 * level than that scale carries, so it samples 5 stops: the top four align with
 * the default scale (speed/power/strengthSpeed/maximalStrength = green/gold/
 * orange/red) and `grinding` takes the ramp's darker red. `maximalStrength` and
 * `grinding` therefore stay DISTINCT — they no longer collapse onto one red for
 * lack of a 5th hue. An exercise moving from default to profile-derived zones
 * never shifts its fast-end colors.
 *
 * Unknown ids fall back to `green` (matching the historical default-path
 * fallback), so a forward-compatible band id never renders an empty bar.
 */
const bandIdToEffortColor: Record<string, string> = {
  speed: sequentialEffort[0], // green-300
  power: sequentialEffort[2], // amber-300 (gold)
  strengthSpeed: sequentialEffort[3], // orange-400
  maximalStrength: sequentialEffort[4], // red-600
  grinding: sequentialEffort[5], // red-700 — the distinct 5th band
}

// --- Default (no-zones) scale ------------------------------------------------
// Retained as named exports for back-compat; they define the default path.

export function getVelocityZoneColor(velocity: number): string {
  if (velocity >= 1.0) return 'vel-green'
  if (velocity >= 0.75) return 'vel-yellow'
  if (velocity >= 0.5) return 'vel-orange'
  return 'vel-red'
}

export function getVelocityZoneName(velocity: number): string {
  if (velocity >= 1.0) return 'Speed'
  if (velocity >= 0.75) return 'Power'
  if (velocity >= 0.5) return 'Strength-Speed'
  return 'Strength'
}

const zoneHexMap: Record<string, string> = {
  'vel-green': VEL_COLORS.green,
  'vel-yellow': VEL_COLORS.yellow,
  'vel-orange': VEL_COLORS.orange,
  'vel-red': VEL_COLORS.red,
}

/**
 * Velocity loss for a set, as a whole percentage. Uses the running-best rep as
 * the reference (matching WA-02.05 / brain WA-D01): `(vBest − vLast) / vBest`,
 * clamped to ≥ 0 so a set that ends on its best rep reports 0 loss.
 */
export function calculateVelocityLoss(velocities: number[]): number {
  if (velocities.length < 2) return 0
  const best = Math.max(...velocities)
  if (best <= 0) return 0
  const last = velocities[velocities.length - 1]
  return Math.max(0, Math.round(((best - last) / best) * 100))
}

/** Arithmetic mean of the per-rep mean-concentric velocities. */
export function calculateMeanVelocity(velocities: number[]): number {
  if (velocities.length === 0) return 0
  const sum = velocities.reduce((acc, v) => acc + v, 0)
  return sum / velocities.length
}

/**
 * Velocity-loss band thresholds (loss %), the same VL10/VL20/VL30 coaching cues
 * FatigueMeter's default thresholds use — kept in sync so a `barColor="loss"`
 * strip and a fatigue hero's VL20/VL30 reference bands agree on where amber/red start.
 */
const VL_LOSS_THRESHOLDS: readonly [number, number, number] = [10, 20, 30]

/**
 * Map a per-rep velocity LOSS (%, from the set's own best — see {@link
 * velocityLossForRep}) onto the same green→gold→orange→red scale as the absolute
 * zone scale ({@link VEL_COLORS}), banded at the {@link VL_LOSS_THRESHOLDS}
 * VL10/VL20/VL30 cues. Past VL20 reads orange ("past VL20 = amber" in coaching
 * terms — this scale's amber/gold band is the yellow stop, orange is the VL20+
 * band), past VL30 reads red, so a fatiguing set reads green→red by LOSS
 * regardless of how slow its absolute velocity is.
 */
export function getVelocityLossColor(lossPct: number): string {
  const [t1, t2, t3] = VL_LOSS_THRESHOLDS
  if (lossPct < t1) return VEL_COLORS.green
  if (lossPct < t2) return VEL_COLORS.yellow
  if (lossPct < t3) return VEL_COLORS.orange
  return VEL_COLORS.red
}

/**
 * A single rep's velocity loss (%) relative to the set's own best rep, clamped to
 * ≥ 0 (a best-so-far rep, or a set with no positive best, reports 0 loss — green).
 * Rounded (matching {@link calculateVelocityLoss}'s convention) so a rep that is
 * arithmetically the set's best — or lands exactly on a VL threshold — doesn't drift
 * across a color-band boundary on floating-point noise (e.g. `1.0 − 0.9` ≈ `0.0999…998`).
 * Feeds `barColor="loss"` bar coloring; distinct from {@link calculateVelocityLoss},
 * which reports only the set's FINAL loss (last rep vs best) as a single summary number.
 */
function velocityLossForRep(velocity: number, best: number): number {
  if (best <= 0) return 0
  return Math.max(0, Math.round(((best - velocity) / best) * 100))
}

/** Classify a velocity into its band (slow → fast, min inclusive / max exclusive). */
function classifyBand(
  velocity: number,
  bands: readonly VelocityZoneBandProp[]
): VelocityZoneBandProp | undefined {
  for (const band of bands) {
    if (band.max === null || velocity < band.max) return band
  }
  return bands[bands.length - 1]
}

function bandColor(band: VelocityZoneBandProp): string {
  return bandIdToEffortColor[band.id] ?? VEL_COLORS.green
}

/**
 * The zone → bar-color resolver, single-sourced so every variant (and the dual
 * diverging sibling) colors reps identically: profile-derived `zones` map through
 * {@link bandColor}; the default (no-zones) path uses the built-in 4-color scale.
 * Color is ALWAYS the velocity zone — never the voltra side.
 */
function makeBarColorFor(zones?: readonly VelocityZoneBandProp[]): (v: number) => string {
  const hasZones = zones != null && zones.length > 0
  return (v: number): string =>
    hasZones ? bandColor(classifyBand(v, zones)!) : zoneHexMap[getVelocityZoneColor(v)]
}

function getLossStyle(loss: number): Record<string, string> | null {
  if (loss > 25) return { color: VEL_COLORS.red }
  if (loss > 20) return { color: VEL_COLORS.orange }
  return null
}

// --- Set-type slot model -----------------------------------------------------
// The strength-training set vocabulary (operator-approved in the Set Modalities
// exploration): one strip encoding for every per-rep set type. A set resolves to
// an ordered list of slots; the slot `kind` picks the color and `leadingGap`
// encodes the chunk pattern (rep gap vs the wide notch that splits drop sub-loads
// / myo clusters / cluster intra-rests). Set-LEVEL types (pyramid / superset /
// tempo) belong to the heading, not the strip.

/**
 * A structured strength-training set. Supply as {@link VelocityStripProps.set} to
 * render its set-type encoding; the done-velocity array (used for the mean / loss
 * / zone summary) is derived from the type's velocity fields.
 */
export type VelocitySet =
  /** Fixed reps at a fixed load: done reps colored + a grey todo remainder to `planned`. */
  | { type: 'straight'; velocities: number[]; planned?: number }
  /** Bounded reps: committed slots `0..floor`, then a cyan variable window `floor..max`. */
  | { type: 'range'; velocities: number[]; floor: number; max: number }
  /** As-many-reps-as-possible: done reps + a trailing cyan "continue" slot that never closes. */
  | { type: 'amrap'; velocities: number[]; target?: number }
  /** Load drops with no rest: each sub-load's reps, split by a WIDE notch gap. */
  | { type: 'drop'; subloads: number[][] }
  /** Rest-pause: an activation chunk + mini-clusters split by WIDE gaps; `open` adds a cyan continue. */
  | { type: 'myo'; activation: number[]; clusters: number[][]; open?: boolean }
  /** Fixed count broken by intra-set rests: reps grouped by `groupSize` with WIDE intra-rest gaps. */
  | { type: 'cluster'; velocities: number[]; groupSize: number; planned?: number }

/** One drawn cell of the strip. `kind` picks the color; `leadingGap` the spacing before it. */
interface VelocitySlot {
  kind: 'rep' | 'todo' | 'variable' | 'continue'
  velocity?: number
  leadingGap: number
}

/** Butted reps carry this gap; chunk boundaries carry {@link WIDE_GAP}. */
const REP_GAP = 2
/**
 * The between-group notch (drop sub-loads / myo clusters / cluster intra-rests): a
 * fixed 8px total gap that reads as a group break without dominating a narrow strip.
 * 4× the rep gap — enough to separate groups at session-rail scale AND wall scale
 * without the notch ballooning at large widths. In the mini variant the container's
 * 2px gap covers part of it, so per-slot margin adds the remaining 6px (2 + 6 = 8).
 */
const WIDE_GAP = 8

/** The done-velocity array a set contributes to the mean / loss / zone summary. */
function deriveDoneVelocities(set: VelocitySet): number[] {
  switch (set.type) {
    case 'drop':
      return set.subloads.flat()
    case 'myo':
      return [...set.activation, ...set.clusters.flat()]
    default:
      return set.velocities
  }
}

/** Flatten velocity chunks into rep slots, carving a WIDE gap before each chunk but the first. */
function chunkedRepSlots(chunks: number[][]): VelocitySlot[] {
  const slots: VelocitySlot[] = []
  chunks.forEach((chunk) => {
    chunk.forEach((velocity, ri) => {
      const first = slots.length === 0
      slots.push({ kind: 'rep', velocity, leadingGap: first ? 0 : ri === 0 ? WIDE_GAP : REP_GAP })
    })
  })
  return slots
}

/** Resolve a set to its ordered slot list — the exact vocabulary of the Set Modalities sheet. */
function buildSlots(set: VelocitySet): VelocitySlot[] {
  switch (set.type) {
    case 'straight': {
      const total = Math.max(set.velocities.length, set.planned ?? set.velocities.length)
      return Array.from({ length: total }, (_, i) => {
        const done = i < set.velocities.length
        return {
          kind: done ? 'rep' : 'todo',
          velocity: done ? set.velocities[i] : undefined,
          leadingGap: i === 0 ? 0 : REP_GAP,
        }
      })
    }
    case 'range': {
      const total = Math.max(set.max, set.velocities.length)
      return Array.from({ length: total }, (_, i) => {
        const kind: VelocitySlot['kind'] =
          i < set.velocities.length ? 'rep' : i < set.floor ? 'todo' : 'variable'
        return {
          kind,
          velocity: kind === 'rep' ? set.velocities[i] : undefined,
          leadingGap: i === 0 ? 0 : REP_GAP,
        }
      })
    }
    case 'amrap': {
      const reps = set.velocities.map<VelocitySlot>((velocity, i) => ({
        kind: 'rep',
        velocity,
        leadingGap: i === 0 ? 0 : REP_GAP,
      }))
      reps.push({ kind: 'continue', leadingGap: reps.length === 0 ? 0 : REP_GAP })
      return reps
    }
    case 'drop':
      return chunkedRepSlots(set.subloads)
    case 'myo': {
      const slots = chunkedRepSlots([set.activation, ...set.clusters])
      if (set.open) slots.push({ kind: 'continue', leadingGap: slots.length === 0 ? 0 : REP_GAP })
      return slots
    }
    case 'cluster': {
      const total = Math.max(set.velocities.length, set.planned ?? set.velocities.length)
      return Array.from({ length: total }, (_, i) => {
        const done = i < set.velocities.length
        const boundary = i > 0 && i % set.groupSize === 0
        return {
          kind: done ? 'rep' : 'todo',
          velocity: done ? set.velocities[i] : undefined,
          leadingGap: i === 0 ? 0 : boundary ? WIDE_GAP : REP_GAP,
        }
      })
    }
  }
}

/** A concise, set-type-aware summary for the strip's accessibility label. */
function setAccessibilityLabel(set: VelocitySet, repCount: number): string {
  switch (set.type) {
    case 'straight':
      return `Velocity strip, straight set, ${repCount} reps`
    case 'range':
      return `Velocity strip, rep-range set, floor ${set.floor} to ${set.max}, ${repCount} reps done`
    case 'amrap':
      return `Velocity strip, AMRAP set, ${repCount} reps and counting`
    case 'drop':
      return `Velocity strip, drop set, ${set.subloads.length} loads, ${repCount} reps`
    case 'myo':
      return `Velocity strip, myo-reps set, ${set.clusters.length} clusters${set.open ? ', open' : ''}, ${repCount} reps`
    case 'cluster':
      return `Velocity strip, cluster set, groups of ${set.groupSize}, ${repCount} reps`
  }
}

/** Default framed `expanded` chart height (px). */
const EXPANDED_HEIGHT = 60
/** Default `compact` (flat resting strip) height (px) — a THIN radius-2 pill row, the resting glance. */
const COMPACT_HEIGHT = 8

/** The dashed running-best reference line color (the lightest charcoal step). */
const HERO_REFERENCE_COLOR = primitiveColors.charcoal[0]

/**
 * A dashed running-best reference line spanning the plot width, absolutely positioned a
 * pixel `offset` from the given `anchor` edge. Shared by the single `hero` chart (anchored
 * to the baseline, `bottom`) and BOTH wings of the diverging dual chart (anchored to the
 * centre axis, `top`) so the three sites render one line treatment (charcoal-0, 1px dashed).
 * Presentation-only + non-interactive — the numeric best lives in each chart's container
 * accessibility label, so the line itself is hidden from the a11y tree.
 *
 * REUSE FOLLOW-UP: `Sparkline` hand-rolls the same dashed-line overlay (plus opacity, an
 * optional label, and a data-domain Y), and two lab specimens duplicate it again. A
 * top-level `ReferenceLine` overlay primitive unifying all of them is a scoped follow-up
 * (see the Workout README) — kept in-file here to keep the hero PR focused.
 */
function DashedReferenceLine({
  anchor,
  offset,
  testID,
}: {
  anchor: 'top' | 'bottom'
  offset: number
  testID: string
}) {
  const edge: ViewStyle = anchor === 'top' ? { top: offset } : { bottom: offset }
  return (
    <View
      accessibilityElementsHidden
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        borderTopWidth: 1,
        borderStyle: 'dashed',
        borderColor: HERO_REFERENCE_COLOR,
        pointerEvents: 'none',
        ...edge,
      }}
      testID={testID}
    />
  )
}

const BAND_LABEL_FONT = 'monospace'
/**
 * Below this plot height (px) the VL20/VL30 labels are DROPPED entirely (the dashed lines + washes
 * stay) rather than shrunk into an overlapping smear. Tuned so a 120px dual (≈41px plot/wing) and the
 * cramped mid-small range drop, while the accepted board scale (≈76px plot/wing) keeps its labels.
 */
const VL_LABEL_MIN_PLOT = 65
const VL_SEMANTIC = getSemanticColors('dark')

/**
 * Velocity-LOSS decision bands for the `hero` variant: the VL20 / VL30 coaching
 * cues (off the running best) drawn as absolutely-positioned bands + dashed
 * threshold lines BEHIND the bars, on the hero's own peak scale so a bar dropping
 * into the amber → red band reads as "these are your last effective reps". Shared
 * by the single hero, the diverging dual wings, and {@link VelocityHero}; render
 * it as the first child of the bottom-anchored plot container.
 *
 * `best` is the running-best velocity (the peak the loss is measured from);
 * `scaleDenom` / `plotHeight` are the hero chart's bar-scaling geometry — a
 * velocity `v` sits `(v / scaleDenom) * plotHeight` px up from the baseline,
 * matching {@link HeroVelocityChart}'s `barHeight`.
 */
export function VelocityLossBands({
  best,
  scaleDenom,
  plotHeight,
  flip = false,
}: {
  best: number
  scaleDenom: number
  plotHeight: number
  /** The parent plot is vertically mirrored (a `down` wing) — counter-flip the labels upright. */
  flip?: boolean
}) {
  if (best <= 0 || scaleDenom <= 0 || plotHeight <= 0) return null
  const yOf = (v: number): number => (v / scaleDenom) * plotHeight
  const vl20 = best * 0.8
  const vl30 = best * 0.7
  // The VL20 / VL30 lines sit ~0.09·plotHeight apart, so on a short chart their labels crowd. Scale
  // the label font to the plot height; below VL_LABEL_MIN_PLOT DROP the labels entirely (keep the
  // dashed lines + washes) rather than shrink them into an illegible smear.
  const vlFont = Math.round(Math.max(7, Math.min(9, plotHeight * 0.05)))
  const showLabels = plotHeight >= VL_LABEL_MIN_PLOT
  const band = (loV: number, hiV: number, color: string) => (
    <View
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: yOf(loV),
        height: Math.max(0, yOf(hiV) - yOf(loV)),
        backgroundColor: color,
      }}
    />
  )
  // The label sits ~90% along the threshold, with the dashed line breaking around it (a long segment
  // before + a short stub after) — near the quiet right end where a declining set has room. Below the
  // label threshold the line spans full width with no text.
  const threshold = (v: number, color: string, label: string) => (
    <View
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: yOf(v),
        // Collapse to zero height so the dashed border lands EXACTLY on `yOf(v)` — the
        // band edge — instead of floating up half a text-row (the label then centres on
        // the line, breaking it). Matches DashedReferenceLine's bare-border anchoring.
        height: 0,
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      <View style={{ flex: 9, borderTopWidth: 1, borderStyle: 'dashed', borderColor: color }} />
      {showLabels ? (
        <>
          <Text
            style={{
              marginHorizontal: 6,
              fontSize: vlFont,
              fontWeight: '800',
              fontFamily: BAND_LABEL_FONT,
              color,
              ...(flip ? { transform: [{ scaleY: -1 as number }] } : null),
            }}
          >
            {label}
          </Text>
          <View style={{ flex: 1, borderTopWidth: 1, borderStyle: 'dashed', borderColor: color }} />
        </>
      ) : null}
    </View>
  )
  return (
    <View
      accessibilityElementsHidden
      pointerEvents="none"
      style={{ position: 'absolute', left: 0, right: 0, bottom: 0, top: 0 }}
      testID="velocity-loss-bands"
    >
      {band(0, vl30, alpha(VL_SEMANTIC['status-error'], 0.09))}
      {band(vl30, vl20, alpha(VL_SEMANTIC['status-warning'], 0.08))}
      {threshold(vl20, alpha(VL_SEMANTIC['status-warning'], 0.75), 'VL 20%')}
      {threshold(vl30, alpha(VL_SEMANTIC['status-error'], 0.75), 'VL 30%')}
    </View>
  )
}

/**
 * The velocity hero's reference overlay, painted by {@link SetBarChart} via `renderReference` from
 * the chart geometry: the VL20 / VL30 loss decision bands (when `showLossBands`) behind the bars,
 * plus the dashed running-best line at the peak. Both measure off the chart's OWN `best` — the
 * per-side loss language that survives the dual's shared height scale. Unlabeled by design (the peak
 * bar already shows its value; the numeric best is in the chart's accessibility label).
 */
function velocityReferenceOverlay(g: SetBarGeometry, showLossBands: boolean) {
  const referencePx = g.best > 0 && g.scaleDenom > 0 ? Math.min(g.plotHeight, g.yOf(g.best)) : 0
  return (
    <>
      {showLossBands && (
        <VelocityLossBands
          best={g.best}
          scaleDenom={g.scaleDenom}
          plotHeight={g.plotHeight}
          flip={g.flip}
        />
      )}
      {referencePx > 0 && (
        <DashedReferenceLine
          anchor="bottom"
          offset={referencePx}
          testID="velocity-hero-reference"
        />
      )}
    </>
  )
}

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
}

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
   * gutter + axis. `rail` — the compact rail-expanded lean renderer, no labels / reference lines.
   */
  variant?: 'hero' | 'compact' | 'rail'
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
const RAIL_RADIUS = 2
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
        <View accessibilityElementsHidden testID="dual-velocity-wing-up">
          {wing('up', aligned.left, leftDone)}
        </View>
        <View accessibilityElementsHidden testID="dual-velocity-wing-down">
          {wing('down', aligned.right, rightDone)}
        </View>
      </View>
    </View>
  )
}

/**
 * The `rail` diverging chart — a lean, compact dedicated renderer. Composing the hero here would
 * drag in its value labels, reference lines, paper, and label headroom, none of which belong at
 * rail scale; instead it draws mirrored per-side bars at the compact rail metrics. Same shared
 * height scale + per-side loss coloring + mirrored radius + shared axis as the hero, but no labels
 * / reference lines / paper. (Set-type slot windows are a hero-composition concern; rail only ever
 * takes plain velocities.)
 */
function DualVelocityRail({
  leftDone,
  rightDone,
  leftStream,
  rightStream,
  zones,
  barColor,
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
      <View accessibilityElementsHidden testID="dual-velocity-wing-up">
        {wing('up', aligned.left, leftDone)}
      </View>
      <View accessibilityElementsHidden testID="dual-velocity-wing-down">
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
  targetReps,
  height,
  className,
  label,
  viewProps,
}: DualChartProps) {
  // Each side is a fixed-height rounded sub-segment (a little pill), stacked above/below the fold gap.
  const half = COMPACT_FOLD_HALF
  const zoneColorFor = makeBarColorFor(zones)
  const bestL = Math.max(...leftDone, 0)
  const bestR = Math.max(...rightDone, 0)
  const colorFor = (v: number, best: number): string =>
    barColor === 'loss' ? getVelocityLossColor(velocityLossForRep(v, best)) : zoneColorFor(v)
  const emptyColor = useOnSurfaceColor('tertiary')
  // The SAME index-locked structure the hero and rail build, so compact carries the set-type
  // vocabulary (to-do remainder, the range variable window, the AMRAP continue window, drop
  // chunk-notch gaps) and aligns a lagging side's un-logged reps as empties under their partner.
  // The previous `railSlots` flattened both sides to bare velocities, which dropped every window
  // and let each side compute its own column count.
  const aligned = alignDualSlots(
    leftStream ? streamNaturalSlots(leftStream, targetReps) : [],
    rightStream ? streamNaturalSlots(rightStream, targetReps) : []
  )
  const slotsL = aligned.left
  const slotsR = aligned.right
  const columns = Math.max(slotsL.length, slotsR.length)
  // Measure the plot so the columns land at the SAME widths + gaps as the single chart (one shared
  // geometry via computeBarLayout) — width 0 (unmeasured) falls back to the layout's own default.
  const [plotW, setPlotW] = useState(0)
  const { gap } = computeBarLayout(plotW, columns)
  const { style: externalStyle, ...restProps } = viewProps

  const foldHalf = (slot: SetSlot | undefined, best: number, testID: string) => {
    // Each sub-segment is a self-contained rounded pill (all corners), not a shared top/bottom cap.
    const radius = { borderRadius: RAIL_RADIUS }
    const v = slot?.value

    // A logged rep: solid, coloured by this side's own loss/zone.
    if (slot?.kind === 'rep' && v != null) {
      return (
        <View
          style={{ height: half, backgroundColor: colorFor(v, best), ...radius }}
          testID={testID}
        />
      )
    }

    // The planned remainder — a solid muted pill, matching the single compact's to-do treatment.
    if (slot?.kind === 'todo') {
      return (
        <View
          style={{ height: half, backgroundColor: emptyColor, opacity: 0.55, ...radius }}
          testID={`${testID}-todo`}
        />
      )
    }

    // The REPEATABLE windows — a range's variable band and an AMRAP/myo "continue" tail. Same CYAN
    // vocabulary as the single (variable fills, continue outlines) so the two views name the same
    // thing the same way; only the scale differs.
    if (slot?.kind === 'variable') {
      return (
        <View
          style={{ height: half, backgroundColor: VARIABLE_FILL, ...radius }}
          testID={`${testID}-variable`}
        />
      )
    }
    if (slot?.kind === 'continue') {
      return (
        <View
          style={{ height: half, borderWidth: 1, borderColor: CONTINUE_OUTLINE, ...radius }}
          testID={`${testID}-continue`}
        />
      )
    }

    // An index-locked gap: this side has not logged the column its partner has. Fainter than a
    // to-do — a rep that is MISSING, not one that is merely planned.
    return (
      <View
        style={{ height: half, backgroundColor: emptyColor, opacity: 0.28, ...radius }}
        testID={`${testID}-empty`}
      />
    )
  }

  return (
    <View
      className={className}
      style={[{ height, flexDirection: 'row', gap, alignItems: 'stretch' }, externalStyle]}
      accessibilityRole="image"
      accessibilityLabel={label}
      testID="dual-velocity-strip"
      onLayout={(e: LayoutChangeEvent) => setPlotW(e.nativeEvent.layout.width)}
      {...restProps}
    >
      {Array.from({ length: columns }, (_, i) => (
        <View
          key={i}
          accessibilityElementsHidden
          style={{ flex: 1, maxWidth: BAR_MAX_WIDTH, gap: COMPACT_FOLD_GAP }}
        >
          {foldHalf(slotsL[i], bestL, `dual-velocity-bar-L-${i}`)}
          {foldHalf(slotsR[i], bestR, `dual-velocity-bar-R-${i}`)}
        </View>
      ))}
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
  targetReps,
  liveRepIndex,
  variant = 'hero',
  scale = 'peak',
  height,
  className,
  ...props
}: DualVelocityStripProps) {
  const resolvedHeight =
    height ??
    (variant === 'hero'
      ? DUAL_HERO_HEIGHT
      : variant === 'compact'
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
    scale,
    targetReps,
    height: resolvedHeight,
    className,
    label,
    viewProps: props,
  }

  // `liveRepIndex` reaches the rail too: its wings are composed strips, so the newest rep grows
  // from the midline on BOTH sides. Compact is flat, so a grow animation has nothing to animate.
  if (variant === 'rail') return <DualVelocityRail {...shared} liveRepIndex={liveRepIndex} />
  if (variant === 'compact') return <DualVelocityCompactStrip {...shared} />
  return <DualVelocityHero {...shared} liveRepIndex={liveRepIndex} />
}

export function VelocityStrip({
  velocities,
  set,
  zones,
  barColor = 'loss',
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
  // A `set` descriptor derives its own done-velocity array; the legacy
  // `velocities` path stays the source of truth otherwise. Every summary calc
  // (mean / loss / zone) runs on this one array so the info row works either way.
  const doneVelocities = set ? deriveDoneVelocities(set) : (velocities ?? [])

  const maxVelocity = Math.max(...doneVelocities, 0)
  const meanVelocity = calculateMeanVelocity(doneVelocities)
  const loss = calculateVelocityLoss(doneVelocities)

  // The framed chart (raised box, labels, info) vs the bare spotlight strip is the
  // only fork in the `expanded` variant — keyed by whether any chrome is requested.
  const framed = showNumbers || showInfo

  const hasZones = zones != null && zones.length > 0
  // Single-sourced zone resolver (diverging-hero) wrapped with the loss-relative mode: `barColor="loss"`
  // colors each rep by its velocity loss from the set's own best, else the shared zone scale. Every
  // variant hands this `colorFor` to SetBarChart, so all variants color identically.
  const zoneColorFor = makeBarColorFor(zones)
  const barColorFor = (v: number): string =>
    barColor === 'loss' ? getVelocityLossColor(velocityLossForRep(v, maxVelocity)) : zoneColorFor(v)
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
        renderReference={(g) => velocityReferenceOverlay(g, lossBandsOn)}
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
      style={{ width: '100%', borderRadius: 6, paddingTop: 16, paddingBottom: showInfo ? 8 : 4 }}
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
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            opacity: infoOpacity,
            marginTop: 6,
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
            style={{ fontSize: 10, fontFamily: 'Inter, sans-serif', ...getLossStyle(loss) }}
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
