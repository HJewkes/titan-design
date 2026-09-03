import { View, Text, Pressable, type ViewProps } from 'react-native'
import { cn } from '../../../utils/cn'
import { DATAVIZ_CATEGORICAL_PALETTE } from '../../../theme/extracted-colors-dataviz'

export interface ScatterDatum {
  /** Stable identity — returned by onPress and used as the React key. */
  id: string
  /** Horizontal position in data space. */
  x: number
  /** Vertical position in data space. */
  y: number
  /** Bubble radius in px. Falls back to a fixed default when omitted. */
  r?: number
  /** Bubble fill color. Falls back to a built-in categorical palette by index. */
  color?: string
  /** Optional label shown for large or selected points. */
  label?: string
}

export interface ScatterAxis {
  xLabel?: string
  yLabel?: string
  /** Domain overrides. Any omitted bound is derived from the data. */
  xMin?: number
  xMax?: number
  yMin?: number
  yMax?: number
}

export interface ScatterProps extends Omit<ViewProps, 'children'> {
  data: ScatterDatum[]
  /** Layout box. Required — the plot fills exactly this area. */
  width: number
  height: number
  /** Axis labels and optional domain overrides. */
  axis?: ScatterAxis
  /**
   * Draw the y = 1 − x "main sequence" reference line (NDepend idiom, where
   * distance from the diagonal measures the zone of pain / zone of uselessness).
   */
  diagonal?: boolean
  /** Fires with a point's id on press. */
  onPress?: (id: string) => void
  /** Draws a highlight ring on the matching point. */
  selectedId?: string
  className?: string
}

/** Titan categorical fallback palette (see extracted-colors-dataviz). */
const PALETTE = DATAVIZ_CATEGORICAL_PALETTE

const GRID_LINE = 'rgba(255,255,255,0.07)'
const AXIS_LINE = 'rgba(255,255,255,0.18)'
const DIAGONAL_LINE = 'rgba(255,255,255,0.28)'
const DEFAULT_R = 6

const PLOT_LEFT = 40
const PLOT_RIGHT = 12
const PLOT_TOP = 12
const PLOT_BOTTOM = 34
const TICK_COUNT = 5

interface Domain {
  min: number
  max: number
}

/** Derive a padded [min, max] from values, honoring explicit overrides. */
function domainOf(values: number[], min?: number, max?: number): Domain {
  const lo = min ?? (values.length ? Math.min(...values) : 0)
  const hi = max ?? (values.length ? Math.max(...values) : 1)
  if (hi > lo) return { min: lo, max: hi }
  const pad = Math.abs(hi) * 0.1 || 0.5
  return { min: lo - pad, max: hi + pad }
}

/** Evenly spaced tick values across a domain. */
function ticksOf(d: Domain, count: number): number[] {
  return Array.from({ length: count }, (_, i) => d.min + ((d.max - d.min) * i) / (count - 1))
}

function formatTick(v: number): string {
  if (Number.isInteger(v)) return `${v}`
  return v.toFixed(Math.abs(v) < 1 ? 2 : 1)
}

/** A single straight segment drawn as one rotated View (SVG-free). */
function LineSegment({
  x1,
  y1,
  x2,
  y2,
  color,
  testID,
}: {
  x1: number
  y1: number
  x2: number
  y2: number
  color: string
  testID: string
}) {
  const dx = x2 - x1
  const dy = y2 - y1
  const length = Math.sqrt(dx * dx + dy * dy)
  const angle = Math.atan2(dy, dx) * (180 / Math.PI)
  return (
    <View
      testID={testID}
      accessibilityElementsHidden
      style={{
        position: 'absolute',
        left: x1,
        top: y1,
        width: length,
        height: 0,
        borderTopWidth: 1,
        borderStyle: 'dashed',
        borderTopColor: color,
        transformOrigin: '0 0',
        transform: [{ rotate: `${angle}deg` }],
      }}
    />
  )
}

/**
 * SVG-free scatter / bubble plot (absolutely-positioned Views), matching the
 * codebase's chart convention so it renders identically on web and native. Used
 * for "main-sequence" plots (instability × abstractness) via the `diagonal`
 * reference line, or any two metrics. Positions and bubble sizes are computed
 * from the data; color and labels are caller-supplied.
 */
