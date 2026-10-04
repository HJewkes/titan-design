import { displayLabel, incident, isValidWeight } from './network-graph-model'
import type {
  GraphEdge,
  GraphEdgeKind,
  GraphKind,
  GraphModel,
  GraphNode,
  GraphNodeContext,
} from './types'

export { displayLabel }

export function nodeLabel(node: GraphNode, context: GraphNodeContext): string {
  return [
    displayLabel(node),
    context.kindLabel,
    ...(context.groupLabels ?? []),
    `${context.incoming} incoming`,
    `${context.outgoing} outgoing`,
  ]
    .filter((part) => part !== undefined && part !== '')
    .join(', ')
}

export function edgeLabel(
  edge: GraphEdge,
  source: GraphNode,
  target: GraphNode,
  kindLabel?: string
): string {
  const weight = isValidWeight(edge.weight) ? `weight ${edge.weight}` : 'weight unknown'
  return [`${displayLabel(source)} to ${displayLabel(target)}`, kindLabel, weight]
    .filter((part) => part !== undefined && part !== '')
    .join(', ')
}

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`

function countByKind(kinds: readonly (string | undefined)[], labels: Map<string, string>) {
  const counts = new Map<string, number>()
  for (const kind of kinds) {
    const label = kind === undefined ? 'no kind' : (labels.get(kind) ?? kind)
    counts.set(label, (counts.get(label) ?? 0) + 1)
  }
  return [...counts]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([label, n]) => `${n} ${label}`)
    .join(', ')
}

function droppedSentence(model: GraphModel): string[] {
  const { report } = model
  const parts = [
    report.duplicateNodes > 0 && plural(report.duplicateNodes, 'duplicate node'),
    report.unknownEndpointEdges > 0 &&
      plural(report.unknownEndpointEdges, 'edge') + ' to unknown nodes',
    report.selfEdges > 0 && plural(report.selfEdges, 'self edge'),
    report.mergedEdges > 0 && plural(report.mergedEdges, 'duplicate edge') + ' merged',
  ].filter(Boolean)
  return parts.length > 0 ? [`Dropped: ${parts.join(', ')}.`] : []
}

function unplacedSentence(model: GraphModel): string[] {
  if (model.unplacedNodes === 0 && model.unplacedEdges === 0) return []
  const placed = model.nodes.length - model.unplacedNodes
  const parts = [`Showing ${placed} of ${plural(model.nodes.length, 'node')}`]
  if (model.unplacedEdges > 0) {
    parts.push(`${model.drawnEdges.length} of ${plural(model.edges.length, 'edge')}`)
  }
  return [`${parts.join(' and ')}.`]
}

/** Regions: "4 groups: Alpha 12, Beta 10." Rings: "Focus alpha-01: 1 hop 4, 2 hops 9." */
function groupSentence(model: GraphModel): string[] {
  const [focus, ...hops] = model.groups.filter((group) => group.variant === 'ring')
  if (focus) {
    const node = model.index.nodesById.get(focus.nodeIds[0] ?? '')
    const counts = hops.map((ring) => `${ring.label} ${ring.nodeIds.length}`)
    const detail = counts.length > 0 ? `: ${counts.join(', ')}` : ''
    return node ? [`Focus ${displayLabel(node)}${detail}.`] : []
  }
  if (model.groups.length === 0) return []
  const counts = model.groups.map((group) => `${group.label} ${group.nodeIds.length}`)
  return [`${plural(model.groups.length, 'group')}: ${counts.join(', ')}.`]
}

function mostConnected(model: GraphModel): string | null {
  let best: { id: string; degree: number } | null = null
  for (const id of model.index.order) {
    const degree = incident(model.index, id).length
    if (degree > 0 && (best === null || degree > best.degree)) best = { id, degree }
  }
  const node = best && model.index.nodesById.get(best.id)
  return best && node
    ? `Most connected: ${displayLabel(node)} with ${plural(best.degree, 'edge')}.`
    : null
}

export function summarizeGraph(
  model: GraphModel,
  kinds: { nodeKinds?: readonly GraphKind[]; edgeKinds?: readonly GraphEdgeKind[] } = {}
): string {
  const tail = [...groupSentence(model), ...droppedSentence(model), ...unplacedSentence(model)]
  if (model.nodes.length === 0) return ['Network graph with no nodes.', ...tail].join(' ')
  const nodeLabels = new Map((kinds.nodeKinds ?? []).map((k) => [k.id, k.label]))
  const edgeLabels = new Map((kinds.edgeKinds ?? []).map((k) => [k.id, k.label]))
  const head = `Network graph with ${plural(model.nodes.length, 'node')} and ${
    model.edges.length === 0 ? 'no edges' : plural(model.edges.length, 'edge')
  }.`
  if (model.nodes.length === 1 && model.edges.length === 0) return [head, ...tail].join(' ')
  const structure = [
    `Nodes: ${countByKind(
      model.nodes.map((n) => n.kind),
      nodeLabels
    )}.`,
    ...(model.edges.length > 0
      ? [
          `Edges: ${countByKind(
            model.edges.map((e) => e.kind),
            edgeLabels
          )}.`,
          mostConnected(model),
        ]
      : []),
  ].filter((part): part is string => part !== null)
  return [head, ...structure, ...tail].join(' ')
}
