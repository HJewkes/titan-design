import { linkHorizontal } from 'd3-shape'
import { arcPath, GRAPH_NODE_RADIUS } from './network-graph-arc'
import { placedGroups } from './network-graph-groups'
import type {
  GraphCleanReport,
  GraphEdge,
  GraphIndex,
  GraphLayout,
  GraphModel,
  GraphNode,
  GraphPoint,
} from './types'

export const GRAPH_NODE_PADDING = 24
export const GRAPH_LABEL_ROOM = 160
export { GRAPH_NODE_RADIUS }
export { edgeSlots } from './network-graph-arc'

const hasOwn = (record: object, key: string) => Object.prototype.hasOwnProperty.call(record, key)

export const compareText = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0)

export const displayLabel = (node: GraphNode) => (node.label === '' ? node.id : node.label)

export const edgeId = (edge: GraphEdge): string =>
  edge.id ?? `${edge.source}->${edge.target}:${edge.kind ?? ''}`

export const isValidWeight = (weight: number | null | undefined): weight is number =>
  typeof weight === 'number' && Number.isFinite(weight) && weight >= 0

function mergeGroup(group: readonly GraphEdge[]): GraphEdge {
  const base = [...group].sort((x, y) => compareText(edgeId(x), edgeId(y)))[0] as GraphEdge
  const weights = group
    .map((edge) => edge.weight)
    .filter(isValidWeight)
    .sort((x, y) => x - y)
  const activity = group
    .map((edge) => edge.activityAt)
    .filter((at): at is number => at !== undefined)
  return {
    ...base,
    id: edgeId(base),
    weight: weights.length > 0 ? weights.reduce((sum, w) => sum + w, 0) : null,
    ...(activity.length > 0 ? { activityAt: Math.max(...activity) } : {}),
  }
}

function dedupeNodes(nodes: readonly GraphNode[]) {
  const seen = new Set<string>()
  const kept: GraphNode[] = []
  for (const node of nodes) {
    if (seen.has(node.id)) continue
    seen.add(node.id)
    kept.push(node)
  }
  return { kept, duplicates: nodes.length - kept.length, ids: seen }
}

const edgeKey = (edge: GraphEdge) => `${edge.source}\u0000${edge.target}\u0000${edge.kind ?? ''}`

const compareEdges = (a: GraphEdge, b: GraphEdge) =>
  compareText(a.source, b.source) ||
  compareText(a.target, b.target) ||
  compareText(a.kind ?? '', b.kind ?? '')

/** Gives each edge a unique id; the edges arrive sorted, so a repeated id is numbered in that order. */
function uniqueIds(edges: readonly GraphEdge[]): GraphEdge[] {
  const used = new Set<string>()
  return edges.map((edge) => {
    const base = edgeId(edge)
    let id = base
    for (let n = 2; used.has(id); n += 1) id = `${base}#${n}`
    used.add(id)
    return { ...edge, id }
  })
}

/** Output never depends on input order: nodes sort by id, edges by source, target, kind. */
export function cleanGraph(
  nodes: readonly GraphNode[],
  edges: readonly GraphEdge[]
): { nodes: GraphNode[]; edges: GraphEdge[]; report: GraphCleanReport } {
  const { kept, duplicates, ids } = dedupeNodes(nodes)
  const groups = new Map<string, GraphEdge[]>()
  let selfEdges = 0
  let unknownEndpointEdges = 0
  for (const edge of edges) {
    if (edge.source === edge.target) selfEdges += 1
    else if (!ids.has(edge.source) || !ids.has(edge.target)) unknownEndpointEdges += 1
    else groups.set(edgeKey(edge), [...(groups.get(edgeKey(edge)) ?? []), edge])
  }
  const merged = [...groups.values()].map(mergeGroup).sort(compareEdges)
  return {
    nodes: kept.sort((a, b) => compareText(a.id, b.id)),
    edges: uniqueIds(merged),
    report: {
      duplicateNodes: duplicates,
      selfEdges,
      unknownEndpointEdges,
      mergedEdges: [...groups.values()].reduce((sum, group) => sum + group.length - 1, 0),
    },
  }
}

function groupEdges(
  order: readonly string[],
  edges: readonly GraphEdge[],
  end: 'source' | 'target'
) {
  const place = new Map(order.map((id, i) => [id, i]))
  const other = end === 'source' ? 'target' : 'source'
  const groups = new Map<string, GraphEdge[]>(order.map((id) => [id, []]))
  for (const edge of edges) groups.get(edge[end])?.push(edge)
  for (const list of groups.values()) {
    list.sort(
      (a, b) =>
        (place.get(a[other]) ?? 0) - (place.get(b[other]) ?? 0) || compareText(edgeId(a), edgeId(b))
    )
  }
  return groups
}

