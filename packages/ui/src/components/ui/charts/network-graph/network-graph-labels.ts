import { compareText, displayLabel, GRAPH_NODE_RADIUS, incident } from './network-graph-model'
import type { GraphIndex, GraphModel, GraphPoint } from './types'

const LABEL_GAP = 6
const LABEL_HEIGHT = 16
const LABEL_CHAR_WIDTH = 8
const LABEL_MAX_CHARS = 20

export interface LabelBox {
  x: number
  y: number
  width: number
  height: number
}

const overlaps = (a: LabelBox, b: LabelBox) =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height

/** Right of the mark, centred on it. Width is estimated from the truncated character count, generously. */
export function labelBox(model: GraphModel, id: string): LabelBox | null {
  const at = model.positions[id]
  const node = model.index.nodesById.get(id)
  if (!at || !node) return null
  const chars = Math.min(displayLabel(node).length, LABEL_MAX_CHARS)
  return {
    x: at.x + GRAPH_NODE_RADIUS + LABEL_GAP,
    y: at.y - LABEL_HEIGHT / 2,
    width: chars * LABEL_CHAR_WIDTH,
    height: LABEL_HEIGHT,
  }
}

const markBox = (at: GraphPoint): LabelBox => ({
  x: at.x - GRAPH_NODE_RADIUS,
  y: at.y - GRAPH_NODE_RADIUS,
  width: 2 * GRAPH_NODE_RADIUS,
  height: 2 * GRAPH_NODE_RADIUS,
})

/** The selected node, the active node and the active node's neighbours. */
export function pinnedNodeIds(
  index: GraphIndex,
  selectedId: string | null | undefined,
  activeId: string | null | undefined
): Set<string> {
  const pinned = new Set<string>()
  for (const id of [selectedId, activeId]) if (id != null && index.nodesById.has(id)) pinned.add(id)
  if (activeId != null) {
    for (const edge of incident(index, activeId)) {
      pinned.add(edge.source)
      pinned.add(edge.target)
    }
  }
  return pinned
}

/**
 * The labels to show, by node id. 'all' keeps every label. 'declutter' walks pinned nodes first, then
 * by degree, then id, and keeps a label that meets no kept label and no other node mark; a pinned
 * label is always kept. The result never depends on the order of `model.order`.
 */
export function placeLabels(
  model: GraphModel,
  pinned: ReadonlySet<string> = new Set()
): Map<string, LabelBox> {
  const ids = model.order.filter((id) => labelBox(model, id) !== null)
  const degree = (id: string) => incident(model.index, id).length
  const ranked = [...ids].sort(
    (a, b) =>
      Number(pinned.has(b)) - Number(pinned.has(a)) || degree(b) - degree(a) || compareText(a, b)
  )
  const marks = ids.map((id) => ({ id, box: markBox(model.positions[id] as GraphPoint) }))
  const kept = new Map<string, LabelBox>()
  for (const id of ranked) {
    const box = labelBox(model, id) as LabelBox
    const clear =
      model.labelMode === 'all' ||
      pinned.has(id) ||
      (![...kept.values()].some((other) => overlaps(box, other)) &&
        !marks.some((mark) => mark.id !== id && overlaps(box, mark.box)))
    if (clear) kept.set(id, box)
  }
  return kept
}

/** Node id to the labels of the groups that hold it, in group order. */
export function groupLabelsByNode(model: GraphModel): Map<string, string[]> {
  const labels = new Map<string, string[]>()
  for (const group of model.groups) {
    for (const id of group.nodeIds) labels.set(id, [...(labels.get(id) ?? []), group.label])
  }
  return labels
}
