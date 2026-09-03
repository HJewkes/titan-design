// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { View, type ViewProps } from 'react-native'
import { cn } from '../../../utils/cn'
import { resolveColor } from '../../../theme/resolve-color'

/** Shortest bar drawn, so an all-but-empty series still reads as a series. */
const MIN_BAR_HEIGHT = 2

export interface SparkBarsProps extends Omit<ViewProps, 'accessibilityLabel'> {
  /** The series, oldest first. Negative values draw in `negativeColor`. */
  values: number[]
  /** Overall bar-field height in px. */
  height?: number
  /** Width of a single bar in px. */
  barWidth?: number
  /** Gap between bars in px. */
  gap?: number
  /** Keep only the last N values — a sparkline is a recent-history glance, not an archive. */
  maxBars?: number
  /** Fill for non-negative bars. Defaults to `result-improve`. */
  color?: string
  /** Fill for negative bars. Defaults to `result-degrade`. */
  negativeColor?: string
  /** Screen-reader description. Defaults to a bar count. */
  label?: string
  className?: string
}

/**
 * SparkBars — a tiny bar-mark sparkline for a signed series.
 *
 * The bar-mark counterpart to {@link Sparkline}: where a line reads a
 * *trajectory*, bars read *discrete per-period magnitude*, which is what
 * per-session activity and per-session net growth actually are. Bars are scaled
 * by absolute value so a negative period is as tall as an equally large
 * positive one, and tinted with `negativeColor` to carry the sign.
 *
 * @example
 * <SparkBars values={[3, 8, -2, 14]} height={22} />
 */
export function SparkBars({
  values,
  height = 22,
  barWidth = 3,
  gap = 2,
  maxBars = 24,
  color,
  negativeColor,
  label,
  className,
  ...props
}: SparkBarsProps) {
  const shown = values.slice(-maxBars)
  // A per-period delta going up or down is `result-*` (a change in a measurement),
  // not `status-*` (a thing being broken). See TOKENS.md §1.
  const positiveFill = color ?? resolveColor('result-improve')
  const negativeFill = negativeColor ?? resolveColor('result-degrade')
  // Scaling on magnitude keeps a -100 as tall as a +100; sign is carried by fill.
  const peak = Math.max(1, ...shown.map((v) => Math.abs(v)))

  return (
    <View
      style={{ height, gap }}
      className={cn('flex-row items-end', className)}
      accessibilityRole="image"
      accessibilityLabel={label ?? `Bar sparkline with ${shown.length} values`}
      testID="spark-bars"
      {...props}
    >
      {shown.map((v, i) => (
        <View
          key={i}
          style={{
            height: Math.max(MIN_BAR_HEIGHT, Math.round((Math.abs(v) / peak) * height)),
            width: barWidth,
            backgroundColor: v < 0 ? negativeFill : positiveFill,
          }}
          className="rounded-t-[1px]"
          accessibilityElementsHidden
          testID={`spark-bars-bar-${i}`}
        />
      ))}
    </View>
  )
}
