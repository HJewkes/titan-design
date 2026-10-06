import { edgeId, incident } from './network-graph-model'
import type { GraphFocus, GraphFocusKey, GraphIndex } from './types'

function moveAmong<T>(items: readonly T[], current: number, key: GraphFocusKey): T | null {
  if (items.length === 0) return null
  const target =
    key === 'Home' ? 0 : key === 'End' ? items.length - 1 : current + (key === 'Down' ? 1 : -1)
  return target < 0 || target >= items.length || target === current ? null : (items[target] ?? null)
}

function nextFromNode(index: GraphIndex, id: string, key: GraphFocusKey): GraphFocus | null {
  const at = index.order.indexOf(id)
  if (at < 0) return null
  if (key === 'Right' || key === 'Left') {
    const edge = (key === 'Right' ? index.outgoing : index.incoming).get(id)?.[0]
    return edge ? { type: 'edge', id: edgeId(edge), from: id } : null
  }
  const next = moveAmong(index.order, at, key)
  return next === null ? null : { type: 'node', id: next }
}

function nextFromEdge(index: GraphIndex, focus: GraphFocus & { type: 'edge' }, key: GraphFocusKey) {
  const edge = index.edgesById.get(focus.id)
  if (!edge) return null
  if (key === 'Right' || key === 'Left') {
    return { type: 'node', id: key === 'Right' ? edge.target : edge.source } as const
  }
  const anchor = index.order.includes(focus.from) ? focus.from : edge.source
  const edges = incident(index, anchor)
  const next = moveAmong(
    edges,
    edges.findIndex((e) => edgeId(e) === focus.id),
    key
  )
  return next ? ({ type: 'edge', id: edgeId(next), from: anchor } as const) : null
}

/** The next focus for a key, or null when the key has no destination. Never wraps. */
export function nextFocus(
  index: GraphIndex,
  focus: GraphFocus,
  key: GraphFocusKey
): GraphFocus | null {
  return focus.type === 'node'
    ? nextFromNode(index, focus.id, key)
    : nextFromEdge(index, focus, key)
}
