// Pure checks of the repo-map/v1 invariants. Each returns readable problems; an empty list is valid.
import type { MapBox, MapEdge, MapLayout, MapNode, MapPoint, MapTimeline } from './types'

const contains = (outer: MapBox, inner: MapBox) =>
  inner.x >= outer.x &&
  inner.y >= outer.y &&
  inner.x + inner.w <= outer.x + outer.w &&
  inner.y + inner.h <= outer.y + outer.h

const touches = (b: MapBox, [x, y]: MapPoint) =>
  x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h

function duplicates(ids: readonly string[], what: string): string[] {
  const seen = new Set<string>()
  const problems: string[] = []
  for (const id of ids) {
    if (seen.has(id)) problems.push(`duplicate ${what} id ${id}`)
    seen.add(id)
  }
  return problems
}

function nodeProblems(node: MapNode, byId: ReadonlyMap<string, MapNode>): string[] {
  if (node.parentId === undefined) return []
  const parent = byId.get(node.parentId)
  if (!parent) return [`node ${node.id}: parent ${node.parentId} does not exist`]
  const problems: string[] = []
  if (parent.level >= node.level) problems.push(`node ${node.id}: not deeper than its parent`)
  if (!contains(parent.box, node.box)) problems.push(`node ${node.id}: box outside its parent`)
  return problems
}

function edgeProblems(edge: MapEdge, byId: ReadonlyMap<string, MapNode>): string[] {
  const source = byId.get(edge.source)
  const target = byId.get(edge.target)
  const missing = [
    ...(source ? [] : [`edge ${edge.id}: source ${edge.source} does not exist`]),
    ...(target ? [] : [`edge ${edge.id}: target ${edge.target} does not exist`]),
  ]
  if (!source || !target || !edge.route) return missing
  const first = edge.route[0]
  const last = edge.route[edge.route.length - 1]
  if (edge.route.length < 2 || !first || !last) return [`edge ${edge.id}: route has under 2 points`]
  return [
    ...(touches(source.box, first) ? [] : [`edge ${edge.id}: route does not start on its source`]),
    ...(touches(target.box, last) ? [] : [`edge ${edge.id}: route does not end on its target`]),
  ]
}

function flowAndCardProblems(layout: MapLayout, nodeIds: ReadonlySet<string>): string[] {
  const edges = new Map(layout.edges.map((edge) => [edge.id, edge]))
  const hops = layout.flows.flatMap((flow) =>
    flow.hops.flatMap((hop) => {
      const edge = edges.get(hop.edgeId)
      if (!edge) return [`flow ${flow.id} step ${hop.step}: edge ${hop.edgeId} does not exist`]
      if (edge.source === hop.from && edge.target === hop.to) return []
      return [`flow ${flow.id} step ${hop.step}: from/to differ from edge ${hop.edgeId}`]
    })
  )
  const cards = layout.cards
    .filter((card) => !nodeIds.has(card.anchor))
    .map((card) => `card ${card.id}: anchor ${card.anchor} does not exist`)
  return [...hops, ...cards]
}

/** Unique ids, children inside parents, edge ends and routes on their nodes, flow and card refs. */
export function validateMapLayout(layout: MapLayout): string[] {
  const byId = new Map(layout.nodes.map((node) => [node.id, node]))
  return [
    ...duplicates(
      layout.nodes.map((node) => node.id),
      'node'
    ),
    ...duplicates(
      layout.edges.map((edge) => edge.id),
      'edge'
    ),
    ...layout.nodes.flatMap((node) => nodeProblems(node, byId)),
    ...layout.edges.flatMap((edge) => edgeProblems(edge, byId)),
    ...flowAndCardProblems(layout, new Set(byId.keys())),
  ]
}

function spanProblems(timeline: MapTimeline): string[] {
  const spans = timeline.spans ?? []
  return spans.flatMap((span, i) => {
    const previous = spans[i - 1]
    if (span.endS <= span.startS) return [`span ${i}: ends before it starts`]
    if (previous && span.startS < previous.endS)
      return [`span ${i}: overlaps or precedes span ${i - 1}`]
    return []
  })
}

const ID_DOMAINS = {
  reveal: 'node',
  focus: 'node',
  lit: 'node',
  edge: 'edge',
  'card-in': 'card',
  'card-out': 'card',
} as const

/** Sorted keyframes, ordered spans, keyframes inside a span, and every id present in the layout. */
export function validateMapTimeline(timeline: MapTimeline, layout: MapLayout): string[] {
  const known = {
    node: new Set(layout.nodes.map((node) => node.id)),
    edge: new Set(layout.edges.map((edge) => edge.id)),
    card: new Set(layout.cards.map((card) => card.id)),
  }
  const spans = timeline.spans
  const keyframes = timeline.keyframes.flatMap((keyframe, i) => {
    const problems: string[] = []
    if (i > 0 && keyframe.atS < (timeline.keyframes[i - 1]?.atS ?? 0))
      problems.push(`keyframe ${i}: out of order`)
    if (spans && !spans.some((span) => keyframe.atS >= span.startS && keyframe.atS < span.endS)) {
      problems.push(`keyframe ${i}: starts outside every span`)
    }
    if (!('ids' in keyframe)) return problems
    const domain = ID_DOMAINS[keyframe.op]
    const unknown = keyframe.ids.filter((id) => !known[domain].has(id))
    return [...problems, ...unknown.map((id) => `keyframe ${i}: unknown ${domain} ${id}`)]
  })
  return [...spanProblems(timeline), ...keyframes]
}
