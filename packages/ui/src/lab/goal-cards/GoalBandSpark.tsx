/**
 * Lab/Goals — the card-scale trajectory spark, built for VW-386 round two.
 *
 * `Sparkline` cannot express any of what the human asked for on 2026-09-14: its
 * x domain is the actuals array's own length (so the line stops at the current
 * session rather than running to the goal week), its y domain is the actuals'
 * own min/max (so a committed or stretch line above the latest reading is drawn
 * outside the box), it has no band between two references, and its reference
 * labels sit above the line rather than beside it.
 *
 * So this is a lab wrapper, not a fork. HARDEN-STEP PROMOTION: `Sparkline`
 * wants an explicit `domain` (x range and y range), a two-reference `band`, and
 * right-edge reference labels. Two consumers justify it — this unit and
 * `GoalTrajectoryChart`, whose 1200x340 hero chart already carries its own
 * `BandColumn`/`EdgeSegment` geometry that this duplicates at card scale.
 *
 * Geometry is a pure exported function with its own View-based renderer, which
 * is the house pattern for this family (`GoalTrajectoryChartGeometry.ts`) —
 * none of the titan charts use react-native-svg.
 */
import { View } from 'react-native'

import { Typography } from '../../components/custom/Typography'
import { useSurfaceMode } from '../../components/ui/surface'
import { getSemanticColors } from '../../theme/tokens/semantic'
import { alpha } from '../../utils/colors'

export interface GoalActual {
  /** Meso week this reading falls in, 1-based. */
  week: number
  value: number
}

/** Where the committed/stretch numbers are written. */
export type BandLabelPlacement = 'gutter' | 'inline'

export interface GoalBandSparkGeometryInput {
  actuals: GoalActual[]
  committed: number
  stretch: number
  /** The week the goal is due — the right edge of the x domain. */
  goalWeek: number
  width: number
  height: number
  /** Width reserved to the right of the plot for the labels; 0 when inline. */
  labelGutter: number
}

export interface SparkSegment {
  left: number
  top: number
  length: number
  angle: number
}

export interface GoalBandSparkGeometry {
  plotWidth: number
  committedY: number
  stretchY: number
  bandTop: number
  bandHeight: number
  segments: SparkSegment[]
  last: { x: number; y: number } | null
}

/** Vertical breathing room so a line at the domain edge is not clipped. */
const PLOT_INSET_Y = 3

/** Fraction of the value span padded onto each end of the y domain. */
const Y_PAD_RATIO = 0.08

/**
 * The x domain is week 1 to `goalWeek` and the y domain spans the actuals AND
 * both targets, which is the whole point: the elapsed readings occupy the left
 * part of the plot and the band runs the full width, so the gap left to close
 * is legible as distance rather than implied.
 */
export function deriveGoalBandSparkGeometry(
  input: GoalBandSparkGeometryInput
): GoalBandSparkGeometry {
  const { actuals, committed, stretch, goalWeek, width, height, labelGutter } = input
  const plotWidth = Math.max(0, width - labelGutter)

  const values = [...actuals.map((a) => a.value), committed, stretch]
  const rawLo = Math.min(...values)
  const rawHi = Math.max(...values)
  const span = rawHi - rawLo
  const pad = span === 0 ? 1 : span * Y_PAD_RATIO
  const lo = rawLo - pad
  const hi = rawHi + pad

  const plotTop = PLOT_INSET_Y
  const plotHeight = Math.max(1, height - PLOT_INSET_Y * 2)
  const y = (value: number) => plotTop + ((hi - value) / (hi - lo)) * plotHeight

  const lastWeek = Math.max(goalWeek, 1)
  const x = (week: number) =>
    lastWeek <= 1 ? 0 : ((Math.min(week, lastWeek) - 1) / (lastWeek - 1)) * plotWidth

  const points = actuals.map((actual) => ({ x: x(actual.week), y: y(actual.value) }))
  const segments: SparkSegment[] = []
  for (let i = 1; i < points.length; i += 1) {
    const from = points[i - 1]
    const to = points[i]
    if (from === undefined || to === undefined) continue
    const dx = to.x - from.x
    const dy = to.y - from.y
    segments.push({
      left: from.x,
      top: from.y,
      length: Math.sqrt(dx * dx + dy * dy),
      angle: Math.atan2(dy, dx) * (180 / Math.PI),
    })
  }

  const committedY = y(committed)
  const stretchY = y(stretch)

  return {
    plotWidth,
    committedY,
    stretchY,
    bandTop: Math.min(committedY, stretchY),
    bandHeight: Math.abs(stretchY - committedY),
    segments,
    last: points[points.length - 1] ?? null,
  }
}

