import { resolveColor } from '../../../../theme/resolve-color'
import type { ThemeMode } from '../../../../theme/tokens/semantic'
import type { LineGeometry } from './types'

export const RULE_DASH = '4 4'

/** Gridlines at the y ticks, dashed reference lines across the plot and dashed boundary rules down it. */
export function Rules({ geometry, mode }: { geometry: LineGeometry; mode: ThemeMode }) {
  const grid = resolveColor('hairline-default', mode)
  const rule = resolveColor('text-secondary', mode)
  const boundary = resolveColor('text-tertiary', mode)
  const across = { x1: 0, x2: geometry.width }
  const down = { y1: 0, y2: geometry.height, strokeDasharray: RULE_DASH }
  return (
    <>
      {geometry.yTicks.map((tick) => (
        <line
          key={tick.value}
          data-testid="line-chart-gridline"
          {...across}
          y1={tick.position}
          y2={tick.position}
          stroke={grid}
        />
      ))}
      {geometry.referenceLines.map((line, i) => (
        <line
          key={i}
          data-testid="line-chart-reference"
          {...across}
          y1={line.position}
          y2={line.position}
          stroke={rule}
          strokeDasharray={RULE_DASH}
        />
      ))}
      {geometry.boundaries.map((b, i) => (
        <line
          key={i}
          data-testid="line-chart-boundary"
          {...down}
          x1={b.position}
          x2={b.position}
          stroke={boundary}
        />
      ))}
    </>
  )
}
