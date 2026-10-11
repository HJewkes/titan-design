import { edgeLabel, nodeLabel } from './network-graph-text'
import type { GraphModel, NetworkGraphProps } from './types'

export type GraphNaming = Pick<
  NetworkGraphProps,
  'nodeKinds' | 'edgeKinds' | 'formatNodeLabel' | 'formatEdgeLabel'
>

export const labelsById = (kinds: readonly { id: string; label: string }[] = []) =>
  new Map(kinds.map((kind) => [kind.id, kind.label]))

/** A kind missing from the list is named by its id, as the summary does. */
export const kindLabel = (labels: ReadonlyMap<string, string>, kind: string | undefined) =>
  kind === undefined ? undefined : (labels.get(kind) ?? kind)

function nodeNames(model: GraphModel, { nodeKinds, formatNodeLabel }: GraphNaming) {
  const labels = labelsById(nodeKinds)
  const { index } = model
  return index.order.flatMap((id): [string, string][] => {
    const node = index.nodesById.get(id)
    if (!node) return []
    const context = {
      kindLabel: kindLabel(labels, node.kind),
      incoming: index.incoming.get(id)?.length ?? 0,
      outgoing: index.outgoing.get(id)?.length ?? 0,
    }
    return [[id, formatNodeLabel?.(node, context) ?? nodeLabel(node, context)]]
  })
}

function edgeNames(model: GraphModel, { edgeKinds, formatEdgeLabel }: GraphNaming) {
  const labels = labelsById(edgeKinds)
  const { nodesById, edgesById } = model.index
  return [...edgesById].flatMap(([id, edge]): [string, string][] => {
    const source = nodesById.get(edge.source)
    const target = nodesById.get(edge.target)
    if (!source || !target) return []
    const name =
      formatEdgeLabel?.(edge, source, target) ??
      edgeLabel(edge, source, target, kindLabel(labels, edge.kind))
    return [[id, name]]
  })
}

export interface GraphItems {
  nodeNames: ReadonlyMap<string, string>
  edgeNames: ReadonlyMap<string, string>
  nodeDomIds: ReadonlyMap<string, string>
  edgeDomIds: ReadonlyMap<string, string>
}

/** Accessible names and DOM ids of every drawn item. Ids are positional, since a graph id may hold spaces. */
export function graphItems(model: GraphModel, naming: GraphNaming, prefix: string): GraphItems {
  const edgeIds = [...model.index.edgesById.keys()]
  return {
    nodeNames: new Map(nodeNames(model, naming)),
    edgeNames: new Map(edgeNames(model, naming)),
    nodeDomIds: new Map(model.order.map((id, i) => [id, `${prefix}-n${String(i)}`])),
    edgeDomIds: new Map(edgeIds.map((id, i) => [id, `${prefix}-e${String(i)}`])),
  }
}
