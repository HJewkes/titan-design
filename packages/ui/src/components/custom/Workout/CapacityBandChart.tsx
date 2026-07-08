// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { useEffect, useState, useMemo } from 'react'
import { View, Text, Pressable, Animated, Easing, type ViewProps } from 'react-native'
import { getSemanticColors } from '../../../theme/tokens/semantic'

const t = getSemanticColors('dark')

const STATUS_SUCCESS = t['status-success']
const STATUS_WARNING = t['status-warning']
const STATUS_INFO = t['status-info']
/** Dot outline: near-white ring so load dots read on the band fill and any
 *  surface (matches the MesoStatusCard gauge-marker convention). */
const DOT_BORDER = '#F3F4F6'
const BAND_FILL = 'rgba(46,213,115,0.1)'
const BAND_EDGE = 'rgba(46,213,115,0.45)'
const PROJECTION_FILL = 'rgba(46,213,115,0.05)'

const PADDING_LEFT = 28
const PADDING_RIGHT = 10
const PADDING_TOP = 8
const PADDING_BOTTOM = 16
const COLUMN_STEP = 4
const DOT_SIZE = 8

export type WorkoutDotStatus = 'within' | 'above' | 'below'

export interface CapacityBandDataPoint {
  /** ISO-ish date string (e.g. "2026-06-01"). */
  date: string
  /** Lower bound of the capacity band (MEV equivalent). */
  bandLow: number
  /** Upper bound of the capacity band (MRV equivalent). */
  bandHigh: number
}

export interface WorkoutDot {
  date: string
  /** Actual session load score. */
  load: number
  /** Position of the session relative to the band. */
  status: WorkoutDotStatus
}

export interface CapacityBandProjection {
  /** Band shape over the next days if training continues (rises). */
  withTraining: CapacityBandDataPoint[]
  /** Band shape over the next days if resting (drops). */
  withRest: CapacityBandDataPoint[]
}

export interface CapacityBandChartProps extends ViewProps {
  /** Capacity band shape over time. */
  band: CapacityBandDataPoint[]
  /** Workout sessions plotted as dots. */
  workouts: WorkoutDot[]
  /** Optional forward projection (next few days). */
  projection?: CapacityBandProjection
  /** Chart width in px. */
  width: number
  /** Chart height in px. */
  height: number
  /** Called when a workout dot is tapped. */
  onWorkoutPress?: (workout: WorkoutDot) => void
  className?: string
}

interface PixelPoint {
  x: number
  yHigh: number
  yLow: number
}

const DOT_COLORS: Record<WorkoutDotStatus, string> = {
  within: STATUS_SUCCESS,
  above: STATUS_WARNING,
  below: STATUS_INFO,
}

const STATUS_PHRASES: Record<WorkoutDotStatus, string> = {
  within: 'within range',
  above: 'above range',
  below: 'below range',
}

