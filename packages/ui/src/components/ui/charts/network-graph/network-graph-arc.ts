import type { GraphEdge, GraphPoint } from './types'

/** The node mark is 12 px wide; an arc stops at its edge. */
export const GRAPH_NODE_RADIUS = 6
/** Bow of an arc, as a share of the edge length, for the first edge between two nodes. */
export const ARC_BOW = 0.15

const round2 = (value: number) => Math.round(value * 100) / 100

export interface ArcGeometry {
  start: GraphPoint
  control: GraphPoint
  end: GraphPoint
}

/** The quadratic curve's three points, or null when the ends coincide, nearly touch or are not finite. */
export function arcGeometry(from: GraphPoint, to: GraphPoint, slot: number): ArcGeometry | null {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const length = Math.hypot(dx, dy)
  if (!Number.isFinite(length) || length <= 2 * GRAPH_NODE_RADIUS) return null
  const [ux, uy] = [dx / length, dy / length]
  const bow = ARC_BOW * length * (Math.max(0, Math.floor(slot) || 0) + 1)
  return {
    start: { x: from.x + ux * GRAPH_NODE_RADIUS, y: from.y + uy * GRAPH_NODE_RADIUS },
    control: { x: (from.x + to.x) / 2 + uy * bow, y: (from.y + to.y) / 2 - ux * bow },
    end: { x: to.x - ux * GRAPH_NODE_RADIUS, y: to.y - uy * GRAPH_NODE_RADIUS },
  }
}

/** The point halfway along the curve, for a readout beside it. */
export const arcMidpoint = ({ start, control, end }: ArcGeometry): GraphPoint => ({
  x: (start.x + 2 * control.x + end.x) / 4,
  y: (start.y + 2 * control.y + end.y) / 4,
})

/** A quadratic curve between the node marks, bowed left of the direction of travel. Coincident or non-finite ends give no path. */
export function arcPath(from: GraphPoint, to: GraphPoint, slot: number): string {
  const arc = arcGeometry(from, to, slot)
  if (arc === null) return ''
  const point = (p: GraphPoint) => `${round2(p.x)},${round2(p.y)}`
  return `M${point(arc.start)}Q${point(arc.control)} ${point(arc.end)}`
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
