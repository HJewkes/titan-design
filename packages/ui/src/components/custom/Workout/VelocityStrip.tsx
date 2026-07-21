// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { useEffect, useState } from 'react'
import {
  View,
  Text,
  Pressable,
  Animated,
  Easing,
  type ViewProps,
  type ViewStyle,
  type LayoutChangeEvent,
} from 'react-native'
import { WORKOUT_TOKENS } from '../../../theme/workout-tokens'
import { primitiveColors, primitiveRamps, sequentialEffort } from '../../../theme/tokens/primitives'
import { formatVelocity } from '../../../utils/workout-format'
import { SET_STRIP_VARIABLE_COLOR } from './SetStrip'

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
   * Live mode: index of the most-recently-completed rep. That bar animates in
   * with a "pop"; if it is also the current set peak (a new best), it "bounces"
   * instead. Only the latest bar animates. Honors `prefers-reduced-motion`.
   * Framed `expanded` chart only (interactive tap-to-expand use).
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
   * `mini` — a flat 3px static strip (set-type aware). `expanded` — the velocity-
   * HEIGHT bar chart (rounded tops), whose chrome is prop-driven: with
   * {@link showNumbers} or {@link showInfo} on it's the framed chart (raised surface,
   * padding, per-bar m/s labels, mean/loss info row, interactive collapse); with both
   * off it's a bare strip — the active-set "spotlight" of {@link ExerciseCard}. `hero`
   * — the across-the-room, single-set wall treatment: tall bars, a per-bar m/s value
   * label, a dashed running-best reference line, and dashed placeholders for the reps
   * still to come (see {@link targetReps}). Reuses the zone scale and the live-rep pop.
   */
  variant?: 'mini' | 'expanded' | 'hero'
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

/** Grey fill for planned-but-unperformed reps (charcoal placeholder, literal hex). */
const TODO_COLOR = primitiveColors.charcoal[300]
/** The thin cyan-800 outline on the open-ended "continue" slot — reads as "keep going". */
const CONTINUE_OUTLINE = primitiveRamps.cyan[800]

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

/** Per-slot accessibility label for the expanded set-type bars. */
function slotAccessibilityLabel(slot: VelocitySlot, index: number): string {
  switch (slot.kind) {
    case 'rep':
      return `Rep ${index + 1}: ${formatVelocity(slot.velocity ?? 0)} meters per second`
    case 'todo':
      return `Rep ${index + 1}: planned`
    case 'variable':
      return `Rep ${index + 1}: variable`
    case 'continue':
      return 'Keep going'
  }
}

/** Straight-set expanded stub height for a planned (todo) rep, as a % of the plot. */
const EXPANDED_TODO_STUB_PCT = 16
/** Expanded height for advanced set-types (drop / myo / cluster / range / amrap): a short mini-style bar. */
const EXPANDED_ENCODED_PCT = 45

/** Default framed `expanded` chart height (px). */
const EXPANDED_HEIGHT = 60
/**
 * The `scale="fixed"` velocity ceiling (m/s). `peak` scales to the set's own max
 * (+15% headroom); `fixed` uses this constant so a bar's height reads the same
 * absolute velocity across sets (the spotlight).
 */
const FIXED_MAX_VELOCITY = 1.15
/** Minimum bare-strip bar height (px) — a planned / variable / continue stub, or a near-zero rep. */
const BARE_STUB_HEIGHT = 3

// --- Hero variant ------------------------------------------------------------
// The across-the-room, single-set wall treatment. Absorbs the R2 "HeroVelocityBars"
// candidate into VelocityStrip: tall bars + per-bar value labels + a dashed
// running-best reference line + dashed placeholders for the reps still to come.

/** Default `hero` plot height (px) — tall enough to read a set's velocity shape across a room. */
const HERO_HEIGHT = 220
/** Vertical band reserved above the tallest bar for its value label (px). */
const HERO_LABEL_HEADROOM = 20
/** Gap between hero bars (px) — a group-notch-free even rhythm at wall scale. */
const HERO_BAR_GAP = 8
/** Cap on a single hero bar's width so a 2–3 rep set doesn't render slab-wide bars (px). */
const HERO_BAR_MAX_WIDTH = 120
/** Below this per-bar width the value labels collide, so all but the peak + live rep are dropped. */
const HERO_LABEL_MIN_BAR_WIDTH = 30
/** Top-corner radius on hero bars (px). */
const HERO_BAR_RADIUS = 5
/** Minimum drawn height of a performed hero bar (px) — a near-zero rep still reads as a rep. */
const HERO_MIN_BAR_HEIGHT = 4
/** Dashed-stub border for a planned-but-unperformed hero rep (charcoal, reads on a dark wall). */
const HERO_PENDING_COLOR = primitiveColors.charcoal[100]
/** The dashed running-best reference line + its label (the lightest charcoal step). */
const HERO_REFERENCE_COLOR = primitiveColors.charcoal[0]

/**
 * Headroom above the peak bar: just enough to seat its value label without a big empty
 * band at the top (was 1.15 — too airy for the wall hero).
 */
const PEAK_HEADROOM = 1.06

/** The bar-height scaling denominator for the given `scale` (guarded ≥ 0 by callers). */
function scaleDenominator(scale: 'peak' | 'fixed', maxVelocity: number): number {
  return scale === 'fixed' ? FIXED_MAX_VELOCITY : maxVelocity * PEAK_HEADROOM
}

/** Bare-strip bar height (px): velocity-scaled for a performed rep, a short stub otherwise. */
function bareSlotHeight(slot: VelocitySlot, height: number, denom: number): number {
  if (slot.kind !== 'rep' || denom <= 0) return BARE_STUB_HEIGHT
  const ratio = Math.min(1, (slot.velocity ?? 0) / denom)
  return Math.max(BARE_STUB_HEIGHT, ratio * height)
}

