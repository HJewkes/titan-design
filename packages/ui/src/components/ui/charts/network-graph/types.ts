import type { ReactNode } from 'react'
import type { ViewProps } from 'react-native'
import type { ColorToken } from '../../../../theme/resolve-color'

/** One thing in the graph. */
export interface GraphNode {
  /** Unique within the graph; the first of duplicate ids is kept. */
  id: string
  /** Shown beside the mark and in the name; an empty label falls back to the id. */
  label: string
  /** Looked up in `nodeKinds` for a colour and a label; unset is a neutral mark. */
  kind?: string
  /** Read by the clustered layout; ignored by the layered layout. */
  group?: string
  /** Shown in the default tooltip. */
  description?: string
  /** Halves the mark's opacity. */
  isMuted?: boolean
}

/** A directed relation: the source acts on the target. */
export interface GraphEdge {
  /** Defaults to `${source}->${target}:${kind ?? ''}`. */
  id?: string
  /** Node id. */
  source: string
  /** Node id. */
  target: string
  /** Looked up in `edgeKinds` for a label and a stroke; an empty kind is no kind. */
  kind?: string
  /** A count; duplicates sum it. `null`, `NaN`, infinite and negative read as unknown. */
  weight?: number | null
  /** Epoch ms of the latest traffic; a newer value pulses the edge. */
  activityAt?: number
}

/** A node kind: its label and, optionally, its colour. */
export interface GraphKind {
  /** Matches `GraphNode.kind`. */
  id: string
  /** In the legend, the tooltip and every node's name. */
  label: string
  /** Overrides the categorical colour the kind's position in `nodeKinds` gives it. */
  color?: ColorToken
}

/** An edge kind: its label and stroke. */
export interface GraphEdgeKind {
  /** Matches `GraphEdge.kind`. */
  id: string
  /** In the legend and every edge's name. */
  label: string
  /** Default 'solid'. */
  stroke?: 'solid' | 'dashed'
}

/** The selection: one node or one edge, by id. */
export interface GraphItemRef {
  /** Which id space `id` names. */
  type: 'node' | 'edge'
  /** A node id, or a cleaned edge id. */
  id: string
}

/** A position in the layout's px space. */
export interface GraphPoint {
  /** Px from the left. */
  x: number
  /** Px from the top. */
  y: number
}

/** What a layout receives: the cleaned graph and the viewport. */
export interface GraphLayoutInput {
  /** Cleaned: unique ids. */
  nodes: readonly GraphNode[]
  /** Cleaned: known endpoints, no self edges, duplicates merged. */
  edges: readonly GraphEdge[]
  /** Viewport width in px. */
  width: number
  /** Viewport height in px. */
  height: number
}

/** A group a clustered layout places together. */
export interface GraphGroup {
  /** Matches `GraphNode.group`. */
  id: string
  /** Painted at the region. */
  label: string
}

/** A circle a layout asks to be drawn under the nodes: a cluster's region or an ego hop ring. */
export interface GraphGroupRegion {
  /** The group id, or a ring's hop. */
  id: string
  /** Drawn at the region and added to each member's accessible name. */
  label: string
  /** The nodes inside. */
  nodeIds: readonly string[]
  /** Centre x in px. */
  cx: number
  /** Centre y in px. */
  cy: number
  /** A radius of 0 is not painted. */
  radius: number
  /** `region`: a disc (clustered); `ring`: an outline (ego hop distance). */
  variant: 'region' | 'ring'
}

/** What a layout returns: positions, an order and a natural size. */
export interface GraphLayoutResult {
  /** A node without a position is not drawn. */
  positions: Readonly<Record<string, GraphPoint>>
  /** Keyboard and reading order of the placed nodes. */
  order: readonly string[]
  /** Natural size; may exceed the viewport. */
  width: number
  /** Natural height in px. */
  height: number
  /** Default 'horizontal'. */
  edgeShape?: 'horizontal' | 'arc'
  /** Default 'all'. */
  labelMode?: 'all' | 'declutter'
  /** Regions or rings to paint under the nodes. */
  groups?: readonly GraphGroupRegion[]
}

/** A layout is a value: a pure, synchronous `compute` and a key the component memoises on. */
export interface GraphLayout {
  /** Stable identity for memoisation: a string of the factory's options. */
  key: string
  /** Equal input gives equal output. */
  compute: (input: GraphLayoutInput) => GraphLayoutResult
}

/** What `formatNodeLabel` is told about a node beyond the node itself. */
export interface GraphNodeContext {
  /** The kind's label from `nodeKinds`, else its id; unset when the node has no kind. */
  kindLabel?: string
  /** Labels of the groups that hold the node, in group order; a hop for an ego ring. */
  groupLabels?: readonly string[]
  /** Drawn edges into the node. */
  incoming: number
  /** Drawn edges out of the node. */
  outgoing: number
}

