// A repo-map/v1 layout at one level, as NetworkGraph props: the box, compound and routed painter (D2).
import { boxLayout, type BoxLayoutGroup } from '../layouts/box-layout-model'
import type {
  GraphBox,
  GraphEdge,
  GraphEdgeKind,
  GraphLayout,
  GraphNode,
  GraphPoint,
} from '../types'
import type { MapBox, MapLayout, MapNode } from './types'

/** One edge kind per evidence source; `traced` is inferred, so it paints dashed. */
export const MAP_EDGE_KINDS: GraphEdgeKind[] = [
  { id: 'import', label: 'imports' },
  { id: 'call', label: 'calls' },
  { id: 'protocol', label: 'protocol' },
  { id: 'traced', label: 'inferred', stroke: 'dashed' },
]

export interface MapGraph {
  nodes: GraphNode[]
  edges: GraphEdge[]
  layout: GraphLayout
}

const toBox = ({ x, y, w, h }: MapBox): GraphBox => ({ x, y, width: w, height: h })

/**
 * The map at `level`: its nodes, and every shallower node without children, as boxes; the shallower
 * nodes with children as compound boxes; and the level's edges between boxes, with their routes.
 */
export function mapGraph(map: MapLayout, level: number): MapGraph {
  const parents = new Set(map.nodes.flatMap((node) => (node.parentId ? [node.parentId] : [])))
  const isBox = (node: MapNode) =>
    node.level === level || (node.level < level && !parents.has(node.id))
  const boxNodes = map.nodes.filter(isBox)
  const boxIds = new Set(boxNodes.map((node) => node.id))
  const groups: BoxLayoutGroup[] = map.nodes
    .filter((node) => node.level < level && parents.has(node.id))
    .map((node) => ({ id: node.id, label: node.label, box: toBox(node.box) }))
  const mapEdges = map.edges.filter(
    (edge) => edge.level === level && boxIds.has(edge.source) && boxIds.has(edge.target)
  )
  const routes: Record<string, GraphPoint[]> = Object.fromEntries(
    mapEdges.flatMap((edge) =>
      edge.route ? [[edge.id, edge.route.map(([x, y]) => ({ x, y }))]] : []
    )
  )
  return {
    nodes: boxNodes.map(({ id, label, kind }) => ({ id, label, kind })),
    edges: mapEdges.map(({ id, source, target, edgeSource, weight }) => ({
      id,
      source,
      target,
      kind: edgeSource,
      weight,
    })),
    layout: boxLayout({
      boxes: Object.fromEntries(boxNodes.map((node) => [node.id, toBox(node.box)])),
      groups,
      routes,
    }),
  }
}
