// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { useEffect, useState } from 'react'
import { View, Text, Pressable, Animated, type ViewProps, type ViewStyle } from 'react-native'
import { WORKOUT_TOKENS } from '../../../theme/workout-tokens'
import { primitiveColors, primitiveRamps, sequentialEffort } from '../../../theme/tokens/primitives'
import { getSemanticColors } from '../../../theme/tokens/semantic'
import { useOnSurfaceColor, useSurface, surfaceBackground } from '../../ui/surface/SurfaceContext'
import { alpha } from '../../../utils/colors'
import { barPaper } from '../../../theme/bar-paper'
import { formatVelocity } from '../../../utils/workout-format'
import { SET_STRIP_VARIABLE_COLOR } from './SetStrip'
import {
  SetBarChart,
  type SetSlot,
  type SetBarGeometry,
  scaleDenominator,
  PEAK_HEADROOM,
  SET_BAR_DEFAULT_HEIGHT,
} from '../charts/SetBarChart'
import { useLiveRepGrowth, ANIMATION_EASING } from '../charts/live-rep-growth'

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
   * `hero` only (internal): pad the rendered columns to at least this many with placeholder to-do
   * cells. The diverging dual passes the union column count of BOTH wings so bars line up
   * column-for-column top↔bottom across the centre axis regardless of each side's own rep count.
   */
  minColumns?: number
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
/** Minimum bare-strip bar height (px) — a planned / variable / continue stub, or a near-zero rep. */
const BARE_STUB_HEIGHT = 3

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
const VL_SEMANTIC = getSemanticColors('dark')

/** Linear-blend two #RRGGBB hexes (`t`=0 → a, 1 → b). Used for the surface-relative to-do tone. */
function mixHex(a: string, b: string, t: number): string {
  const parse = (h: string): [number, number, number] => {
    const s = h.replace('#', '')
    return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)]
  }
  const [ar, ag, ab] = parse(a)
  const [br, bg, bb] = parse(b)
  const ch = (x: number, y: number): string =>
    Math.round(x + (y - x) * t)
      .toString(16)
      .padStart(2, '0')
  return `#${ch(ar, br)}${ch(ag, bg)}${ch(ab, bb)}`
}

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
  // The label sits ~90% along the threshold, with the dashed line breaking around it
  // (a long segment before + a short stub after) — cohesive, near the quiet right end
  // where a declining set has room, and it can't clip the plot edge or cross a bar.
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
      <Text
        style={{
          marginHorizontal: 6,
          fontSize: 9,
          fontWeight: '800',
          fontFamily: BAND_LABEL_FONT,
          color,
          ...(flip ? { transform: [{ scaleY: -1 as number }] } : null),
        }}
      >
        {label}
      </Text>
      <View style={{ flex: 1, borderTopWidth: 1, borderStyle: 'dashed', borderColor: color }} />
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

