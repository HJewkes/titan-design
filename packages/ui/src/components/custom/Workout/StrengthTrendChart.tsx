// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { useEffect, useMemo, useState } from 'react'
import { View, Text, Pressable, Animated, Easing, type ViewProps } from 'react-native'
import { cn } from '../../../utils/cn'

const BRAND_PRIMARY = '#FF7900'
const TEXT_PRIMARY = '#F3F4F6'
const TEXT_SECONDARY = '#9CA3AF'
const TEXT_TERTIARY = '#6B7280'
const BORDER_STRONG = '#2C2C2C'
const STATUS_SUCCESS = '#14B8A6'
const STATUS_ERROR = '#D14343'
const STATUS_WARNING = '#FFB020'
const GRID_LINE = 'rgba(255,255,255,0.06)'
const TOOLTIP_BG = 'rgba(28,28,28,0.95)'
const SUCCESS_PILL_BG = 'rgba(20,184,166,0.10)'
const SUCCESS_PILL_BORDER = 'rgba(20,184,166,0.20)'
const ERROR_PILL_BG = 'rgba(209,67,67,0.10)'
const ERROR_PILL_BORDER = 'rgba(209,67,67,0.20)'

/** Left gutter reserved for y-axis value labels. */
const PLOT_LEFT = 26
/** Approximate tooltip width used for edge clamping. */
const TOOLTIP_WIDTH = 124

export interface StrengthTrendDataPoint {
  /** ISO date string for the session. */
  date: string
  /** Estimated one-rep max in the chart's unit. */
  e1rm: number
  /** Marks a personal-record session (rendered with a star). */
  isPR?: boolean
  /** Optional human label shown in the tooltip instead of the raw date. */
  sessionLabel?: string
}

export interface StrengthTrendChartMesoBoundary {
  /** ISO date where the mesocycle boundary falls. */
  date: string
  /** Short label, e.g. "Hypertrophy". */
  label: string
}

export interface StrengthTrendChartProps extends ViewProps {
  /** Actual e1RM data points, chronological. */
  data: StrengthTrendDataPoint[]
  /** Projected/planned e1RM trajectory, drawn as a dashed line. */
  projection?: StrengthTrendDataPoint[]
  /** Chart plot width in pixels. */
  width: number
  /** Chart plot height in pixels (120-160 for the compact variant). */
  height: number
  /** Mesocycle boundary markers (vertical guides + labels). */
  mesoBoundaries?: StrengthTrendChartMesoBoundary[]
  /** Called when an actual data point is tapped. */
  onPointPress?: (point: StrengthTrendDataPoint) => void
  /** Unit for display and labels. */
  unit: 'lbs' | 'kg'
  /** Animate the left-to-right line draw on mount (default true). */
  animateOnMount?: boolean
  className?: string
}

interface Coord {
  x: number
  y: number
  point: StrengthTrendDataPoint
  index: number
}

interface Geometry {
  hasData: boolean
  toX: (time: number) => number
  toY: (value: number) => number
  actual: Coord[]
  projection: Coord[]
  gridLines: Array<{ y: number; label: string }>
  boundaries: Array<{ x: number; label: string }>
}

function timeOf(dateStr: string): number {
  const t = Date.parse(dateStr)
  return Number.isNaN(t) ? 0 : t
}

function formatValue(value: number): string {
  return `${Math.round(value)}`
}

function buildGeometry(
  data: StrengthTrendDataPoint[],
  projection: StrengthTrendDataPoint[],
  boundaries: StrengthTrendChartMesoBoundary[],
  width: number,
  height: number,
): Geometry {
  const values = [...data, ...projection].map((p) => p.e1rm)
  // Empty state keys off actual data only: a projection with no measured
  // sessions still shows the placeholder rather than a "Current: 0" chart.
  if (data.length === 0) {
    return {
      hasData: false,
      toX: () => 0,
      toY: () => 0,
      actual: [],
      projection: [],
      gridLines: [],
      boundaries: [],
    }
  }

  const times = [
    ...data.map((p) => timeOf(p.date)),
    ...projection.map((p) => timeOf(p.date)),
    ...boundaries.map((b) => timeOf(b.date)),
  ]
  const tMin = Math.min(...times)
  const tMaxRaw = Math.max(...times)
  const tMax = tMaxRaw === tMin ? tMin + 1 : tMaxRaw

  const yMin = Math.min(...values)
  const yMax = Math.max(...values)
  const range = yMax - yMin || Math.max(1, yMax * 0.1)
  const padV = range * 0.15
  const domainMin = yMin - padV
  const domainMax = yMax + padV

  const innerW = Math.max(1, width - PLOT_LEFT)
  const toX = (time: number) =>
    PLOT_LEFT + ((time - tMin) / (tMax - tMin)) * innerW
  const toY = (value: number) =>
    height - ((value - domainMin) / (domainMax - domainMin)) * height

  const project = (points: StrengthTrendDataPoint[]): Coord[] =>
    points.map((point, index) => ({
      x: toX(timeOf(point.date)),
      y: toY(point.e1rm),
      point,
      index,
    }))

  const tickValues = Array.from(
    new Set([yMax, (yMin + yMax) / 2, yMin].map((v) => Math.round(v))),
  )
  const gridLines = tickValues.map((v) => ({ y: toY(v), label: formatValue(v) }))

  return {
    hasData: true,
    toX,
    toY,
    actual: project(data),
    projection: project(projection),
    gridLines,
    boundaries: boundaries.map((b) => ({
      x: toX(timeOf(b.date)),
      label: b.label,
    })),
  }
}

