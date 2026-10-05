import { View, Text, type ViewStyle } from 'react-native'
import { greyRamp } from '../../../theme/tokens/primitives'
import { getSemanticColors } from '../../../theme/tokens/semantic'
import { useSurfaceMode } from '../../ui/surface'
import { alpha } from '../../../utils/colors'
import type { SetBarGeometry } from '../charts/SetBarChart'
import {
  VL_LOSS_THRESHOLDS,
  normalizeLossThresholds,
  type VelocityLossThresholds,
} from './velocity-scale'

/** The dashed running-best reference line color (the lightest grey step). */
const HERO_REFERENCE_COLOR = greyRamp[600]

/**
 * A dashed running-best reference line spanning the plot width, absolutely positioned a
 * pixel `offset` from the given `anchor` edge. Shared by the single `hero` chart (anchored
 * to the baseline, `bottom`) and BOTH wings of the diverging dual chart (anchored to the
 * centre axis, `top`) so the three sites render one line treatment (grey-0, 1px dashed).
 * Presentation-only + non-interactive — the numeric best lives in each chart's container
 * accessibility label, so the line itself is hidden from the a11y tree.
 *
 * REUSE FOLLOW-UP: `Sparkline` hand-rolls the same dashed-line overlay (plus opacity, an
 * optional label, and a data-domain Y), and two lab specimens duplicate it again. A
 * top-level `ReferenceLine` overlay primitive unifying all of them is a scoped follow-up
 * (see the Workout README) — kept in-file here to keep the hero PR focused.
 */
export function DashedReferenceLine({
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
  thresholds = VL_LOSS_THRESHOLDS,
}: {
  best: number
  scaleDenom: number
  plotHeight: number
  /** The parent plot is vertically mirrored (a `down` wing) — counter-flip the labels upright. */
  flip?: boolean
  /** The bar-colour thresholds; the amber band starts at the second, the red at the third. */
  thresholds?: VelocityLossThresholds
}) {
  // Before the early return, so the mode is read on every render.
  const vl = getSemanticColors(useSurfaceMode())
  if (best <= 0 || scaleDenom <= 0 || plotHeight <= 0) return null
  const yOf = (v: number): number => (v / scaleDenom) * plotHeight
  const [, amberPct, redPct] = normalizeLossThresholds(thresholds)
  const vl20 = best * (1 - amberPct / 100)
  const vl30 = best * (1 - redPct / 100)
  const hasAmber = amberPct < redPct
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
  // Lines closer than one label height would overprint, so only the stop line keeps its label.
  const amberLabelFits = yOf(vl20) - yOf(vl30) >= vlFont
  const threshold = (v: number, color: string, label: string | null) => (
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
      {showLabels && label ? (
        <>
          <Text
            className="mx-1.5"
            style={{
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
      {band(0, vl30, alpha(vl['status-error'], 0.09))}
      {hasAmber && band(vl30, vl20, alpha(vl['status-warning'], 0.08))}
      {hasAmber &&
        threshold(
          vl20,
          alpha(vl['status-warning'], 0.75),
          amberLabelFits ? `VL ${Math.round(amberPct)}%` : null
        )}
      {threshold(vl30, alpha(vl['status-error'], 0.75), `VL ${Math.round(redPct)}%`)}
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
export function velocityReferenceOverlay(
  g: SetBarGeometry,
  showLossBands: boolean,
  thresholds?: VelocityLossThresholds
) {
  const referencePx = g.best > 0 && g.scaleDenom > 0 ? Math.min(g.plotHeight, g.yOf(g.best)) : 0
  return (
    <>
      {showLossBands && (
        <VelocityLossBands
          best={g.best}
          scaleDenom={g.scaleDenom}
          plotHeight={g.plotHeight}
          flip={g.flip}
          thresholds={thresholds}
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
