// Box nodes and routed edges: the pure geometry of NetworkGraph's `box` node shape and `routed` edge shape.
import type { GraphBox, GraphEdge, GraphLayoutResult, GraphPoint } from './types'

/** The size of a `box` node the layout gave no rectangle. */
export const DEFAULT_NODE_BOX = { width: 120, height: 40 } as const
/** Straight routed edges between the same pair of boxes sit this far apart, so each one shows. */
export const ROUTED_PARALLEL_GAP = 18

const round2 = (value: number) => Math.round(value * 100) / 100
const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value)

const isFinitePoint = (p: unknown): p is GraphPoint =>
  typeof p === 'object' &&
  p !== null &&
  isFiniteNumber((p as GraphPoint).x) &&
  isFiniteNumber((p as GraphPoint).y)

/** A rectangle with finite corners and a size above 0. */
export const isPaintableBox = (box: GraphBox | undefined): box is GraphBox =>
  box !== undefined &&
  [box.x, box.y, box.width, box.height].every(isFiniteNumber) &&
  box.width > 0 &&
  box.height > 0

export const boxCentre = (box: GraphBox): GraphPoint => ({
  x: box.x + box.width / 2,
  y: box.y + box.height / 2,
})

const centredBox = (at: GraphPoint): GraphBox => ({
  x: at.x - DEFAULT_NODE_BOX.width / 2,
  y: at.y - DEFAULT_NODE_BOX.height / 2,
  ...DEFAULT_NODE_BOX,
})

/** Each placed node's rectangle under the `box` shape: the layout's, else a default box on its position. */
export function placedNodeBoxes(
  result: Pick<GraphLayoutResult, 'nodeShape' | 'nodeBoxes'>,
  positions: Readonly<Record<string, GraphPoint>>
): Record<string, GraphBox> {
  if (result.nodeShape !== 'box') return {}
  return Object.fromEntries(
    Object.entries(positions).map(([id, at]) => {
      const box = result.nodeBoxes?.[id]
      return [id, isPaintableBox(box) ? { ...box } : centredBox(at)]
    })
  )
}

/** The layout's routes for drawn edges, kept only when every point is finite and there are at least two. */
export function placedRoutes(
  result: Pick<GraphLayoutResult, 'edgeShape' | 'routes'>,
  drawnIds: ReadonlySet<string>
): Record<string, readonly GraphPoint[]> {
  if (result.edgeShape !== 'routed' || !result.routes) return {}
  return Object.fromEntries(
    Object.entries(result.routes).filter(
      ([id, route]) =>
        drawnIds.has(id) && Array.isArray(route) && route.length >= 2 && route.every(isFinitePoint)
    )
  )
}

const point = (p: GraphPoint) => `${round2(p.x)},${round2(p.y)}`

/** Each bend's rounded corner: where it leaves the incoming leg and joins the outgoing one. */
function corner(prev: GraphPoint, at: GraphPoint, next: GraphPoint, radius: number) {
  const inLength = Math.hypot(at.x - prev.x, at.y - prev.y)
  const outLength = Math.hypot(next.x - at.x, next.y - at.y)
  const r = Math.min(radius, inLength / 2, outLength / 2)
  if (r <= 0) return null
  const cross = (at.x - prev.x) * (next.y - at.y) - (at.y - prev.y) * (next.x - at.x)
  if (cross === 0) return null
  return {
    r,
    enter: {
      x: at.x - ((at.x - prev.x) / inLength) * r,
      y: at.y - ((at.y - prev.y) / inLength) * r,
    },
    leave: {
      x: at.x + ((next.x - at.x) / outLength) * r,
      y: at.y + ((next.y - at.y) / outLength) * r,
    },
    sweep: cross > 0 ? 1 : 0,
  }
}

/**
 * A polyline as an SVG path `d` through every point. A `cornerRadius` above 0 rounds each bend with a
 * circular arc, never wider than half of either leg; a straight-through point stays a plain join.
 */
