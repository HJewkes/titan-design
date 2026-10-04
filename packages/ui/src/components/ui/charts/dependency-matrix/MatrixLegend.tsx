import { View } from 'react-native'

import { Typography } from '../../typography'
import { MatrixFill, MatrixFlagMark } from './MatrixCell'
import type { MatrixStep } from './matrix-model'
import type { MatrixDirection } from './types'

const STEPS: MatrixStep[] = [1, 2, 3, 4]

export const DIRECTION_CAPTION: Record<MatrixDirection, string> = {
  'row-depends-on-column': 'Each row depends on the columns it marks.',
  'column-depends-on-row': 'Each column depends on the rows it marks.',
}

export const NO_EDGES_CAPTION = 'No dependencies between these items.'

export interface MatrixLegendProps {
  direction: MatrixDirection
  hasEdges: boolean
  hasCycle: boolean
}

function IntensityKey() {
  return (
    <View className="flex-row items-center gap-inline-sm">
      <Typography variant="caption" color="secondary">
        Fewer
      </Typography>
      <View className="flex-row gap-0.5">
        {STEPS.map((step) => (
          <View key={step} testID="matrix-legend-step" className="h-3 w-3">
            <MatrixFill step={step} />
          </View>
        ))}
      </View>
      <Typography variant="caption" color="secondary">
        More references
      </Typography>
    </View>
  )
}

/** The key to a DependencyMatrix: the four steps, the cycle mark and the reading direction in words. */
export function MatrixLegend({ direction, hasEdges, hasCycle }: MatrixLegendProps) {
  return (
    <View testID="matrix-legend" className="gap-stack-sm">
      <View className="flex-row flex-wrap items-center gap-inline-lg">
        <IntensityKey />
        {hasCycle && (
          <View className="flex-row items-center gap-inline-sm">
            <MatrixFlagMark flag="cycle" />
            <Typography variant="caption" color="secondary">
              Cycle
            </Typography>
          </View>
        )}
      </View>
      <Typography variant="caption" color="secondary" testID="matrix-direction-caption">
        {DIRECTION_CAPTION[direction]}
      </Typography>
      {!hasEdges && (
        <Typography variant="caption" color="secondary" testID="matrix-no-edges-caption">
          {NO_EDGES_CAPTION}
        </Typography>
      )}
    </View>
  )
}
