import { DATAVIZ_CATEGORICAL_ROLES } from '../../../../theme/extracted-colors-dataviz'
import type { ColorToken } from '../../../../theme/resolve-color'
import { CATEGORICAL_CVD_SAFE_MAX } from '../../../../theme/tokens/primitives'
import {
  binWeight,
  edgeId,
  edgePath,
  incident,
  isValidWeight,
  weightRange,
} from './network-graph-model'
import type {
  GraphEdge,
  GraphEdgeKind,
  GraphFocus,
  GraphIndex,
  GraphItemRef,
  GraphKind,
  GraphModel,
  GraphPoint,
} from './types'

export const NODE_RADIUS = 6
export const ARROW_LENGTH = 7
/** Distance between two edges that join the same pair of nodes. */
export const PARALLEL_EDGE_GAP = 6
export const LABEL_MAX_CHARS = 22
/** Fill for a node whose kind is unset or not listed in `nodeKinds`. */
export const NEUTRAL_NODE_COLOR: ColorToken = 'text-secondary'

/** Counts code points, so an emoji is never cut in half. */
export function truncateLabel(label: string, max = LABEL_MAX_CHARS): string {
  const chars = Array.from(label)
  return chars.length > max ? `${chars.slice(0, max).join('')}…` : label
}

/** A fill per kind in `nodeKinds` order; past the CVD-safe count the colours repeat. */
export function kindColors(nodeKinds: readonly GraphKind[] = []): Map<string, ColorToken> {
  return new Map(
    nodeKinds.map((kind, i) => [
      kind.id,
      kind.color ?? (DATAVIZ_CATEGORICAL_ROLES[i % CATEGORICAL_CVD_SAFE_MAX] as ColorToken),
    ])
  )
}

export const weightText = (edge: GraphEdge): string =>
  isValidWeight(edge.weight) ? `weight ${edge.weight}` : 'weight unknown'

export interface EdgeGeometry {
  id: string
  edge: GraphEdge
  path: string
  /** A point on the curve, for the weight readout. */
  mid: GraphPoint
  /** Stroke step from `binWeight`, 0 lowest. */
  step: 0 | 1 | 2
  isDashed: boolean
}

/** Edges joining the same pair of nodes, in either direction, spread about the centre line. */
function parallelOffsets(edges: readonly GraphEdge[]): Map<string, number> {
  const groups = new Map<string, string[]>()
  for (const edge of edges) {
    const key = [edge.source, edge.target].sort().join('\u0000')
    groups.set(key, [...(groups.get(key) ?? []), edgeId(edge)])
  }
  const offsets = new Map<string, number>()
  for (const ids of groups.values()) {
    ids.forEach((id, i) => offsets.set(id, (i - (ids.length - 1) / 2) * PARALLEL_EDGE_GAP))
  }
  return offsets
}

/** Starts at the source mark's rim and stops short of the target's, leaving room for the arrowhead. */
function anchors(from: GraphPoint, to: GraphPoint, offset: number) {
  if (from.x === to.x) {
    const dir = to.y < from.y ? -1 : 1
    return {
      start: { x: from.x + offset, y: from.y + dir * NODE_RADIUS },
      end: { x: to.x + offset, y: to.y - dir * (NODE_RADIUS + ARROW_LENGTH) },
    }
  }
  const dir = to.x < from.x ? -1 : 1
  return {
    start: { x: from.x + dir * NODE_RADIUS, y: from.y + offset },
    end: { x: to.x - dir * (NODE_RADIUS + ARROW_LENGTH), y: to.y + offset },
  }
}

export function edgeGeometries(
  model: GraphModel,
  edgeKinds: readonly GraphEdgeKind[] = []
): EdgeGeometry[] {
  const range = weightRange(model.drawnEdges)
  const dashed = new Set(edgeKinds.filter((kind) => kind.stroke === 'dashed').map((k) => k.id))
  const offsets = parallelOffsets(model.drawnEdges)
  return model.drawnEdges.flatMap((edge) => {
    const from = model.positions[edge.source]
    const to = model.positions[edge.target]
    if (!from || !to) return []
    const id = edgeId(edge)
    const { start, end } = anchors(from, to, offsets.get(id) ?? 0)
    return [
      {
        id,
        edge,
        path: edgePath(start, end),
        mid: { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 },
        step: binWeight(edge.weight, range),
        isDashed: edge.kind !== undefined && dashed.has(edge.kind),
      },
    ]
  })
}

export const isItem = (item: GraphItemRef | null, type: GraphItemRef['type'], id: string) =>
  item !== null && item.type === type && item.id === id

export interface GraphEmphasis {
  nodes: ReadonlySet<string>
  edges: ReadonlySet<string>
}

/** What keeps full strength while an item is active: a node with its edges and neighbours, or an edge with its ends. */
export function emphasisFor(index: GraphIndex, active: GraphFocus | null): GraphEmphasis | null {
  if (active === null) return null
  if (active.type === 'edge') {
    const edge = index.edgesById.get(active.id)
    return edge ? { nodes: new Set([edge.source, edge.target]), edges: new Set([active.id]) } : null
  }
  const edges = incident(index, active.id)
  return {
    nodes: new Set([active.id, ...edges.flatMap((edge) => [edge.source, edge.target])]),
    edges: new Set(edges.map(edgeId)),
  }
}
