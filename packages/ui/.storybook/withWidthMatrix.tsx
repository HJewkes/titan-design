// Renders a story in a column of fixed-width frames so width-dependent layout can be checked (TD-317).
//
// Opt-in is the `width-matrix` tag; `parameters.widthMatrix.thresholds` adds a frame one pixel
// either side of each component breakpoint. Each frame carries `testID="width-frame-<w>"`, the
// DOM contract that audit:stories scopes its probes to.
import type { Decorator } from '@storybook/react-vite'
import { Text, View } from 'react-native'
import { MATRIX_WIDTHS } from '../src/test/fixtures/stress'

export const WIDTH_MATRIX_TAG = 'width-matrix'

export interface WidthMatrixParameters {
  thresholds?: readonly number[]
}

export function matrixWidths(thresholds: readonly number[] = []): number[] {
  const around = thresholds.flatMap((t) => [t - 1, t + 1])
  return [...new Set<number>([...MATRIX_WIDTHS, ...around])].sort((a, b) => a - b)
}

export const withWidthMatrix: Decorator = (Story, context) => {
  if (!context.tags?.includes(WIDTH_MATRIX_TAG)) return <Story />
  const { thresholds } = (context.parameters.widthMatrix ?? {}) as WidthMatrixParameters
  return (
    <View className="gap-stack-md">
      {matrixWidths(thresholds).map((w) => (
        <View key={w} testID={`width-frame-${w}`} style={{ width: w }}>
          <Text className="text-text-secondary">{w}px</Text>
          <Story />
        </View>
      ))}
    </View>
  )
}
