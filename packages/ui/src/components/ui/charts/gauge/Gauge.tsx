import type { ReactNode } from 'react'
import { View, Text, type ViewProps } from 'react-native'
import { cn } from '../../../../utils/cn'
import { getSemanticColors, type ThemeMode } from '../../../../theme/tokens/semantic'
import { EmptyState } from '../../empty-state'
import { useSurfaceMode } from '../../surface'
import { formatTrimmedDecimal } from '../../../../utils/number-format'
import { countText, valueAt } from '../../animated-number/animated-number-model'
import { TABULAR_STYLE, useMotionProgress } from '../../animated-number/useCountedText'

export interface GaugeThreshold {
  /** Band start, in the gauge's value units. */
  value: number
  /** Color applied to filled segments at or above this band. */
  color: string
}

export interface GaugeProps extends Omit<ViewProps, 'children'> {
  /**
   * Current value. Clamped to [min, max] for the fill. `null` or a non-finite number draws the
   * unfilled track with the "No data" `EmptyState` in the centre.
   */
  value: number | null
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
  /**
   * 0..1 from the caller's clock: the number counts up from `min` in tabular digits, the arc fills
   * with it, and both land on `value` exactly at 1. Omitted, or under reduced motion, the gauge
   * shows `value` as given.
   */
  progress?: number
  /** Replaces the "No data" placeholder in the centre when `value` is `null` or not finite. */
  emptyState?: ReactNode
  className?: string
}

/**
 * Unfilled-segment token per theme. Light takes `border-input`: on the 3b light planes
 * `border-prominent` falls under 2.5:1 against surface-base (TD-473).
 */
const TRACK_TOKEN = { dark: 'border-prominent', light: 'border-input' } as const

/** Titan status-token bands for a 0–100 score, in the given theme. */
function defaultThresholds(mode: ThemeMode): GaugeThreshold[] {
  const sem = getSemanticColors(mode)
  return [
    { value: 0, color: sem['status-error'] },
    { value: 60, color: sem['status-warning'] },
    { value: 80, color: sem['status-success'] },
  ]
}

const ARC_START = 135
const ARC_SWEEP = 270
const SEGMENTS = 40

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0
  return Math.max(0, Math.min(1, n))
}

/** Color of the highest band whose start value the fraction reaches. */
function bandColor(
  fraction: number,
  bands: GaugeThreshold[],
  range: { min: number; max: number; fallback: string }
): string {
  const value = range.min + fraction * (range.max - range.min)
  const sorted = [...bands].sort((a, b) => a.value - b.value)
  let color = sorted[0]?.color ?? range.fallback
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
function buildTicks(
  fill: number,
  size: number,
  colors: { active: (f: number) => string; track: string }
): Tick[] {
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
      color: fraction <= fill ? colors.active(fraction) : colors.track,
    }
  })
}

function ariaLabelOf(value: number | null, max: number, label?: string, unit?: string): string {
  const reading =
    value === null
      ? 'no value'
      : `${formatTrimmedDecimal(value, 1)}${unit ?? ''} of ${formatTrimmedDecimal(max, 1)}`
  return `${label ? `${label}: ` : ''}${reading}`
}

interface ReadoutProps {
  value: number | null
  color: string
  unit?: string
  emptyState?: ReactNode
  /** The count: where it starts and how far it has run. Omitted, the readout is settled. */
  count?: { from: number; progress?: number }
}

/** The big number and unit, or the no-value placeholder (the consumer's `emptyState`, else "No data"). */
function GaugeReadout({ value, color, unit, emptyState, count }: ReadoutProps) {
  if (value === null) {
    return emptyState ?? <EmptyState title="No data" className="py-4" testID="gauge-empty" />
  }
  const finalText = formatTrimmedDecimal(value, 1)
  const progress = count?.progress
  return (
    <View className="flex-row items-baseline gap-0.5">
      <Text
        testID="gauge-value"
        className={cn('text-3xl font-bold', count && 'tabular-nums')}
        style={count ? [TABULAR_STYLE, { color }] : { color }}
      >
        {progress === undefined ? finalText : countText(finalText, progress, count?.from)}
      </Text>
      {unit && <Text className="text-sm text-text-tertiary">{unit}</Text>}
    </View>
  )
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
  thresholds,
  color,
  emptyState,
  progress,
  className,
  ...props
}: GaugeProps) {
  const motion = useMotionProgress(progress)
  const mode = useSurfaceMode()
  const sem = getSemanticColors(mode)
  const bands = thresholds ?? defaultThresholds(mode)
  const range = { min, max, fallback: sem['status-success'] }
  const span = max - min || 1
  const reading = value !== null && Number.isFinite(value) ? value : null
  const shown = reading === null || motion === undefined ? reading : valueAt(motion, min, reading)
  const fill = shown === null ? 0 : clamp01((shown - min) / span)
  const activeColor = (f: number) => color ?? bandColor(f, bands, range)
  const ticks = buildTicks(fill, size, { active: activeColor, track: sem[TRACK_TOKEN[mode]] })
  const displayColor = activeColor(fill)
  const tickLength = size * 0.11
  const tickThickness = Math.max(2, (size * 0.9) / SEGMENTS)
  const ariaLabel = ariaLabelOf(reading, max, label, unit)

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
      <View
        style={{ position: 'absolute', top: 0, left: 0, width: size, height: size }}
        className="items-center justify-center"
      >
        <GaugeReadout
          value={reading}
          color={displayColor}
          unit={unit}
          emptyState={emptyState}
          count={progress === undefined ? undefined : { from: min, progress: motion }}
        />
        {label && (
          <Text testID="gauge-label" className="text-xs text-text-secondary mt-1">
            {label}
          </Text>
        )}
      </View>
    </View>
  )
}
