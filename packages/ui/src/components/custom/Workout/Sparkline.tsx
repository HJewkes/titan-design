// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { View, type ViewProps } from 'react-native'
import { cn } from '../../../utils/cn'
import { resolveColor } from '../../../theme/resolve-color'
import {
  sparklinePoints,
  type SparklineBand,
  type SparklineDomain,
  type SparklineReferenceLabelPlacement,
} from './sparklineGeometry'
import {
  SparklineBandFill,
  SparklineDots,
  SparklineReferenceLines,
  SparklineSegments,
} from './SparklineParts'

export type {
  SparklineBand,
  SparklineDomain,
  SparklineReferenceLabelPlacement,
} from './sparklineGeometry'

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
  const { points, yDomain } = sparklinePoints(data, xValues, domain, width, height)

  return (
    <View
      style={{ width, height, position: 'relative' }}
      className={cn(className)}
      accessibilityRole="image"
      accessibilityLabel={`Sparkline chart with ${data.length} data points`}
      testID="sparkline"
      {...props}
    >
      {band !== undefined && <SparklineBandFill band={band} yDomain={yDomain} height={height} />}
      {referenceLines !== undefined && (
        <SparklineReferenceLines
          lines={referenceLines}
          yDomain={yDomain}
          height={height}
          placement={referenceLabelPlacement}
        />
      )}
      <SparklineSegments points={points} color={resolvedColor} />
      {(showDots || highlightLast) && (
        <SparklineDots
          points={points}
          color={resolvedColor}
          showDots={showDots}
          highlightLast={highlightLast}
        />
      )}
    </View>
  )
}