function getReducedMotionPreference(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Track the OS "reduce motion" preference; falls back to `false` (jsdom/SSR). */
function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(getReducedMotionPreference)
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handler = () => setReduced(mq.matches)
    handler()
    mq.addEventListener?.('change', handler)
    return () => mq.removeEventListener?.('change', handler)
  }, [])
  return reduced
}

const ANIMATION_DURATION = 400
const ANIMATION_EASING = Easing.bezier(0.22, 1, 0.36, 1)
const POP_EASING = Easing.bezier(0.34, 1.56, 0.64, 1)

/**
 * The newest-rep entrance shared by the framed `expanded` chart and `hero`: a
 * bounce when the rep is a new set peak, a pop otherwise. Honors reduced motion.
 * Returns the scale `Animated.Value` for the live bar; inert while `active` is
 * false or no live rep is present.
 */
function useLiveRepPop(
  active: boolean,
  liveRepIndex: number | undefined,
  liveVelocity: number | undefined,
  isNewPeak: boolean
): Animated.Value {
  const prefersReducedMotion = usePrefersReducedMotion()
  const [liveScale] = useState(() => new Animated.Value(1))
  useEffect(() => {
    if (!active || liveRepIndex == null || liveVelocity == null) return
    if (prefersReducedMotion) {
      liveScale.setValue(1)
      return
    }
    if (isNewPeak) {
      liveScale.setValue(1)
      Animated.sequence([
        Animated.timing(liveScale, {
          toValue: 1.25,
          duration: 150,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.spring(liveScale, {
          toValue: 1,
          friction: 3,
          tension: 140,
          useNativeDriver: true,
        }),
      ]).start()
    } else {
      liveScale.setValue(0.8)
      Animated.timing(liveScale, {
        toValue: 1,
        duration: 300,
        easing: POP_EASING,
        useNativeDriver: true,
      }).start()
    }
  }, [active, liveRepIndex, liveVelocity, isNewPeak, prefersReducedMotion, liveScale])
  return liveScale
}

interface HeroVelocityChartProps {
  /** Performed per-rep mean concentric velocities (m/s). */
  doneVelocities: number[]
  /** Zone → color resolver, shared with the other variants (single-sources the scale). */
  barColorFor: (velocity: number) => string
  /** Bar-height scaling denominator (`peak` set-max or `fixed` ceiling). */
  scaleDenom: number
  /** Running-best velocity (the set peak) — drives the dashed reference line. */
  referenceVelocity: number
  liveRepIndex?: number
  isNewPeak: boolean
  targetReps?: number
  height: number
  className?: string
  viewProps: ViewProps
}

/**
 * The `hero` render: the across-the-room, single-set wall treatment. Tall bars +
 * a per-bar value label + a dashed running-best reference line + dashed placeholders
 * for the reps still to come. Reuses {@link barColorFor} (zone scale) and the
 * {@link useLiveRepPop} entrance so it stays consistent with the framed chart.
 */
function HeroVelocityChart({
  doneVelocities,
  barColorFor,
  scaleDenom,
  referenceVelocity,
  liveRepIndex,
  isNewPeak,
  targetReps,
  height,
  className,
  viewProps,
}: HeroVelocityChartProps) {
  const liveVelocity = liveRepIndex != null ? doneVelocities[liveRepIndex] : undefined
  const liveScale = useLiveRepPop(true, liveRepIndex, liveVelocity, isNewPeak)

  // Measure the plot so per-bar value labels can thin on a narrow chart (they collide once
  // bars get thin). Width 0 (unmeasured) → show all, so test/server renders are unchanged.
  const [plotW, setPlotW] = useState(0)
  const onPlotLayout = (e: LayoutChangeEvent) => setPlotW(e.nativeEvent.layout.width)

  // Reserve a band above the tallest bar for its value label so a peak bar never clips.
  const plotHeight = Math.max(0, height - HERO_LABEL_HEADROOM)
  const barHeight = (velocity: number): number =>
    scaleDenom > 0
      ? Math.max(HERO_MIN_BAR_HEIGHT, Math.min(1, velocity / scaleDenom) * plotHeight)
      : HERO_MIN_BAR_HEIGHT

  const pendingCount = Math.max(0, (targetReps ?? 0) - doneVelocities.length)
  const referencePx =
    referenceVelocity > 0 && scaleDenom > 0
      ? Math.min(plotHeight, (referenceVelocity / scaleDenom) * plotHeight)
      : 0

  // When bars get too thin, keep only the peak + live-rep labels so the rest don't overlap.
  const totalSlots = doneVelocities.length + pendingCount
  const barWidth =
    plotW > 0 && totalSlots > 0
      ? Math.min(HERO_BAR_MAX_WIDTH, (plotW - HERO_BAR_GAP * (totalSlots - 1)) / totalSlots)
      : HERO_BAR_MAX_WIDTH
  const labelsCrowded = plotW > 0 && barWidth < HERO_LABEL_MIN_BAR_WIDTH
  // Step the inter-bar gap down with the bars so the gaps never dwarf the bars themselves.
  const heroGap =
    plotW === 0 ? HERO_BAR_GAP : barWidth < 16 ? 2 : barWidth < 28 ? 4 : HERO_BAR_GAP
  const peakIndex = doneVelocities.reduce(
    (best, v, i) => (v > doneVelocities[best] ? i : best),
    0,
  )
  const showBarLabel = (i: number): boolean =>
    !labelsCrowded || i === peakIndex || i === liveRepIndex

  const repCount = doneVelocities.length
  const total = Math.max(repCount, targetReps ?? repCount)
  const label =
    referenceVelocity > 0
      ? `Velocity chart, ${repCount} of ${total} reps, best ${formatVelocity(referenceVelocity)} meters per second`
      : `Velocity chart, ${repCount} of ${total} reps`

  const { style: externalStyle, ...restProps } = viewProps

  return (
    <View
      className={className}
      style={[{ height }, externalStyle]}
      accessibilityRole="image"
      accessibilityLabel={label}
      testID="velocity-strip-hero"
      {...restProps}
    >
      <View
        onLayout={onPlotLayout}
        style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'flex-end',
          gap: heroGap,
          position: 'relative',
          borderBottomWidth: 2,
          borderBottomColor: HERO_PENDING_COLOR,
        }}
      >
        {/*
         * Running-best reference line. Deliberately unlabeled: it sits at the tallest
         * bar's top, and that bar already displays its velocity as its own value label,
         * so a "best X.XX" tag would duplicate it — and would collide with that label
         * whenever the peak bar is on the same side (declines peak-left, ends-on-best
         * peak-right). The line alone reads as "how far has velocity fallen from best".
         * The numeric best is in the container's accessibility label.
         */}
        {referencePx > 0 && (
          <View
            accessibilityElementsHidden
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: referencePx,
              borderTopWidth: 1,
              borderStyle: 'dashed',
              borderColor: HERO_REFERENCE_COLOR,
              pointerEvents: 'none',
            }}
            testID="velocity-hero-reference"
          />
        )}

        {doneVelocities.map((velocity, i) => {
          const isLive = liveRepIndex === i
          return (
            <View
              key={i}
              accessibilityElementsHidden
              style={{
                flex: 1,
                maxWidth: HERO_BAR_MAX_WIDTH,
                height: '100%',
                alignItems: 'center',
                justifyContent: 'flex-end',
              }}
            >
              {showBarLabel(i) && (
                <Text
                  className="text-text-primary"
                  style={{ fontSize: 12, fontWeight: '800', marginBottom: 4 }}
                  testID={`velocity-label-${i}`}
                >
                  {formatVelocity(velocity)}
                </Text>
              )}
              <Animated.View
                style={[
                  {
                    width: '100%',
                    height: barHeight(velocity),
                    borderTopLeftRadius: HERO_BAR_RADIUS,
                    borderTopRightRadius: HERO_BAR_RADIUS,
                    backgroundColor: barColorFor(velocity),
                  },
                  isLive ? { transform: [{ scale: liveScale }] } : null,
                ]}
                testID={`velocity-bar-${i}`}
              />
            </View>
          )
        })}

        {Array.from({ length: pendingCount }, (_, i) => (
          <View
            key={`pending-${i}`}
            accessibilityElementsHidden
            style={{
              flex: 1,
              maxWidth: HERO_BAR_MAX_WIDTH,
              height: '100%',
              alignItems: 'center',
              justifyContent: 'flex-end',
            }}
          >
            <View
              style={{
                width: '100%',
                height: HERO_MIN_BAR_HEIGHT * 3,
                borderWidth: 1,
                borderStyle: 'dashed',
                borderColor: HERO_PENDING_COLOR,
                borderTopLeftRadius: HERO_BAR_RADIUS,
                borderTopRightRadius: HERO_BAR_RADIUS,
              }}
              testID="velocity-slot-todo"
            />
          </View>
        ))}
      </View>
    </View>
  )
}