/** Bare-strip bar height (px): velocity-scaled for a performed rep, a short stub otherwise. */
function bareSlotHeight(slot: VelocitySlot, height: number, denom: number): number {
  if (slot.kind !== 'rep' || denom <= 0) return BARE_STUB_HEIGHT
  const ratio = Math.min(1, (slot.velocity ?? 0) / denom)
  return Math.max(BARE_STUB_HEIGHT, ratio * height)
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

/** Default `hero` diverging height (px) — matches the single hero. */
const DUAL_HERO_HEIGHT = SET_BAR_DEFAULT_HEIGHT
/** Default `rail` diverging height (px) — compact enough to sit inside a rail slot. */
const DUAL_RAIL_HEIGHT = 96

// --- Rail geometry (the compact dedicated path) ------------------------------
// The `hero` variant COMPOSES two single VelocityStrip heroes, so it inherits the
// hero geometry for free. The `rail` variant is far smaller than a hero (no value
// labels, reference lines, paper, or label headroom), so composing the hero would
// drag all of that in; it keeps a lean dedicated renderer at these compact metrics.
const RAIL_GAP = 3
const RAIL_MAX_COL = 26
const RAIL_RADIUS = 2
const RAIL_MIN_BAR = 3

/** One side's performed per-rep velocities — flattened from a `set` descriptor, or the raw array. */
function streamDone(stream: DualVelocityStream): number[] {
  return stream.set ? deriveDoneVelocities(stream.set) : (stream.velocities ?? [])
}

/**
 * A side's NATURAL column count — the number of cells its composed hero draws: a `set` resolves to
 * its full slot list (reps + todo + window cells), a plain stream to `max(done, targetReps)`. The
 * dual takes the union of both sides so it can pad the shorter wing and align bars across the axis.
 */
function streamColumns(stream: DualVelocityStream, targetReps?: number): number {
  if (stream.set) return buildSlots(stream.set).length
  return Math.max(stream.velocities?.length ?? 0, targetReps ?? 0)
}

/**
 * The vertical per-side SLOT-NAME rail down the chart's left edge — the same rotated-label
 * treatment the single dual live view uses, split into an upper (up wing) and lower (down
 * wing) half so the name reads without any tag overlapping the bars near the axis. The label
 * TEXT is data — each side's `DualVelocityStream.label` (a slot name, e.g. "Left Arm"), NOT a
 * hardcoded side. A side with no label renders no tag; when neither side has one the rail is
 * omitted entirely (the chart just loses its gutter). `rail` scale uses a narrower gutter.
 */
function DivergingSideRail({
  plotHalf,
  variant,
  leftLabel,
  rightLabel,
}: {
  plotHalf: number
  variant: 'hero' | 'rail'
  leftLabel?: string
  rightLabel?: string
}) {
  if (!leftLabel && !rightLabel) return null
  const isRail = variant === 'rail'
  // The rotated label runs along the chart's VERTICAL extent, so its length budget is the
  // WING HEIGHT (plotHalf), not the narrow gutter. The rotate lives on a wrapper sized to
  // plotHalf so `numberOfLines` (RNW → max-width:100%) resolves against that tall dimension,
  // not the gutter — otherwise a multi-char slot name clips to ~2 chars. Ellipsis therefore
  // only kicks in when a name genuinely exceeds the wing (long names at rail scale).
  const labelLength = Math.max(0, plotHalf - (isRail ? 0 : 6))
  const textStyle = {
    maxWidth: '100%' as const,
    textAlign: 'center' as const,
    // Rail wing is short (~48px): drop to 7px + no tracking so an 8–10 char slot name
    // ("RIGHT ARM") fits the wing fully once uppercased. Hero has room for the airier
    // 11px/tracked read. Small-caps/eyebrow treatment: the DATA keeps its casing ("Left
    // Arm"), the component renders it UPPERCASE — matching titan's label tag convention.
    fontSize: isRail ? 7 : 11,
    fontWeight: '700' as const,
    letterSpacing: isRail ? 0 : 3,
    textTransform: 'uppercase' as const,
  }
  const renderHalf = (label: string | undefined, testID: string) => (
    <View style={{ height: plotHalf, alignItems: 'center', justifyContent: 'center' }}>
      {label ? (
        <View
          style={{ width: labelLength, alignItems: 'center', transform: [{ rotate: '-90deg' }] }}
        >
          <Text className="text-text-tertiary" style={textStyle} numberOfLines={1} testID={testID}>
            {label}
          </Text>
        </View>
      ) : null}
    </View>
  )
  return (
    <View
      className={isRail ? undefined : 'border-border'}
      style={{ width: isRail ? 18 : 34, borderRightWidth: isRail ? 0 : 1 }}
      accessibilityElementsHidden
    >
      {renderHalf(leftLabel, 'dual-velocity-side-label-L')}
      {renderHalf(rightLabel, 'dual-velocity-side-label-R')}
    </View>
  )
}

/** Rail slots: performed reps (carrying a velocity) followed by todo placeholders up to `targetReps`. */
function railSlots(done: number[], targetReps?: number): { velocity?: number }[] {
  const total = Math.max(done.length, targetReps ?? done.length)
  return Array.from({ length: total }, (_, i) => (i < done.length ? { velocity: done[i] } : {}))
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

/** The centre axis — the single hero's baseline tone (surface-relative), drawn once where the wings meet. */
function DualCentreAxis({ plotHalf, color }: { plotHalf: number; color: string }) {
  return (
    <View
      accessibilityElementsHidden
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: plotHalf - 1,
        height: 2,
        backgroundColor: color,
        pointerEvents: 'none',
      }}
      testID="dual-velocity-axis"
    />
  )
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
  const plotHalf = height / 2
  // ONE shared height scale across both wings so the L/R asymmetry reads as bar length, not two
  // scales; each composed strip still colors by its OWN loss and draws its OWN best reference.
  // `peak` shares the pair max via `scaleMax`; `fixed` shares the cross-set ceiling (both wings
  // resolve the same fixed ceiling), so `scaleMax` is left off and `scale` carries it.
  const sharedMax = Math.max(...leftDone, ...rightDone, 0)
  // The union column count of both wings — each wing pads to this so bars line up column-for-column
  // top↔bottom across the centre axis, regardless of one side having fewer reps or a shorter set.
  const sharedColumns = Math.max(
    leftStream ? streamColumns(leftStream, targetReps) : leftDone.length,
    rightStream ? streamColumns(rightStream, targetReps) : rightDone.length
  )
  const axisColor = useOnSurfaceColor('tertiary')
  const { style: externalStyle, ...restProps } = viewProps

  // Pass the raw stream (its `set` descriptor when present, else its velocities) straight into the
  // composed hero so a side's set-type WINDOWS render — the composed hero builds its own slots.
  const wing = (
    orientation: 'up' | 'down',
    stream: DualVelocityStream | undefined,
    done: number[]
  ) => (
    <VelocityStrip
      variant="hero"
      orientation={orientation}
      {...(stream?.set ? { set: stream.set } : { velocities: stream?.velocities ?? done })}
      scale={scale}
      scaleMax={scale === 'fixed' ? undefined : sharedMax}
      barColor={barColor}
      zones={zones}
      targetReps={targetReps}
      minColumns={sharedColumns}
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
      {/* Vertical per-side slot-name labels down the left edge, from each stream's `label`
          (data, not a hardcoded side) — rotated so they never overlap the bars. */}
      <DivergingSideRail
        plotHalf={plotHalf}
        variant="hero"
        leftLabel={leftLabel}
        rightLabel={rightLabel}
      />

      <View style={{ flex: 1, position: 'relative' }}>
        {/* The two composed heroes. Their own labels are redundant with the dual's summary label,
            so the wings are hidden from the a11y tree (testIDs still resolve for tests). */}
        <View accessibilityElementsHidden testID="dual-velocity-wing-up">
          {wing('up', leftStream, leftDone)}
        </View>
        <View accessibilityElementsHidden testID="dual-velocity-wing-down">
          {wing('down', rightStream, rightDone)}
        </View>

        <DualCentreAxis plotHalf={plotHalf} color={axisColor} />
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
  leftLabel,
  rightLabel,
  zones,
  barColor,
  scale,
  targetReps,
  height,
  className,
  label,
  viewProps,
}: DualChartProps) {
  const plotHalf = height / 2
  const sharedMax = Math.max(...leftDone, ...rightDone, 0)
  const scaleDenom = scaleDenominator(scale, sharedMax)
  const bestL = Math.max(...leftDone, 0)
  const bestR = Math.max(...rightDone, 0)
  const zoneColorFor = makeBarColorFor(zones)
  const colorFor = (v: number, best: number): string =>
    barColor === 'loss' ? getVelocityLossColor(velocityLossForRep(v, best)) : zoneColorFor(v)
  const barPx = (v: number): number =>
    scaleDenom <= 0 ? RAIL_MIN_BAR : Math.max(RAIL_MIN_BAR, Math.min(1, v / scaleDenom) * plotHalf)
  const placeholder = useOnSurfaceColor('tertiary')

  const slotsL = railSlots(leftDone, targetReps)
  const slotsR = railSlots(rightDone, targetReps)
  const columns = Math.max(slotsL.length, slotsR.length)
  const { style: externalStyle, ...restProps } = viewProps

  const railBar = (
    slot: { velocity?: number },
    grow: 'up' | 'down',
    best: number,
    testID: string
  ) => {
    const radius =
      grow === 'up'
        ? { borderTopLeftRadius: RAIL_RADIUS, borderTopRightRadius: RAIL_RADIUS }
        : { borderBottomLeftRadius: RAIL_RADIUS, borderBottomRightRadius: RAIL_RADIUS }
    if (slot.velocity == null) {
      return (
        <View
          style={{
            width: '100%',
            height: RAIL_MIN_BAR * 2,
            borderWidth: 1,
            borderStyle: 'dashed',
            borderColor: placeholder,
            ...radius,
          }}
          testID={`${testID}-todo`}
        />
      )
    }
    return (
      <View
        style={{
          width: '100%',
          height: barPx(slot.velocity),
          backgroundColor: colorFor(slot.velocity, best),
          ...radius,
        }}
        testID={testID}
      />
    )
  }

  return (
    <View
      className={className}
      style={[{ height, flexDirection: 'row' }, externalStyle]}
      accessibilityRole="image"
      accessibilityLabel={label}
      testID="dual-velocity-strip"
      {...restProps}
    >
      <DivergingSideRail
        plotHalf={plotHalf}
        variant="rail"
        leftLabel={leftLabel}
        rightLabel={rightLabel}
      />

      <View style={{ flex: 1, position: 'relative' }}>
        <View
          style={{ flexDirection: 'row', gap: RAIL_GAP, height: '100%', alignItems: 'stretch' }}
        >
          {Array.from({ length: columns }, (_, i) => {
            const lSlot = slotsL[i]
            const rSlot = slotsR[i]
            return (
              <View
                key={i}
                accessibilityElementsHidden
                style={{ flex: 1, maxWidth: RAIL_MAX_COL, height: '100%' }}
              >
                <View
                  style={{ height: plotHalf, justifyContent: 'flex-end', alignItems: 'center' }}
                >
                  {lSlot && railBar(lSlot, 'up', bestL, `dual-velocity-bar-L-${i}`)}
                </View>
                <View
                  style={{ height: plotHalf, justifyContent: 'flex-start', alignItems: 'center' }}
                >
                  {rSlot && railBar(rSlot, 'down', bestR, `dual-velocity-bar-R-${i}`)}
                </View>
              </View>
            )
          })}
        </View>

        <DualCentreAxis plotHalf={plotHalf} color={placeholder} />
      </View>
    </View>
  )
}

