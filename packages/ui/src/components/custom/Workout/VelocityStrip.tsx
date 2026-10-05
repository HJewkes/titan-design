import { useEffect, useState } from 'react'
import { Animated, type ViewProps } from 'react-native'
import { useSurfaceMode } from '../../ui/surface'
import { type SetSlot } from '../charts/SetBarChart'
import { ANIMATION_EASING } from '../charts/live-rep-growth'
import {
  makeBarColorFor,
  normalizeLossThresholds,
  velocityLossForRep,
  getVelocityLossColor,
  type VelocityLossThresholds,
  type VelocityZoneBandProp,
} from './velocity-scale'
import { useVelocitySlots, type VelocitySet } from './velocity-slots'
import { summarizeVelocities } from './velocity-strip-model'
import {
  EXPANDED_HEIGHT,
  VelocityStripCompact,
  VelocityStripExpanded,
  VelocityStripHero,
} from './VelocityStripVariants'

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
  type VelocityZoneBandProp,
} from './velocity-scale'
export type { VelocitySet } from './velocity-slots'
export { VelocityLossBands } from './VelocityLossBands'

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

/** Framed expanded collapse-animation duration (ms). */
const ANIMATION_DURATION = 400

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
  const summary = summarizeVelocities(set, velocities, zones, liveRepIndex)
  const { doneVelocities, maxVelocity } = summary

  // The framed chart (raised box, labels, info) vs the bare spotlight strip is the
  // only fork in the `expanded` variant — keyed by whether any chrome is requested.
  const framed = showNumbers || showInfo

  // Single-sourced zone resolver (diverging-hero) wrapped with the loss-relative mode: `barColor="loss"`
  // colors each rep by its velocity loss from the set's own best, else the shared zone scale. Every
  // variant hands this `colorFor` to SetBarChart, so all variants color identically.
  const mode = useSurfaceMode()
  const zoneColorFor = makeBarColorFor(zones, mode)
  const barColorFor = (v: number): string =>
    barColor === 'loss'
      ? getVelocityLossColor(velocityLossForRep(v, maxVelocity), lossThresholds, mode)
      : zoneColorFor(v)

  // The framed collapse is now an IN-PLACE bar-height morph: `expandProgress` (0 collapsed → 1 open)
  // drives SetBarChart's bars flat↔value (no reflow), replacing the old collapse-to-3px height anim.
  // `infoOpacity` fades the info row; the per-bar labels fade with `expandProgress` in the overlay.
  const [expandProgress] = useState(() => new Animated.Value(expanded ? 1 : 0))
  const [infoOpacity] = useState(() => new Animated.Value(expanded ? 1 : 0))

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

  const slots = useVelocitySlots(set, doneVelocities)

  // Nothing to draw: neither a legacy velocity array nor a set descriptor.
  if (set == null && velocities == null) return null

  const variantProps = {
    chart: {
      set,
      columnSlots,
      slots,
      barColorFor,
      height,
      scale,
      scaleMax,
      orientation,
      liveRepIndex,
      targetReps,
      label,
      className,
      props,
    },
    summary: { ...summary, lossThresholds, lossBandsOn, mode },
    chrome: {
      framed,
      expanded,
      onToggle,
      onRepPress,
      showNumbers,
      showInfo,
      expandProgress,
      infoOpacity,
    },
  }
  // Called as a function inside an unkeyed fragment, which React unwraps, not mounted as an element:
  // a live `variant` toggle keeps the same host SetBarChart (and its measured width), as before.
  const renderVariant =
    variant === 'hero'
      ? VelocityStripHero
      : variant === 'compact'
        ? VelocityStripCompact
        : VelocityStripExpanded
  return <>{renderVariant(variantProps)}</>
}
