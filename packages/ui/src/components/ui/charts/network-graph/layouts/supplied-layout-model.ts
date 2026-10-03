import { GRAPH_LABEL_ROOM, GRAPH_NODE_PADDING } from '../network-graph-model'
import type { GraphLayout, GraphPoint } from '../types'

const hasOwn = (record: object, key: string) => Object.prototype.hasOwnProperty.call(record, key)

const compareText = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0)

const isFinitePoint = (p: unknown): p is GraphPoint =>
  typeof p === 'object' &&
  p !== null &&
  Number.isFinite((p as GraphPoint).x) &&
  Number.isFinite((p as GraphPoint).y)

/** Places each node at the caller's point. A node without a finite point is left out. */
export function suppliedLayout(positions: Readonly<Record<string, GraphPoint>>): GraphLayout {
  const supplied = Object.keys(positions).sort(compareText)
  const key = `supplied:${supplied.map((id) => `${id}@${positions[id]?.x},${positions[id]?.y}`).join(';')}`
  return {
    key,
    compute: ({ nodes }) => {
      const placed = nodes
        .map((node) => node.id)
        .filter((id) => hasOwn(positions, id) && isFinitePoint(positions[id]))
      const point = (id: string) => positions[id] as GraphPoint
      const order = [...placed].sort(
        (a, b) => point(a).y - point(b).y || point(a).x - point(b).x || compareText(a, b)
      )
      return {
        positions: Object.fromEntries(order.map((id) => [id, { x: point(id).x, y: point(id).y }])),
        order,
        width:
          Math.max(0, ...order.map((id) => point(id).x)) + GRAPH_LABEL_ROOM + GRAPH_NODE_PADDING,
        height: Math.max(0, ...order.map((id) => point(id).y)) + GRAPH_NODE_PADDING,
      }
    },
  }
}
