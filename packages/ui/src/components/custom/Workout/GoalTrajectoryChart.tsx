// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { useMemo, type ReactNode } from 'react'
import { View, Text, type ViewProps } from 'react-native'
import { cn } from '../../../utils/cn'
import { getSemanticColors, type ThemeMode } from '../../../theme/tokens/semantic'
import { alpha } from '../../../utils/colors'
import { roundWeight } from '../../../utils/workout-format'
import { useSurfaceMode, useOnSurfaceColor } from '../../ui/surface'
import {
  deriveTrajectoryGeometry,
  type EdgeSegment,
  type GoalActualPoint,
  type GoalDirection,
  type GoalExpectedPoint,
  type GoalTrajectoryGeometry,
  type GoalTrajectoryStatus,
  type GoalTrajectoryWeek,
} from './GoalTrajectoryChartGeometry'

export type {
  GoalActualPoint,
  GoalDirection,
  GoalExpectedPoint,
  GoalTrajectoryStatus,
  GoalTrajectoryWeek,
} from './GoalTrajectoryChartGeometry'

/**
 * Status tone tokens.
 *
 * `ahead` takes the BRAND tone, never warning-amber: amber is the pacing/PR hue,
 * and painting "better than asked" in the warning colour is the collision
 * REJECTED.md records under "amber holds". MesoStatusCard's `info` badge made the
 * same call for the same reason.
 *
 * These are the existing semantic status tokens. When the `dataviz-*` semantic
 * keys land (PR #219) the chart-specific entries should move onto them; the map
 * is the single place that swap has to happen.
 */
const STATUS_TOKEN = {
  on_track: 'status-success',
  ahead: 'brand-primary',
  behind: 'status-warning',
  tolerated: 'status-info',
  deload_week: 'result-neutral',
  calibrating: 'result-inconclusive',
  stalled: 'status-error',
} as const satisfies Record<GoalTrajectoryStatus, keyof ReturnType<typeof getSemanticColors>>

const STATUS_LABEL: Record<GoalTrajectoryStatus, string> = {
  on_track: 'On track',
  ahead: 'Ahead',
  behind: 'Behind',
  tolerated: 'Tolerated',
  deload_week: 'Deload week',
  calibrating: 'Calibrating',
  stalled: 'Stalled',
}

/** Above this width the chart renders at wall density (across-the-room scale). */
const WALL_BREAKPOINT = 720

interface Density {
  dot: number
  star: number
  axisFont: number
  ruleLabelFont: number
  pillFont: number
  stroke: number
}

const DENSITY: Record<'phone' | 'wall', Density> = {
  phone: { dot: 7, star: 12, axisFont: 9, ruleLabelFont: 9, pillFont: 10, stroke: 2 },
  wall: { dot: 11, star: 20, axisFont: 14, ruleLabelFont: 13, pillFont: 16, stroke: 3.5 },
}

/** Literal-hex palette for one theme mode. Resolved at render, never at import. */
function trajectoryPalette(mode: ThemeMode, status: GoalTrajectoryStatus) {
  const t = getSemanticColors(mode)
  const band = t['brand-secondary']
  return {
    status: t[STATUS_TOKEN[status]],
    bandFill: alpha(band, 0.12),
    bandEdge: alpha(band, 0.45),
    committed: t['brand-primary'],
    stretch: alpha(t['brand-primary'], 0.55),
    star: t['status-warning'],
    deload: alpha(t['text-tertiary'], 0.1),
    boundary: alpha(t['text-tertiary'], 0.35),
    dotRing: t['text-primary'],
  }
}

export interface GoalTrajectoryChartProps extends ViewProps {
  /** Expected band per planned week. `low` is the committed edge, `high` the stretch edge. */
  expected: GoalExpectedPoint[]
  /** Committed target value — the low edge of the honest band (plan §1.7). */
  committed: number
  /** Stretch target value — the high edge. */
  stretch: number
  /** Measured values, placed by `weekIndex` or by `ts` against week start dates. */
  actuals: GoalActualPoint[]
  /** Planned weeks; `isDeload` flattens the band and shades the column. */
  weeks: GoalTrajectoryWeek[]
  /** Week indices where a mesocycle boundary falls. */
  mesoBoundaries?: number[]
  /** Read-model status; drives the actual line's tone and the status pill. */
  status: GoalTrajectoryStatus
  /** Which way "better" points. `down` is a loss goal (low > high numerically). */
  direction?: GoalDirection
  /** Chart plot width in px (360 phone, 1200 wall). */
  width: number
  /** Chart plot height in px. */
  height: number
  /** Unit suffix for value labels, e.g. "lbs". */
  unit?: string
  /** Metric name for the accessible summary, e.g. "Bench top load". */
  metricLabel?: string
  className?: string
}