export interface GoalBandSparkProps {
  actuals: GoalActual[]
  committed: number
  stretch: number
  goalWeek: number
  unit: string
  width: number
  height: number
  /** `true` paints the trend line as a regression rather than progress. */
  isRegressing: boolean
  placement: BandLabelPlacement
}

/** Room for "110 kg" beside the plot. Chart geometry, not a spacing token. */
const LABEL_GUTTER = 46

/** Lifts an inline label clear of the line it names. */
const INLINE_LABEL_RISE = 11

/** Half a label's line box, so a gutter label centres on its line. */
const LABEL_HALF_HEIGHT = 6

function BandLabel({
  value,
  unit,
  top,
  left,
  align,
}: {
  value: number
  unit: string
  top: number
  left?: number
  align: 'left' | 'right'
}) {
  return (
    <View
      style={{
        position: 'absolute',
        top,
        ...(left === undefined ? { right: 0 } : { left }),
        alignItems: align === 'right' ? 'flex-end' : 'flex-start',
      }}
      accessibilityElementsHidden
    >
      <Typography variant="microLabel" color="tertiary">
        {`${value}${unit}`}
      </Typography>
    </View>
  )
}

/**
 * The trajectory at card scale: a shaded band between committed and stretch
 * running the full meso, both edges labelled with their target load, and the
 * actuals occupying only the elapsed part of the x domain.
 */
export function GoalBandSpark({
  actuals,
  committed,
  stretch,
  goalWeek,
  unit,
  width,
  height,
  isRegressing,
  placement,
}: GoalBandSparkProps) {
  const mode = useSurfaceMode()
  const t = getSemanticColors(mode)

  const labelGutter = placement === 'gutter' ? LABEL_GUTTER : 0
  const g = deriveGoalBandSparkGeometry({
    actuals,
    committed,
    stretch,
    goalWeek,
    width,
    height,
    labelGutter,
  })

  const lineColor = isRegressing ? t['result-degrade'] : t['result-improve']
  const edgeColor = t['text-tertiary']

  return (
    <View style={{ width, height, position: 'relative' }} testID="goal-band-spark">
      <View
        style={{
          position: 'absolute',
          left: 0,
          top: g.bandTop,
          width: g.plotWidth,
          height: g.bandHeight,
          backgroundColor: alpha(edgeColor, 0.16),
        }}
        accessibilityElementsHidden
        testID="goal-band-spark-band"
      />

      {[g.committedY, g.stretchY].map((top, index) => (
        <View
          key={`edge-${index}`}
          style={{
            position: 'absolute',
            left: 0,
            top,
            width: g.plotWidth,
            height: 0,
            borderTopWidth: 1,
            borderStyle: 'dashed',
            borderTopColor: alpha(edgeColor, 0.55),
          }}
          accessibilityElementsHidden
          testID={`goal-band-spark-edge-${index}`}
        />
      ))}

      {g.segments.map((segment, index) => (
        <View
          key={`segment-${index}`}
          style={{
            position: 'absolute',
            left: segment.left,
            top: segment.top,
            width: segment.length,
            height: 1.5,
            backgroundColor: lineColor,
            transformOrigin: '0 0',
            transform: [{ rotate: `${segment.angle}deg` }],
          }}
          accessibilityElementsHidden
        />
      ))}

      {g.last !== null && (
        <View
          style={{
            position: 'absolute',
            // optical: centres the 5px dot on the final point rather than hanging it off.
            left: g.last.x - 2.5,
            top: g.last.y - 2.5,
            width: 5,
            height: 5,
            borderRadius: 9999,
            backgroundColor: lineColor,
          }}
          accessibilityElementsHidden
        />
      )}

      {placement === 'gutter' ? (
        <>
          <BandLabel
            value={committed}
            unit={unit}
            top={g.committedY - LABEL_HALF_HEIGHT}
            left={g.plotWidth}
            align="left"
          />
          <BandLabel
            value={stretch}
            unit={unit}
            top={g.stretchY - LABEL_HALF_HEIGHT}
            left={g.plotWidth}
            align="left"
          />
        </>
      ) : (
        <>
          <BandLabel
            value={committed}
            unit={unit}
            top={g.committedY - INLINE_LABEL_RISE}
            align="right"
          />
          <BandLabel
            value={stretch}
            unit={unit}
            top={g.stretchY - INLINE_LABEL_RISE}
            align="right"
          />
        </>
      )}
    </View>
  )
}