/**
 * The dual-voltra (bilateral) DIVERGING per-rep velocity chart. The up-wing stream grows UP, the
 * down-wing stream grows DOWN from one shared centre axis. The `hero` variant COMPOSES two single
 * {@link VelocityStrip} heroes (see {@link DualVelocityHero}) so any hero improvement reaches the
 * dual for free; `rail` uses a lean compact renderer ({@link DualVelocityRail}). Single-voltra sets
 * keep using {@link VelocityStrip} (`variant="hero"`) — unchanged.
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
  const resolvedHeight = height ?? (variant === 'hero' ? DUAL_HERO_HEIGHT : DUAL_RAIL_HEIGHT)
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

  return variant === 'rail' ? (
    <DualVelocityRail {...shared} />
  ) : (
    <DualVelocityHero {...shared} liveRepIndex={liveRepIndex} />
  )
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
  minColumns,
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
  // `scaleMax` (the diverging dual's shared pair-max) overrides the height denominator so both
  // wings share ONE height scale; loss coloring + the reference still read this strip's own
  // `maxVelocity`, so a per-side loss language survives the shared height scale.
  const scaleDenom =
    scaleMax != null && scaleMax > 0
      ? scaleMax * PEAK_HEADROOM
      : scaleDenominator(scale, maxVelocity)

  const hasZones = zones != null && zones.length > 0
  // Single-sourced zone resolver (diverging-hero) wrapped with the loss-relative
  // mode (velocitystrip-loss): `barColor="loss"` colors each rep by its velocity
  // loss from the set's own best, else fall through to the shared zone scale.
  const zoneColorFor = makeBarColorFor(zones)
  const barColorFor = (v: number): string =>
    barColor === 'loss' ? getVelocityLossColor(velocityLossForRep(v, maxVelocity)) : zoneColorFor(v)
  // Planned/to-do reps take a SURFACE-RELATIVE tone: the surface plane blended toward
  // the on-surface neutral by a constant amount, so an empty slot holds ~constant
  // contrast on EVERY plane (the inset/pressed relative model). This is the pattern we
  // want surface-wide — it's also what makes a future light-mode redesign fall out.
  const onSurfaceTertiary = useOnSurfaceColor('tertiary')
  const surface = useSurface()
  const todoColor = mixHex(surfaceBackground(surface.level, surface.mode), onSurfaceTertiary, 0.55)
  const slotColor = (slot: VelocitySlot): string => {
    if (slot.kind === 'rep') return barColorFor(slot.velocity ?? 0)
    if (slot.kind === 'todo') return todoColor
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
  const liveGrowth = useLiveRepGrowth(
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
    const heroHeight = height === EXPANDED_HEIGHT ? SET_BAR_DEFAULT_HEIGHT : height
    // A `set` builds its own typed slots (rep / todo / variable / continue + chunk-notch gaps);
    // the plain `velocities` path is bare rep slots + a `targetReps` todo remainder SetBarChart fills.
    const heroSlots: SetSlot[] = set
      ? buildSlots(set).map((s) => ({ kind: s.kind, value: s.velocity, leadingGap: s.leadingGap }))
      : doneVelocities.map((v) => ({ kind: 'rep', value: v }))
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
        targetReps={set ? undefined : targetReps}
        minColumns={minColumns}
        showValueLabels
        formatValue={formatVelocity}
        renderReference={(g) => velocityReferenceOverlay(g, lossBandsOn)}
        hideBaseline={hideBaseline}
        testID="velocity-strip-hero"
        testIDPrefix="velocity"
        accessibilityLabel={heroLabel}
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
        {slots.map((slot, i) => {
          const barH = bareSlotHeight(slot, height, scaleDenom)
          const isLive = i === liveRepIndex && slot.kind === 'rep'
          const barStyle: ViewStyle = {
            flex: 1,
            minWidth: 4,
            height: barH,
            // Top-rounded to match the framed chart's bars (the "rounded tops from
            // the numbers one"); square bottoms since bars sit on the baseline.
            borderTopLeftRadius: 2,
            borderTopRightRadius: 2,
            backgroundColor: slotColor(slot),
            marginLeft: Math.max(0, slot.leadingGap - REP_GAP),
            // Performed reps carry the same paper treatment as the hero (grain +
            // rim-light + contact shadow) so the spotlight strip reads as one material.
            ...(slot.kind === 'rep' ? barPaper(slotColor(slot)) : null),
            ...(slot.kind === 'continue' ? { borderWidth: 1, borderColor: CONTINUE_OUTLINE } : {}),
          }
          const barTestID = slot.kind === 'rep' ? `velocity-bar-${i}` : `velocity-slot-${slot.kind}`
          // The newest rep grows up from the baseline as it lands (matching the framed
          // chart + hero); a new set peak overshoots then settles.
          return isLive ? (
            <Animated.View
              key={i}
              style={[
                barStyle,
                { height: liveGrowth.interpolate({ inputRange: [0, 1], outputRange: [0, barH] }) },
              ]}
              accessibilityElementsHidden
              testID={barTestID}
            />
          ) : (
            <View key={i} style={barStyle} accessibilityElementsHidden testID={barTestID} />
          )
        })}
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
              ...(isStraightRep ? barPaper(slotColor(slot)) : null),
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
                    // Framed chart bars carry the hero's paper treatment too, so the
                    // framed / bare / hero treatments read as one material family.
                    ...barPaper(barBackground),
                  }
                : {
                    minHeight: '100%' as unknown as number,
                    borderTopLeftRadius: 2,
                    borderTopRightRadius: 2,
                    borderBottomLeftRadius: 0,
                    borderBottomRightRadius: 0,
                    backgroundColor: barBackground,
                  }

              // Live bar grows up from the baseline to its own target height (barStyle's
              // static height, overridden here with the animated growth-factor readout);
              // every other bar sits at its plain computed height straight away.
              const barInner = isLive ? (
                <Animated.View
                  style={[
                    barStyle,
                    {
                      height: liveGrowth.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', `${barHeightPct}%`],
                      }),
                    },
                  ]}
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