/** What `cleanGraph` dropped or merged; every count reaches the summary. */
export interface GraphCleanReport {
  /** Later nodes that repeated an id. */
  duplicateNodes: number
  /** Edges whose source is their target. */
  selfEdges: number
  /** Edges with an end that names no node. */
  unknownEndpointEdges: number
  /** Edges folded into another with the same source, target and kind. */
  mergedEdges: number
}

/** Lookups over the drawn graph, for traversal and names. */
export interface GraphIndex {
  /** Placed nodes in reading order. */
  order: readonly string[]
  /** Every cleaned node. */
  nodesById: ReadonlyMap<string, GraphNode>
  /** Every drawn edge. */
  edgesById: ReadonlyMap<string, GraphEdge>
  /** Drawn edges per node, ordered by the other endpoint's place in `order`, then edge id. */
  incoming: ReadonlyMap<string, readonly GraphEdge[]>
  /** As `incoming`, for the edges out of each node. */
  outgoing: ReadonlyMap<string, readonly GraphEdge[]>
}

/** The cleaned, laid-out graph the component paints and `summarize` reads. */
export interface GraphModel {
  /** Cleaned nodes and edges, placed or not. */
  nodes: readonly GraphNode[]
  /** Cleaned edges, drawn or not. */
  edges: readonly GraphEdge[]
  /** What cleaning dropped or merged. */
  report: GraphCleanReport
  /** The layout's positions for the placed nodes. */
  positions: Readonly<Record<string, GraphPoint>>
  /** Placed nodes in keyboard and reading order. */
  order: readonly string[]
  /** Edges whose two endpoints are placed. */
  drawnEdges: readonly GraphEdge[]
  /** Cleaned nodes the layout gave no finite position. */
  unplacedNodes: number
  /** Cleaned edges with an unplaced end. */
  unplacedEdges: number
  /** Lookups over the drawn graph. */
  index: GraphIndex
  /** Natural width in px, at least the viewport. */
  width: number
  /** Natural height in px, at least the viewport. */
  height: number
  /** How edges are drawn; from the layout. */
  edgeShape: 'horizontal' | 'arc'
  /** Whether labels may be hidden to avoid overlap; from the layout. */
  labelMode: 'all' | 'declutter'
  /** The layout's regions or rings, limited to placed nodes; empty when the layout gives none. */
  groups: readonly GraphGroupRegion[]
}

/** The keys that move the active item. */
export type GraphFocusKey = 'Down' | 'Up' | 'Right' | 'Left' | 'Home' | 'End'

/** An edge focus remembers the node it was entered from, the anchor for Down, Up, Home and End. */
export type GraphFocus = { type: 'node'; id: string } | { type: 'edge'; id: string; from: string }

/** Props of `NetworkGraph`. Controlled state is `selection`, `defaultSelection`, `onSelectionChange`. */
export interface NetworkGraphProps extends Omit<ViewProps, 'children'> {
  /** Cleaned before layout: the first of duplicate ids is kept and the rest are counted. */
  nodes: GraphNode[]
  /** Cleaned before layout: self edges and unknown ends are dropped, duplicates merge. */
  edges: GraphEdge[]
  /** The root is named `"<label>. <summary>"`. */
  accessibilityLabel: string
  /** Viewport width in px; a larger layout scrolls. */
  width: number
  /** Viewport height in px; a larger layout scrolls. */
  height: number
  /** Default `layeredLayout()`. */
  layout?: GraphLayout
  /** Labels and colours for node kinds, in list order. */
  nodeKinds?: GraphKind[]
  /** Labels and strokes for edge kinds. */
  edgeKinds?: GraphEdgeKind[]
  /** Default false. A row below the plot, built from the two kind lists. */
  showLegend?: boolean
  /** Controlled selection; a ref to an item that is not drawn reads as `null`. */
  selection?: GraphItemRef | null
  /** Initial selection when uncontrolled. */
  defaultSelection?: GraphItemRef | null
  /** Called with the new selection, or `null` when it clears. */
  onSelectionChange?: (selection: GraphItemRef | null) => void
  /** Replaces the active node's tooltip content (label, kind and description by default). */
  nodeTooltip?: (node: GraphNode) => ReactNode
  /** Replaces a node's accessible name. */
  formatNodeLabel?: (node: GraphNode, context: GraphNodeContext) => string
  /** Replaces an edge's accessible name. */
  formatEdgeLabel?: (edge: GraphEdge, source: GraphNode, target: GraphNode) => string
  /** Replaces the summary sentence in the root's name. */
  summarize?: (model: GraphModel) => string
  /** Default true. False renders no edge pulse; reduced motion keeps a still one. */
  animate?: boolean
  /** Renders a skeleton of `width` by `height` instead of the graph. */
  isLoading?: boolean
  /** Keeps focus, traversal, hover and reading; stops selection changes; sets `aria-disabled`. */
  isDisabled?: boolean
  /** Shown when no node is drawn; default `<EmptyState title="No nodes" />`. */
  emptyState?: ReactNode
  /** Tailwind classes for the outer view. */
  className?: string
}
