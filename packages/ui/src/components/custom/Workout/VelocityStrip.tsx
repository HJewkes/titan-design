// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { useEffect, useState } from 'react'
import { View, Text, Pressable, Animated, type ViewProps } from 'react-native'
import { space } from '../../../theme/tokens/semantic'
import { useSurfaceMode } from '../../ui/surface'
import { formatVelocity } from '../../../utils/workout-format'
import { SetBarChart, type SetSlot, SET_BAR_DEFAULT_HEIGHT } from '../charts/SetBarChart'
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
  type VelocityZoneBandProp,
} from './velocity-scale'
import {
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
  type VelocityZoneBandProp,
} from './velocity-scale'
export type { VelocitySet } from './velocity-slots'
export { VelocityLossBands } from './VelocityLossBands'
export {
  DualVelocityStrip,
  type DualVelocityStripProps,
  type DualVelocityStream,
} from './DualVelocityStrip'

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

/** Default framed `expanded` chart height (px). */
const EXPANDED_HEIGHT = 60
/** Default `compact` (flat resting strip) height (px) — a THIN radius-2 pill row, the resting glance. */
const COMPACT_HEIGHT = 8

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
