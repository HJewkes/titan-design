import type {
  GraphEdge,
  GraphGroup,
  GraphGroupRegion,
  GraphLayout,
  GraphLayoutInput,
  GraphLayoutResult,
  GraphNode,
  GraphPoint,
} from '../types'
import { simulateForces } from './force-layout-model'
import {
  LAYOUT_DEFAULTS,
  clampInt,
  frameLayout,
  packCircles,
  readingOrder,
  round2,
  toSeed,
  type PackedCircle,
} from './layout-geometry'

export interface ClusteredLayoutOptions {
  /** Default 1. */
  seed?: number
  /** Default 300, per group; an integer, clamped to 1..1000. */
  iterations?: number
  /** Region order and labels; unlisted group ids follow, sorted. */
  groups?: readonly GraphGroup[]
  /** Default 'Ungrouped'. */
  ungroupedLabel?: string
}

type CleanOptions = Required<ClusteredLayoutOptions> & { groups: GraphGroup[] }

interface Cluster {
  /** The group id; `''` is the ungrouped region, which no group id can equal. */
  id: string
  label: string
  /** Member positions relative to the region centre. */
  members: Record<string, GraphPoint>
  radius: number
}

const DEFAULT_SEED = 1
const DEFAULT_ITERATIONS = 300
const MIN_ITERATIONS = 1
const MAX_ITERATIONS = 1000
const DEFAULT_UNGROUPED_LABEL = 'Ungrouped'
const UNGROUPED = ''

const compareText = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0)

const groupOf = (node: GraphNode) => (typeof node.group === 'string' ? node.group : UNGROUPED)

/** Member ids per group id; a repeated node id keeps its smallest group, so input order never matters. */
function membership(nodes: readonly GraphNode[]): Map<string, string[]> {
  const groupById = new Map<string, string>()
  for (const node of nodes) {
    const group = groupOf(node)
    const known = groupById.get(node.id)
    if (known === undefined || compareText(group, known) < 0) groupById.set(node.id, group)
  }
  const members = new Map<string, string[]>()
  for (const [id, group] of groupById) members.set(group, [...(members.get(group) ?? []), id])
  return members
}

/** Listed groups in option order, then unlisted ids sorted, then ungrouped; empty groups drop out. */
function regionOrder(present: ReadonlySet<string>, listed: readonly GraphGroup[]): string[] {
  const listedIds = listed.map((group) => group.id).filter((id) => present.has(id))
  const unlisted = [...present]
    .filter((id) => id !== UNGROUPED && !listedIds.includes(id))
    .sort(compareText)
  return [...listedIds, ...unlisted, ...(present.has(UNGROUPED) ? [UNGROUPED] : [])]
}

/** Lays one group out alone on its own edges and centres it on its members' bounding box. */
function layoutCluster(
  memberIds: readonly string[],
  edges: readonly GraphEdge[],
  options: CleanOptions
): Pick<Cluster, 'members' | 'radius'> {
  const inGroup = new Set(memberIds)
  const inner = edges.filter((edge) => inGroup.has(edge.source) && inGroup.has(edge.target))
  const raw = simulateForces(
    memberIds.map((id) => ({ id })),
    inner,
    options
  )
  const points = Object.values(raw)
  const mid = (values: number[]) => (Math.min(...values) + Math.max(...values)) / 2
  const cx = mid(points.map((p) => p.x))
  const cy = mid(points.map((p) => p.y))
  const members = Object.fromEntries(
    Object.entries(raw).map(([id, p]) => [id, { x: p.x - cx, y: p.y - cy }])
  )
  const reach = Math.max(...Object.values(members).map((p) => Math.hypot(p.x, p.y)))
  return { members, radius: reach + LAYOUT_DEFAULTS.REGION_PADDING }
}

function buildClusters(input: GraphLayoutInput, options: CleanOptions): Cluster[] {
  const members = membership(input.nodes)
  const labels = new Map(options.groups.map((group) => [group.id, group.label]))
  return regionOrder(new Set(members.keys()), options.groups).map((id) => ({
    id,
    label: id === UNGROUPED ? options.ungroupedLabel : (labels.get(id) ?? id),
    ...layoutCluster(members.get(id) as string[], input.edges, options),
  }))
}

