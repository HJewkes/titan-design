import type { ReactNode } from 'react'
import type { ViewProps } from 'react-native'
import type { ColorToken } from '../../../../theme/resolve-color'

export interface GraphNode {
  id: string
  label: string
  kind?: string
  /** Read by the clustered layout; ignored by the layered layout. */
  group?: string
  description?: string
  isMuted?: boolean
}

export interface GraphEdge {
  /** Defaults to `${source}->${target}:${kind ?? ''}`. */
  id?: string
  source: string
  target: string
  kind?: string
  weight?: number | null
  /** Epoch ms of the latest traffic; a newer value pulses the edge. */
  activityAt?: number
}

export interface GraphKind {
  id: string
  label: string
  color?: ColorToken
}

export interface GraphEdgeKind {
  id: string
  label: string
  stroke?: 'solid' | 'dashed'
}

export interface GraphItemRef {
  type: 'node' | 'edge'
  id: string
}

export interface GraphPoint {
  x: number
  y: number
}

export interface GraphLayoutInput {
  /** Cleaned: unique ids. */
  nodes: readonly GraphNode[]
  /** Cleaned: known endpoints, no self edges, duplicates merged. */
  edges: readonly GraphEdge[]
  width: number
  height: number
}

export interface GraphGroup {
  id: string
  label: string
}

/** A circle a layout asks to be drawn under the nodes: a cluster's region or an ego hop ring. */
export interface GraphGroupRegion {
  id: string
  /** Drawn at the region and added to each member's accessible name. */
  label: string
  nodeIds: readonly string[]
  cx: number
  cy: number
  /** A radius of 0 is not painted. */
  radius: number
  /** `region`: a disc (clustered); `ring`: an outline (ego hop distance). */
  variant: 'region' | 'ring'
}

export interface GraphLayoutResult {
  /** A node without a position is not drawn. */
  positions: Readonly<Record<string, GraphPoint>>
  /** Keyboard and reading order of the placed nodes. */
  order: readonly string[]
  /** Natural size; may exceed the viewport. */
  width: number
  height: number
  /** Default 'horizontal'. */
  edgeShape?: 'horizontal' | 'arc'
  /** Default 'all'. */
  labelMode?: 'all' | 'declutter'
  groups?: readonly GraphGroupRegion[]
}

export interface GraphLayout {
  /** Stable identity for memoisation: a string of the factory's options. */
  key: string
  compute: (input: GraphLayoutInput) => GraphLayoutResult
}

export interface GraphNodeContext {
  kindLabel?: string
  /** Labels of the groups that hold the node, in group order; a hop for an ego ring. */
  groupLabels?: readonly string[]
  incoming: number
  outgoing: number
}

export interface GraphCleanReport {
  duplicateNodes: number
  selfEdges: number
  unknownEndpointEdges: number
  mergedEdges: number
}

export interface GraphIndex {
  /** Placed nodes in reading order. */
  order: readonly string[]
  nodesById: ReadonlyMap<string, GraphNode>
  edgesById: ReadonlyMap<string, GraphEdge>
  /** Drawn edges per node, ordered by the other endpoint's place in `order`, then edge id. */
  incoming: ReadonlyMap<string, readonly GraphEdge[]>
  outgoing: ReadonlyMap<string, readonly GraphEdge[]>
}

export interface GraphModel {
  /** Cleaned nodes and edges, placed or not. */
  nodes: readonly GraphNode[]
  edges: readonly GraphEdge[]
  report: GraphCleanReport
  positions: Readonly<Record<string, GraphPoint>>
  order: readonly string[]
  /** Edges whose two endpoints are placed. */
  drawnEdges: readonly GraphEdge[]
  unplacedNodes: number
  unplacedEdges: number
  index: GraphIndex
  width: number
  height: number
  edgeShape: 'horizontal' | 'arc'
  labelMode: 'all' | 'declutter'
  /** The layout's regions or rings, limited to placed nodes; empty when the layout gives none. */
  groups: readonly GraphGroupRegion[]
}

export type GraphFocusKey = 'Down' | 'Up' | 'Right' | 'Left' | 'Home' | 'End'

/** An edge focus remembers the node it was entered from, the anchor for Down, Up, Home and End. */
export type GraphFocus = { type: 'node'; id: string } | { type: 'edge'; id: string; from: string }

export interface NetworkGraphProps extends Omit<ViewProps, 'children'> {
  nodes: GraphNode[]
  edges: GraphEdge[]
  accessibilityLabel: string
  width: number
  height: number
  /** Default `layeredLayout()`. */
  layout?: GraphLayout
  nodeKinds?: GraphKind[]
  edgeKinds?: GraphEdgeKind[]
  showLegend?: boolean
  selection?: GraphItemRef | null
  defaultSelection?: GraphItemRef | null
  onSelectionChange?: (selection: GraphItemRef | null) => void
  nodeTooltip?: (node: GraphNode) => ReactNode
  formatNodeLabel?: (node: GraphNode, context: GraphNodeContext) => string
  formatEdgeLabel?: (edge: GraphEdge, source: GraphNode, target: GraphNode) => string
  summarize?: (model: GraphModel) => string
  /** Default true. False renders no edge pulse; reduced motion keeps a still one. */
  animate?: boolean
  isLoading?: boolean
  isDisabled?: boolean
  emptyState?: ReactNode
  className?: string
}
