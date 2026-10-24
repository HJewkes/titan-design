import type { ColorToken } from '../../../../../theme/resolve-color'
import { compareText } from '../../kit/compareText'
import { boxCentre, isPaintableBox } from '../network-graph-boxes'
import { GRAPH_NODE_PADDING } from '../network-graph-model'
import type { GraphBox, GraphGroupRegion, GraphLayout, GraphPoint } from '../types'

/** A compound box: a labelled rectangle drawn under the nodes it holds. */
export interface BoxLayoutGroup {
  id: string
  label: string
  box: GraphBox
  /** The outline colour; unset is the default hairline. */
  stroke?: ColorToken
}

export interface BoxLayoutOptions {
  /** Each node's rectangle, precomputed; a node without a finite box of some area is not placed. */
  boxes: Readonly<Record<string, GraphBox>>
  /** Compound boxes; a group holds every node whose box lies wholly inside its own. */
  groups?: readonly BoxLayoutGroup[]
  /** A polyline per edge id, source border to target border; an edge without one runs straight. */
  routes?: Readonly<Record<string, readonly GraphPoint[]>>
}

const contains = (outer: GraphBox, inner: GraphBox) =>
  inner.x >= outer.x &&
  inner.y >= outer.y &&
  inner.x + inner.width <= outer.x + outer.width &&
  inner.y + inner.height <= outer.y + outer.height

const hasOwn = (record: object, key: string) => Object.prototype.hasOwnProperty.call(record, key)

const sortedEntries = <T>(record: Readonly<Record<string, T>> | undefined) =>
  Object.entries(record ?? {}).sort(([a], [b]) => compareText(a, b))

/** Outermost first, so a parent paints under its children. */
function groupRegions(
  groups: readonly BoxLayoutGroup[],
  boxes: ReadonlyMap<string, GraphBox>
): GraphGroupRegion[] {
  const area = (group: BoxLayoutGroup) => group.box.width * group.box.height
  return groups
    .filter((group) => isPaintableBox(group.box))
    .sort((a, b) => area(b) - area(a) || compareText(a.id, b.id))
    .map((group) => ({
      id: group.id,
      label: group.label,
      nodeIds: [...boxes].filter(([, box]) => contains(group.box, box)).map(([id]) => id),
      ...boxCentreAs(group.box),
      radius: 0,
      variant: 'box' as const,
      box: { ...group.box },
      ...(group.stroke ? { stroke: group.stroke } : {}),
    }))
}

const boxCentreAs = (box: GraphBox) => {
  const { x, y } = boxCentre(box)
  return { cx: x, cy: y }
}

/** The far corner of everything drawn: boxes, groups and route points. */
function extent(boxes: readonly GraphBox[], routes: BoxLayoutOptions['routes']) {
  const points = [
    ...boxes.map((box) => ({ x: box.x + box.width, y: box.y + box.height })),
    ...Object.values(routes ?? {}).flat(),
  ].filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y))
  return {
    width: Math.max(0, ...points.map((p) => p.x)) + GRAPH_NODE_PADDING,
    height: Math.max(0, ...points.map((p) => p.y)) + GRAPH_NODE_PADDING,
  }
}

/**
 * Places each node in the caller's precomputed box and paints boxes, compound groups and routed
 * edges. Nothing is laid out at render: the boxes and routes come in whole, as from ELK.
 */
export function boxLayout({ boxes, groups = [], routes }: BoxLayoutOptions): GraphLayout {
  const key = `box:${JSON.stringify([sortedEntries(boxes), groups, sortedEntries(routes)])}`
  return {
    key,
    compute: ({ nodes }) => {
      const placed = new Map(
        nodes.flatMap((node) => {
          const box = hasOwn(boxes, node.id) ? boxes[node.id] : undefined
          return isPaintableBox(box) ? [[node.id, { ...box }] as const] : []
        })
      )
      const centre = (id: string) => boxCentre(placed.get(id) as GraphBox)
      const order = [...placed.keys()].sort(
        (a, b) => centre(a).y - centre(b).y || centre(a).x - centre(b).x || compareText(a, b)
      )
      const regions = groupRegions(groups, placed)
      return {
        positions: Object.fromEntries(order.map((id) => [id, centre(id)])),
        order,
        ...extent([...placed.values(), ...regions.map((r) => r.box as GraphBox)], routes),
        nodeShape: 'box',
        nodeBoxes: Object.fromEntries(placed),
        edgeShape: 'routed',
        routes,
        groups: regions,
      }
    },
  }
}
