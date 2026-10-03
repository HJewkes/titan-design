import { seededRandom } from '../kit/seededRandom'
import { suppliedLayout } from './layouts/supplied-layout-model'
import type {
  GraphEdge,
  GraphEdgeKind,
  GraphKind,
  GraphLayout,
  GraphNode,
  GraphPoint,
} from './types'

export interface GraphFixture {
  nodes: GraphNode[]
  edges: GraphEdge[]
  nodeKinds: GraphKind[]
  edgeKinds: GraphEdgeKind[]
  /** The layout the fixture is meant to be shown with; the layered default when unset. */
  layout?: GraphLayout
  /** Viewport override for fixtures that probe size handling. */
  width?: number
}

const NODE_KINDS: GraphKind[] = [
  { id: 'human', label: 'Human' },
  { id: 'lead', label: 'Lead' },
  { id: 'worker', label: 'Worker' },
]
const EDGE_KINDS: GraphEdgeKind[] = [
  { id: 'spawn', label: 'Spawned', stroke: 'solid' },
  { id: 'message', label: 'Messaged', stroke: 'dashed' },
]

const pad = (n: number, width = 2) => String(n).padStart(width, '0')
const node = (id: string, kind: string, label = id): GraphNode => ({ id, label, kind })
const spawn = (source: string, target: string): GraphEdge => ({ source, target, kind: 'spawn' })
const message = (source: string, target: string, weight: number | null): GraphEdge => ({
  source,
  target,
  kind: 'message',
  weight,
})
const fixture = (
  nodes: GraphNode[],
  edges: GraphEdge[],
  extra: Partial<GraphFixture> = {}
): GraphFixture => ({
  nodes,
  edges,
  nodeKinds: NODE_KINDS,
  edgeKinds: EDGE_KINDS,
  ...extra,
})

/** Seeded message edges between distinct nodes, never repeating a pair already in `taken`. */
function seededMessages(
  ids: readonly string[],
  count: number,
  random: () => number,
  taken: GraphEdge[] = []
): GraphEdge[] {
  const edges = [...taken]
  const seen = new Set(edges.map((e) => `${e.source}>${e.target}`))
  while (edges.length < taken.length + count) {
    const from = ids[Math.floor(random() * ids.length)] as string
    const to = ids[Math.floor(random() * ids.length)] as string
    if (from === to || seen.has(`${from}>${to}`)) continue
    seen.add(`${from}>${to}`)
    edges.push(message(from, to, 1 + Math.floor(random() * 40)))
  }
  return edges.slice(taken.length)
}

function buildSmall(): GraphFixture {
  const workers = [1, 2, 3, 4].map((n) => `worker-${pad(n)}`)
  return fixture(
    [node('lead-01', 'lead'), ...workers.map((id) => node(id, 'worker'))],
    [
      ...workers.map((id) => spawn('lead-01', id)),
      message('lead-01', 'worker-01', 6),
      message('worker-02', 'worker-03', 2),
      message('worker-04', 'lead-01', 11),
    ]
  )
}

function buildMedium(): GraphFixture {
  const humans = ['human-01', 'human-02']
  const leads = [1, 2, 3, 4].map((n) => `lead-${pad(n)}`)
  const mids = Array.from({ length: 10 }, (_, i) => `worker-${pad(i + 1)}`)
  const leaves = Array.from({ length: 14 }, (_, i) => `worker-${pad(i + 11)}`)
  const spawns = [
    ...leads.map((id, i) => spawn(humans[i % 2] as string, id)),
    ...mids.map((id, i) => spawn(leads[i % 4] as string, id)),
    ...leaves.map((id, i) => spawn(mids[i % 10] as string, id)),
  ]
  const cycle = [
    message('lead-02', 'lead-03', 1),
    message('lead-03', 'worker-04', 40),
    message('worker-04', 'lead-02', 7),
  ]
  const random = seededRandom(30)
  return fixture(
    [
      ...humans.map((id) => node(id, 'human')),
      ...leads.map((id) => node(id, 'lead')),
      ...[...mids, ...leaves].map((id) => node(id, 'worker')),
    ],
    [...spawns, ...cycle, ...seededMessages([...leads, ...mids, ...leaves], 13, random, cycle)]
  )
}

function buildLarge(): GraphFixture {
  const random = seededRandom(150)
  const roots = Array.from({ length: 5 }, (_, i) => `lead-${pad(i + 1)}`)
  const levels = new Map<string, number>(roots.map((id) => [id, 0]))
  const spawns: GraphEdge[] = []
  for (let n = 1; n <= 145; n += 1) {
    const id = `worker-${pad(n, 3)}`
    const candidates = [...levels].filter(([, level]) => level < 3).map(([parent]) => parent)
    const parent = candidates[Math.floor(random() * candidates.length)] as string
    spawns.push(spawn(parent, id))
    levels.set(id, (levels.get(parent) ?? 0) + 1)
  }
  const ids = [...levels.keys()]
  return fixture(
    ids.map((id) => node(id, id.startsWith('lead') ? 'lead' : 'worker')),
    [...spawns, ...seededMessages(ids, 150, random)]
  )
}

function buildWideFanOut(): GraphFixture {
  const children = Array.from({ length: 60 }, (_, i) => `worker-${pad(i + 1)}`)
  return fixture(
    [node('lead-01', 'lead'), ...children.map((id) => node(id, 'worker'))],
    children.map((id) => spawn('lead-01', id))
  )
}

