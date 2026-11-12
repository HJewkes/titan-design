// Synthetic fixtures for DependencyGraph: invented names, and a grid layout standing in for the
// build-time ELK layout a consumer supplies.
import type { GraphBox, GraphPoint } from '../network-graph/types'
import { cleanDependencies, dependencyEdgeId, egoSubgraph } from './dependency-graph-model'
import type {
  DependencyGraphData,
  DependencyGraphInput,
  DependencyGraphLayout,
  DependencyNode,
  DependencyTier,
} from './types'

export const TIERS: DependencyTier[] = [
  { id: 'app', label: 'Apps' },
  { id: 'service', label: 'Services' },
  { id: 'core', label: 'Core' },
]

const node = (id: string, tier: string, description?: string): DependencyNode => ({
  id,
  label: `@acme/${id}`,
  tier,
  description,
})

const NODES: DependencyNode[] = [
  node('console', 'app', 'Operator console'),
  node('docs', 'app', 'Documentation site'),
  node('mobile', 'app'),
  node('studio', 'app'),
  node('api', 'service', 'Request routing and handlers'),
  node('auth', 'service'),
  node('search', 'service'),
  node('billing', 'service'),
  node('schema', 'core', 'Shared types and validators'),
  node('logger', 'core'),
  node('config', 'core'),
  node('kernel', 'core'),
]

const dep = (source: string, target: string) => ({ source, target })

const EDGES = [
  dep('console', 'api'),
  dep('console', 'auth'),
  dep('docs', 'search'),
  dep('docs', 'schema'),
  dep('mobile', 'api'),
  dep('mobile', 'auth'),
  dep('studio', 'api'),
  dep('studio', 'search'),
  dep('studio', 'logger'),
  dep('api', 'schema'),
  dep('api', 'logger'),
  dep('api', 'config'),
  dep('auth', 'config'),
  dep('auth', 'logger'),
  dep('search', 'schema'),
  dep('billing', 'auth'),
  dep('billing', 'kernel'),
  dep('schema', 'kernel'),
  dep('logger', 'kernel'),
  dep('config', 'kernel'),
]

export const BOX = { width: 120, height: 40 }
const COLUMN = 75
const PAD = 20
const HEADER = 28
const GAP = 56
const LANE = 8

interface Placed {
  boxes: Record<string, GraphBox>
  tierOf: Map<string, number>
}

/** Each tier a row; odd tiers sit half a slot over, so a line passing through a tier misses its boxes. */
function placeNodes(data: DependencyGraphData, tiers: readonly DependencyTier[]): Placed {
  const boxes: Record<string, GraphBox> = {}
  const tierOf = new Map<string, number>()
  tiers.forEach((tier, row) => {
    const top = PAD + row * (HEADER + BOX.height + PAD + GAP) + HEADER
    data.nodes
      .filter((n) => n.tier === tier.id)
      .forEach((n, i) => {
        const x = 2 * PAD + ((row % 2) + 2 * i) * COLUMN
        boxes[n.id] = { x, y: top, ...BOX }
        tierOf.set(n.id, row)
      })
  })
  return { boxes, tierOf }
}

function tierBoxes(placed: Placed, tiers: readonly DependencyTier[]) {
  return Object.fromEntries(
    tiers.flatMap((tier, row) => {
      const members = [...placed.tierOf].filter(([, r]) => r === row).map(([id]) => id)
      const boxes = members.map((id) => placed.boxes[id] as GraphBox)
      if (boxes.length === 0) return []
      const left = Math.min(...boxes.map((b) => b.x)) - PAD
      const right = Math.max(...boxes.map((b) => b.x + b.width)) + PAD
      const top = (boxes[0] as GraphBox).y - HEADER
      return [
        [tier.id, { x: left, y: top, width: right - left, height: HEADER + BOX.height + PAD }],
      ]
    })
  )
}

const withoutRepeats = (points: GraphPoint[]) =>
  points.filter((p, i) => i === 0 || p.x !== points[i - 1]?.x || p.y !== points[i - 1]?.y)

/** Down from the source's bottom into a lane, across, then into the target's top (or up into its bottom). */
function route(source: GraphBox, target: GraphBox, lane: number): GraphPoint[] {
  const sx = source.x + source.width / 2
  const tx = target.x + target.width / 2
  const bottom = source.y + source.height
  const sameRow = source.y === target.y
  const laneY = bottom + (sameRow ? PAD / 2 : LANE * (1 + (lane % 5)))
  const end = sameRow ? target.y + target.height : target.y
  return withoutRepeats([
    { x: sx, y: bottom },
    { x: sx, y: laneY },
    { x: tx, y: laneY },
    { x: tx, y: end },
  ])
}

/** A deterministic stand-in for the build-time compound layout of `data`. */
export function gridLayout(
  data: DependencyGraphData,
  tiers: readonly DependencyTier[] = TIERS
): DependencyGraphLayout {
  const clean = cleanDependencies(data)
  const placed = placeNodes(clean, tiers)
  const lanes = new Map<number, number>()
  const routes = Object.fromEntries(
    clean.edges.map((edge) => {
      const row = placed.tierOf.get(edge.source) ?? 0
      const lane = lanes.get(row) ?? 0
      lanes.set(row, lane + 1)
      const points = route(
        placed.boxes[edge.source] as GraphBox,
        placed.boxes[edge.target] as GraphBox,
        lane
      )
      return [dependencyEdgeId(edge.source, edge.target), points]
    })
  )
  return { nodes: placed.boxes, tiers: tierBoxes(placed, tiers), routes }
}

export const architectureFixture: DependencyGraphData = { nodes: NODES, edges: EDGES }
export const architectureLayout = gridLayout(architectureFixture)

/** The node the ego and focused stories centre on. */
export const EGO_FOCUS = 'api'
export const egoFixture = egoSubgraph(architectureFixture, EGO_FOCUS)
export const egoLayout = gridLayout(egoFixture)

/** Every node on the full layout, as a build step would hand it over. */
export const architectureGraph: DependencyGraphInput = {
  ...architectureFixture,
  tiers: TIERS,
  layout: architectureLayout,
}

/** Every node on the ego layout of `EGO_FOCUS`, for `egoId`. */
export const egoGraph: DependencyGraphInput = { ...architectureGraph, layout: egoLayout }
