import { compareText } from '../../kit/compareText'
import { GRAPH_LABEL_ROOM, GRAPH_NODE_PADDING } from '../network-graph-model'
import type { GraphEdge, GraphLayout, GraphLayoutInput, GraphLayoutResult } from '../types'
import { rankKindsKey, rankLayers } from './layout-geometry'

export const LAYER_COLUMN_WIDTH = 186
export const LAYER_ROW_HEIGHT = 30

export interface LayeredLayoutOptions {
  /** Edge kinds that rank the layers; every edge ranks when unset. */
  rankEdgeKinds?: readonly string[]
}

/** A node's primary parent is its first ranking predecessor by id. */
function childrenByParent(ids: readonly string[], edges: readonly GraphEdge[]) {
  const parents = new Map<string, string>()
  for (const { source, target } of edges) {
    const current = parents.get(target)
    if (current === undefined || compareText(source, current) < 0) parents.set(target, source)
  }
  const children = new Map<string, string[]>(ids.map((id) => [id, []]))
  for (const id of ids) {
    const parent = parents.get(id)
    if (parent !== undefined) children.get(parent)?.push(id)
  }
  return { roots: ids.filter((id) => !parents.has(id)), children }
}

/** A leaf takes the next row; a parent centres on its first and last child. */
function assignRows(roots: readonly string[], children: Map<string, string[]>) {
  const rows = new Map<string, number>()
  let nextRow = 0
  const place = (id: string): void => {
    const kids = children.get(id) ?? []
    if (kids.length === 0) {
      rows.set(id, nextRow)
      nextRow += 1
      return
    }
    kids.forEach(place)
    rows.set(
      id,
      ((rows.get(kids[0] as string) ?? 0) + (rows.get(kids[kids.length - 1] as string) ?? 0)) / 2
    )
  }
  roots.forEach(place)
  return { rows, rowCount: nextRow }
}

/** Each node's layered row: depth-first from the roots, a parent centred on its children. */
export function treeRows(ids: readonly string[], kept: readonly GraphEdge[]) {
  const { roots, children } = childrenByParent(ids, kept)
  return assignRows(roots, children)
}

function computeLayered(
  input: GraphLayoutInput,
  rankEdgeKinds: readonly string[] | undefined
): GraphLayoutResult {
  const { ids, kept, layers } = rankLayers(input, rankEdgeKinds)
  const { rows, rowCount } = treeRows(ids, kept)
  const layerOf = (id: string) => layers.get(id) ?? 0
  const rowOf = (id: string) => rows.get(id) ?? 0
  const order = [...ids].sort(
    (a, b) => layerOf(a) - layerOf(b) || rowOf(a) - rowOf(b) || compareText(a, b)
  )
  const lastLayer = Math.max(0, ...ids.map(layerOf))
  return {
    positions: Object.fromEntries(
      ids.map((id) => [
        id,
        {
          x: GRAPH_NODE_PADDING + layerOf(id) * LAYER_COLUMN_WIDTH,
          y: GRAPH_NODE_PADDING + rowOf(id) * LAYER_ROW_HEIGHT,
        },
      ])
    ),
    order,
    width: GRAPH_NODE_PADDING * 2 + lastLayer * LAYER_COLUMN_WIDTH + GRAPH_LABEL_ROOM,
    height: GRAPH_NODE_PADDING * 2 + Math.max(rowCount - 1, 0) * LAYER_ROW_HEIGHT,
  }
}

/**
 * Layers left to right by longest path along the ranking edges (every edge by default), rows by
 * depth-first order with a parent centred on its children. Deterministic for any input order.
 */
export function layeredLayout(options: LayeredLayoutOptions = {}): GraphLayout {
  const { rankEdgeKinds } = options
  const key = `layered:${rankKindsKey(rankEdgeKinds)}`
  return { key, compute: (input) => computeLayered(input, rankEdgeKinds) }
}
