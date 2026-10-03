import { linkHorizontal } from 'd3-shape'
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

const hasOwn = (record: object, key: string) => Object.prototype.hasOwnProperty.call(record, key)

const compareText = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0)

export const edgeId = (edge: GraphEdge): string =>
  edge.id ?? `${edge.source}->${edge.target}:${edge.kind ?? ''}`

export const isValidWeight = (weight: number | null | undefined): weight is number =>
  typeof weight === 'number' && Number.isFinite(weight) && weight >= 0

function mergeEdge(kept: GraphEdge, extra: GraphEdge): GraphEdge {
  const weights = [kept.weight, extra.weight].filter(isValidWeight)
  const activity = [kept.activityAt, extra.activityAt].filter(
    (at): at is number => at !== undefined
  )
  return {
    ...kept,
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

export function cleanGraph(
  nodes: readonly GraphNode[],
  edges: readonly GraphEdge[]
): { nodes: GraphNode[]; edges: GraphEdge[]; report: GraphCleanReport } {
  const { kept, duplicates, ids } = dedupeNodes(nodes)
  const merged = new Map<string, GraphEdge>()
  let selfEdges = 0
  let unknownEndpointEdges = 0
  let mergedEdges = 0
  const usedIds = new Set<string>()
  const uniqueId = (edge: GraphEdge) => {
    const base = edgeId(edge)
    let id = base
    for (let n = 2; usedIds.has(id); n += 1) id = `${base}#${n}`
    usedIds.add(id)
    return id
  }
  for (const edge of edges) {
    if (edge.source === edge.target) selfEdges += 1
    else if (!ids.has(edge.source) || !ids.has(edge.target)) unknownEndpointEdges += 1
    else {
      const key = `${edge.source}\u0000${edge.target}\u0000${edge.kind ?? ''}`
      const prior = merged.get(key)
      if (prior) mergedEdges += 1
      merged.set(
        key,
        prior
          ? mergeEdge(prior, edge)
          : { ...edge, id: uniqueId(edge), weight: isValidWeight(edge.weight) ? edge.weight : null }
      )
    }
  }
  return {
    nodes: kept,
    edges: [...merged.values()],
    report: { duplicateNodes: duplicates, selfEdges, unknownEndpointEdges, mergedEdges },
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

export function edgePath(from: GraphPoint, to: GraphPoint): string {
  return link({ source: from, target: to }) ?? ''
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
  }
}