function buildDeepChain(): GraphFixture {
  const ids = Array.from({ length: 12 }, (_, i) => `worker-${pad(i + 1)}`)
  return fixture(
    ids.map((id) => node(id, 'worker')),
    ids.slice(1).map((id, i) => spawn(ids[i] as string, id))
  )
}

function buildMissingValues(): GraphFixture {
  const ids = ['alpha-01', 'alpha-02', 'alpha-03', 'alpha-04']
  return {
    nodes: ids.map((id) => ({ id, label: id })),
    edges: [
      { source: 'alpha-01', target: 'alpha-02' },
      { source: 'alpha-02', target: 'alpha-03', weight: null },
      { source: 'alpha-03', target: 'alpha-04', kind: 'message', weight: null },
    ],
    nodeKinds: [],
    edgeKinds: EDGE_KINDS,
  }
}

function buildManyKinds(): GraphFixture {
  const kinds = Array.from({ length: 8 }, (_, i) => `kind-${pad(i + 1)}`)
  return {
    nodes: kinds.map((kind, i) => node(`alpha-${pad(i + 1)}`, kind)),
    edges: kinds.slice(1).map((_, i) => spawn(`alpha-${pad(i + 1)}`, `alpha-${pad(i + 2)}`)),
    nodeKinds: kinds.map((id, i) => ({ id, label: `Kind ${i + 1}` })),
    edgeKinds: EDGE_KINDS,
  }
}

function buildLongLabels(): GraphFixture {
  const labels = ['x'.repeat(120), `${'unbroken'.repeat(8)}`, 'Orchestrator 🚀 ✨', '']
  return fixture(
    labels.map((label, i) => ({ id: `alpha-${pad(i + 1)}`, label, kind: 'worker' })),
    [spawn('alpha-01', 'alpha-02'), spawn('alpha-01', 'alpha-03'), spawn('alpha-01', 'alpha-04')]
  )
}

const ringPositions = (ids: readonly string[]): Record<string, GraphPoint> =>
  Object.fromEntries(
    ids.map((id, i) => {
      const angle = (2 * Math.PI * i) / ids.length
      return [
        id,
        { x: Math.round(200 + 140 * Math.cos(angle)), y: Math.round(200 + 140 * Math.sin(angle)) },
      ]
    })
  )

/** Positions for `hostileFixture`: two nodes missing and one non-finite. */
export const hostilePositions: Record<string, GraphPoint> = {
  'alpha-01': { x: 40, y: 40 },
  'alpha-02': { x: 200, y: 40 },
  'alpha-03': { x: Number.NaN, y: 80 },
}

function buildHostile(): GraphFixture {
  return {
    nodes: [
      { id: 'alpha-01', label: 'alpha-01', kind: 'lead' },
      { id: 'alpha-01', label: 'alpha-01 again', kind: 'worker' },
      { id: 'alpha-02', label: 'alpha-02', kind: 'worker' },
      { id: 'alpha-03', label: 'alpha-03', kind: 'worker' },
      { id: 'alpha-04', label: 'alpha-04', kind: 'worker' },
      { id: 'alpha-05', label: 'alpha-05', kind: 'worker' },
    ],
    edges: [
      { source: 'alpha-01', target: 'alpha-02', kind: 'spawn', weight: 3 },
      { source: 'alpha-01', target: 'alpha-02', kind: 'spawn', weight: 4 },
      { source: 'alpha-02', target: 'alpha-02', kind: 'spawn' },
      { source: 'alpha-02', target: 'alpha-99', kind: 'spawn' },
      { source: 'alpha-02', target: 'alpha-03', kind: 'spawn' },
      { source: 'alpha-03', target: 'alpha-01', kind: 'spawn' },
      { source: 'alpha-03', target: 'alpha-04', kind: 'message', weight: Number.NaN },
      { source: 'alpha-04', target: 'alpha-05', kind: 'message', weight: -5 },
    ],
    nodeKinds: NODE_KINDS,
    edgeKinds: EDGE_KINDS,
    width: 0,
  }
}

export const smallFixture = buildSmall()
export const mediumFixture = buildMedium()
export const largeFixture = buildLarge()
export const suppliedFixture: GraphFixture = {
  ...buildSmall(),
  layout: suppliedLayout(ringPositions(smallFixture.nodes.map((n) => n.id))),
}
export const hostileFixture = buildHostile()

export const networkGraphFixtures = {
  'Small (5)': smallFixture,
  'Medium (30)': mediumFixture,
  'Large (150)': largeFixture,
  'Wide fan-out': buildWideFanOut(),
  'Deep chain': buildDeepChain(),
  Supplied: suppliedFixture,
  Empty: fixture([], []),
  'One item': fixture([node('lead-01', 'lead')], []),
  'No edges': fixture(
    Array.from({ length: 12 }, (_, i) => node(`worker-${pad(i + 1)}`, 'worker')),
    []
  ),
  'All equal': fixture(
    Array.from({ length: 9 }, (_, i) => node(`worker-${pad(i + 1)}`, 'worker')),
    Array.from({ length: 8 }, (_, i) => message(`worker-${pad(i + 1)}`, `worker-${pad(i + 2)}`, 5))
  ),
  'Missing values': buildMissingValues(),
  'Many kinds': buildManyKinds(),
  Pulse: buildSmall(),
  'Long label': buildLongLabels(),
  Hostile: hostileFixture,
} satisfies Record<string, GraphFixture>