export function indexGraph(
  nodes: readonly GraphNode[],
  edges: readonly GraphEdge[],
  order: readonly string[]
): GraphIndex {
  const nodesById = new Map(nodes.map((node) => [node.id, node]))
  const placed = new Set(order.filter((id) => nodesById.has(id)))
  const placedOrder = order.filter((id) => placed.has(id))
  const drawn = edges.filter((e) => placed.has(e.source) && placed.has(e.target))
  return {
    order: placedOrder,
    nodesById,
    edgesById: new Map(drawn.map((edge) => [edgeId(edge), edge])),
    incoming: groupEdges(placedOrder, drawn, 'target'),
    outgoing: groupEdges(placedOrder, drawn, 'source'),
  }
}

export interface WeightRange {
  min: number
  max: number
}

export function weightRange(edges: readonly GraphEdge[]): WeightRange | null {
  const weights = edges.map((edge) => edge.weight).filter(isValidWeight)
  if (weights.length === 0) return null
  return { min: Math.min(...weights), max: Math.max(...weights) }
}

/** Three stroke steps, 0 lowest. Unknown, invalid and all-equal weights take step 0. */
export function binWeight(weight: number | null | undefined, range: WeightRange | null): 0 | 1 | 2 {
  if (!isValidWeight(weight) || range === null || range.max === range.min) return 0
  const t = (weight - range.min) / (range.max - range.min)
  return t < 1 / 3 ? 0 : t < 2 / 3 ? 1 : 2
}

const link = linkHorizontal<{ source: GraphPoint; target: GraphPoint }, GraphPoint>()
  .x((p) => p.x)
  .y((p) => p.y)

/** `slot` is the edge's index among edges with the same source and target; see `edgeSlots`. */
export function edgePath(
  from: GraphPoint,
  to: GraphPoint,
  shape: 'horizontal' | 'arc' = 'horizontal',
  slot = 0
): string {
  return shape === 'arc' ? arcPath(from, to, slot) : (link({ source: from, target: to }) ?? '')
}

export const incident = (index: GraphIndex, nodeId: string): GraphEdge[] => [
  ...(index.outgoing.get(nodeId) ?? []),
  ...(index.incoming.get(nodeId) ?? []),
]

const finitePoint = (p: unknown): p is GraphPoint =>
  typeof p === 'object' &&
  p !== null &&
  Number.isFinite((p as GraphPoint).x) &&
  Number.isFinite((p as GraphPoint).y)

const finiteOr = (value: number, fallback: number) => (Number.isFinite(value) ? value : fallback)

/** Cleans the data, runs the layout and drops what the layout left unplaced or non-finite. */
export function buildGraphModel(
  nodes: readonly GraphNode[],
  edges: readonly GraphEdge[],
  layout: GraphLayout,
  viewport: { width: number; height: number }
): GraphModel {
  const cleaned = cleanGraph(nodes, edges)
  const result = layout.compute({ nodes: cleaned.nodes, edges: cleaned.edges, ...viewport })
  const known = new Set(cleaned.nodes.map((node) => node.id))
  const positions = Object.fromEntries(
    Object.entries(result.positions).filter(([id, p]) => known.has(id) && finitePoint(p))
  )
  const seen = new Set<string>()
  const order = [...result.order, ...Object.keys(positions).sort(compareText)].filter((id) => {
    const keep = hasOwn(positions, id) && !seen.has(id)
    seen.add(id)
    return keep
  })
  const index = indexGraph(cleaned.nodes, cleaned.edges, order)
  const drawnEdges = [...index.edgesById.values()]
  return {
    nodes: cleaned.nodes,
    edges: cleaned.edges,
    report: cleaned.report,
    positions,
    order,
    drawnEdges,
    unplacedNodes: cleaned.nodes.length - order.length,
    unplacedEdges: cleaned.edges.length - drawnEdges.length,
    index,
    width: finiteOr(result.width, viewport.width),
    height: finiteOr(result.height, viewport.height),
    edgeShape: result.edgeShape === 'arc' ? 'arc' : 'horizontal',
    labelMode: result.labelMode === 'declutter' ? 'declutter' : 'all',
    groups: placedGroups(result.groups, index.order),
  }
}
