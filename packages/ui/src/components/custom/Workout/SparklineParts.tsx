import { View } from 'react-native'
import { Typography } from '../../ui/typography'
import { resolveColor } from '../../../theme/resolve-color'
import {
  bandRect,
  scaleY,
  segmentBetween,
  type SparklineBand,
  type SparklinePoint,
  type SparklineReferenceLabelPlacement,
  type SparklineReferenceLine,
} from './sparklineGeometry'

export function SparklineBandFill({
  band,
  yDomain,
  height,
}: {
  band: SparklineBand
  yDomain: [number, number]
  height: number
}) {
  const rect = bandRect(band, yDomain, height)
  return (
    <View
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: rect.top,
        height: rect.height,
        backgroundColor: band.color ?? resolveColor('hairline-default'),
        opacity: band.color === undefined ? 0.35 : 1,
      }}
      accessibilityElementsHidden
      testID="sparkline-band"
    />
  )
}

export function SparklineReferenceLines({
  lines,
  yDomain,
  height,
  placement,
}: {
  lines: SparklineReferenceLine[]
  yDomain: [number, number]
  height: number
  placement: SparklineReferenceLabelPlacement
}) {
  const rules = lines.map((line, i) => (
    <SparklineReferenceRule
      key={`ref-${i}`}
      index={i}
      line={line}
      y={scaleY(line.value, yDomain, height)}
      labelOnLeft={placement === 'left'}
    />
  ))
  return <>{rules}</>
}

function SparklineReferenceRule({
  index: i,
  line,
  y,
  labelOnLeft,
}: {
  index: number
  line: SparklineReferenceLine
  y: number
  labelOnLeft: boolean
}) {
  return (
    <View
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
}

/** Line segments connecting data points */
export function SparklineSegments({ points, color }: { points: SparklinePoint[]; color: string }) {
  const segments = points.map((point, i) => {
    if (i === 0) return null
    const prev = points[i - 1]
    if (prev === undefined) return null
    const { length, angle } = segmentBetween(prev, point)
    return (
      <View
        key={`line-${i}`}
        style={{
          position: 'absolute',
          left: prev.x,
          top: prev.y,
          width: length,
          height: 1.5,
          backgroundColor: color,
          transformOrigin: '0 0',
          transform: [{ rotate: `${angle}deg` }],
        }}
        accessibilityElementsHidden
        testID={`sparkline-segment-${i}`}
      />
    )
  })
  return <>{segments}</>
}

/** Data point dots */
export function SparklineDots({
  points,
  color,
  showDots,
  highlightLast,
}: {
  points: SparklinePoint[]
  color: string
  showDots: boolean
  highlightLast: boolean
}) {
  const dotSize = 3
  const highlightSize = 6
  const dots = points.map((point, i) => {
    const isLast = i === points.length - 1
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
          backgroundColor: color,
        }}
        accessibilityElementsHidden
        testID={`sparkline-dot-${i}`}
      />
    )
  })
  return <>{dots}</>
}