function RotatedLine({
  segment,
  color,
  strokeWidth,
  dashed,
  testID,
}: {
  segment: EdgeSegment
  color: string
  strokeWidth: number
  dashed?: boolean
  testID: string
}): ReactNode {
  return (
    <View
      testID={testID}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        {
          position: 'absolute',
          left: segment.left,
          top: segment.top,
          width: segment.length,
          transformOrigin: '0 0',
          transform: [{ rotate: `${segment.angle}deg` }],
        },
        dashed
          ? { height: 0, borderTopWidth: strokeWidth, borderStyle: 'dashed', borderTopColor: color }
          : { height: strokeWidth, borderRadius: strokeWidth / 2, backgroundColor: color },
      ]}
    />
  )
}

function summarize(
  status: GoalTrajectoryStatus,
  geometry: GoalTrajectoryGeometry,
  committed: number,
  stretch: number,
  unit: string,
  metricLabel: string
): string {
  const latest = geometry.actuals[geometry.actuals.length - 1]
  const current = latest
    ? `Latest ${String(roundWeight(latest.value))} ${unit} at week ${String(Math.round(latest.weekIndex))}.`
    : 'No measured values yet.'
  const prs = geometry.prStars.length
  return (
    `${metricLabel} trajectory chart. Status: ${STATUS_LABEL[status]}. ` +
    `Committed ${String(roundWeight(committed))} ${unit}, stretch ${String(roundWeight(stretch))} ${unit}. ` +
    `${current} ${String(prs)} personal record${prs === 1 ? '' : 's'}.`
  )
}

/**
 * Goal trajectory over a block: the coach's expected band as a shaded polygon,
 * the committed and stretch rules, the athlete's actual line with PR stars,
 * meso boundary rules and deload shading.
 *
 * Drawn with absolutely-positioned Views (no SVG), the technique CapacityBandChart
 * and StrengthTrendChart share. All geometry comes from `deriveTrajectoryGeometry`,
 * which orders the band in pixel space so a LOSS goal (`low` numerically greater
 * than `high`, e.g. bodyweight in a fat-loss phase) draws identically to a gain goal.
 *
 * @example
 * <GoalTrajectoryChart
 *   expected={[{ weekIndex: 1, low: 178, high: 182 }, { weekIndex: 6, low: 185, high: 195 }]}
 *   committed={185}
 *   stretch={195}
 *   actuals={[{ weekIndex: 1, value: 175 }, { weekIndex: 4, value: 185, isPR: true }]}
 *   weeks={[{ index: 1 }, { index: 5, isDeload: true }, { index: 6 }]}
 *   mesoBoundaries={[6]}
 *   status="on_track"
 *   width={1200}
 *   height={340}
 * />
 */