function parseTime(date: string): number {
  const parts = date.split('-')
  if (parts.length === 3) {
    return Date.UTC(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
  }
  const parsed = Date.parse(date)
  return Number.isNaN(parsed) ? 0 : parsed
}

function formatDate(date: string): string {
  const parts = date.split('-')
  if (parts.length === 3) return `${Number(parts[1])}/${Number(parts[2])}`
  const d = new Date(date)
  return Number.isNaN(d.getTime()) ? date : `${d.getMonth() + 1}/${d.getDate()}`
}

function toPixels(
  points: CapacityBandDataPoint[],
  toX: (date: string) => number,
  toY: (value: number) => number,
): PixelPoint[] {
  return points
    .map((p) => ({ x: toX(p.date), yHigh: toY(p.bandHigh), yLow: toY(p.bandLow) }))
    .sort((a, b) => a.x - b.x)
}

function interpEdge(pixels: PixelPoint[], x: number, key: 'yHigh' | 'yLow'): number {
  for (let i = 0; i < pixels.length - 1; i++) {
    const a = pixels[i]
    const b = pixels[i + 1]
    if (x >= a.x && x <= b.x) {
      const t = b.x === a.x ? 0 : (x - a.x) / (b.x - a.x)
      return a[key] + t * (b[key] - a[key])
    }
  }
  return pixels[pixels.length - 1][key]
}

function buildColumns(pixels: PixelPoint[], step: number) {
  if (pixels.length < 2) return []
  const start = pixels[0].x
  const end = pixels[pixels.length - 1].x
  const columns: Array<{ x: number; top: number; height: number }> = []
  for (let x = start; x < end; x += step) {
    const top = interpEdge(pixels, x, 'yHigh')
    const bottom = interpEdge(pixels, x, 'yLow')
    columns.push({ x, top, height: Math.max(0, bottom - top) })
  }
  return columns
}

function buildEdges(pixels: PixelPoint[], key: 'yHigh' | 'yLow') {
  const segments: Array<{ left: number; top: number; length: number; angle: number }> = []
  for (let i = 1; i < pixels.length; i++) {
    const a = pixels[i - 1]
    const b = pixels[i]
    const dx = b.x - a.x
    const dy = b[key] - a[key]
    segments.push({
      left: a.x,
      top: a[key],
      length: Math.sqrt(dx * dx + dy * dy),
      angle: Math.atan2(dy, dx) * (180 / Math.PI),
    })
  }
  return segments
}

function collectValues(
  band: CapacityBandDataPoint[],
  workouts: WorkoutDot[],
  projection?: CapacityBandProjection,
): number[] {
  const values: number[] = []
  band.forEach((p) => values.push(p.bandLow, p.bandHigh))
  workouts.forEach((w) => values.push(w.load))
  projection?.withTraining.forEach((p) => values.push(p.bandLow, p.bandHigh))
  projection?.withRest.forEach((p) => values.push(p.bandLow, p.bandHigh))
  return values
}

function currentStatus(workouts: WorkoutDot[]): string {
  if (workouts.length === 0) return 'no recent sessions'
  const latest = [...workouts].sort((a, b) => parseTime(b.date) - parseTime(a.date))[0]
  return STATUS_PHRASES[latest.status]
}

/**
 * Gentler-Streak-inspired fatigue visualization. Renders a shaded capacity
 * band (between a rolling MEV/MRV estimate), workout sessions as colored dots
 * positioned by load, and an optional dashed forward projection that diverges
 * for "keep training" (rises) versus "rest" (drops). View-based, no SVG:
 * the band fill is a run of vertical columns and the edges/projection are
 * rotated line Views (same technique as Sparkline).
 *
 * @example
 * <CapacityBandChart
 *   band={band}
 *   workouts={workouts}
 *   projection={{ withTraining, withRest }}
 *   width={320}
 *   height={180}
 *   onWorkoutPress={(w) => openSession(w)}
 * />
 */
export function CapacityBandChart({
  band,
  workouts,
  projection,
  width,
  height,
  onWorkoutPress,
  className,
  ...props
}: CapacityBandChartProps) {
  const [reveal] = useState(() => new Animated.Value(0))
  const dotAnims = useMemo(
    () => Array.from({ length: workouts.length }, () => new Animated.Value(0)),
    [workouts.length],
  )

  useEffect(() => {
    reveal.setValue(0)
    dotAnims.forEach((a) => a.setValue(0))
    const draw = Animated.timing(reveal, {
      toValue: 1,
      duration: 800,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    })
    const pops = dotAnims.map((a) =>
      Animated.timing(a, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      }),
    )
    const animation = Animated.sequence([draw, Animated.stagger(200, pops)])
    animation.start()
    return () => animation.stop()
  }, [reveal, dotAnims, band.length, workouts.length])

  const plotWidth = width - PADDING_LEFT - PADDING_RIGHT
  const plotHeight = height - PADDING_TOP - PADDING_BOTTOM

  const scale = useMemo(() => {
    const times = band.map((p) => parseTime(p.date))
    projection?.withTraining.forEach((p) => times.push(parseTime(p.date)))
    projection?.withRest.forEach((p) => times.push(parseTime(p.date)))
    const minT = times.length ? Math.min(...times) : 0
    const maxT = times.length ? Math.max(...times) : 1
    const tRange = maxT - minT || 1

    const values = collectValues(band, workouts, projection)
    const minV = values.length ? Math.min(...values) : 0
    const maxV = values.length ? Math.max(...values) : 1
    const pad = (maxV - minV) * 0.1 || 1
    const domainMin = minV - pad
    const domainMax = maxV + pad
    const vRange = domainMax - domainMin || 1

    const toX = (date: string) =>
      PADDING_LEFT + ((parseTime(date) - minT) / tRange) * plotWidth
    const toY = (value: number) =>
      PADDING_TOP + (1 - (value - domainMin) / vRange) * plotHeight
    return { toX, toY }
  }, [band, workouts, projection, plotWidth, plotHeight])

  if (band.length === 0) {
    return (
      <View
        style={{ width, height }}
        className={className}
        accessibilityRole="image"
        accessibilityLabel="Training capacity band chart, no data"
        testID="capacity-band-chart-empty"
        {...props}
      />
    )
  }

  const { toX, toY } = scale
  const bandPixels = toPixels(band, toX, toY)
  const columns = buildColumns(bandPixels, COLUMN_STEP)
  const topEdge = buildEdges(bandPixels, 'yHigh')
  const bottomEdge = buildEdges(bandPixels, 'yLow')

  const lastBandPoint = band[band.length - 1]
  const trainingPixels = projection
    ? toPixels([lastBandPoint, ...projection.withTraining], toX, toY)
    : []
  const restPixels = projection
    ? toPixels([lastBandPoint, ...projection.withRest], toX, toY)
    : []

  const labelStride = Math.max(1, Math.ceil(band.length / 5))
  const revealWidth = reveal.interpolate({ inputRange: [0, 1], outputRange: [0, width] })

  const renderColumns = (cols: ReturnType<typeof buildColumns>, color: string, key: string) =>
    cols.map((col, i) => (
      <View
        key={`${key}-${i}`}
        style={{
          position: 'absolute',
          left: col.x,
          top: col.top,
          width: COLUMN_STEP + 0.5,
          height: col.height,
          backgroundColor: color,
        }}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        testID={key}
      />
    ))

  const renderEdges = (
    segments: ReturnType<typeof buildEdges>,
    color: string,
    dashed: boolean,
    key: string,
  ) =>
    segments.map((seg, i) => (
      <View
        key={`${key}-${i}`}
        style={{
          position: 'absolute',
          left: seg.left,
          top: seg.top,
          width: seg.length,
          height: dashed ? 0 : 1.5,
          borderTopWidth: dashed ? 1 : 0,
          borderTopColor: dashed ? color : undefined,
          borderStyle: dashed ? 'dashed' : 'solid',
          backgroundColor: dashed ? undefined : color,
          opacity: dashed ? 0.7 : 1,
          transformOrigin: '0 0',
          transform: [{ rotate: `${seg.angle}deg` }],
        }}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        testID={key}
      />
    ))

  return (
    <View
      style={{ width, height, position: 'relative' }}
      className={className}
      testID="capacity-band-chart-root"
      {...props}
    >
      {/* Static visual layer carries the image role; interactive dots live as
          siblings so the image role has no focusable descendants. */}
      <View
        style={{ position: 'absolute', top: 0, left: 0, width, height }}
        accessibilityRole="image"
        accessibilityLabel={`Training capacity band chart. Current capacity: ${currentStatus(
          workouts,
        )}. ${workouts.length} workout${workouts.length === 1 ? '' : 's'} shown.`}
        testID="capacity-band-chart"
      >
      {/* Band + projection draw left-to-right via an animated clip. */}
      <Animated.View
        style={{ position: 'absolute', top: 0, left: 0, height, width: revealWidth, overflow: 'hidden' }}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        testID="capacity-band-chart-reveal"
      >
        <View style={{ width, height, position: 'relative' }}>
          {projection && (
            <View testID="capacity-band-chart-projection">
              {renderColumns(buildColumns(trainingPixels, COLUMN_STEP), PROJECTION_FILL, 'capacity-band-chart-projection-fill')}
              {renderColumns(buildColumns(restPixels, COLUMN_STEP), PROJECTION_FILL, 'capacity-band-chart-projection-fill')}
              {renderEdges(buildEdges(trainingPixels, 'yHigh'), STATUS_SUCCESS, true, 'capacity-band-chart-projection-training')}
              {renderEdges(buildEdges(trainingPixels, 'yLow'), STATUS_SUCCESS, true, 'capacity-band-chart-projection-training')}
              {renderEdges(buildEdges(restPixels, 'yHigh'), STATUS_INFO, true, 'capacity-band-chart-projection-rest')}
              {renderEdges(buildEdges(restPixels, 'yLow'), STATUS_INFO, true, 'capacity-band-chart-projection-rest')}
              <Text
                style={{
                  position: 'absolute',
                  left: trainingPixels[trainingPixels.length - 1]?.x + 2,
                  top: trainingPixels[trainingPixels.length - 1]?.yHigh - 12,
                  fontSize: 9,
                  fontFamily: 'Inter, sans-serif',
                  color: STATUS_SUCCESS,
                }}
                testID="capacity-band-chart-projection-training-label"
              >
                Training
              </Text>
              <Text
                style={{
                  position: 'absolute',
                  left: restPixels[restPixels.length - 1]?.x + 2,
                  top: restPixels[restPixels.length - 1]?.yLow + 2,
                  fontSize: 9,
                  fontFamily: 'Inter, sans-serif',
                  color: STATUS_INFO,
                }}
                testID="capacity-band-chart-projection-rest-label"
              >
                Rest
              </Text>
            </View>
          )}

          <View testID="capacity-band-chart-band">
            {renderColumns(columns, BAND_FILL, 'capacity-band-chart-band-cell')}
          </View>
          {renderEdges(topEdge, BAND_EDGE, false, 'capacity-band-chart-edge-top')}
          {renderEdges(bottomEdge, BAND_EDGE, false, 'capacity-band-chart-edge-bottom')}
        </View>
      </Animated.View>

      {/* Y axis conceptual label (no numbers). */}
      <Text
        className="text-text-tertiary"
        style={{
          position: 'absolute',
          left: PADDING_LEFT / 2 - 14,
          top: PADDING_TOP + plotHeight / 2 - 7,
          width: 32,
          textAlign: 'center',
          fontSize: 9,
          fontFamily: 'Inter, sans-serif',
          transform: [{ rotate: '-90deg' }],
        }}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        testID="capacity-band-chart-y-axis-label"
      >
        Load
      </Text>

      {/* X axis date labels (subset to avoid overlap). */}
      {band.map((point, i) => {
        if (i % labelStride !== 0 && i !== band.length - 1) return null
        return (
          <Text
            key={`x-${point.date}`}
            className="text-text-tertiary"
            style={{
              position: 'absolute',
              left: toX(point.date) - 14,
              top: height - PADDING_BOTTOM + 2,
              width: 28,
              textAlign: 'center',
              fontSize: 10,
              fontFamily: 'Inter, sans-serif',
            }}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            testID="capacity-band-chart-x-label"
          >
            {formatDate(point.date)}
          </Text>
        )
      })}
      </View>

      {/* Workout dots — scale in after the band draws. */}
      {workouts.map((workout, i) => {
        const cx = toX(workout.date)
        const cy = toY(workout.load)
        const color = DOT_COLORS[workout.status]
        const dotStyle = {
          width: DOT_SIZE,
          height: DOT_SIZE,
          borderRadius: DOT_SIZE / 2,
          backgroundColor: color,
          borderWidth: 2,
          borderColor: DOT_BORDER,
        }
        const label = `Workout on ${formatDate(workout.date)}, load ${workout.load}, ${
          STATUS_PHRASES[workout.status]
        }`
        return (
          <Animated.View
            key={`dot-${workout.date}-${i}`}
            style={{
              position: 'absolute',
              left: cx - DOT_SIZE / 2,
              top: cy - DOT_SIZE / 2,
              transform: [{ scale: dotAnims[i] ?? 1 }],
            }}
            testID="capacity-band-chart-dot-wrapper"
          >
            {onWorkoutPress ? (
              <Pressable
                onPress={() => onWorkoutPress(workout)}
                accessibilityRole="button"
                accessibilityLabel={label}
                style={dotStyle}
                testID="capacity-band-chart-dot"
              />
            ) : (
              <View
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
                style={dotStyle}
                testID="capacity-band-chart-dot"
              />
            )}
          </Animated.View>
        )
      })}
    </View>
  )
}
