import type { GraphEdge, GraphPoint } from './types'

/** The node mark is 12 px wide; an arc stops at its edge. */
export const GRAPH_NODE_RADIUS = 6
/** Bow of an arc, as a share of the edge length, for the first edge between two nodes. */
export const ARC_BOW = 0.15

const round2 = (value: number) => Math.round(value * 100) / 100

/** A quadratic curve between the node marks, bowed left of the direction of travel. Coincident or non-finite ends give no path. */
export function arcPath(from: GraphPoint, to: GraphPoint, slot: number): string {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const length = Math.hypot(dx, dy)
  if (!Number.isFinite(length) || length <= 2 * GRAPH_NODE_RADIUS) return ''
  const [ux, uy] = [dx / length, dy / length]
  const bow = ARC_BOW * length * (Math.max(0, Math.floor(slot) || 0) + 1)
  const control = { x: (from.x + to.x) / 2 + uy * bow, y: (from.y + to.y) / 2 - ux * bow }
  const start = { x: from.x + ux * GRAPH_NODE_RADIUS, y: from.y + uy * GRAPH_NODE_RADIUS }
  const end = { x: to.x - ux * GRAPH_NODE_RADIUS, y: to.y - uy * GRAPH_NODE_RADIUS }
  const point = (p: GraphPoint) => `${round2(p.x)},${round2(p.y)}`
  return `M${point(start)}Q${point(control)} ${point(end)}`
}

/** Edge id to its index among edges with the same source and target, in id order. Takes cleaned edges, which all carry an id. */
export function edgeSlots(edges: readonly GraphEdge[]): Map<string, number> {
  const seen = new Map<string, number>()
  const slots = new Map<string, number>()
  for (const edge of [...edges].sort((a, b) => ((a.id as string) < (b.id as string) ? -1 : 1))) {
    const pair = JSON.stringify([edge.source, edge.target])
    const slot = seen.get(pair) ?? 0
    seen.set(pair, slot + 1)
    slots.set(edge.id as string, slot)
  }
  return slots
}