export function routeToPath(
  route: readonly GraphPoint[],
  { cornerRadius = 0 }: { cornerRadius?: number } = {}
): string {
  const [first, ...rest] = route
  if (first === undefined || rest.length === 0) return ''
  const parts = [`M${point(first)}`]
  rest.forEach((at, i) => {
    const prev = route[i] as GraphPoint
    const next = route[i + 2]
    const bend = next && cornerRadius > 0 ? corner(prev, at, next, cornerRadius) : null
    if (bend === null) parts.push(`L${point(at)}`)
    else {
      parts.push(`L${point(bend.enter)}`)
      parts.push(`A${round2(bend.r)},${round2(bend.r)} 0 0 ${bend.sweep} ${point(bend.leave)}`)
    }
  })
  return parts.join('')
}

/** The point halfway along a polyline by length; the first point when it has no length. */
export function polylineMidpoint(route: readonly GraphPoint[]): GraphPoint {
  const legs = route.slice(1).map((at, i) => {
    const from = route[i] as GraphPoint
    return { from, at, length: Math.hypot(at.x - from.x, at.y - from.y) }
  })
  let remaining = legs.reduce((sum, leg) => sum + leg.length, 0) / 2
  for (const { from, at, length } of legs) {
    if (remaining <= length && length > 0) {
      const share = remaining / length
      return { x: from.x + (at.x - from.x) * share, y: from.y + (at.y - from.y) * share }
    }
    remaining -= length
  }
  return route[0] ?? { x: 0, y: 0 }
}

/** Where the ray from `from` toward `toward` leaves `box`; `from` itself when the two coincide. */
export function borderPoint(box: GraphBox, from: GraphPoint, toward: GraphPoint): GraphPoint {
  const dx = toward.x - from.x
  const dy = toward.y - from.y
  const centre = boxCentre(box)
  const room = (span: number, centreAt: number, fromAt: number, d: number) =>
    d === 0
      ? Infinity
      : (d > 0 ? centreAt + span / 2 - fromAt : fromAt - (centreAt - span / 2)) / Math.abs(d)
  const share = Math.max(
    0,
    Math.min(room(box.width, centre.x, from.x, dx), room(box.height, centre.y, from.y, dy))
  )
  if (!Number.isFinite(share)) return from
  return { x: from.x + dx * share, y: from.y + dy * share }
}

/**
 * A straight edge from one box's border to the other's, moved `offset` px to the side of the line
 * between the centres. The side is fixed by the pair, not by the direction, so an edge each way with
 * opposite offsets separates.
 */
export function straightRoute(
  source: { id: string; box: GraphBox },
  target: { id: string; box: GraphBox },
  offset: number
): [GraphPoint, GraphPoint] {
  const [a, b] = source.id <= target.id ? [source, target] : [target, source]
  const from = boxCentre(a.box)
  const to = boxCentre(b.box)
  const length = Math.hypot(to.x - from.x, to.y - from.y) || 1
  const nx = (-(to.y - from.y) / length) * offset
  const ny = ((to.x - from.x) / length) * offset
  const s = { x: boxCentre(source.box).x + nx, y: boxCentre(source.box).y + ny }
  const t = { x: boxCentre(target.box).x + nx, y: boxCentre(target.box).y + ny }
  return [borderPoint(source.box, s, t), borderPoint(target.box, t, s)]
}

/** Edges between the same pair of nodes, either way, spread `ROUTED_PARALLEL_GAP` apart about the centre line. */
export function routedOffsets(edges: readonly GraphEdge[], idOf: (edge: GraphEdge) => string) {
  const pairs = new Map<string, string[]>()
  for (const edge of edges) {
    const key = [edge.source, edge.target].sort().join('\u0000')
    pairs.set(key, [...(pairs.get(key) ?? []), idOf(edge)])
  }
  const offsets = new Map<string, number>()
  for (const ids of pairs.values()) {
    ids.forEach((id, i) => offsets.set(id, (i - (ids.length - 1) / 2) * ROUTED_PARALLEL_GAP))
  }
  return offsets
}
