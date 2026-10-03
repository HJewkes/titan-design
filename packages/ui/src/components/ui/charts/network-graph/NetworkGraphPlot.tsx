// The two SVG layers of NetworkGraph. A DOM `<svg>`, as every line mark on main is; all
// geometry comes from `network-graph-plot-model.ts`, so this file only paints.
import type { CSSProperties } from 'react'
import { resolveColor, type ColorToken } from '../../../../theme/resolve-color'
import { CHART_EASE_OUT, useChartEntrance } from '../kit/chartEntrance'
import {
  ARROW_LENGTH,
  NEUTRAL_NODE_COLOR,
  NODE_RADIUS,
  isItem,
  type EdgeGeometry,
  type GraphEmphasis,
} from './network-graph-plot-model'
import type { GraphFocus, GraphItemRef, GraphModel, GraphNode } from './types'
import { PULSE_MS } from './useNetworkGraph'

/** Opacity of everything that is not the active item, its edges or its neighbours. */
export const DIM_OPACITY = 0.25
export const MUTED_OPACITY = 0.5
const EDGE_STROKE_WIDTHS = [1, 2, 3] as const
const EDGE_DASH = '5 4'
const PULSE_STROKE_WIDTH = 3
/** Length of the travelling dash, as a fraction of the edge. */
const PULSE_DASH = 0.2
const SELECTION_RING_GAP = 3
const ACTIVE_HALO_GAP = 5

export const LAYER_STYLE: CSSProperties = {
  position: 'absolute',
  left: 0,
  top: 0,
  pointerEvents: 'none',
}

function ArrowMarker({ id, color }: { id: string; color: ColorToken }) {
  const half = ARROW_LENGTH / 2
  return (
    <marker
      id={id}
      markerUnits="userSpaceOnUse"
      markerWidth={ARROW_LENGTH}
      markerHeight={ARROW_LENGTH}
      refX={0}
      refY={half}
      orient="auto"
    >
      <path
        d={`M0,0L${ARROW_LENGTH},${half}L0,${ARROW_LENGTH}Z`}
        style={{ fill: resolveColor(color) }}
      />
    </marker>
  )
}

interface EdgeMarkProps {
  geometry: EdgeGeometry
  markerPrefix: string
  isStrong: boolean
  isDimmed: boolean
}

function EdgeMark({ geometry, markerPrefix, isStrong, isDimmed }: EdgeMarkProps) {
  return (
    <path
      d={geometry.path}
      fill="none"
      strokeWidth={EDGE_STROKE_WIDTHS[geometry.step]}
      strokeDasharray={geometry.isDashed ? EDGE_DASH : undefined}
      markerEnd={`url(#${markerPrefix}-${isStrong ? 'strong' : 'rest'})`}
      opacity={isDimmed ? DIM_OPACITY : 1}
      style={{ stroke: resolveColor(isStrong ? 'text-primary' : 'text-secondary') }}
      data-edge={geometry.id}
      data-emphasis={isStrong ? 'strong' : 'rest'}
    />
  )
}

/**
 * Traffic on an edge: a dash that travels source to target, as one CSS transition. With motion
 * off or reduced it is a still stroke over the whole edge, which the owner removes after `PULSE_MS`.
 */
function PulseMark({ path, animate }: { path: string; animate: boolean }) {
  const { enabled, played } = useChartEntrance(animate)
  const stroke = resolveColor('brand-primary')
  if (!enabled) {
    return (
      <path
        d={path}
        fill="none"
        strokeWidth={PULSE_STROKE_WIDTH}
        style={{ stroke }}
        data-pulse="still"
      />
    )
  }
  return (
    <path
      d={path}
      pathLength={1}
      fill="none"
      strokeWidth={PULSE_STROKE_WIDTH}
      strokeLinecap="round"
      style={{
        stroke,
        strokeDasharray: `${PULSE_DASH} 1`,
        strokeDashoffset: played ? -1 : PULSE_DASH,
        transition: `stroke-dashoffset ${String(PULSE_MS)}ms ${CHART_EASE_OUT}`,
      }}
      data-pulse="travel"
    />
  )
}

interface NodeMarkProps {
  node: GraphNode
  x: number
  y: number
  color: ColorToken
  isActive: boolean
  isSelected: boolean
  isDimmed: boolean
}

function NodeMark({ node, x, y, color, isActive, isSelected, isDimmed }: NodeMarkProps) {
  const opacity = isDimmed ? DIM_OPACITY : node.isMuted ? MUTED_OPACITY : 1
  return (
    <g opacity={opacity} data-node={node.id}>
      {isActive && (
        <circle
          cx={x}
          cy={y}
          r={NODE_RADIUS + ACTIVE_HALO_GAP}
          style={{ fill: resolveColor('interactive-focus') }}
        />
      )}
      <circle cx={x} cy={y} r={NODE_RADIUS} style={{ fill: resolveColor(color) }} />
      {isSelected && (
        <circle
          cx={x}
          cy={y}
          r={NODE_RADIUS + SELECTION_RING_GAP}
          fill="none"
          strokeWidth={2}
          style={{ stroke: resolveColor('text-primary') }}
          data-ring="selected"
        />
      )}
    </g>
  )
}

export interface NetworkGraphPlotProps {
  model: GraphModel
  geometries: readonly EdgeGeometry[]
  nodeColors: ReadonlyMap<string, ColorToken>
  emphasis: GraphEmphasis | null
  active: GraphFocus | null
  selection: GraphItemRef | null
  pulsing: ReadonlyMap<string, number>
  animate: boolean
  /** Prefix for the arrowhead marker ids, unique per graph. */
  markerPrefix: string
}

/** The painted layer: edges, arrowheads, pulses and node marks. Hidden from assistive tech. */
export function NetworkGraphPlot(props: NetworkGraphPlotProps) {
  const { model, geometries, nodeColors, emphasis, active, selection, pulsing, animate } = props
  const { markerPrefix } = props
  return (
    <svg
      aria-hidden="true"
      width={model.width}
      height={model.height}
      style={LAYER_STYLE}
      data-testid="network-graph-plot"
    >
      <defs>
        <ArrowMarker id={`${markerPrefix}-rest`} color="text-secondary" />
        <ArrowMarker id={`${markerPrefix}-strong`} color="text-primary" />
      </defs>
      {geometries.map((geometry) => (
        <EdgeMark
          key={geometry.id}
          geometry={geometry}
          markerPrefix={markerPrefix}
          isStrong={
            (emphasis?.edges.has(geometry.id) ?? false) || isItem(selection, 'edge', geometry.id)
          }
          isDimmed={emphasis !== null && !emphasis.edges.has(geometry.id)}
        />
      ))}
      {geometries.flatMap(({ id, path }) =>
        pulsing.has(id)
          ? [<PulseMark key={`${id}:${String(pulsing.get(id))}`} path={path} animate={animate} />]
          : []
      )}
      {model.order.map((id) => {
        const node = model.index.nodesById.get(id)
        const point = model.positions[id]
        if (!node || !point) return null
        return (
          <NodeMark
            key={id}
            node={node}
            x={point.x}
            y={point.y}
            color={(node.kind !== undefined && nodeColors.get(node.kind)) || NEUTRAL_NODE_COLOR}
            isActive={isItem(active, 'node', id)}
            isSelected={isItem(selection, 'node', id)}
            isDimmed={emphasis !== null && !emphasis.nodes.has(id)}
          />
        )
      })}
    </svg>
  )
}
