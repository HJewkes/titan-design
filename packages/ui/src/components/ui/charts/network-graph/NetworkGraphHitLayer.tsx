import { isItem, type EdgeGeometry } from './network-graph-plot-model'
import { LAYER_STYLE } from './NetworkGraphPlot'
import type { GraphItemRef, GraphModel } from './types'

/** Wide enough to press; the painted stroke under it is 1 to 3 px. */
export const EDGE_HIT_WIDTH = 14

export interface NetworkGraphHitLayerProps {
  model: GraphModel
  geometries: readonly EdgeGeometry[]
  domIds: ReadonlyMap<string, string>
  names: ReadonlyMap<string, string>
  selection: GraphItemRef | null
  onPress: (edgeId: string) => void
  onHoverIn: (edgeId: string) => void
  onHoverOut: () => void
}

/** One wide unpainted path per edge: the edge's name, its press target and its `aria-activedescendant` target. */
export function NetworkGraphHitLayer(props: NetworkGraphHitLayerProps) {
  const { model, geometries, domIds, names, selection, onPress, onHoverIn, onHoverOut } = props
  return (
    // eslint-disable-next-line titan/no-html-element -- DOM svg, web and React Native Web only (contract C9)
    <svg role="presentation" width={model.width} height={model.height} style={LAYER_STYLE}>
      {geometries.map(({ id, path }) => (
        // eslint-disable-next-line titan/no-html-element -- DOM svg, web and React Native Web only (contract C9)
        <path
          key={id}
          id={domIds.get(id)}
          role="button"
          aria-label={names.get(id)}
          aria-pressed={isItem(selection, 'edge', id)}
          tabIndex={-1}
          d={path}
          fill="none"
          strokeWidth={EDGE_HIT_WIDTH}
          style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
          onClick={() => onPress(id)}
          onPointerEnter={() => onHoverIn(id)}
          onPointerLeave={onHoverOut}
        />
      ))}
    </svg>
  )
}