export function Scatter({
  data,
  width,
  height,
  axis = {},
  diagonal = false,
  onPress,
  selectedId,
  className,
  ...props
}: ScatterProps) {
  const innerW = Math.max(1, width - PLOT_LEFT - PLOT_RIGHT)
  const innerH = Math.max(1, height - PLOT_TOP - PLOT_BOTTOM)
  const xd = domainOf(
    data.map((d) => d.x),
    axis.xMin,
    axis.xMax
  )
  const yd = domainOf(
    data.map((d) => d.y),
    axis.yMin,
    axis.yMax
  )

  const toX = (x: number) => PLOT_LEFT + ((x - xd.min) / (xd.max - xd.min)) * innerW
  const toY = (y: number) => PLOT_TOP + (1 - (y - yd.min) / (yd.max - yd.min)) * innerH

  const points = data.map((d, i) => ({
    datum: d,
    cx: toX(d.x),
    cy: toY(d.y),
    radius: d.r ?? DEFAULT_R,
    color: d.color ?? PALETTE[i % PALETTE.length],
  }))

  const ariaLabel = `Scatter plot of ${axis.xLabel ?? 'x'} versus ${axis.yLabel ?? 'y'}, ${data.length} point${data.length === 1 ? '' : 's'}`

  return (
    <View className={cn('relative', className)} style={{ width, height }} {...props}>
      {/* Non-interactive labelled canvas: grid, axes, ticks, diagonal. */}
      <View
        accessibilityRole="image"
        accessibilityLabel={ariaLabel}
        testID="scatter-canvas"
        style={{ position: 'absolute', top: 0, left: 0, width, height, overflow: 'hidden' }}
      >
        {ticksOf(yd, TICK_COUNT).map((t, i) => {
          const y = toY(t)
          return (
            <View
              key={`y-${i}`}
              accessibilityElementsHidden
              testID="scatter-gridline-y"
              style={{
                position: 'absolute',
                left: PLOT_LEFT,
                width: innerW,
                top: y,
                height: 1,
                backgroundColor: GRID_LINE,
              }}
            >
              <Text
                className="text-[9px] text-text-tertiary"
                style={{
                  position: 'absolute',
                  left: -PLOT_LEFT,
                  top: -6,
                  width: PLOT_LEFT - 6,
                  textAlign: 'right',
                }}
              >
                {formatTick(t)}
              </Text>
            </View>
          )
        })}
        {ticksOf(xd, TICK_COUNT).map((t, i) => {
          const x = toX(t)
          return (
            <View
              key={`x-${i}`}
              accessibilityElementsHidden
              testID="scatter-gridline-x"
              style={{
                position: 'absolute',
                top: PLOT_TOP,
                height: innerH,
                left: x,
                width: 1,
                backgroundColor: GRID_LINE,
              }}
            >
              <Text
                className="text-[9px] text-text-tertiary"
                style={{
                  position: 'absolute',
                  top: innerH + 4,
                  left: -16,
                  width: 32,
                  textAlign: 'center',
                }}
              >
                {formatTick(t)}
              </Text>
            </View>
          )
        })}

        {/* Axis frame (left + bottom). */}
        <View
          accessibilityElementsHidden
          style={{
            position: 'absolute',
            left: PLOT_LEFT,
            top: PLOT_TOP,
            width: 1,
            height: innerH,
            backgroundColor: AXIS_LINE,
          }}
        />
        <View
          accessibilityElementsHidden
          style={{
            position: 'absolute',
            left: PLOT_LEFT,
            top: PLOT_TOP + innerH,
            width: innerW,
            height: 1,
            backgroundColor: AXIS_LINE,
          }}
        />

        {diagonal && (
          <LineSegment
            testID="scatter-diagonal"
            color={DIAGONAL_LINE}
            x1={toX(xd.min)}
            y1={toY(1 - xd.min)}
            x2={toX(xd.max)}
            y2={toY(1 - xd.max)}
          />
        )}

        {axis.xLabel && (
          <Text
            testID="scatter-x-label"
            className="text-[10px] font-semibold text-text-secondary"
            style={{
              position: 'absolute',
              left: PLOT_LEFT,
              width: innerW,
              bottom: 2,
              textAlign: 'center',
            }}
          >
            {axis.xLabel}
          </Text>
        )}
        {axis.yLabel && (
          <Text
            testID="scatter-y-label"
            className="text-[10px] font-semibold text-text-secondary"
            style={{
              position: 'absolute',
              left: -innerH / 2 + 6,
              top: PLOT_TOP + innerH / 2,
              width: innerH,
              textAlign: 'center',
              transformOrigin: '50% 50%',
              transform: [{ rotate: '-90deg' }],
            }}
          >
            {axis.yLabel}
          </Text>
        )}
      </View>

      {/* Interactive point overlay (kept out of the image-role canvas). */}
      <View
        style={{ position: 'absolute', top: 0, left: 0, width, height }}
        testID="scatter-points"
      >
        {points.map((p) => {
          const selected = p.datum.id === selectedId
          const showLabel = p.datum.label && (selected || p.radius >= 10)
          return (
            <Pressable
              key={p.datum.id}
              testID={`scatter-point-${p.datum.id}`}
              accessibilityRole="button"
              accessibilityLabel={p.datum.label ?? p.datum.id}
              onPress={() => onPress?.(p.datum.id)}
              style={{
                position: 'absolute',
                left: p.cx - p.radius,
                top: p.cy - p.radius,
                width: p.radius * 2,
                height: p.radius * 2,
                borderRadius: p.radius,
                backgroundColor: p.color,
                opacity: selected ? 1 : 0.82,
                borderWidth: selected ? 2 : 0,
                borderColor: '#ffffff',
              }}
            >
              {showLabel && (
                <Text
                  numberOfLines={1}
                  className="text-[9px] font-semibold text-text-primary"
                  style={{
                    position: 'absolute',
                    left: p.radius * 2 + 3,
                    top: p.radius - 6,
                    width: 80,
                  }}
                >
                  {p.datum.label}
                </Text>
              )}
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}
