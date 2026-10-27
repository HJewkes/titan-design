import { compareText } from '../../kit/compareText'
import { GRAPH_LABEL_ROOM, GRAPH_NODE_PADDING } from '../network-graph-model'
import type {
  GraphGroup,
  GraphGroupRegion,
  GraphLayout,
  GraphLayoutInput,
  GraphLayoutResult,
  GraphNode,
  GraphPoint,
} from '../types'
import { cleanGroups } from './clustered-layout-model'
import { LAYER_COLUMN_WIDTH, LAYER_ROW_HEIGHT, treeRows } from './layered-layout-model'
import { LAYOUT_DEFAULTS, rankKindsKey, rankLayers } from './layout-geometry'

/** Options of `laneLayout`; both are part of the layout's `key`. */
export interface LaneLayoutOptions {
  /** Band order and labels, top to bottom; the first entry wins on a repeated id. */
  lanes: readonly GraphGroup[]
  /** Edge kinds that rank the columns; every edge ranks when unset. */
  rankEdgeKinds?: readonly string[]
}

/** The trailing band of nodes whose group is not a lane; no lane id can equal `''`. */
const OTHER = ''
const OTHER_LABEL = 'Other'
/** A band's box reaches this far left of the first column and right of the label room. */
const LANE_INSET = 16
const LANE_GAP = 8
const BOX_X = GRAPH_NODE_PADDING - LANE_INSET

interface Band {
  id: string
  label: string
  /** Members in column order, then row order. */
  nodeIds: string[]
  /** Each member's row inside the band. */
  rows: Map<string, number>
  rowCount: number
}

const laneOf = (node: GraphNode, laneIds: ReadonlySet<string>) =>
  typeof node.group === 'string' && laneIds.has(node.group) ? node.group : OTHER

/** Inside a band each column stacks its members from row 0, in layered row order, then id. */
function stackRows(
  members: readonly string[],
  layerOf: (id: string) => number,
  treeRow: (id: string) => number
) {
  const nodeIds = [...members].sort(
    (a, b) => layerOf(a) - layerOf(b) || treeRow(a) - treeRow(b) || compareText(a, b)
  )
  const filled = new Map<number, number>()
  const rows = new Map<string, number>()
  for (const id of nodeIds) {
    const row = filled.get(layerOf(id)) ?? 0
    rows.set(id, row)
    filled.set(layerOf(id), row + 1)
  }
  return { nodeIds, rows, rowCount: Math.max(1, ...filled.values()) }
}

function buildBands(
  input: GraphLayoutInput,
  lanes: readonly GraphGroup[],
  rankEdgeKinds?: readonly string[]
) {
  const { ids, kept, layers } = rankLayers(input, rankEdgeKinds)
  const { rows } = treeRows(ids, kept)
  const layerOf = (id: string) => layers.get(id) ?? 0
  const treeRow = (id: string) => rows.get(id) ?? 0
  const laneIds = new Set(lanes.map((lane) => lane.id))
  const laneById = new Map(input.nodes.map((node) => [node.id, laneOf(node, laneIds)]))
  const membersOf = (laneId: string) => ids.filter((id) => laneById.get(id) === laneId)
  const others = membersOf(OTHER)
  const listed = [...lanes, ...(others.length > 0 ? [{ id: OTHER, label: OTHER_LABEL }] : [])]
  const bands: Band[] = listed.map(({ id, label }) => ({
    id,
    label,
    ...stackRows(membersOf(id), layerOf, treeRow),
  }))
  return { bands, layerOf, lastLayer: Math.max(0, ...ids.map(layerOf)) }
}

const bandHeight = (band: Band) =>
  LAYOUT_DEFAULTS.REGION_LABEL_BAND + band.rowCount * LAYER_ROW_HEIGHT

/** A band's box spans the frame's width; its members sit in rows under the label band. */
function placeBand(band: Band, top: number, width: number, layerOf: (id: string) => number) {
  const { REGION_LABEL_BAND } = LAYOUT_DEFAULTS
  const box = { x: BOX_X, y: top, width: width - BOX_X * 2, height: bandHeight(band) }
  const firstRowY = top + REGION_LABEL_BAND + LAYER_ROW_HEIGHT / 2
  const positions = band.nodeIds.map((id) => {
    const point = {
      x: GRAPH_NODE_PADDING + layerOf(id) * LAYER_COLUMN_WIDTH,
      y: firstRowY + (band.rows.get(id) ?? 0) * LAYER_ROW_HEIGHT,
    }
    return [id, point] as const
  })
  const region: GraphGroupRegion = {
    id: band.id,
    label: band.label,
    nodeIds: band.nodeIds,
    cx: box.x + box.width / 2,
    cy: box.y + box.height / 2,
    radius: 0,
    variant: 'box',
    box,
  }
  return { positions, region }
}

function computeLanes(
  input: GraphLayoutInput,
  lanes: readonly GraphGroup[],
  rankEdgeKinds: readonly string[] | undefined
): GraphLayoutResult {
  const { bands, layerOf, lastLayer } = buildBands(input, lanes, rankEdgeKinds)
  const naturalWidth = GRAPH_NODE_PADDING * 2 + lastLayer * LAYER_COLUMN_WIDTH + GRAPH_LABEL_ROOM
  const width = Math.max(naturalWidth, Number.isFinite(input.width) ? input.width : 0)
  const positions: Record<string, GraphPoint> = {}
  const groups: GraphGroupRegion[] = []
  let top = BOX_X
  for (const band of bands) {
    const placed = placeBand(band, top, width, layerOf)
    for (const [id, point] of placed.positions) positions[id] = point
    groups.push(placed.region)
    top += bandHeight(band) + LANE_GAP
  }
  return {
    positions,
    order: bands.flatMap((band) => band.nodeIds),
    width,
    height: top - LANE_GAP + BOX_X,
    groups,
  }
}

/**
 * Goal swimlanes: one full-width band per lane, top to bottom in the order given, and a trailing
 * `Other` band for nodes whose `group` is no lane. Columns are the layered layout's longest-path
 * layers, so a node sits in the column `layeredLayout` gives it; inside a band each column stacks its
 * members in rows. Returns one `box` group per band. Deterministic for any input order.
 */
export function laneLayout({ lanes, rankEdgeKinds }: LaneLayoutOptions): GraphLayout {
  const clean = cleanGroups(lanes)
  return {
    key: JSON.stringify(['lane', clean, rankKindsKey(rankEdgeKinds)]),
    compute: (input) => computeLanes(input, clean, rankEdgeKinds),
  }
}
