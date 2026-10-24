// Pure: a build-time compound layout (graph-layout's `computeCompoundLayout` result) as a
// `DependencyGraphLayout`. Typed by shape, so react-ui takes no dependency on the layout package.
import type { GraphBox, GraphPoint } from '../network-graph/types'
import { dependencyEdgeId } from './dependency-graph-model'
import type { DependencyGraphLayout } from './types'

/** A laid-out box; `x` and `y` are its centre. */
export interface CenteredBox {
  /** A node id, or a group id for a group box. */
  id: string
  /** Centre x in px. */
  x: number
  /** Centre y in px. */
  y: number
  /** Width in px. */
  width: number
  /** Height in px. */
  height: number
}

/** An edge from the layout; a routed edge carries its points on `attrs.route`. */
export interface LaidOutDependency {
  /** Node id of the dependent. */
  srcId: string
  /** Node id of the dependency. */
  dstId: string
  /** `route`, when set, is the edge's polyline; other keys are ignored. */
  attrs?: Readonly<Record<string, unknown>>
}

/** The shape of a compound layout result: leaf boxes, group boxes and routed edges. */
export interface CompoundLayoutLike {
  /** Leaf boxes, one per node. */
  nodes: readonly CenteredBox[]
  /** Group boxes, one per tier. */
  groups: readonly CenteredBox[]
  /** Edges, routed or not. */
  edges: readonly LaidOutDependency[]
}

/** How `fromCompoundLayout` reads group ids. */
export interface CompoundLayoutAdapterOptions {
  /** The tier a group box stands for, or null to drop it. Default: the group id is the tier id. */
  tierOfGroup?: (groupId: string) => string | null
}

const isFiniteBox = (box: CenteredBox) =>
  [box.x, box.y, box.width, box.height].every(Number.isFinite) && box.width > 0 && box.height > 0

const topLeft = ({ x, y, width, height }: CenteredBox): GraphBox => ({
  x: x - width / 2,
  y: y - height / 2,
  width,
  height,
})

const isPoint = (value: unknown): value is GraphPoint =>
  typeof value === 'object' &&
  value !== null &&
  Number.isFinite((value as GraphPoint).x) &&
  Number.isFinite((value as GraphPoint).y)

function routeOf(edge: LaidOutDependency): GraphPoint[] | null {
  const route = edge.attrs?.route
  if (!Array.isArray(route) || route.length < 2 || !route.every(isPoint)) return null
  return route.map(({ x, y }) => ({ x, y }))
}

/** Centre boxes become top-left boxes; group boxes become tier boxes; each valid route is kept. */
export function fromCompoundLayout(
  layout: CompoundLayoutLike,
  { tierOfGroup = (id) => id }: CompoundLayoutAdapterOptions = {}
): DependencyGraphLayout {
  const boxes = (items: readonly CenteredBox[], idOf: (id: string) => string | null) =>
    Object.fromEntries(
      items.flatMap((item) => {
        const id = idOf(item.id)
        return id !== null && isFiniteBox(item) ? [[id, topLeft(item)]] : []
      })
    )
  return {
    nodes: boxes(layout.nodes, (id) => id),
    tiers: boxes(layout.groups, tierOfGroup),
    routes: Object.fromEntries(
      layout.edges.flatMap((edge) => {
        const route = routeOf(edge)
        return route ? [[dependencyEdgeId(edge.srcId, edge.dstId), route]] : []
      })
    ),
  }
}
