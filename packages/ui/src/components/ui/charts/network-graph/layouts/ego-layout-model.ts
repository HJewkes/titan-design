import { compareText } from '../../kit/compareText'
import type {
  GraphEdge,
  GraphGroupRegion,
  GraphLayout,
  GraphLayoutInput,
  GraphLayoutResult,
  GraphPoint,
} from '../types'
import { LAYOUT_DEFAULTS, clampInt, frameLayout, round2 } from './layout-geometry'

/** Which edges count as a hop: every edge two-way, source to target only, or target to source only. */
export type EgoDirection = 'both' | 'outgoing' | 'incoming'

/** Options of `egoLayout`; all three are part of the layout's `key`. There is no `seed`: nothing is random. */
export interface EgoLayoutOptions {
  /** `null` or an unknown id places nothing. */
  focusId: string | null
  /** Default 2; floored, at least 0. */
  hops?: number
  /** Default 'both'. */
  direction?: EgoDirection
}

const DEFAULT_HOPS = 2
const DIRECTIONS: readonly EgoDirection[] = ['both', 'outgoing', 'incoming']

/** Neighbour lists in id order; an edge with an unknown or repeated endpoint is ignored. */
function adjacency(
  ids: ReadonlySet<string>,
  edges: readonly GraphEdge[],
  direction: EgoDirection
): Map<string, string[]> {
  const sets = new Map<string, Set<string>>([...ids].map((id) => [id, new Set<string>()]))
  for (const { source, target } of edges) {
    if (!ids.has(source) || !ids.has(target) || source === target) continue
    if (direction !== 'incoming') sets.get(source)?.add(target)
    if (direction !== 'outgoing') sets.get(target)?.add(source)
  }
  return new Map([...sets].map(([id, set]) => [id, [...set].sort(compareText)]))
}

/** Breadth-first rings from the focus, each in discovery order, up to `hops`. */
function egoRings(
  focusId: string,
  neighbours: ReadonlyMap<string, readonly string[]>,
  hops: number
): string[][] {
  const seen = new Set([focusId])
  const rings = [[focusId]]
  for (let hop = 1; hop <= hops; hop += 1) {
    const ring: string[] = []
    for (const id of rings[hop - 1] as string[]) {
      for (const next of neighbours.get(id) ?? []) {
        if (seen.has(next)) continue
        seen.add(next)
        ring.push(next)
      }
    }
    if (ring.length === 0) break
    rings.push(ring)
  }
  return rings
}

/** `r(0) = 0`; each ring is `RING_GAP` past the last, or wider when its nodes need `MIN_ARC` each. */
function ringRadii(rings: readonly (readonly string[])[]): number[] {
  const { RING_GAP, MIN_ARC } = LAYOUT_DEFAULTS
  const radii = [0]
  for (let hop = 1; hop < rings.length; hop += 1) {
    const crowded = ((rings[hop] as readonly string[]).length * MIN_ARC) / (2 * Math.PI)
    radii.push(Math.max((radii[hop - 1] as number) + RING_GAP, crowded))
  }
  return radii
}

/** Built with `Object.fromEntries`, so an id such as `__proto__` becomes an own key. */
function ringPositions(
  rings: readonly (readonly string[])[],
  radii: readonly number[]
): Record<string, GraphPoint> {
  return Object.fromEntries(
    rings.flatMap((ring, hop) =>
      ring.map((id, i) => {
        const radius = radii[hop] as number
        const angle = -Math.PI / 2 + (2 * Math.PI * i) / ring.length
        return [id, { x: radius * Math.cos(angle), y: radius * Math.sin(angle) }]
      })
    )
  )
}

const hopLabel = (hop: number) => (hop === 0 ? 'focus' : hop === 1 ? '1 hop' : `${hop} hops`)

/** Two corners of the outermost ring's box, so the framed box holds every ring guide. */
const ringBounds = (radius: number): GraphPoint[] => [
  { x: -radius, y: -radius },
  { x: radius, y: radius },
]

function computeEgo(
  { nodes, edges, width, height }: GraphLayoutInput,
  options: Required<EgoLayoutOptions>
): GraphLayoutResult {
  const ids = new Set(nodes.map((node) => node.id))
  const { focusId, hops, direction } = options
  const rings =
    focusId !== null && ids.has(focusId)
      ? egoRings(focusId, adjacency(ids, edges, direction), hops)
      : []
  const radii = ringRadii(rings)
  const outer = radii[radii.length - 1] ?? 0
  const framed = frameLayout(ringPositions(rings, radii), { width, height }, ringBounds(outer))
  const groups: GraphGroupRegion[] = rings.map((ring, hop) => ({
    id: `hop-${hop}`,
    label: hopLabel(hop),
    nodeIds: ring,
    cx: round2(framed.offset.x),
    cy: round2(framed.offset.y),
    radius: round2(radii[hop] as number),
    variant: 'ring',
  }))
  return {
    positions: framed.positions,
    order: rings.flat(),
    width: framed.width,
    height: framed.height,
    edgeShape: 'arc',
    labelMode: 'declutter',
    groups,
  }
}

function sanitize(options: EgoLayoutOptions | undefined): Required<EgoLayoutOptions> {
  const focusId = typeof options?.focusId === 'string' ? options.focusId : null
  const hops = clampInt(options?.hops, 0, Number.MAX_SAFE_INTEGER, DEFAULT_HOPS)
  const direction = DIRECTIONS.includes(options?.direction as EgoDirection)
    ? (options?.direction as EgoDirection)
    : 'both'
  return { focusId, hops, direction }
}

/**
 * An ego layout: the focus at the centre and one ring per hop out to `hops`, so distance means hops
 * from one node. Nodes further away are left unplaced and counted; a `null` or unknown `focusId`
 * places nothing, so the empty state renders. Asks for arc edges and decluttered labels, and
 * returns one `ring` group per hop.
 */
export function egoLayout(options: EgoLayoutOptions): GraphLayout {
  const clean = sanitize(options)
  return {
    key: JSON.stringify(['ego', clean.focusId, clean.hops, clean.direction]),
    compute: (input) => computeEgo(input, clean),
  }
}
