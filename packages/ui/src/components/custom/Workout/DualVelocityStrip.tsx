import type { ViewProps } from 'react-native'
import { SET_BAR_DEFAULT_HEIGHT } from '../charts/SetBarChart'
import type { VelocityLossThresholds, VelocityZoneBandProp } from './velocity-scale'
import { streamDone, type DualVelocityStream } from './dual-velocity-slots'
import {
  DUAL_COMPACT_HEIGHT,
  DualVelocityCompactStrip,
  DualVelocityHero,
  DualVelocityRail,
  type DualChartProps,
} from './DualVelocityCharts'

export type { DualVelocityStream } from './dual-velocity-slots'

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
