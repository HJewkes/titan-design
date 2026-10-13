import { compareText, displayLabel, GRAPH_NODE_RADIUS, incident } from './network-graph-model'
import type { GraphGroupRegion, GraphIndex, GraphModel, GraphPoint } from './types'

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

/** Space kept between a ring label and a node mark. */
export const RING_LABEL_CLEARANCE = 4
/** A ring label's box is centred this far inside its ring: a 16 px line box ending 8 px short of the line. */
const RING_LABEL_INSET = 16
/** Each try turns the label this far round the ring, alternating sides of six o'clock. */
const RING_LABEL_STEP = Math.PI / 12

const grow = (box: LabelBox, by: number): LabelBox => ({
  x: box.x - by,
  y: box.y - by,
  width: box.width + by * 2,
  height: box.height + by * 2,
})

/** What a ring label must not meet: every node mark plus `RING_LABEL_CLEARANCE`, and every node label. */
export function nodeKeepOuts(model: GraphModel): LabelBox[] {
  return model.order.flatMap((id) => {
    const at = model.positions[id]
    const label = labelBox(model, id)
    if (!at) return []
    const mark = grow(markBox(at), RING_LABEL_CLEARANCE)
    return label ? [mark, label] : [mark]
  })
}

/** The label box centred `RING_LABEL_INSET` inside the ring at `angle` (0 is three o'clock, y down). */
function ringLabelAt(group: GraphGroupRegion, angle: number): LabelBox {
  const reach = Math.max(group.radius - RING_LABEL_INSET, 0)
  const width = Math.min(group.label.length, LABEL_MAX_CHARS) * LABEL_CHAR_WIDTH
  return {
    x: group.cx + reach * Math.cos(angle) - width / 2,
    y: group.cy + reach * Math.sin(angle) - LABEL_HEIGHT / 2,
    width,
    height: LABEL_HEIGHT,
  }
}

/** Six o'clock first, then one step either side, out to twelve o'clock. */
function ringLabelAngles(): number[] {
  const turns = Math.round(Math.PI / RING_LABEL_STEP)
  return Array.from({ length: turns * 2 }, (_, i) => {
    const side = i % 2 === 0 ? 1 : -1
    return Math.PI / 2 + side * Math.ceil(i / 2) * RING_LABEL_STEP
  })
}

/**
 * A box per ring with a radius, by group id: the first angle whose label meets no node keep-out and
 * no earlier ring label, else six o'clock.
 */
export function ringLabelBoxes(model: GraphModel): Map<string, LabelBox> {
  const blocked = nodeKeepOuts(model)
  const boxes = new Map<string, LabelBox>()
  for (const group of model.groups) {
    if (group.variant !== 'ring' || group.radius <= 0) continue
    const tries = ringLabelAngles().map((angle) => ringLabelAt(group, angle))
    const box = tries.find((t) => !blocked.some((b) => overlaps(t, b))) ?? (tries[0] as LabelBox)
    blocked.push(box)
    boxes.set(group.id, box)
  }
  return boxes
}

/** Node id to the labels of the groups that hold it, in group order. */
export function groupLabelsByNode(model: GraphModel): Map<string, string[]> {
  const labels = new Map<string, string[]>()
  for (const group of model.groups) {
    for (const id of group.nodeIds) labels.set(id, [...(labels.get(id) ?? []), group.label])
  }
  return labels
}
