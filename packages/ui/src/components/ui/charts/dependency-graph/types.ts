import type { ReactNode } from 'react'
import type { ViewProps } from 'react-native'
import type { GraphBox, GraphPoint } from '../network-graph/types'

/** One unit of the system: a package, an app or a service. */
export interface DependencyNode {
  /** Unique within the graph. */
  id: string
  /** Shown on the box and in the focus panel; an empty label falls back to the id. */
  label: string
  /** The `DependencyTier` id that holds the node. */
  tier: string
  /** Shown in the tooltip and the focus panel. */
  description?: string
}

/** `source` depends on `target`. */
export interface DependencyEdge {
  /** Node id of the dependent. */
  source: string
  /** Node id of the dependency. */
  target: string
}

/** A layer of the system; the graph boxes each tier's nodes together. */
export interface DependencyTier {
  /** Matches `DependencyNode.tier`. */
  id: string
  /** Painted on the tier's box and in the legend. */
  label: string
}

/**
 * A layout computed before render, as by ELK at build time. Every coordinate is in px with the
 * origin at the top left; nothing is laid out at runtime.
 */
export interface DependencyGraphLayout {
  /** Each node's rectangle, by node id. A node without one is not drawn. */
  nodes: Readonly<Record<string, GraphBox>>
  /** Each tier's rectangle, by tier id. A tier without one draws no box. */
  tiers?: Readonly<Record<string, GraphBox>>
  /**
   * A polyline per edge, source border to target border, keyed by `dependencyEdgeId`. An edge
   * without one runs straight between the two boxes.
   */
  routes?: Readonly<Record<string, readonly GraphPoint[]>>
}

/** A node's direct neighbours, each in input order. */
export interface DependencyNeighbourhood {
  /** Nodes the node depends on. */
  dependsOn: DependencyNode[]
  /** Nodes that depend on the node. */
  usedBy: DependencyNode[]
}

/** The nodes and edges of a dependency graph, before any layout. */
export interface DependencyGraphData {
  /** Every node; the first of a repeated id is kept. */
  nodes: DependencyNode[]
  /** Every dependency; self edges, repeats and edges with an unknown end are dropped. */
  edges: DependencyEdge[]
}

/** What a build step hands the component: the graph, its tiers and its precomputed layout. */
export interface DependencyGraphInput extends DependencyGraphData {
  /** The tiers; a node's colour follows its tier's place in this list. */
  tiers: DependencyTier[]
  /** Boxes and routes for the nodes that are drawn. */
  layout: DependencyGraphLayout
}

/**
 * Props of `DependencyGraph`. Controlled state is `focusedId`, `defaultFocusedId`,
 * `onFocusedIdChange`.
 */
export interface DependencyGraphProps extends Omit<ViewProps, 'children'> {
  /** The nodes, edges, tiers and layout; with `egoId` set, only that node's neighbourhood is drawn. */
  graph: DependencyGraphInput
  /** The root is named `"<label>. <summary>"`. */
  accessibilityLabel: string
  /** Viewport width in px; a larger layout scrolls. */
  width: number
  /** Viewport height in px; a larger layout scrolls. */
  height: number
  /**
   * Ego mode, for a page about one node: draws this node with only what it depends on and what
   * depends on it, on a layout computed for that subgraph (`egoSubgraph`). Unset draws every node.
   */
  egoId?: string
  /** Controlled focus: the node whose dependencies and dependents stay lit. */
  focusedId?: string | null
  /** Initial focus when uncontrolled. */
  defaultFocusedId?: string | null
  /** Called with the newly focused node id, or `null` when focus clears. */
  onFocusedIdChange?: (id: string | null) => void
  /**
   * A link to the node's own page, shown in the focus panel, e.g.
   * `(node) => <Link href={`/reference/${node.id}`}>Open reference</Link>`. Unset shows no link.
   */
  renderNodeLink?: (node: DependencyNode) => ReactNode
  /** Renders a skeleton of `width` by `height` instead of the graph. */
  isLoading?: boolean
  /** Shown when no node is drawn. */
  emptyState?: ReactNode
  /** Tailwind classes for the outer view. */
  className?: string
}
