import { compareText } from '../../kit/compareText'
import { GRAPH_LABEL_ROOM, GRAPH_NODE_PADDING, edgeId } from '../network-graph-model'
import type { GraphEdge, GraphLayout, GraphLayoutInput, GraphLayoutResult } from '../types'

export const LAYER_COLUMN_WIDTH = 186
export const LAYER_ROW_HEIGHT = 30

export interface LayeredLayoutOptions {
  /** Edge kinds that rank the layers; every edge ranks when unset. */
  rankEdgeKinds?: readonly string[]
}

function reaches(successors: Map<string, string[]>, from: string, to: string): boolean {
  const seen = new Set<string>()
  const stack = [from]
  while (stack.length > 0) {
    const id = stack.pop() as string
    if (id === to) return true
    if (seen.has(id)) continue
    seen.add(id)
    stack.push(...(successors.get(id) ?? []))
  }
  return false
}

/** Keeps ranking edges in id order, dropping each one that would close a cycle. */
function acyclicEdges(ids: readonly string[], ranking: readonly GraphEdge[]): GraphEdge[] {
  const successors = new Map<string, string[]>(ids.map((id) => [id, []]))
  const kept: GraphEdge[] = []
  const sorted = [...ranking].sort((a, b) => compareText(edgeId(a), edgeId(b)))
  for (const edge of sorted) {
    if (reaches(successors, edge.target, edge.source)) continue
    successors.get(edge.source)?.push(edge.target)
    kept.push(edge)
  }
  return kept
}

/** Each node's longest path from a root, over an acyclic edge set. */
function longestPathLayers(ids: readonly string[], edges: readonly GraphEdge[]) {
  const layers = new Map(ids.map((id) => [id, 0]))
  const pending = new Map(ids.map((id) => [id, 0]))
  const successors = new Map<string, string[]>(ids.map((id) => [id, []]))
  for (const { source, target } of edges) {
    successors.get(source)?.push(target)
    pending.set(target, (pending.get(target) ?? 0) + 1)
  }
  const ready = ids.filter((id) => pending.get(id) === 0)
  while (ready.length > 0) {
    const id = ready.pop() as string
    for (const next of successors.get(id) ?? []) {
      layers.set(next, Math.max(layers.get(next) ?? 0, (layers.get(id) ?? 0) + 1))
      pending.set(next, (pending.get(next) ?? 0) - 1)
      if (pending.get(next) === 0) ready.push(next)
    }
  }
  return layers
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

function computeLayered(
  { nodes, edges }: GraphLayoutInput,
  rankEdgeKinds: readonly string[] | undefined
): GraphLayoutResult {
  const ids = nodes.map((node) => node.id).sort(compareText)
  const known = new Set(ids)
  const ranking = edges.filter(
    (edge) =>
      known.has(edge.source) &&
      known.has(edge.target) &&
      edge.source !== edge.target &&
      (rankEdgeKinds === undefined || rankEdgeKinds.includes(edge.kind ?? ''))
  )
  const kept = acyclicEdges(ids, ranking)
  const layers = longestPathLayers(ids, kept)
  const { roots, children } = childrenByParent(ids, kept)
  const { rows, rowCount } = assignRows(roots, children)
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

export function layeredLayout(options: LayeredLayoutOptions = {}): GraphLayout {
  const { rankEdgeKinds } = options
  const key = `layered:${rankEdgeKinds === undefined ? '*' : [...rankEdgeKinds].sort(compareText).join(',')}`
  return { key, compute: (input) => computeLayered(input, rankEdgeKinds) }
}
