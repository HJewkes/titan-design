// The node marks NetworkGraph's plot paints: a dot, or a box under the `box` node shape.
import { resolveColor, type ColorToken } from '../../../../theme/resolve-color'
import { NODE_RADIUS } from './network-graph-plot-model'
import type { GraphBox, GraphNode } from './types'

/** Opacity of everything that is not the active item, its edges or its neighbours. */
export const DIM_OPACITY = 0.25
export const MUTED_OPACITY = 0.5
const SELECTION_RING_GAP = 3
const ACTIVE_HALO_GAP = 5
/** Corner radius of a box node; its rings follow the corner out. */
export const BOX_CORNER_RADIUS = 6
const BOX_FILL: ColorToken = 'surface-raised'
const BOX_STROKE_WIDTH = 2

interface NodeMarkProps {
  node: GraphNode
  x: number
  y: number
  color: ColorToken
  isActive: boolean
  isSelected: boolean
  isDimmed: boolean
}

export function NodeMark({ node, x, y, color, isActive, isSelected, isDimmed }: NodeMarkProps) {
  const opacity = isDimmed ? DIM_OPACITY : node.isMuted ? MUTED_OPACITY : 1
  return (
    // eslint-disable-next-line titan/no-html-element -- DOM svg, web and React Native Web only (contract C9)
    <g opacity={opacity} data-node={node.id}>
      {isActive ? (
        // eslint-disable-next-line titan/no-html-element -- DOM svg, web and React Native Web only (contract C9)
        <circle
          cx={x}
          cy={y}
          r={NODE_RADIUS + ACTIVE_HALO_GAP}
          style={{ fill: resolveColor('interactive-focus') }}
        />
      ) : null}
      {/* eslint-disable-next-line titan/no-html-element -- DOM svg, web and React Native Web only (contract C9) */}
      <circle cx={x} cy={y} r={NODE_RADIUS} style={{ fill: resolveColor(color) }} />
      {isSelected ? (
        // eslint-disable-next-line titan/no-html-element -- DOM svg, web and React Native Web only (contract C9)
        <circle
          cx={x}
          cy={y}
          r={NODE_RADIUS + SELECTION_RING_GAP}
          fill="none"
          strokeWidth={2}
          style={{ stroke: resolveColor('text-primary') }}
          data-ring="selected"
        />
      ) : null}
    </g>
  )
}

const outset = (box: GraphBox, gap: number) => ({
  x: box.x - gap,
  y: box.y - gap,
  width: box.width + 2 * gap,
  height: box.height + 2 * gap,
  rx: BOX_CORNER_RADIUS + gap,
})

interface BoxMarkProps extends Omit<NodeMarkProps, 'x' | 'y'> {
  box: GraphBox
}

/** A `box` node: a raised rectangle outlined in its kind's colour, with the same halo and ring as a dot. */
export function BoxMark({ node, box, color, isActive, isSelected, isDimmed }: BoxMarkProps) {
  const opacity = isDimmed ? DIM_OPACITY : node.isMuted ? MUTED_OPACITY : 1
  return (
    // eslint-disable-next-line titan/no-html-element -- DOM svg, web and React Native Web only (contract C9)
    <g opacity={opacity} data-node={node.id} data-shape="box">
      {isActive ? (
        // eslint-disable-next-line titan/no-html-element -- DOM svg, web and React Native Web only (contract C9)
        <rect
          {...outset(box, ACTIVE_HALO_GAP)}
          style={{ fill: resolveColor('interactive-focus') }}
        />
      ) : null}
      {/* eslint-disable-next-line titan/no-html-element -- DOM svg, web and React Native Web only (contract C9) */}
      <rect
        {...outset(box, 0)}
        strokeWidth={BOX_STROKE_WIDTH}
        style={{ fill: resolveColor(BOX_FILL), stroke: resolveColor(color) }}
      />
      {isSelected ? (
        // eslint-disable-next-line titan/no-html-element -- DOM svg, web and React Native Web only (contract C9)
        <rect
          {...outset(box, SELECTION_RING_GAP + BOX_STROKE_WIDTH / 2)}
          fill="none"
          strokeWidth={2}
          style={{ stroke: resolveColor('text-primary') }}
          data-ring="selected"
        />
      ) : null}
    </g>
  )
}
