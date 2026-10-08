import { View, Text } from 'react-native'
import type { getSemanticColors } from '../../../../theme/tokens/semantic'
import {
  PLOT_LEFT,
  PLOT_TOP,
  type ScatterAxis,
  type ScatterLayout,
  type ScatterSegment,
} from './scatterGeometry'

type SemanticColors = ReturnType<typeof getSemanticColors>

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

/** Left and bottom axis frame, the reference lines, and the axis titles. */
export function ScatterFrame({
  layout,
  colors,
  axis,
  segments,
}: {
  layout: ScatterLayout
  colors: SemanticColors
  axis: ScatterAxis
  segments: { testID: string; segment: ScatterSegment }[]
}) {
  const { innerW, innerH } = layout
  return (
    <>
      <View
        accessibilityElementsHidden
        testID="scatter-axis-y"
        style={{
          position: 'absolute',
          left: PLOT_LEFT,
          top: PLOT_TOP,
          width: 1,
          height: innerH,
          backgroundColor: colors['hairline-default'],
        }}
      />
      <View
        accessibilityElementsHidden
        testID="scatter-axis-x"
        style={{
          position: 'absolute',
          left: PLOT_LEFT,
          top: PLOT_TOP + innerH,
          width: innerW,
          height: 1,
          backgroundColor: colors['hairline-default'],
        }}
      />

      {segments.map(({ testID, segment }, i) => (
        <LineSegment
          key={`${testID}-${i}`}
          testID={testID}
          color={colors['hairline-strong']}
          x1={segment.x1}
          y1={segment.y1}
          x2={segment.x2}
          y2={segment.y2}
        />
      ))}

      {!!axis.xLabel && (
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
      {!!axis.yLabel && (
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
    </>
  )
}