function computeTrend(
  data: StrengthTrendDataPoint[],
  boundaries: StrengthTrendChartMesoBoundary[],
): { percent: number; positive: boolean } {
  if (data.length < 2) return { percent: 0, positive: true }
  let series = data
  if (boundaries.length > 0) {
    const lastBoundary = Math.max(...boundaries.map((b) => timeOf(b.date)))
    const filtered = data.filter((p) => timeOf(p.date) >= lastBoundary)
    // The pill is labelled "this meso"; if the current meso has <2 points
    // there is no meso trend to show — stay neutral rather than silently
    // reporting the whole-series change under a "this meso" label.
    if (filtered.length < 2) return { percent: 0, positive: true }
    series = filtered
  }
  const first = series[0].e1rm
  const last = series[series.length - 1].e1rm
  const percent = first ? ((last - first) / first) * 100 : 0
  return { percent, positive: percent >= 0 }
}

function ChartLine({
  coords,
  color,
  strokeWidth,
  dashed,
  testID,
}: {
  coords: Coord[]
  color: string
  strokeWidth: number
  dashed?: boolean
  testID: string
}) {
  return (
    <>
      {coords.map((c, i) => {
        if (i === 0) return null
        const prev = coords[i - 1]
        const dx = c.x - prev.x
        const dy = c.y - prev.y
        const length = Math.sqrt(dx * dx + dy * dy)
        const angle = Math.atan2(dy, dx) * (180 / Math.PI)
        return (
          <View
            key={`${testID}-${i}`}
            testID={testID}
            accessibilityElementsHidden
            style={[
              {
                position: 'absolute',
                left: prev.x,
                top: prev.y,
                width: length,
                transformOrigin: '0 0',
                transform: [{ rotate: `${angle}deg` }],
              },
              dashed
                ? {
                    height: 0,
                    borderTopWidth: strokeWidth,
                    borderStyle: 'dashed',
                    borderTopColor: color,
                  }
                : {
                    height: strokeWidth,
                    borderRadius: strokeWidth / 2,
                    backgroundColor: color,
                  },
            ]}
          />
        )
      })}
    </>
  )
}

/**
 * Estimated-1RM line chart over time with an optional dashed plan-projection
 * line and PR star markers. Rendered entirely with absolutely-positioned
 * Views (no SVG), following the Sparkline approach. Tapping an actual point
 * opens a tooltip and fires `onPointPress`. A trend pill below the chart
 * summarizes the percentage change for the current mesocycle.
 *
 * @example
 * <StrengthTrendChart
 *   data={[{ date: '2026-01-01', e1rm: 225 }, { date: '2026-02-01', e1rm: 245, isPR: true }]}
 *   projection={[{ date: '2026-02-01', e1rm: 245 }, { date: '2026-03-01', e1rm: 260 }]}
 *   width={320}
 *   height={150}
 *   unit="lbs"
 * />
 */
