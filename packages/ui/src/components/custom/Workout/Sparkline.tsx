// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { View, type ViewProps } from 'react-native'
import { cn } from '../../../utils/cn'
import { Typography } from '../../ui/typography'
import { resolveColor } from '../../../theme/resolve-color'

/**
 * An explicit plotting range. Both axes default to the data's own extent, which
 * is what every pre-VW-386 consumer gets.
 *
 * `x` exists because a series can stop short of the range it is measured
 * against: a goal's readings run to the current week, but the chart has to run
 * to the goal week so the distance left to close is legible. `y` exists for the
 * same reason on the other axis — a reference line above every reading is drawn
 * OUTSIDE the box unless the caller widens the range to include it.
 */
export interface SparklineDomain {
  x?: [number, number]
  y?: [number, number]
}

/** A shaded region between two values on the y axis, e.g. a committed/stretch band. */
export interface SparklineBand {
  from: number
  to: number
  /** Defaults to a low-alpha `text-tertiary`. */
  color?: string
}

/** Where a reference line's label sits. `above` is the pre-VW-386 behaviour. */
export type SparklineReferenceLabelPlacement = 'above' | 'left'

export interface SparklineProps extends ViewProps {
  data: number[]
  /**
   * The x position of each entry in `data`, same length and order. Defaults to
   * the array index, which is what an evenly-spaced series wants.
   */
  xValues?: number[]
  /** Explicit axis ranges. Each axis falls back to the data's own extent. */
  domain?: SparklineDomain
  /** A shaded region between two y values, drawn behind the trace. */
  band?: SparklineBand
  width?: number
  height?: number
  color?: string
  showDots?: boolean
  referenceLines?: Array<{
    value: number
    color: string
    dashed?: boolean
    label?: string
  }>
  /** Where reference labels sit. Defaults to `above`, the original placement. */
  referenceLabelPlacement?: SparklineReferenceLabelPlacement
  highlightLast?: boolean
  className?: string
}

/** A [min, max] pair that never has zero width, so no scale divides by zero. */
function extentOf(values: number[], override?: [number, number]): [number, number] {
  if (override) return override
  if (values.length === 0) return [0, 1]
  return [Math.min(...values), Math.max(...values)]
}

function scaleY(value: number, [lo, hi]: [number, number], height: number): number {
  return height - ((value - lo) / (hi - lo || 1)) * height
}

function scaleX(value: number, [lo, hi]: [number, number], width: number): number {
  return ((value - lo) / (hi - lo || 1)) * width
}

export function Sparkline({
  data,
  xValues,
  domain,
  band,
  width = 80,
  height = 30,
  color,
  showDots = false,
  referenceLines,
  referenceLabelPlacement = 'above',
  highlightLast = false,
  className,
  ...props
}: SparklineProps) {
  if (data.length === 0) {
    return (
      <View
        style={{ width, height }}
        className={className}
        testID="sparkline-empty"
        accessibilityLabel="Sparkline chart, no data"
        {...props}
      />
    )
  }

  const resolvedColor = color ?? resolveColor('brand-primary')
  const xs = xValues ?? data.map((_, i) => i)
  const xDomain = extentOf(xs, domain?.x)
  const yDomain = extentOf(data, domain?.y)
  const points = data.map((value, i) => ({
    x: scaleX(xs[i] ?? i, xDomain, width),
    y: scaleY(value, yDomain, height),
  }))

  const dotSize = 3
  const highlightSize = 6

  return (
    <View
      style={{ width, height, position: 'relative' }}
      className={cn(className)}
      accessibilityRole="image"
      accessibilityLabel={`Sparkline chart with ${data.length} data points`}
      testID="sparkline"
      {...props}
    >
      {band !== undefined && (
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: Math.min(scaleY(band.from, yDomain, height), scaleY(band.to, yDomain, height)),
            height: Math.abs(scaleY(band.to, yDomain, height) - scaleY(band.from, yDomain, height)),
            backgroundColor: band.color ?? resolveColor('hairline-default'),
            opacity: band.color === undefined ? 0.35 : 1,
          }}
          accessibilityElementsHidden
          testID="sparkline-band"
        />
      )}

      {referenceLines?.map((line, i) => {
        const y = scaleY(line.value, yDomain, height)
        const labelOnLeft = referenceLabelPlacement === 'left'
        return (
          <View
            key={`ref-${i}`}
            style={[
              {
                position: 'absolute',
                top: y,
                left: 0,
                right: 0,
                opacity: 0.6,
              },
              line.dashed
                ? {
                    height: 0,
                    borderStyle: 'dashed',
                    borderTopWidth: 1,
                    borderTopColor: line.color,
                  }
                : {
                    height: 1,
                    backgroundColor: line.color,
                  },
            ]}
            accessibilityElementsHidden
            testID={`sparkline-reference-${i}`}
          >
            {line.label && (
              // `3xs` (9px) is the scale floor; the label was 7px, which is off it
              // entirely (TOKENS.md §4). The line box stays unpinned, as the raw
              // <Text> this replaced was, so the absolute offset still lands.
              <Typography
                variant="caption"
                color="inherit"
                className="text-3xs leading-[normal]"
                style={{
                  position: 'absolute',
                  ...(labelOnLeft ? { left: 0 } : { right: 0 }),
                  top: -10,
                  color: line.color,
                  opacity: 1,
                }}
                testID={`sparkline-reference-label-${i}`}
              >
                {line.label}
              </Typography>
            )}
          </View>
        )
      })}

      {/* Line segments connecting data points */}
      {points.map((point, i) => {
        if (i === 0) return null
        const prev = points[i - 1]
        if (prev === undefined) return null
        const dx = point.x - prev.x
        const dy = point.y - prev.y
        const length = Math.sqrt(dx * dx + dy * dy)
        const angle = Math.atan2(dy, dx) * (180 / Math.PI)
        return (
          <View
            key={`line-${i}`}
            style={{
              position: 'absolute',
              left: prev.x,
              top: prev.y,
              width: length,
              height: 1.5,
              backgroundColor: resolvedColor,
              transformOrigin: '0 0',
              transform: [{ rotate: `${angle}deg` }],
            }}
            accessibilityElementsHidden
            testID={`sparkline-segment-${i}`}
          />
        )
      })}

      {/* Data point dots */}
      {(showDots || highlightLast) &&
        points.map((point, i) => {
          const isLast = i === data.length - 1
          const shouldShow = showDots || (highlightLast && isLast)
          if (!shouldShow) return null

          const size = highlightLast && isLast ? highlightSize : dotSize
          return (
            <View
              key={`dot-${i}`}
              style={{
                position: 'absolute',
                left: point.x - size / 2,
                top: point.y - size / 2,
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: resolvedColor,
              }}
              accessibilityElementsHidden
              testID={`sparkline-dot-${i}`}
            />
          )
        })}
    </View>
  )
}