/** Rows wrap so the framed width stays within the viewport unless one region alone is wider. */
function packRegions(clusters: readonly Cluster[], viewportWidth: number) {
  const { PADDING, LABEL_ROOM, REGION_GAP, REGION_LABEL_BAND } = LAYOUT_DEFAULTS
  const widest = Math.max(0, ...clusters.map((cluster) => cluster.radius * 2))
  const room = Number.isFinite(viewportWidth) ? viewportWidth - PADDING * 2 - LABEL_ROOM : 0
  return packCircles(clusters, {
    width: Math.max(room, widest),
    gap: REGION_GAP,
    headroom: REGION_LABEL_BAND,
  }).circles
}

function toRegion(
  cluster: Cluster,
  { cx, cy, radius }: PackedCircle,
  framed: ReturnType<typeof frameLayout>
): GraphGroupRegion {
  const nodeIds = Object.keys(cluster.members)
  const inside = Object.fromEntries(nodeIds.map((id) => [id, framed.positions[id] as GraphPoint]))
  return {
    id: cluster.id,
    label: cluster.label,
    nodeIds: readingOrder(inside),
    cx: round2(cx + framed.offset.x),
    cy: round2(cy + framed.offset.y),
    radius: round2(radius),
    variant: 'region',
  }
}

function computeClustered(input: GraphLayoutInput, options: CleanOptions): GraphLayoutResult {
  const clusters = buildClusters(input, options)
  const packed = packRegions(clusters, input.width)
  const positions: Record<string, GraphPoint> = Object.fromEntries(
    packed.flatMap(({ cx, cy }, i) =>
      Object.entries((clusters[i] as Cluster).members).map(([id, p]) => [
        id,
        { x: cx + p.x, y: cy + p.y },
      ])
    )
  )
  const bounds = packed.flatMap(({ cx, cy, radius }) => [
    { x: cx - radius, y: cy - radius - LAYOUT_DEFAULTS.REGION_LABEL_BAND },
    { x: cx + radius, y: cy + radius },
  ])
  const framed = frameLayout(positions, input, bounds)
  const groups = packed.map((circle, i) => toRegion(clusters[i] as Cluster, circle, framed))
  return {
    positions: framed.positions,
    order: groups.flatMap((group) => group.nodeIds),
    width: framed.width,
    height: framed.height,
    edgeShape: 'arc',
    labelMode: 'declutter',
    groups,
  }
}

/** Keeps listed groups with a non-empty string id, the first entry winning on a repeated id. */
function cleanGroups(groups: unknown): GraphGroup[] {
  if (!Array.isArray(groups)) return []
  const kept = new Map<string, string>()
  for (const group of groups as Partial<GraphGroup>[]) {
    const { id, label } = group ?? {}
    if (typeof id !== 'string' || id === UNGROUPED || kept.has(id)) continue
    kept.set(id, typeof label === 'string' ? label : id)
  }
  return [...kept].map(([id, label]) => ({ id, label }))
}

function sanitize(options: ClusteredLayoutOptions): CleanOptions {
  return {
    seed: toSeed(options.seed ?? DEFAULT_SEED),
    iterations: clampInt(options.iterations, MIN_ITERATIONS, MAX_ITERATIONS, DEFAULT_ITERATIONS),
    groups: cleanGroups(options.groups),
    ungroupedLabel:
      typeof options.ungroupedLabel === 'string' ? options.ungroupedLabel : DEFAULT_UNGROUPED_LABEL,
  }
}

export function clusteredLayout(options: ClusteredLayoutOptions = {}): GraphLayout {
  const clean = sanitize(options)
  return {
    key: JSON.stringify([
      'clustered',
      clean.seed,
      clean.iterations,
      clean.groups,
      clean.ungroupedLabel,
    ]),
    compute: (input) => computeClustered(input, clean),
  }
}