// --- Dual (bilateral) diverging chart ----------------------------------------
// The two-device (LEFT + RIGHT voltra) treatment. Instead of two stacked single
// heroes with independent baselines, ONE diverging chart shares a horizontal centre
// axis: LEFT reps grow UP, RIGHT reps grow DOWN, one mirrored pair per rep index. The
// asymmetry (left-dominant / right-lagging) reads pre-attentively as the silhouette.
// It reuses VelocityStrip's slot model ({@link buildSlots}/{@link VelocitySlot}), its
// zone color scale ({@link makeBarColorFor}), the hero geometry constants, and the
// live-rep entrance ({@link useLiveRepPop}) — side is POSITION only, never hue.

/** One voltra's velocity stream — the SAME shape VelocityStrip accepts (one of these). */
export interface DualVelocityStream {
  /** Per-rep MEAN concentric velocity (m/s) for this side. */
  velocities?: number[]
  /** A structured set descriptor for this side (drives the typed slot vocabulary). */
  set?: VelocitySet
}

export interface DualVelocityStripProps extends ViewProps {
  /** LEFT voltra stream — drawn growing UP from the centre axis. */
  left: DualVelocityStream
  /** RIGHT voltra stream — drawn growing DOWN from the centre axis. */
  right: DualVelocityStream
  /**
   * Optional velocity-zone bands (shape-compatible with WA's `VelocityZones.bands`),
   * shared with {@link VelocityStrip}. Colors the reps by zone on BOTH sides; side is
   * never encoded by hue. When omitted the built-in default scale is used.
   */
  zones?: readonly VelocityZoneBandProp[]
  /**
   * Planned rep count. Reps beyond a side's performed count draw as mirrored dashed
   * todo stubs (same "3 of 8 done" read as the single hero), on both wings.
   */
  targetReps?: number
  /** Index of the most-recently-completed rep; that mirrored pair animates in (hero only). */
  liveRepIndex?: number
  /**
   * `hero` — the across-the-room wall scale: tall wings, per-rep m/s value labels, and
   * a dashed running-best reference line per side. `rail` — the compact rail-expanded
   * scale: the same diverging form, no labels / reference lines.
   */
  variant?: 'hero' | 'rail'
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

// Bars fill the full column width (barPct '100%'); the ONLY inter-bar whitespace is the
// column `gap`, exactly like the single VelocityStrip hero — so a dual chart's rep columns
// sit at the same density as a single one (only the up/down mirroring differs).
/** Scale-dependent chrome for the diverging chart, reusing the hero geometry constants. */
const DIVERGING_CHROME = {
  hero: {
    gap: HERO_BAR_GAP,
    maxCol: HERO_BAR_MAX_WIDTH,
    labelBand: HERO_LABEL_HEADROOM,
    radius: HERO_BAR_RADIUS,
    minBar: HERO_MIN_BAR_HEIGHT,
    barPct: '100%',
    showValues: true,
    showReference: true,
  },
  rail: {
    gap: 3,
    maxCol: 26,
    labelBand: 0,
    radius: 2,
    minBar: 3,
    barPct: '100%',
    showValues: false,
    showReference: false,
  },
} as const

/** Default `hero` diverging height (px) — matches the single hero. */
const DUAL_HERO_HEIGHT = HERO_HEIGHT
/** Default `rail` diverging height (px) — compact enough to sit inside a rail slot. */
const DUAL_RAIL_HEIGHT = 96

/** Resolve one side's stream to its done-velocity array + typed slot list (reusing buildSlots). */
function resolveStream(
  stream: DualVelocityStream,
  targetReps?: number
): { done: number[]; slots: VelocitySlot[] } {
  if (stream.set) {
    return { done: deriveDoneVelocities(stream.set), slots: buildSlots(stream.set) }
  }
  const done = stream.velocities ?? []
  if (targetReps != null && targetReps > done.length) {
    // Synthesize a straight set so the unperformed remainder renders as todo stubs.
    return { done, slots: buildSlots({ type: 'straight', velocities: done, planned: targetReps }) }
  }
  const slots = done.map<VelocitySlot>((v, i) => ({
    kind: 'rep',
    velocity: v,
    leadingGap: i === 0 ? 0 : REP_GAP,
  }))
  return { done, slots }
}

/** Round only the away-from-axis end of a wing bar (top for the up wing, bottom for down). */
function wingRadius(grow: 'up' | 'down', radius: number): ViewStyle {
  return grow === 'up'
    ? { borderTopLeftRadius: radius, borderTopRightRadius: radius }
    : { borderBottomLeftRadius: radius, borderBottomRightRadius: radius }
}

type DivergingChrome = (typeof DIVERGING_CHROME)[keyof typeof DIVERGING_CHROME]

interface WingBarProps {
  slot: VelocitySlot
  grow: 'up' | 'down'
  c: DivergingChrome
  color: string
  barPx: number
  liveScale: Animated.Value
  isLive: boolean
  testID: string
}

/**
 * One slot's bar for a wing: a filled zone-colored bar for a performed rep (the live
 * rep carries the pop), a dashed charcoal stub for a planned `todo` rep, a solid cyan
 * stub for a range's `variable` window, and a dashed cyan outline for the open `continue`.
 * Rounded only on the away-from-axis end so the mirrored pair meets cleanly at the axis.
 */
function WingBar({ slot, grow, c, color, barPx, liveScale, isLive, testID }: WingBarProps) {
  const r = wingRadius(grow, c.radius)
  const stub = c.minBar * 2
  if (slot.kind === 'todo') {
    return (
      <View
        style={{ width: c.barPct, height: stub, borderWidth: 1, borderStyle: 'dashed', borderColor: HERO_PENDING_COLOR, ...r }}
        testID={`${testID}-todo`}
      />
    )
  }
  if (slot.kind === 'variable') {
    return (
      <View
        style={{ width: c.barPct, height: stub, backgroundColor: SET_STRIP_VARIABLE_COLOR, ...r }}
        testID={`${testID}-variable`}
      />
    )
  }
  if (slot.kind === 'continue') {
    return (
      <View
        style={{ width: c.barPct, height: stub, borderWidth: 1, borderStyle: 'dashed', borderColor: CONTINUE_OUTLINE, ...r }}
        testID={`${testID}-continue`}
      />
    )
  }
  const barStyle: ViewStyle = { width: c.barPct, height: barPx, backgroundColor: color, ...r }
  return isLive ? (
    <Animated.View style={[barStyle, { transform: [{ scale: liveScale }] }]} testID={testID} />
  ) : (
    <View style={barStyle} testID={testID} />
  )
}

/**
 * The vertical voltra-name rail down the chart's left edge — the same rotated-label
 * treatment the single dual live view uses, split into an upper (LEFT, over the up
 * wing) and lower (RIGHT, over the down wing) half so the side reads without any tag
 * overlapping the bars near the axis. `rail` scale shrinks to a single-letter gutter.
 */
function DivergingSideRail({ plotHalf, variant }: { plotHalf: number; variant: 'hero' | 'rail' }) {
  if (variant === 'rail') {
    return (
      <View style={{ width: 14 }} accessibilityElementsHidden>
        <View style={{ height: plotHalf, alignItems: 'center', justifyContent: 'center' }}>
          <Text className="text-text-tertiary" style={{ fontSize: 9, fontWeight: '800', letterSpacing: 0.5 }}>
            L
          </Text>
        </View>
        <View style={{ height: plotHalf, alignItems: 'center', justifyContent: 'center' }}>
          <Text className="text-text-tertiary" style={{ fontSize: 9, fontWeight: '800', letterSpacing: 0.5 }}>
            R
          </Text>
        </View>
      </View>
    )
  }
  // Fixed-width holds the full rotated label so it doesn't clip to the strip before rotation.
  const rotated = {
    width: 150,
    textAlign: 'center' as const,
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 3,
    transform: [{ rotate: '-90deg' }],
  }
  return (
    <View className="border-border" style={{ width: 34, borderRightWidth: 1 }} accessibilityElementsHidden>
      <View style={{ height: plotHalf, alignItems: 'center', justifyContent: 'center' }}>
        <Text className="text-text-tertiary" style={rotated}>
          LEFT VOLTRA
        </Text>
      </View>
      <View style={{ height: plotHalf, alignItems: 'center', justifyContent: 'center' }}>
        <Text className="text-text-tertiary" style={rotated}>
          RIGHT VOLTRA
        </Text>
      </View>
    </View>
  )
}

/**
 * The dual-voltra (bilateral) DIVERGING per-rep velocity chart. LEFT reps grow UP,
 * RIGHT reps grow DOWN from one shared centre axis; one mirrored pair per rep index.
 * Reuses VelocityStrip's slot vocabulary, zone colors, hero geometry, and live-rep pop.
 * Single-voltra sets keep using {@link VelocityStrip} (`variant="hero"`) — unchanged.
 */
export function DualVelocityStrip({
  left,
  right,
  zones,
  targetReps,
  liveRepIndex,
  variant = 'hero',
  scale = 'peak',
  height,
  className,
  ...props
}: DualVelocityStripProps) {
  const c = DIVERGING_CHROME[variant]
  const resolvedHeight = height ?? (variant === 'hero' ? DUAL_HERO_HEIGHT : DUAL_RAIL_HEIGHT)
  const L = resolveStream(left, targetReps)
  const R = resolveStream(right, targetReps)
  const barColorFor = makeBarColorFor(zones)

  // ONE shared scale across both wings so the L/R asymmetry reads as length, not two scales.
  const maxVelocity = Math.max(...L.done, ...R.done, 0)
  const scaleDenom = scaleDenominator(scale, maxVelocity)
  const bestL = Math.max(...L.done, 0)
  const bestR = Math.max(...R.done, 0)

  // Live-rep entrance on the newest mirrored pair (one Animated.Value per side).
  const liveVelL = liveRepIndex != null ? L.done[liveRepIndex] : undefined
  const liveVelR = liveRepIndex != null ? R.done[liveRepIndex] : undefined
  const isNewPeakL = liveVelL != null && bestL > 0 && liveVelL === bestL
  const isNewPeakR = liveVelR != null && bestR > 0 && liveVelR === bestR
  const liveScaleL = useLiveRepPop(variant === 'hero', liveRepIndex, liveVelL, isNewPeakL)
  const liveScaleR = useLiveRepPop(variant === 'hero', liveRepIndex, liveVelR, isNewPeakR)

  const [plotW, setPlotW] = useState(0)
  const onPlotLayout = (e: LayoutChangeEvent) => setPlotW(e.nativeEvent.layout.width)

  const plotHalf = resolvedHeight / 2
  const maxBar = Math.max(0, plotHalf - c.labelBand)
  const barPx = (velocity: number | undefined): number =>
    velocity == null || scaleDenom <= 0
      ? c.minBar
      : Math.max(c.minBar, Math.min(1, velocity / scaleDenom) * maxBar)

  const columns = Math.max(L.slots.length, R.slots.length)
  const doneL = L.done.length
  const doneR = R.done.length

  // Reference lines (hero only) — the per-side running best, mirrored above / below the axis.
  const refPxL = bestL > 0 && scaleDenom > 0 ? Math.min(maxBar, (bestL / scaleDenom) * maxBar) : 0
  const refPxR = bestR > 0 && scaleDenom > 0 ? Math.min(maxBar, (bestR / scaleDenom) * maxBar) : 0

  // When bars get thin, keep only the peak + live labels per side so they don't overlap.
  const barWidth =
    plotW > 0 && columns > 0
      ? Math.min(c.maxCol, (plotW - c.gap * (columns - 1)) / columns)
      : c.maxCol
  const labelsCrowded = c.showValues && plotW > 0 && barWidth < HERO_LABEL_MIN_BAR_WIDTH
  const gap = plotW === 0 ? c.gap : barWidth < 16 ? 2 : barWidth < 28 ? 4 : c.gap
  const peakIndex = (done: number[]): number =>
    done.length === 0 ? -1 : done.reduce((best, v, i) => (v > done[best] ? i : best), 0)
  const peakL = peakIndex(L.done)
  const peakR = peakIndex(R.done)
  const showLabel = (i: number, peak: number): boolean =>
    !labelsCrowded || i === peak || i === liveRepIndex

  const label =
    `Dual velocity chart, left ${doneL} of ${Math.max(doneL, targetReps ?? doneL)} reps, ` +
    `right ${doneR} of ${Math.max(doneR, targetReps ?? doneR)} reps`
  const { style: externalStyle, ...restProps } = props

  return (
    <View
      className={className}
      style={[{ height: resolvedHeight, flexDirection: 'row' }, externalStyle]}
      accessibilityRole="image"
      accessibilityLabel={label}
      testID="dual-velocity-strip"
      {...restProps}
    >
      {/* Vertical LEFT / RIGHT voltra labels down the left edge (never overlap the bars). */}
      <DivergingSideRail plotHalf={plotHalf} variant={variant} />

      <View style={{ flex: 1, position: 'relative' }}>
      {/* Per-side running-best reference lines (hero) — how far each side has fallen from best. */}
      {c.showReference && refPxL > 0 && (
        <View
          accessibilityElementsHidden
          pointerEvents="none"
          style={{ position: 'absolute', left: 0, right: 0, top: plotHalf - refPxL, borderTopWidth: 1, borderStyle: 'dashed', borderColor: HERO_REFERENCE_COLOR }}
          testID="dual-velocity-reference-L"
        />
      )}
      {c.showReference && refPxR > 0 && (
        <View
          accessibilityElementsHidden
          pointerEvents="none"
          style={{ position: 'absolute', left: 0, right: 0, top: plotHalf + refPxR, borderTopWidth: 1, borderStyle: 'dashed', borderColor: HERO_REFERENCE_COLOR }}
          testID="dual-velocity-reference-R"
        />
      )}

      {/* Mirrored per-rep columns. */}
      <View
        onLayout={onPlotLayout}
        style={{ flexDirection: 'row', gap, height: '100%', alignItems: 'stretch' }}
      >
        {Array.from({ length: columns }, (_, i) => {
          const lSlot = L.slots[i]
          const rSlot = R.slots[i]
          return (
            <View key={i} accessibilityElementsHidden style={{ flex: 1, maxWidth: c.maxCol, height: '100%' }}>
              {/* Up wing — LEFT. */}
              <View style={{ height: plotHalf, justifyContent: 'flex-end', alignItems: 'center' }}>
                {c.showValues && (
                  <View style={{ height: c.labelBand, justifyContent: 'flex-end' }}>
                    {lSlot?.kind === 'rep' && showLabel(i, peakL) && (
                      <Text className="text-text-primary" style={{ fontSize: 12, fontWeight: '800' }} testID={`dual-velocity-label-L-${i}`}>
                        {formatVelocity(lSlot.velocity ?? 0)}
                      </Text>
                    )}
                  </View>
                )}
                {lSlot && (
                  <WingBar
                    slot={lSlot}
                    grow="up"
                    c={c}
                    color={barColorFor(lSlot.velocity ?? 0)}
                    barPx={barPx(lSlot.velocity)}
                    liveScale={liveScaleL}
                    isLive={i === liveRepIndex && lSlot.kind === 'rep'}
                    testID={`dual-velocity-bar-L-${i}`}
                  />
                )}
              </View>

              {/* Down wing — RIGHT. */}
              <View style={{ height: plotHalf, justifyContent: 'flex-start', alignItems: 'center' }}>
                {rSlot && (
                  <WingBar
                    slot={rSlot}
                    grow="down"
                    c={c}
                    color={barColorFor(rSlot.velocity ?? 0)}
                    barPx={barPx(rSlot.velocity)}
                    liveScale={liveScaleR}
                    isLive={i === liveRepIndex && rSlot.kind === 'rep'}
                    testID={`dual-velocity-bar-R-${i}`}
                  />
                )}
                {c.showValues && (
                  <View style={{ height: c.labelBand, justifyContent: 'flex-start' }}>
                    {rSlot?.kind === 'rep' && showLabel(i, peakR) && (
                      <Text className="text-text-primary" style={{ fontSize: 12, fontWeight: '800' }} testID={`dual-velocity-label-R-${i}`}>
                        {formatVelocity(rSlot.velocity ?? 0)}
                      </Text>
                    )}
                  </View>
                )}
              </View>
            </View>
          )
        })}
      </View>

      {/* The centre axis — same weight/color as the single hero's baseline (charcoal, 2px).
          Rendered LAST so it sits ON TOP of the bars, visually splitting each rep's up (L)
          and down (R) halves into two distinct bars meeting at the axis. */}
      <View
        accessibilityElementsHidden
        pointerEvents="none"
        style={{ position: 'absolute', left: 0, right: 0, top: plotHalf - 1, height: 2, backgroundColor: HERO_PENDING_COLOR }}
        testID="dual-velocity-axis"
      />
      </View>
    </View>
  )
}

export function VelocityStrip({
  velocities,
  set,
  zones,
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
  // A `set` descriptor derives its own done-velocity array; the legacy
  // `velocities` path stays the source of truth otherwise. Every summary calc
  // (mean / loss / zone) runs on this one array so the info row works either way.
  const doneVelocities = set ? deriveDoneVelocities(set) : (velocities ?? [])
  const slots: VelocitySlot[] = set
    ? buildSlots(set)
    : doneVelocities.map((v, i) => ({
        kind: 'rep',
        velocity: v,
        leadingGap: i === 0 ? 0 : REP_GAP,
      }))

  const maxVelocity = Math.max(...doneVelocities, 0)
  const meanVelocity = calculateMeanVelocity(doneVelocities)
  const loss = calculateVelocityLoss(doneVelocities)

  // The framed chart (raised box, labels, info) vs the bare spotlight strip is the
  // only fork in the `expanded` variant — keyed by whether any chrome is requested.
  const framed = showNumbers || showInfo
  const scaleDenom = scaleDenominator(scale, maxVelocity)

  const hasZones = zones != null && zones.length > 0
  const barColorFor = makeBarColorFor(zones)
  const slotColor = (slot: VelocitySlot): string => {
    if (slot.kind === 'rep') return barColorFor(slot.velocity ?? 0)
    if (slot.kind === 'todo') return TODO_COLOR
    return SET_STRIP_VARIABLE_COLOR
  }
  const meanZone = hasZones
    ? (classifyBand(meanVelocity, zones)?.label ?? '')
    : getVelocityZoneName(meanVelocity)

  const [heightAnim] = useState(() => new Animated.Value(expanded ? height : 3))
  const [labelOpacity] = useState(() => new Animated.Value(expanded ? 1 : 0))
  const [infoOpacity] = useState(() => new Animated.Value(expanded ? 1 : 0))

  // Newest-rep animation: pop for a normal rep, bounce when it sets a new peak.
  const liveVelocity = liveRepIndex != null ? doneVelocities[liveRepIndex] : undefined
  const isNewPeak = liveVelocity != null && maxVelocity > 0 && liveVelocity === maxVelocity
  const liveScale = useLiveRepPop(
    variant === 'expanded' && framed,
    liveRepIndex,
    liveVelocity,
    isNewPeak
  )

  useEffect(() => {
    if (variant !== 'expanded' || !framed) return

    Animated.parallel([
      Animated.timing(heightAnim, {
        toValue: expanded ? height : 3,
        duration: ANIMATION_DURATION,
        easing: ANIMATION_EASING,
        useNativeDriver: false,
      }),
      Animated.timing(labelOpacity, {
        toValue: expanded ? 1 : 0,
        duration: 300,
        delay: expanded ? 150 : 0,
        useNativeDriver: false,
      }),
      Animated.timing(infoOpacity, {
        toValue: expanded ? 1 : 0,
        duration: 300,
        delay: expanded ? 200 : 0,
        useNativeDriver: false,
      }),
    ]).start()
  }, [expanded, variant, framed, height, heightAnim, labelOpacity, infoOpacity])

  // Nothing to draw: neither a legacy velocity array nor a set descriptor.
  if (set == null && velocities == null) return null

  const repCount = doneVelocities.length
  const miniLabel = set ? setAccessibilityLabel(set, repCount) : `Velocity strip, ${repCount} reps`

  if (variant === 'hero') {
    // Hero's plot is far taller than the expanded chart; apply its own default when
    // the caller left `height` at the shared 60px default.
    const heroHeight = height === EXPANDED_HEIGHT ? HERO_HEIGHT : height
    return (
      <HeroVelocityChart
        doneVelocities={doneVelocities}
        barColorFor={barColorFor}
        scaleDenom={scaleDenom}
        referenceVelocity={maxVelocity}
        liveRepIndex={liveRepIndex}
        isNewPeak={isNewPeak}
        targetReps={targetReps}
        height={heroHeight}
        className={className}
        viewProps={props}
      />
    )
  }

  if (variant === 'mini') {
    const { style: externalStyle, ...restProps } = props
    // The container keeps the uniform REP_GAP (so a no-`set` strip is byte-identical
    // to prior releases and holds HTML-parity); per-slot `marginLeft` carries only
    // the EXTRA spacing for the WIDE notch that chunks drop / myo / cluster sets.
    return (
      <View
        className={className}
        style={[
          { flexDirection: 'row', height: 3, gap: REP_GAP, borderRadius: 2, overflow: 'hidden' },
          externalStyle,
        ]}
        accessibilityRole="image"
        accessibilityLabel={miniLabel}
        testID="velocity-strip-mini"
        {...restProps}
      >
        {slots.map((slot, i) => (
          <View
            key={i}
            style={{
              flex: 1,
              backgroundColor: slotColor(slot),
              borderRadius: 1,
              minWidth: 4,
              height: '100%' as unknown as number,
              // The container's uniform 2px gap covers rep spacing; a wide slot adds
              // only the EXTRA (WIDE_GAP − REP_GAP) so the notch totals WIDE_GAP.
              marginLeft: Math.max(0, slot.leadingGap - REP_GAP),
              ...(slot.kind === 'continue'
                ? { borderWidth: 1, borderColor: CONTINUE_OUTLINE }
                : {}),
            }}
            accessibilityElementsHidden
            testID={slot.kind === 'rep' ? `velocity-bar-${i}` : `velocity-slot-${slot.kind}`}
          />
        ))}
      </View>
    )
  }

  // Bare `expanded` strip (both chrome flags off): the velocity-HEIGHT spotlight —
  // px bar heights, no raised box / labels / info row / animation. Set-type gaps carry
  // over from the slot model exactly as in `mini` (container REP_GAP + per-slot extra
  // for a WIDE notch); planned / variable / continue slots draw as stubs.
  if (!framed) {
    const { style: externalStyle, ...restProps } = props
    return (
      <View
        className={className}
        style={[
          { flexDirection: 'row', height, gap: REP_GAP, alignItems: 'flex-end' },
          externalStyle,
        ]}
        accessibilityRole="image"
        accessibilityLabel={miniLabel}
        testID="velocity-strip-compact"
        {...restProps}
      >
        {slots.map((slot, i) => (
          <View
            key={i}
            style={{
              flex: 1,
              minWidth: 4,
              height: bareSlotHeight(slot, height, scaleDenom),
              // Top-rounded to match the framed chart's bars (the "rounded tops from
              // the numbers one"); square bottoms since bars sit on the baseline.
              borderTopLeftRadius: 2,
              borderTopRightRadius: 2,
              backgroundColor: slotColor(slot),
              marginLeft: Math.max(0, slot.leadingGap - REP_GAP),
              ...(slot.kind === 'continue'
                ? { borderWidth: 1, borderColor: CONTINUE_OUTLINE }
                : {}),
            }}
            accessibilityElementsHidden
            testID={slot.kind === 'rep' ? `velocity-bar-${i}` : `velocity-slot-${slot.kind}`}
          />
        ))}
      </View>
    )
  }

  const stripLabel = set
    ? `${setAccessibilityLabel(set, repCount)}, tap to ${expanded ? 'collapse' : 'expand'}`
    : `Velocity chart for set, ${repCount} reps, tap to ${expanded ? 'collapse' : 'expand'}`
  // When onToggle wraps the strip or individual reps are interactive, the container itself is not a button
  const hasInteractiveContainer = onToggle != null
  const hasInteractiveReps = onRepPress != null && expanded

  // Expanded set-type bars: `straight` is the active-set spotlight (velocity-height
  // done reps + short grey planned stubs); the advanced types render as a short,
  // mini-style encoding (the gaps + colors carry identity, height is uniform).
  const setBars =
    set != null &&
    slots.map((slot, i) => {
      const isStraightRep = set.type === 'straight' && slot.kind === 'rep'
      const heightPct = isStraightRep
        ? scaleDenom > 0
          ? Math.round(((slot.velocity ?? 0) / scaleDenom) * 100)
          : 0
        : set.type === 'straight'
          ? EXPANDED_TODO_STUB_PCT
          : EXPANDED_ENCODED_PCT
      return (
        <View
          key={i}
          style={{
            flex: 1,
            height: '100%',
            justifyContent: 'flex-end',
            marginLeft: slot.leadingGap,
          }}
        >
          <View
            style={{
              height: `${heightPct}%`,
              minHeight: 2,
              borderTopLeftRadius: 2,
              borderTopRightRadius: 2,
              backgroundColor: slotColor(slot),
              ...(slot.kind === 'continue'
                ? { borderWidth: 1, borderColor: CONTINUE_OUTLINE }
                : {}),
            }}
            testID={slot.kind === 'rep' ? `velocity-bar-${i}` : `velocity-slot-${slot.kind}`}
            accessibilityRole="image"
            accessibilityLabel={slotAccessibilityLabel(slot, i)}
          />
        </View>
      )
    })

  const stripContent = (
    <Animated.View
      className={[className, expanded ? 'bg-surface-raised' : 'bg-transparent']
        .filter(Boolean)
        .join(' ')}
      style={[
        {
          height: heightAnim,
          width: '100%',
          gap: 2,
          borderRadius: expanded ? 6 : 2,
          paddingTop: expanded ? 16 : 0,
          paddingBottom: expanded ? 24 : 0,
          // No horizontal inset — the framed chart's bars span full width, matching
          // the bare spotlight and mini. Numbers/info sit in the vertical padding.
          paddingHorizontal: 0,
          paddingVertical: expanded ? undefined : 8,
          overflow: expanded ? 'visible' : 'hidden',
        },
      ]}
      accessibilityRole={hasInteractiveContainer || hasInteractiveReps ? 'none' : 'button'}
      accessibilityLabel={hasInteractiveContainer || hasInteractiveReps ? undefined : stripLabel}
      testID="velocity-strip"
      {...props}
    >
      <View style={{ flexDirection: 'row', flex: 1, gap: set ? 0 : 2, alignItems: 'flex-end' }}>
        {set
          ? setBars
          : doneVelocities.map((v, i) => {
              const barBackground = barColorFor(v)
              // Guard all-zero velocities (idle / pre-rep): a 0 denominator makes
              // this 0 / 0 === NaN and emits height:'NaN%'. Flatten the bars instead.
              const barHeightPct = scaleDenom > 0 ? Math.round((v / scaleDenom) * 100) : 0
              const isLive = liveRepIndex === i
              const liveLabelSuffix = isLive
                ? isNewPeak
                  ? ', latest rep, new set peak'
                  : ', latest rep'
                : ''

              const barStyle: ViewStyle = expanded
                ? {
                    height: `${barHeightPct}%`,
                    minHeight: 2,
                    borderTopLeftRadius: 2,
                    borderTopRightRadius: 2,
                    backgroundColor: barBackground,
                  }
                : {
                    minHeight: '100%' as unknown as number,
                    borderTopLeftRadius: 2,
                    borderTopRightRadius: 2,
                    borderBottomLeftRadius: 0,
                    borderBottomRightRadius: 0,
                    backgroundColor: barBackground,
                  }

              const barInner = isLive ? (
                <Animated.View
                  style={[barStyle, { transform: [{ scale: liveScale }] }]}
                  testID={`velocity-bar-${i}`}
                  accessibilityRole="image"
                  accessibilityLabel={`Rep ${i + 1}: ${formatVelocity(v)} meters per second${liveLabelSuffix}`}
                />
              ) : (
                <View
                  style={barStyle}
                  testID={`velocity-bar-${i}`}
                  accessibilityRole="image"
                  accessibilityLabel={`Rep ${i + 1}: ${formatVelocity(v)} meters per second`}
                />
              )

              const bar = (
                <View
                  key={i}
                  style={{
                    flex: 1,
                    height: '100%',
                    justifyContent: 'flex-end',
                    position: 'relative',
                  }}
                >
                  {expanded && showNumbers && (
                    <Animated.View
                      style={{
                        opacity: labelOpacity,
                        alignItems: 'center',
                        position: 'absolute',
                        top: -13,
                        left: 0,
                        right: 0,
                      }}
                      accessibilityElementsHidden
                    >
                      <Text
                        className="text-text-secondary"
                        style={{ fontSize: 8, fontWeight: '600' }}
                        testID={`velocity-label-${i}`}
                      >
                        {formatVelocity(v)}
                      </Text>
                    </Animated.View>
                  )}
                  {barInner}
                </View>
              )

              if (onRepPress && expanded) {
                return (
                  <Pressable
                    key={i}
                    style={{ flex: 1, height: '100%' }}
                    onPress={() => onRepPress(i, v)}
                    accessibilityRole="button"
                    accessibilityLabel={`Rep ${i + 1}: ${formatVelocity(v)} meters per second, tap for details`}
                    testID={`velocity-bar-pressable-${i}`}
                  >
                    {bar}
                  </Pressable>
                )
              }

              return bar
            })}
      </View>
      {expanded && showInfo && (
        <Animated.View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            opacity: infoOpacity,
            position: 'absolute',
            bottom: 4,
            left: 6,
            right: 6,
          }}
          testID="velocity-info-row"
        >
          <Text
            className="text-text-secondary"
            style={{
              fontSize: 10,
              fontFamily: 'Inter, sans-serif',
            }}
          >
            {meanZone} {'·'} {formatVelocity(meanVelocity)} m/s
          </Text>
          <Text
            className="text-text-secondary"
            style={{
              fontSize: 10,
              fontFamily: 'Inter, sans-serif',
              ...getLossStyle(loss),
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
