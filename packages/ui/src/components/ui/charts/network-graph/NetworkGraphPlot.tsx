// The two SVG layers of NetworkGraph. A DOM `<svg>`, as every line mark on main is; all
// geometry comes from `network-graph-plot-model.ts`, so this file only paints.
import type { CSSProperties } from 'react'
import { resolveColor, type ColorToken } from '../../../../theme/resolve-color'
import { CHART_EASE_OUT, useChartEntrance } from '../kit/chartEntrance'
import {
  ARROW_LENGTH,
  EDGE_REST_COLOR,
  EDGE_STRONG_COLOR,
  NEUTRAL_NODE_COLOR,
  arrowRefX,
  isItem,
  type EdgeGeometry,
  type GraphEmphasis,
} from './network-graph-plot-model'
import { BoxMark, DIM_OPACITY, NodeMark } from './NetworkGraphNodeMarks'
import type { GraphFocus, GraphItemRef, GraphModel } from './types'
import { PULSE_MS } from './useNetworkGraph'

export { BOX_CORNER_RADIUS, DIM_OPACITY, MUTED_OPACITY } from './NetworkGraphNodeMarks'

const EDGE_STROKE_WIDTHS = [1, 2, 3] as const
const EDGE_DASH = '5 4'
const PULSE_STROKE_WIDTH = 3
/** Length of the travelling dash, as a fraction of the edge. */
const PULSE_DASH = 0.2

export const LAYER_STYLE: CSSProperties = {
  position: 'absolute',
  left: 0,
  top: 0,
  pointerEvents: 'none',
}

function ArrowMarker({ id, color, refX }: { id: string; color: ColorToken; refX: number }) {
  const half = ARROW_LENGTH / 2
  return (
    // eslint-disable-next-line titan/no-html-element -- DOM svg, web and React Native Web only (contract C9)
    <marker
      id={id}
      markerUnits="userSpaceOnUse"
      markerWidth={ARROW_LENGTH}
      markerHeight={ARROW_LENGTH}
      refX={refX}
      refY={half}
      orient="auto"
    >
      {/* eslint-disable-next-line titan/no-html-element -- DOM svg, web and React Native Web only (contract C9) */}
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

/** The arrowhead for a rest colour: the shared one, or one per edge-kind colour. */
const restMarkerId = (prefix: string, color: ColorToken | undefined) =>
  color ? `${prefix}-rest-${color}` : `${prefix}-rest`

function EdgeMark({ geometry, markerPrefix, isStrong, isDimmed }: EdgeMarkProps) {
  const marker = isStrong ? `${markerPrefix}-strong` : restMarkerId(markerPrefix, geometry.color)
  const stroke = isStrong ? EDGE_STRONG_COLOR : (geometry.color ?? EDGE_REST_COLOR)
  return (
    // eslint-disable-next-line titan/no-html-element -- DOM svg, web and React Native Web only (contract C9)
    <path
      d={geometry.path}
      fill="none"
      strokeWidth={EDGE_STROKE_WIDTHS[geometry.step]}
      strokeDasharray={geometry.isDashed ? EDGE_DASH : undefined}
      markerEnd={`url(#${marker})`}
      opacity={isDimmed ? DIM_OPACITY : 1}
      style={{ stroke: resolveColor(stroke) }}
      data-edge={geometry.id}
      data-emphasis={isStrong ? 'strong' : 'rest'}
    />
  )
}

/**
 * Traffic on an edge: a dash that travels source to target, as one CSS transition. With reduced
 * motion it is a still stroke over the whole edge, which the owner removes after `PULSE_MS`.
 */
function PulseMark({ path }: { path: string }) {
  const { enabled, played } = useChartEntrance(true)
  const stroke = resolveColor('brand-primary')
  if (!enabled) {
    return (
      // eslint-disable-next-line titan/no-html-element -- DOM svg, web and React Native Web only (contract C9)
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
    // eslint-disable-next-line titan/no-html-element -- DOM svg, web and React Native Web only (contract C9)
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

export interface NetworkGraphPlotProps {
  model: GraphModel
  geometries: readonly EdgeGeometry[]
  nodeColors: ReadonlyMap<string, ColorToken>
  emphasis: GraphEmphasis | null
  active: GraphFocus | null
  selection: GraphItemRef | null
  pulsing: ReadonlyMap<string, number>
  /** False paints no pulse at all; reduced motion still gets the still form. */
  animate: boolean
  /** Prefix for the arrowhead marker ids, unique per graph. */
  markerPrefix: string
}

/** Each distinct edge-kind colour, once, for its arrowhead. */
const kindColorsOf = (geometries: readonly EdgeGeometry[]) => [
  ...new Set(geometries.flatMap((g) => (g.color ? [g.color] : []))),
]

/** The painted layer: edges, arrowheads, pulses and node marks. Hidden from assistive tech. */
export function NetworkGraphPlot(props: NetworkGraphPlotProps) {
  const { model, geometries, nodeColors, emphasis, active, selection, pulsing, animate } = props
  const { markerPrefix } = props
  const refX = arrowRefX(model.edgeShape)
  return (
    // eslint-disable-next-line titan/no-html-element -- DOM svg, web and React Native Web only (contract C9)
    <svg
      aria-hidden="true"
      width={model.width}
      height={model.height}
      style={LAYER_STYLE}
      data-testid="network-graph-plot"
    >
      {/* eslint-disable-next-line titan/no-html-element -- DOM svg, web and React Native Web only (contract C9) */}
      <defs>
        <ArrowMarker id={`${markerPrefix}-rest`} color={EDGE_REST_COLOR} refX={refX} />
        <ArrowMarker id={`${markerPrefix}-strong`} color={EDGE_STRONG_COLOR} refX={refX} />
        {kindColorsOf(geometries).map((color) => (
          <ArrowMarker
            key={color}
            id={restMarkerId(markerPrefix, color)}
            color={color}
            refX={refX}
          />
        ))}
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
      {animate
        ? geometries.flatMap(({ id, path }) =>
            pulsing.has(id)
              ? [<PulseMark key={`${id}:${String(pulsing.get(id))}`} path={path} />]
              : []
          )
        : null}
      {model.order.map((id) => {
        const node = model.index.nodesById.get(id)
        const point = model.positions[id]
        if (!node || !point) return null
        const mark = {
          node,
          color: (node.kind !== undefined && nodeColors.get(node.kind)) || NEUTRAL_NODE_COLOR,
          isActive: isItem(active, 'node', id),
          isSelected: isItem(selection, 'node', id),
          isDimmed: emphasis !== null && !emphasis.nodes.has(id),
        }
        const box = model.nodeBoxes[id]
        return box ? (
          <BoxMark key={id} {...mark} box={box} />
        ) : (
          <NodeMark key={id} {...mark} x={point.x} y={point.y} />
        )
      })}
    </svg>
  )
}
