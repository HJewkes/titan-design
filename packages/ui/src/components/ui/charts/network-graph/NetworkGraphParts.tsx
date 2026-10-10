// The parts NetworkGraph lays over its SVG: node press targets, the tooltip, the weight readout and the legend.
import { memo, type ReactNode } from 'react'
import { Pressable, View, type PressableProps, type ViewProps } from 'react-native'
import { resolveColor, type ColorToken } from '../../../../theme/resolve-color'
import { cn } from '../../../../utils/cn'
import { Tooltip } from '../../tooltip'
import { Typography } from '../../typography'
import {
  NEUTRAL_NODE_COLOR,
  NODE_RADIUS,
  truncateLabel,
  weightText,
  type EdgeGeometry,
} from './network-graph-plot-model'
import { displayLabel } from './network-graph-text'
import { DIM_OPACITY } from './NetworkGraphPlot'
import type { GraphEdgeKind, GraphItemRef, GraphKind, GraphNode, GraphPoint } from './types'

/** Height of a node's press target; rows of the layered layout are 30 px apart. */
const NODE_TARGET_HEIGHT = 24
const NODE_TARGET_INSET = 2

interface NodeButtonProps {
  node: GraphNode
  point: GraphPoint
  domId: string | undefined
  name: string | undefined
  isSelected: boolean
  isDimmed: boolean
  describedBy: string | undefined
  onPress: (item: GraphItemRef) => void
  onHoverIn: (item: GraphItemRef) => void
  onHoverOut: () => void
}

/** A node's press target and visible label, over the mark the plot paints. */
export const NodeButton = memo(function NodeButton(props: NodeButtonProps) {
  const { node, point, domId, name, isSelected, isDimmed, describedBy } = props
  const { onPress, onHoverIn, onHoverOut } = props
  const item: GraphItemRef = { type: 'node', id: node.id }
  const webProps = {
    'aria-pressed': isSelected,
    'aria-describedby': describedBy,
    onPointerEnter: () => onHoverIn(item),
    onPointerLeave: onHoverOut,
  } as PressableProps
  return (
    <Pressable
      id={domId}
      role="button"
      aria-label={name}
      tabIndex={-1}
      onPress={() => onPress(item)}
      className="absolute flex-row items-center pl-5"
      style={{
        left: point.x - NODE_RADIUS - NODE_TARGET_INSET,
        top: point.y - NODE_TARGET_HEIGHT / 2,
        height: NODE_TARGET_HEIGHT,
        opacity: isDimmed ? DIM_OPACITY : 1,
      }}
      testID={`network-graph-node-${node.id}`}
      {...webProps}
    >
      <Typography
        variant="caption"
        color={node.isMuted ? 'secondary' : 'primary'}
        numberOfLines={1}
        className="max-w-40"
      >
        {truncateLabel(displayLabel(node))}
      </Typography>
    </Pressable>
  )
})

export function DefaultNodeTip({ node, kind }: { node: GraphNode; kind: string | undefined }) {
  return (
    <View className="gap-stack-xs">
      <Typography variant="subtitle2">{displayLabel(node)}</Typography>
      {kind !== undefined && (
        <Typography variant="caption" color="secondary">
          {kind}
        </Typography>
      )}
      {node.description !== undefined && (
        <Typography variant="caption">{node.description}</Typography>
      )}
    </View>
  )
}

/** One Tooltip for the whole graph, anchored on the active node's mark. */
export function NodeTip({
  id,
  point,
  children,
}: {
  id: string
  point: GraphPoint
  children: ReactNode
}) {
  return (
    <View
      className="pointer-events-none absolute"
      style={{ left: point.x - NODE_RADIUS, top: point.y - NODE_RADIUS }}
    >
      <Tooltip
        isOpen
        usePortal
        placement="top"
        content={
          <View nativeID={id} role="tooltip">
            {children}
          </View>
        }
      >
        <View style={{ width: NODE_RADIUS * 2, height: NODE_RADIUS * 2 }} />
      </Tooltip>
    </View>
  )
}

/** The active edge's weight beside its midpoint. The edge's name already says it, so this is hidden. */
export function EdgeWeight({ geometry }: { geometry: EdgeGeometry }) {
  const hidden = { 'aria-hidden': true } as ViewProps
  return (
    <View
      className="pointer-events-none absolute rounded bg-surface-elevated px-1"
      style={{ left: geometry.mid.x + NODE_RADIUS, top: geometry.mid.y - NODE_TARGET_HEIGHT }}
      testID="network-graph-edge-weight"
      {...hidden}
    >
      <Typography variant="caption">{weightText(geometry.edge)}</Typography>
    </View>
  )
}

interface GraphLegendProps {
  nodeKinds: readonly GraphKind[]
  edgeKinds: readonly GraphEdgeKind[]
  colors: ReadonlyMap<string, ColorToken>
}

export function GraphLegend({ nodeKinds, edgeKinds, colors }: GraphLegendProps) {
  if (nodeKinds.length === 0 && edgeKinds.length === 0) return null
  const item = 'flex-row items-center gap-inline-sm'
  return (
    <View role="list" aria-label="Legend" className="flex-row flex-wrap gap-x-inline-lg gap-y-1">
      {nodeKinds.map((kind) => (
        <View key={`node-${kind.id}`} role="listitem" className={item}>
          <View
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: resolveColor(colors.get(kind.id) ?? NEUTRAL_NODE_COLOR) }}
          />
          <Typography variant="caption" color="secondary">
            {kind.label}
          </Typography>
        </View>
      ))}
      {edgeKinds.map((kind) => (
        <View key={`edge-${kind.id}`} role="listitem" className={item}>
          <View
            className={cn(
              'w-5 border-t border-hairline-strong',
              kind.stroke === 'dashed' && 'border-dashed'
            )}
          />
          <Typography variant="caption" color="secondary">
            {kind.label}
          </Typography>
        </View>
      ))}
    </View>
  )
}
