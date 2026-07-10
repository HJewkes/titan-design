import { type ViewProps } from 'react-native'
import { HStack } from '../../ui/stack'
import { Tile } from '../../ui/tile'

export interface MetricTileData {
  /** Uppercase micro-label shown above the value */
  label: string
  /** Primary value */
  value: string
  /** Tints the value (status/accent hex); defaults to primary text */
  valueColor?: string
}

export interface MetricTilesProps extends ViewProps {
  /** Stat cells rendered left-to-right; typically three */
  metrics: MetricTileData[]
  /** Space between tiles (Stack gap scale, default 1 ≈ 4px) */
  gap?: 0 | 1 | 2 | 3 | 4
}

/**
 * MetricTiles — a row of equal-width stat tiles.
 *
 * A thin, presentational HStack of {@link Tile}. Each tile flexes to fill its
 * share so the row reflows gracefully in a responsive rail. Used by SessionHeader
 * for Volume / Load / Fatigue (and Date / Time / Until when upcoming).
 *
 * @example
 * <MetricTiles metrics={[
 *   { label: 'Volume', value: '76%' },
 *   { label: 'Load', value: '7.3k' },
 *   { label: 'Fatigue', value: 'MOD', valueColor: amber },
 * ]} />
 */
export function MetricTiles({ metrics, gap = 1, ...props }: MetricTilesProps) {
  return (
    <HStack gap={gap} align="stretch" {...props}>
      {metrics.map((metric) => (
        <Tile
          key={metric.label}
          label={metric.label}
          value={metric.value}
          valueColor={metric.valueColor}
        />
      ))}
    </HStack>
  )
}
