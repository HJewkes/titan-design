import { View, Text } from 'react-native'
import type { getSemanticColors } from '../../../theme/tokens/semantic'
import {
  PLOT_LEFT,
  PLOT_TOP,
  TICK_COUNT,
  tickLabel,
  ticksOf,
  type ScatterLayout,
} from './scatterGeometry'

type SemanticColors = ReturnType<typeof getSemanticColors>

/** Horizontal then vertical gridlines, each carrying its tick label. */
export function ScatterGridlines({
  layout,
  colors,
}: {
  layout: ScatterLayout
  colors: SemanticColors
}) {
  const { innerW, innerH, xd, yd, toX, toY } = layout
  return (
    <>
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
              backgroundColor: colors['hairline-subtle'],
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
              {tickLabel(t)}
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
              backgroundColor: colors['hairline-subtle'],
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
              {tickLabel(t)}
            </Text>
          </View>
        )
      })}
    </>
  )
}
