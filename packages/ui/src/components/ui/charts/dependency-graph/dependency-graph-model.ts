// Pure: a dependency graph's neighbourhoods, its ego subgraph and its NetworkGraph props.
import type { ColorToken } from '../../../../theme/resolve-color'
import { boxLayout } from '../network-graph/layouts/box-layout-model'
import type {
  GraphEdge,
  GraphEdgeKind,
  GraphKind,
  GraphLayout,
  GraphNode,
} from '../network-graph/types'
import type {
  DependencyGraphData,
  DependencyGraphInput,
  DependencyNeighbourhood,
  DependencyNode,
} from './types'

/** The id an edge's route is keyed by in `DependencyGraphLayout.routes`. */
export const dependencyEdgeId = (source: string, target: string) => `${source}->${target}`

/** First of each id kept; edges with an unknown end, self edges and repeats dropped. */
export function cleanDependencies({ nodes, edges }: DependencyGraphData): DependencyGraphData {
  const byId = new Map<string, DependencyNode>()
  for (const node of nodes) if (!byId.has(node.id)) byId.set(node.id, node)
  const seen = new Set<string>()
  const kept = edges.filter((edge) => {
    const id = dependencyEdgeId(edge.source, edge.target)
    const keep =
      edge.source !== edge.target && byId.has(edge.source) && byId.has(edge.target) && !seen.has(id)
    seen.add(id)
    return keep
  })
  return { nodes: [...byId.values()], edges: kept }
}

/** What `id` depends on and what depends on it, direct only, in input order. */
export function neighbourhood(data: DependencyGraphData, id: string): DependencyNeighbourhood {
  const { nodes, edges } = cleanDependencies(data)
  const targets = new Set(edges.filter((e) => e.source === id).map((e) => e.target))
  const sources = new Set(edges.filter((e) => e.target === id).map((e) => e.source))
  return {
    dependsOn: nodes.filter((node) => targets.has(node.id)),
    usedBy: nodes.filter((node) => sources.has(node.id)),
  }
}

/**
 * The ego view of `id`: the node, its direct dependencies and its direct dependents, with the edges
 * between the focus and each of them. Empty when `id` is not a node. Feed it to the build-time
 * layout to get the ego layout.
 */
export function egoSubgraph(data: DependencyGraphData, id: string): DependencyGraphData {
  const clean = cleanDependencies(data)
  if (!clean.nodes.some((node) => node.id === id)) return { nodes: [], edges: [] }
  const edges = clean.edges.filter((edge) => edge.source === id || edge.target === id)
  const kept = new Set([id, ...edges.flatMap((edge) => [edge.source, edge.target])])
  return { nodes: clean.nodes.filter((node) => kept.has(node.id)), edges }
}

/** Marks at rest: the boundary token that clears 3:1 on every plane the graph sits on. */
export const REST_MARK: ColorToken = 'border-input'
/** The focus, its neighbours and the edges between them. */
export const LIT_MARK: ColorToken = 'text-primary'
export const DEPENDENCY_KIND = 'dependency'
export const LIT_PREFIX = 'lit:'

/**
 * Lights `focusId`'s direct neighbourhood: the focus, its dependencies, its dependents and the
 * edges between them move to their lit kinds, painted in `LIT_MARK`; the rest stays at rest.
 * Brightening rather than fading keeps every mark above 3:1. Unchanged without a focus.
 */
export function lightFocus(
  graph: { nodes: readonly GraphNode[]; edges: readonly GraphEdge[] },
  focusId: string | null
): { nodes: GraphNode[]; edges: GraphEdge[] } {
  if (focusId === null) return { nodes: [...graph.nodes], edges: [...graph.edges] }
  const touches = (edge: GraphEdge) => edge.source === focusId || edge.target === focusId
  const lit = new Set([
    focusId,
    ...graph.edges.filter(touches).flatMap((edge) => [edge.source, edge.target]),
  ])
  const lightKind = (kind: string | undefined) => `${LIT_PREFIX}${kind ?? ''}`
  return {
    nodes: graph.nodes.map((node) =>
      lit.has(node.id) ? { ...node, kind: lightKind(node.kind) } : node
    ),
    edges: graph.edges.map((edge) =>
      touches(edge) ? { ...edge, kind: lightKind(edge.kind) } : edge
    ),
  }
}

/** Each kind at rest and lit, under one label, so names and the summary read the same. */
function withLitKinds<K extends { id: string; label: string }>(kinds: readonly K[]) {
  return kinds.flatMap((kind) => [
    { ...kind, color: REST_MARK },
    { ...kind, id: `${LIT_PREFIX}${kind.id}`, color: LIT_MARK },
  ])
}

export interface DependencyNetwork {
  nodes: GraphNode[]
  edges: GraphEdge[]
  nodeKinds: GraphKind[]
  edgeKinds: GraphEdgeKind[]
  layout: GraphLayout
}

/** NetworkGraph props: one box per node inside its tier's box, on its routes, every mark at rest. */
export function toNetworkGraph({
  tiers,
  layout,
  ...data
}: DependencyGraphInput): DependencyNetwork {
  const { nodes, edges } = cleanDependencies(data)
  const used = new Set(nodes.map((node) => node.tier))
  const tierBoxes = layout.tiers ?? {}
  return {
    nodes: nodes.map(({ id, label, tier, description }) => ({
      id,
      label,
      kind: tier,
      description,
    })),
    edges: edges.map(({ source, target }) => ({
      id: dependencyEdgeId(source, target),
      source,
      target,
      kind: DEPENDENCY_KIND,
    })),
    nodeKinds: withLitKinds(tiers.map(({ id, label }) => ({ id, label }))),
    edgeKinds: withLitKinds([{ id: DEPENDENCY_KIND, label: 'depends on' }]),
    layout: boxLayout({
      boxes: layout.nodes,
      routes: layout.routes,
      groups: tiers.flatMap(({ id, label }) => {
        const box = tierBoxes[id]
        return box && used.has(id) ? [{ id: `tier:${id}`, label, box, stroke: REST_MARK }] : []
      }),
    }),
  }
}