export function GoalTrajectoryChart({
  expected,
  committed,
  stretch,
  actuals,
  weeks,
  mesoBoundaries = [],
  status,
  direction = 'up',
  width,
  height,
  unit = 'lbs',
  metricLabel = 'Goal',
  className,
  ...props
}: GoalTrajectoryChartProps) {
  const mode = useSurfaceMode()
  const axisColor = useOnSurfaceColor('tertiary')
  const palette = trajectoryPalette(mode, status)
  const density = width >= WALL_BREAKPOINT ? DENSITY.wall : DENSITY.phone

  const geometry = useMemo(
    () =>
      deriveTrajectoryGeometry({
        expected,
        committed,
        stretch,
        actuals,
        weeks,
        mesoBoundaries,
        width,
        height,
      }),
    [expected, committed, stretch, actuals, weeks, mesoBoundaries, width, height]
  )

  if (!geometry.hasBand && !geometry.hasActuals) {
    return (
      <View
        style={{ width, height }}
        className={cn('items-center justify-center', className)}
        accessibilityRole="image"
        accessibilityLabel={`${metricLabel} trajectory chart. Calibrating: not enough matched sessions to draw a band yet.`}
        testID="goal-trajectory-chart-empty"
        {...props}
      >
        <Text
          style={{
            color: axisColor,
            fontSize: density.axisFont + 3,
            fontFamily: 'Inter, sans-serif',
          }}
        >
          Calibrating — no band yet
        </Text>
      </View>
    )
  }

  const ariaLabel = summarize(status, geometry, committed, stretch, unit, metricLabel)
  const axisWeeks = weeks.length > 0 ? weeks : expected.map((p) => ({ index: p.weekIndex }))
  const weekStride = Math.max(1, Math.ceil(axisWeeks.length / (width >= WALL_BREAKPOINT ? 12 : 6)))

  return (
    <View style={{ width }} className={cn(className)} testID="goal-trajectory-chart" {...props}>
      <View style={{ width, height, position: 'relative' }}>
        <View
          style={{ position: 'absolute', top: 0, left: 0, width, height }}
          accessibilityRole="image"
          accessibilityLabel={ariaLabel}
          testID="goal-trajectory-chart-canvas"
        >
          {/* Deload shading sits underneath everything: it marks weeks the plan
              did not ask for progress in, so the band above it runs flat. */}
          {geometry.deloadRects.map((rect) => (
            <View
              key={`deload-${rect.weekIndex}`}
              testID="goal-trajectory-chart-deload"
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              style={{
                position: 'absolute',
                left: rect.x,
                top: geometry.plot.top,
                width: rect.width,
                height: geometry.plot.bottom - geometry.plot.top,
                backgroundColor: palette.deload,
              }}
            />
          ))}

          <View testID="goal-trajectory-chart-band">
            {geometry.bandColumns.map((column, i) => (
              <View
                key={`band-${i}`}
                testID="goal-trajectory-chart-band-cell"
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
                style={{
                  position: 'absolute',
                  left: column.x,
                  top: column.top,
                  width: 4.5,
                  height: column.height,
                  backgroundColor: palette.bandFill,
                }}
              />
            ))}
          </View>

          {geometry.bandTopEdge.map((segment, i) => (
            <RotatedLine
              key={`band-top-${i}`}
              segment={segment}
              color={palette.bandEdge}
              strokeWidth={1.5}
              testID="goal-trajectory-chart-band-edge-top"
            />
          ))}
          {geometry.bandBottomEdge.map((segment, i) => (
            <RotatedLine
              key={`band-bottom-${i}`}
              segment={segment}
              color={palette.bandEdge}
              strokeWidth={1.5}
              testID="goal-trajectory-chart-band-edge-bottom"
            />
          ))}

          {/* Meso boundary rules — a full-height dashed guide per boundary week. */}
          {geometry.boundaries.map((boundary) => (
            <View
              key={`boundary-${boundary.weekIndex}`}
              testID="goal-trajectory-chart-meso-boundary"
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              style={{
                position: 'absolute',
                left: boundary.x,
                top: 0,
                width: 0,
                height,
                borderLeftWidth: 1,
                borderStyle: 'dashed',
                borderLeftColor: palette.boundary,
              }}
            />
          ))}

          {/* Committed (solid) and stretch (dashed) rules. Both are displayed,
              always — the shown band is never moved to match (audit B55). */}
          <View
            testID="goal-trajectory-chart-committed-line"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={{
              position: 'absolute',
              left: geometry.plot.left,
              width: geometry.plot.right - geometry.plot.left,
              top: geometry.committedY,
              height: 1.5,
              backgroundColor: palette.committed,
            }}
          />
          <View
            testID="goal-trajectory-chart-stretch-line"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={{
              position: 'absolute',
              left: geometry.plot.left,
              width: geometry.plot.right - geometry.plot.left,
              top: geometry.stretchY,
              height: 0,
              borderTopWidth: 1.5,
              borderStyle: 'dashed',
              borderTopColor: palette.stretch,
            }}
          />
          <Text
            testID="goal-trajectory-chart-committed-label"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={{
              position: 'absolute',
              left: geometry.plot.left + 4,
              top: geometry.committedY + 2,
              color: palette.committed,
              fontSize: density.ruleLabelFont,
              fontFamily: 'Inter, sans-serif',
            }}
          >
            {`Committed ${String(roundWeight(committed))}`}
          </Text>
          <Text
            testID="goal-trajectory-chart-stretch-label"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={{
              position: 'absolute',
              left: geometry.plot.left + 4,
              top: geometry.stretchY - density.ruleLabelFont - 4,
              color: palette.stretch,
              fontSize: density.ruleLabelFont,
              fontFamily: 'Inter, sans-serif',
            }}
          >
            {`Stretch ${String(roundWeight(stretch))}`}
          </Text>

          {geometry.actualSegments.map((segment, i) => (
            <RotatedLine
              key={`actual-${i}`}
              segment={segment}
              color={palette.status}
              strokeWidth={density.stroke}
              testID="goal-trajectory-chart-actual-segment"
            />
          ))}

          {geometry.actuals.map((coord) => (
            <View
              key={`dot-${coord.index}`}
              testID="goal-trajectory-chart-actual-dot"
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              style={{
                position: 'absolute',
                left: coord.x - density.dot / 2,
                top: coord.y - density.dot / 2,
                width: density.dot,
                height: density.dot,
                borderRadius: density.dot / 2,
                borderWidth: 2,
                borderColor: coord.matched ? palette.dotRing : palette.status,
                backgroundColor: coord.matched ? palette.status : 'transparent',
              }}
            />
          ))}

          {geometry.prStars.map((coord) => (
            <Text
              key={`star-${coord.index}`}
              testID="goal-trajectory-chart-pr-star"
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              style={{
                position: 'absolute',
                left: coord.x - density.star / 2,
                top: coord.y - density.star - density.dot,
                width: density.star,
                textAlign: 'center',
                fontSize: density.star,
                color: palette.star,
              }}
            >
              ★
            </Text>
          ))}

          {/* Week axis. */}
          {axisWeeks.map((week, i) =>
            i % weekStride === 0 || i === axisWeeks.length - 1 ? (
              <Text
                key={`week-${week.index}`}
                testID="goal-trajectory-chart-week-label"
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
                style={{
                  position: 'absolute',
                  left: geometry.toX(week.index) - 16,
                  top: geometry.plot.bottom + 4,
                  width: 32,
                  textAlign: 'center',
                  color: axisColor,
                  fontSize: density.axisFont,
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                {`w${String(week.index)}`}
              </Text>
            ) : null
          )}
        </View>
      </View>

      {/* Status pill + legend. */}
      <View
        className="flex-row items-center flex-wrap"
        style={{ marginTop: 8, gap: 12 }}
        testID="goal-trajectory-chart-legend"
      >
        <View
          testID="goal-trajectory-chart-status-pill"
          accessibilityLabel={`Goal status: ${STATUS_LABEL[status]}`}
          style={{
            paddingVertical: 3,
            paddingHorizontal: 8,
            borderRadius: 4,
            borderWidth: 1,
            backgroundColor: alpha(palette.status, 0.15),
            borderColor: alpha(palette.status, 0.3),
          }}
        >
          <Text
            style={{
              color: palette.status,
              fontSize: density.pillFont,
              fontFamily: 'Inter, sans-serif',
              fontWeight: '600',
            }}
          >
            {STATUS_LABEL[status]}
          </Text>
        </View>

        <View className="flex-row items-center" style={{ gap: 5 }}>
          <View
            style={{
              width: 14,
              height: 8,
              backgroundColor: palette.bandFill,
              borderWidth: 1,
              borderColor: palette.bandEdge,
            }}
          />
          <Text
            style={{
              color: axisColor,
              fontSize: density.pillFont,
              fontFamily: 'Inter, sans-serif',
            }}
          >
            {direction === 'down' ? 'Expected (loss)' : 'Expected'}
          </Text>
        </View>
        <View className="flex-row items-center" style={{ gap: 5 }}>
          <View style={{ width: 14, height: 2, backgroundColor: palette.committed }} />
          <Text
            style={{
              color: axisColor,
              fontSize: density.pillFont,
              fontFamily: 'Inter, sans-serif',
            }}
          >
            Committed
          </Text>
        </View>
        <View className="flex-row items-center" style={{ gap: 5 }}>
          <View
            style={{
              width: 14,
              height: 0,
              borderTopWidth: 2,
              borderStyle: 'dashed',
              borderTopColor: palette.stretch,
            }}
          />
          <Text
            style={{
              color: axisColor,
              fontSize: density.pillFont,
              fontFamily: 'Inter, sans-serif',
            }}
          >
            Stretch
          </Text>
        </View>
        <View className="flex-row items-center" style={{ gap: 5 }}>
          <Text style={{ color: palette.star, fontSize: density.pillFont + 2 }}>★</Text>
          <Text
            style={{
              color: axisColor,
              fontSize: density.pillFont,
              fontFamily: 'Inter, sans-serif',
            }}
          >
            PR
          </Text>
        </View>
        {geometry.deloadRects.length > 0 && (
          <View className="flex-row items-center" style={{ gap: 5 }}>
            <View style={{ width: 14, height: 8, backgroundColor: palette.deload }} />
            <Text
              style={{
                color: axisColor,
                fontSize: density.pillFont,
                fontFamily: 'Inter, sans-serif',
              }}
            >
              Deload
            </Text>
          </View>
        )}
      </View>
    </View>
  )
}
