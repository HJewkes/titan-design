import { View, type ViewProps } from 'react-native'
import { cn } from '../../../../utils/cn'
import { DATAVIZ_CATEGORICAL_ROLES } from '../../../../theme/extracted-colors-dataviz'
import { getSemanticColors } from '../../../../theme/tokens/semantic'
import { useSurfaceMode } from '../../surface'
import {
  scatterAriaLabel,
  scatterLayout,
  type ScatterAxis,
  type ScatterDatum,
} from './scatterGeometry'
import { ScatterFrame } from './ScatterFrame'
import { ScatterGridlines } from './ScatterGridlines'
import { ScatterPointMark } from './ScatterPointMark'

export type { ScatterAxis, ScatterDatum } from './scatterGeometry'

export interface ScatterProps extends Omit<ViewProps, 'children'> {
  data: ScatterDatum[]
  /** Layout box. Required — the plot fills exactly this area. */
  width: number
  height: number
  /** Axis labels and optional domain overrides. */
  axis?: ScatterAxis
  /**
   * Draw the y = 1 − x "main sequence" reference line (NDepend idiom, where
   * distance from the diagonal measures the zone of pain / zone of uselessness).
   */
  diagonal?: boolean
  /** Fires with a point's id on press. */
  onPress?: (id: string) => void
  /** Draws a highlight ring on the matching point. */
  selectedId?: string
  className?: string
}

/**
 * SVG-free scatter / bubble plot (absolutely-positioned Views), matching the
 * codebase's chart convention so it renders identically on web and native. Used
 * for "main-sequence" plots (instability × abstractness) via the `diagonal`
 * reference line, or any two metrics. Positions and bubble sizes are computed
 * from the data; color and labels are caller-supplied.
 */
export function Scatter({
  data,
  width,
  height,
  axis = {},
  diagonal = false,
  onPress,
  selectedId,
  className,
  ...props
}: ScatterProps) {
  const colors = getSemanticColors(useSurfaceMode())
  const palette = DATAVIZ_CATEGORICAL_ROLES.map((role) => colors[role])
  const layout = scatterLayout(data, width, height, axis, palette)
  const ariaLabel = scatterAriaLabel(axis, data.length)

  return (
    <View className={cn('relative', className)} style={{ width, height }} {...props}>
      {/* Non-interactive labelled canvas: grid, axes, ticks, diagonal. */}
      <View
        accessibilityRole="image"
        accessibilityLabel={ariaLabel}
        testID="scatter-canvas"
        style={{ position: 'absolute', top: 0, left: 0, width, height, overflow: 'hidden' }}
      >
        <ScatterGridlines layout={layout} colors={colors} />
        <ScatterFrame layout={layout} colors={colors} axis={axis} diagonal={diagonal} />
      </View>

      {/* Interactive point overlay (kept out of the image-role canvas). */}
      <View
        style={{ position: 'absolute', top: 0, left: 0, width, height }}
        testID="scatter-points"
      >
        {layout.points.map((p) => (
          <ScatterPointMark
            key={p.datum.id}
            point={p}
            isSelected={p.datum.id === selectedId}
            ringColor={colors['text-primary']}
            onPress={onPress}
          />
        ))}
      </View>
    </View>
  )
}
