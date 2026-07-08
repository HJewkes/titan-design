import { View, Text, type ViewProps } from 'react-native'
import { cn } from '../../../utils/cn'
import { getSemanticColors } from '../../../theme/tokens/semantic'

const sem = getSemanticColors('dark')

export interface GaugeThreshold {
  /** Band start, in the gauge's value units. */
  value: number
  /** Color applied to filled segments at or above this band. */
  color: string
}

export interface GaugeProps extends Omit<ViewProps, 'children'> {
  /** Current value. Clamped to [min, max]. */
  value: number
  min?: number
  max?: number
  /** Diameter in px. */
  size?: number
  /** Caption under the big number. */
  label?: string
  /** Unit suffix beside the big number (e.g. "%"). */
  unit?: string
  /**
   * Band coloring, ascending by `value`. A filled segment takes the color of
   * the highest band whose `value` it reaches. Defaults to Titan status tokens
   * (red < 60, amber < 80, green ≥ 80 on a 0–100 scale).
   */
  thresholds?: GaugeThreshold[]
  /** Single-color override for filled segments (ignores `thresholds`). */
  color?: string
  className?: string
}

const STATUS_SUCCESS = sem['status-success']
const STATUS_WARNING = sem['status-warning']
const STATUS_ERROR = sem['status-error']
const TRACK = 'rgba(255,255,255,0.08)'

/** Titan status-token bands for a 0–100 score. */
const DEFAULT_THRESHOLDS: GaugeThreshold[] = [
  { value: 0, color: STATUS_ERROR },
  { value: 60, color: STATUS_WARNING },
  { value: 80, color: STATUS_SUCCESS },
]

const ARC_START = 135
const ARC_SWEEP = 270
const SEGMENTS = 40

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0
  return Math.max(0, Math.min(1, n))
}

function formatValue(v: number): string {
  return Number.isInteger(v) ? `${v}` : v.toFixed(1)
}

/** Color of the highest band whose start value the fraction reaches. */
function bandColor(fraction: number, bands: GaugeThreshold[], min: number, max: number): string {
  const value = min + fraction * (max - min)
  const sorted = [...bands].sort((a, b) => a.value - b.value)
  let color = sorted[0]?.color ?? STATUS_SUCCESS
  for (const band of sorted) {
    if (value >= band.value) color = band.color
  }
  return color
}

interface Tick {
  key: number
  left: number
  top: number
  rotate: string
  color: string
}

/** Position + color each radial segment of the arc. */
function buildTicks(fill: number, size: number, activeColor: (f: number) => string): Tick[] {
  const center = size / 2
  const radius = center - size * 0.08
  return Array.from({ length: SEGMENTS }, (_, i) => {
    const fraction = (i + 0.5) / SEGMENTS
    const deg = ARC_START + fraction * ARC_SWEEP
    const rad = (deg * Math.PI) / 180
    return {
      key: i,
      left: center + radius * Math.cos(rad),
      top: center + radius * Math.sin(rad),
      rotate: `${deg - 90}deg`,
      color: fraction <= fill ? activeColor(fraction) : TRACK,
    }
  })
}

/**
 * SVG-free radial gauge (absolutely-positioned segment Views), matching the
 * codebase's chart convention so it renders identically on web and native. The
 * 270° arc fills with band colors as the value rises; the center reuses the
 * Metric visual language (large bold value + unit + caption). Ideal for a 0–100
 * health / quality score.
 */
export function Gauge({
  value,
  min = 0,
  max = 100,
  size = 160,
  label,
  unit,
  thresholds = DEFAULT_THRESHOLDS,
  color,
  className,
  ...props
}: GaugeProps) {
  const span = max - min || 1
  const fill = clamp01((value - min) / span)
  const activeColor = (f: number) => color ?? bandColor(f, thresholds, min, max)
  const ticks = buildTicks(fill, size, activeColor)
  const displayColor = color ?? bandColor(fill, thresholds, min, max)
  const tickLength = size * 0.11
  const tickThickness = Math.max(2, (size * 0.9) / SEGMENTS)

  const ariaLabel = `${label ? `${label}: ` : ''}${formatValue(value)}${unit ?? ''} of ${formatValue(max)}`

  return (
    <View
      className={cn('relative', className)}
      style={{ width: size, height: size }}
      accessibilityRole="image"
      accessibilityLabel={ariaLabel}
      testID="gauge"
      {...props}
    >
      {ticks.map((t) => (
        <View
          key={t.key}
          accessibilityElementsHidden
          testID="gauge-segment"
          style={{
            position: 'absolute',
            left: t.left - tickThickness / 2,
            top: t.top - tickLength / 2,
            width: tickThickness,
            height: tickLength,
            borderRadius: tickThickness / 2,
            backgroundColor: t.color,
            transform: [{ rotate: t.rotate }],
          }}
        />
      ))}

      {/* Center readout — Metric visual language. */}
      <View style={{ position: 'absolute', top: 0, left: 0, width: size, height: size }} className="items-center justify-center">
        <View className="flex-row items-baseline gap-0.5">
          <Text testID="gauge-value" className="text-3xl font-bold" style={{ color: displayColor }}>
            {formatValue(value)}
          </Text>
          {unit && <Text className="text-sm text-text-tertiary">{unit}</Text>}
        </View>
        {label && (
          <Text testID="gauge-label" className="text-xs text-text-secondary mt-1">
            {label}
          </Text>
        )}
      </View>
    </View>
  )
}
