import { formatVelocity } from '../../../utils/workout-format'
import { SetBarChart, type SetSlot, SET_BAR_DEFAULT_HEIGHT } from '../charts/SetBarChart'
import type { VelocityStripVariantProps } from './velocity-strip-model'
import { velocityReferenceOverlay } from './VelocityLossBands'
import { VelocityStripFramed } from './VelocityStripFramed'

/** Default framed `expanded` chart height (px). */
export const EXPANDED_HEIGHT = 60
/** Default `compact` (flat resting strip) height (px) — a THIN radius-2 pill row, the resting glance. */
const COMPACT_HEIGHT = 8

export function VelocityStripHero({ chart, summary }: VelocityStripVariantProps) {
  const { set, columnSlots, slots, barColorFor, height, scale, scaleMax, orientation } = chart
  const { liveRepIndex, targetReps, label, className, props } = chart
  const { repCount, maxVelocity, isNewPeak, lossBandsOn, lossThresholds } = summary
  // Hero's plot is far taller than the expanded chart; apply its own default when the caller left
  // `height` at the shared 60px default. The diverging dual (which passes `columnSlots`) sets an
  // explicit per-wing height — exempt it, so a dual whose wing height happens to be 60px (a 120px
  // dual) isn't mistaken for "unset" and blown up to 220.
  const heroHeight =
    height === EXPANDED_HEIGHT && columnSlots == null ? SET_BAR_DEFAULT_HEIGHT : height
  // `columnSlots` (the diverging dual's shared index-locked structure) wins; else a `set` builds
  // its own typed slots, and the plain `velocities` path is bare rep slots + a `targetReps` remainder.
  const heroSlots: SetSlot[] = columnSlots ?? slots
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

export function VelocityStripCompact({ chart, summary }: VelocityStripVariantProps) {
  const { set, columnSlots, slots, barColorFor, height, scale, scaleMax, orientation } = chart
  const { targetReps, label, className, props } = chart
  const { miniLabel } = summary
  // `compact` = the flat resting form: SetBarChart in FLAT mode (uniform short bars, no value
  // labels), sharing hero's geometry — same colors, paper, 0.08 spacing, proportional chunk-notch,
  // todo/variable/continue slots, and gutter — so a compact↔expanded toggle only changes bar HEIGHT.
  // `columnSlots` (the diverging dual-compact's shared index-locked structure) wins, like the hero.
  const compactSlots: SetSlot[] = columnSlots ?? slots
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

export function VelocityStripExpanded(variantProps: VelocityStripVariantProps) {
  const { chart, summary, chrome } = variantProps
  const { set, columnSlots, slots, barColorFor, height, scale, scaleMax, orientation } = chart
  const { liveRepIndex, targetReps, label, className, props } = chart
  const { miniLabel, isNewPeak } = summary
  const { framed } = chrome
  // Bare `expanded` strip (both chrome flags off): the velocity-HEIGHT spotlight — now
  // FOLDED onto SetBarChart (value mode, no labels), so its bars share the SAME geometry
  // (widths / gaps / chunk-notch / slots / paper) as compact + hero. Only the height-mode
  // (value here, flat in compact) differs, so a compact↔spotlight toggle never reflows.
  if (!framed) {
    // `columnSlots` wins, exactly as it does for compact and hero. The diverging dual passes the
    // index-locked shared structure through here; ignoring it gave the expanded dual its own
    // per-side columns, so a lagging side rendered FEWER bars instead of an aligned empty cell.
    const spotlightSlots: SetSlot[] = columnSlots ?? slots
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
  return VelocityStripFramed(variantProps)
}