export function StrengthTrendChart({
  data,
  projection = [],
  width,
  height,
  mesoBoundaries = [],
  onPointPress,
  unit,
  animateOnMount = true,
  className,
  ...props
}: StrengthTrendChartProps) {
  const geometry = useMemo(
    () => buildGeometry(data, projection, mesoBoundaries, width, height),
    [data, projection, mesoBoundaries, width, height],
  )
  const trend = useMemo(
    () => computeTrend(data, mesoBoundaries),
    [data, mesoBoundaries],
  )

  const [reveal] = useState(() => new Animated.Value(animateOnMount ? 0 : 1))
  const [selected, setSelected] = useState<number | null>(null)

  useEffect(() => {
    if (!animateOnMount) return
    const animation = Animated.timing(reveal, {
      toValue: 1,
      duration: 600,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    })
    animation.start()
    return () => animation.stop()
  }, [animateOnMount, reveal])

  const current = data.length > 0 ? data[data.length - 1].e1rm : 0
  const trendSign = trend.percent >= 0 ? '+' : '-'
  const trendText = `${trendSign}${Math.abs(trend.percent).toFixed(1)}% this meso`
  const ariaLabel = geometry.hasData
    ? `Strength trend chart showing estimated one rep max over time. Current: ${formatValue(current)} ${unit}. Trend: ${trendSign}${Math.abs(trend.percent).toFixed(1)}%`
    : 'Strength trend chart, no data'

  if (!geometry.hasData) {
    return (
      <View
        style={{ width }}
        className={cn(className)}
        accessibilityRole="image"
        accessibilityLabel={ariaLabel}
        testID="strength-trend-chart-empty"
        {...props}
      >
        <View
          style={{
            width,
            height,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 12, fontFamily: 'Inter, sans-serif', color: TEXT_TERTIARY }}>
            No strength data yet
          </Text>
        </View>
      </View>
    )
  }

  const revealWidth = reveal.interpolate({
    inputRange: [0, 1],
    outputRange: [0, width],
  })

  const selectedCoord =
    selected != null ? geometry.actual[selected] : undefined

  return (
    <View
      style={{ width }}
      className={cn(className)}
      testID="strength-trend-chart"
      {...props}
    >
      <View style={{ width, height, position: 'relative' }}>
        {/* Labelled, non-interactive chart canvas (grid + lines + markers). */}
        <View
          style={{ position: 'absolute', top: 0, left: 0, width, height }}
          accessibilityRole="image"
          accessibilityLabel={ariaLabel}
          testID="strength-trend-chart-canvas"
        >
          {geometry.gridLines.map((line, i) => (
            <View
              key={`grid-${i}`}
              accessibilityElementsHidden
              testID="strength-trend-chart-gridline"
              style={{
                position: 'absolute',
                left: PLOT_LEFT,
                right: 0,
                top: line.y,
                height: 1,
                backgroundColor: GRID_LINE,
              }}
            >
              <Text
                style={{
                  position: 'absolute',
                  left: -PLOT_LEFT,
                  top: -6,
                  width: PLOT_LEFT - 4,
                  textAlign: 'right',
                  fontSize: 9,
                  fontFamily: 'Inter, sans-serif',
                  color: TEXT_TERTIARY,
                }}
              >
                {line.label}
              </Text>
            </View>
          ))}

          {geometry.boundaries.map((boundary, i) => (
            <View
              key={`boundary-${i}`}
              accessibilityElementsHidden
              testID="strength-trend-chart-meso-boundary"
              style={{
                position: 'absolute',
                left: boundary.x,
                top: 0,
                width: 0,
                height,
                borderLeftWidth: 1,
                borderStyle: 'dashed',
                borderLeftColor: 'rgba(255,255,255,0.10)',
              }}
            />
          ))}

          <Animated.View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: revealWidth,
              height,
              overflow: 'hidden',
            }}
            testID="strength-trend-chart-reveal"
          >
            <View style={{ width, height, position: 'absolute', top: 0, left: 0 }}>
              <ChartLine
                coords={geometry.projection}
                color={TEXT_TERTIARY}
                strokeWidth={2}
                dashed
                testID="strength-trend-chart-projection-segment"
              />
              <ChartLine
                coords={geometry.actual}
                color={BRAND_PRIMARY}
                strokeWidth={2.5}
                testID="strength-trend-chart-actual-segment"
              />
            </View>
          </Animated.View>

          {geometry.actual.map((c) =>
            c.point.isPR ? (
              <Text
                key={`star-${c.index}`}
                accessibilityElementsHidden
                testID="strength-trend-chart-pr-star"
                style={{
                  position: 'absolute',
                  left: c.x - 7,
                  top: c.y - 20,
                  fontSize: 12,
                  color: STATUS_WARNING,
                }}
              >
                ★
              </Text>
            ) : null,
          )}
        </View>

        {/* Interactive point overlay (kept out of the image-role canvas). */}
        <View
          style={{ position: 'absolute', top: 0, left: 0, width, height }}
          testID="strength-trend-chart-points"
        >
          {geometry.actual.map((c) => {
            const label = c.point.sessionLabel ?? c.point.date
            return (
              <Pressable
                key={`point-${c.index}`}
                testID="strength-trend-chart-point"
                accessibilityRole="button"
                accessibilityLabel={`${label}: ${formatValue(c.point.e1rm)} ${unit}${c.point.isPR ? ', personal record' : ''}`}
                onPress={() => {
                  setSelected(c.index)
                  onPointPress?.(c.point)
                }}
                style={{
                  position: 'absolute',
                  left: c.x - 4,
                  top: c.y - 4,
                  width: 8,
                  height: 8,
                  borderRadius: 1,
                  backgroundColor: BRAND_PRIMARY,
                }}
              />
            )
          })}
        </View>

        {selectedCoord && (
          <View
            testID="strength-trend-chart-tooltip"
            accessibilityElementsHidden
            style={{
              position: 'absolute',
              left: Math.max(
                0,
                Math.min(width - TOOLTIP_WIDTH, selectedCoord.x - TOOLTIP_WIDTH / 2),
              ),
              top: Math.max(0, selectedCoord.y - 52),
              maxWidth: TOOLTIP_WIDTH,
              backgroundColor: TOOLTIP_BG,
              borderWidth: 1,
              borderColor: BORDER_STRONG,
              borderRadius: 8,
              paddingVertical: 8,
              paddingHorizontal: 10,
            }}
          >
            <Text
              style={{
                fontSize: 10,
                fontFamily: 'Inter, sans-serif',
                color: TEXT_TERTIARY,
              }}
            >
              {selectedCoord.point.sessionLabel ?? selectedCoord.point.date}
            </Text>
            <Text
              style={{
                marginTop: 2,
                fontSize: 13,
                fontFamily: 'Inter, sans-serif',
                fontWeight: '700',
                color: TEXT_PRIMARY,
              }}
            >
              {`${formatValue(selectedCoord.point.e1rm)} ${unit}`}
            </Text>
            {selected != null && selected > 0 && (
              <Text
                style={{
                  marginTop: 1,
                  fontSize: 10,
                  fontFamily: 'Inter, sans-serif',
                  color:
                    selectedCoord.point.e1rm - geometry.actual[selected - 1].point.e1rm >= 0
                      ? STATUS_SUCCESS
                      : STATUS_ERROR,
                }}
              >
                {`${
                  selectedCoord.point.e1rm - geometry.actual[selected - 1].point.e1rm >= 0
                    ? '+'
                    : '-'
                }${Math.abs(
                  selectedCoord.point.e1rm - geometry.actual[selected - 1].point.e1rm,
                ).toFixed(1)} ${unit}`}
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Meso boundary x-axis labels. */}
      {geometry.boundaries.length > 0 && (
        <View
          style={{ width, height: 14, position: 'relative', marginTop: 2 }}
          accessibilityElementsHidden
          testID="strength-trend-chart-axis"
        >
          {geometry.boundaries.map((boundary, i) => (
            <Text
              key={`axis-${i}`}
              testID="strength-trend-chart-axis-label"
              style={{
                position: 'absolute',
                left: boundary.x - 24,
                width: 48,
                textAlign: 'center',
                fontSize: 10,
                fontFamily: 'Inter, sans-serif',
                color: TEXT_TERTIARY,
              }}
            >
              {boundary.label}
            </Text>
          ))}
        </View>
      )}

      {/* Trend pill. */}
      <View className="flex-row" style={{ marginTop: 8 }}>
        <View
          testID="strength-trend-chart-trend-pill"
          accessibilityLabel={`Strength trend: ${trendText}`}
          style={{
            paddingVertical: 3,
            paddingHorizontal: 8,
            borderRadius: 4,
            borderWidth: 1,
            backgroundColor: trend.positive ? SUCCESS_PILL_BG : ERROR_PILL_BG,
            borderColor: trend.positive ? SUCCESS_PILL_BORDER : ERROR_PILL_BORDER,
          }}
        >
          <Text
            style={{
              fontSize: 11,
              fontFamily: 'Inter, sans-serif',
              fontWeight: '600',
              color: trend.positive ? STATUS_SUCCESS : STATUS_ERROR,
            }}
          >
            {trendText}
          </Text>
        </View>
      </View>

      {/* Legend. */}
      <View
        className="flex-row items-center"
        style={{ marginTop: 8, gap: 14 }}
        testID="strength-trend-chart-legend"
      >
        <View className="flex-row items-center" style={{ gap: 5 }}>
          <View style={{ width: 14, height: 2.5, borderRadius: 1.5, backgroundColor: BRAND_PRIMARY }} />
          <Text style={{ fontSize: 10, fontFamily: 'Inter, sans-serif', color: TEXT_SECONDARY }}>
            Actual
          </Text>
        </View>
        <View className="flex-row items-center" style={{ gap: 5 }}>
          <View
            style={{
              width: 14,
              height: 0,
              borderTopWidth: 2,
              borderStyle: 'dashed',
              borderTopColor: TEXT_TERTIARY,
            }}
          />
          <Text style={{ fontSize: 10, fontFamily: 'Inter, sans-serif', color: TEXT_SECONDARY }}>
            Projected
          </Text>
        </View>
        <View className="flex-row items-center" style={{ gap: 5 }}>
          <Text style={{ fontSize: 12, color: STATUS_WARNING }}>★</Text>
          <Text style={{ fontSize: 10, fontFamily: 'Inter, sans-serif', color: TEXT_SECONDARY }}>
            PR
          </Text>
        </View>
      </View>
    </View>
  )
}
