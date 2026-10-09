import { compareText } from '../../kit/compareText'
import {
  forceCollide,
  forceLink,
  forceManyBody,
  forceX,
  forceY,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from 'd3-force'
import { seededRandom } from '../../kit/seededRandom'
import type { GraphEdge, GraphLayout, GraphLayoutInput, GraphNode, GraphPoint } from '../types'
import { LAYOUT_DEFAULTS, clampInt, frameLayout, readingOrder, toSeed } from './layout-geometry'

/** Options of `forceLayout`; both are part of the layout's `key`. */
export interface ForceLayoutOptions {
  /** Default 1. */
  seed?: number
  /** Default 300; an integer, clamped to 1..1000. */
  iterations?: number
}

export interface SimulateOptions {
  seed: number
  iterations: number
}

const VELOCITY_DECAY = 0.6
const FINAL_ALPHA = 0.001

interface Body extends SimulationNodeDatum {
  id: string
  x: number
  y: number
  vx: number
  vy: number
}

/** Edges between two distinct known nodes, copied as plain ids and sorted by source, target, id. */
function simulationLinks(
  ids: ReadonlySet<string>,
  edges: readonly GraphEdge[]
): SimulationLinkDatum<Body>[] {
  return edges
    .filter((edge) => ids.has(edge.source) && ids.has(edge.target) && edge.source !== edge.target)
    .map((edge) => ({ source: edge.source, target: edge.target }))
    .sort((a, b) => compareText(a.source, b.source) || compareText(a.target, b.target))
}

function startingBodies(ids: readonly string[], random: () => number): Body[] {
  const side = LAYOUT_DEFAULTS.LINK_DISTANCE * Math.sqrt(ids.length)
  return ids.map((id) => ({
    id,
    x: (random() - 0.5) * side,
    y: (random() - 0.5) * side,
    vx: 0,
    vy: 0,
  }))
}

/** The body of d3-force's `simulation.tick`, run without `forceSimulation` and its timer. */
function stepForces(
  bodies: Body[],
  links: SimulationLinkDatum<Body>[],
  iterations: number,
  random: () => number
) {
  const forces = [
    forceManyBody<Body>(),
    forceLink<Body, SimulationLinkDatum<Body>>(links)
      .id((body) => body.id)
      .distance(LAYOUT_DEFAULTS.LINK_DISTANCE),
    forceCollide<Body>(LAYOUT_DEFAULTS.COLLIDE_RADIUS),
    forceX<Body>(0),
    forceY<Body>(0),
  ]
  for (const force of forces) force.initialize?.(bodies, random)
  const alphaDecay = 1 - Math.pow(FINAL_ALPHA, 1 / iterations)
  let alpha = 1
  for (let step = 0; step < iterations; step += 1) {
    alpha += (0 - alpha) * alphaDecay
    for (const force of forces) force(alpha)
    for (const body of bodies) {
      body.vx *= VELOCITY_DECAY
      body.x += body.vx
      body.vy *= VELOCITY_DECAY
      body.y += body.vy
    }
  }
}

/** Unframed, unrounded positions in id order, one per distinct id. The inputs are never mutated. */
export function simulateForces(
  nodes: readonly Pick<GraphNode, 'id'>[],
  edges: readonly GraphEdge[],
  { seed, iterations }: SimulateOptions
): Record<string, GraphPoint> {
  const ids = [...new Set(nodes.map((node) => node.id))].sort(compareText)
  const random = seededRandom(toSeed(seed))
  const bodies = startingBodies(ids, random)
  stepForces(bodies, simulationLinks(new Set(ids), edges), iterations, random)
  return Object.fromEntries(bodies.map(({ id, x, y }) => [id, { x, y }]))
}

function computeForce({ nodes, edges, width, height }: GraphLayoutInput, options: SimulateOptions) {
  const raw = simulateForces(nodes, edges, options)
  const framed = frameLayout(raw, { width, height })
  return {
    positions: framed.positions,
    order: readingOrder(framed.positions),
    width: framed.width,
    height: framed.height,
    edgeShape: 'arc' as const,
    labelMode: 'declutter' as const,
  }
}

/**
 * A force-directed layout: linked nodes sit near each other and unlinked ones are pushed apart, so
 * distance means connection. Deterministic for a `seed`; it steps `d3-force` a fixed number of
 * `iterations` with no timer. Asks for arc edges and decluttered labels.
 */
export function forceLayout(options: ForceLayoutOptions = {}): GraphLayout {
  const seed = toSeed(options.seed ?? LAYOUT_DEFAULTS.SEED)
  const iterations = clampInt(
    options.iterations,
    LAYOUT_DEFAULTS.MIN_ITERATIONS,
    LAYOUT_DEFAULTS.MAX_ITERATIONS,
    LAYOUT_DEFAULTS.ITERATIONS
  )
  return {
    key: JSON.stringify(['force', seed, iterations]),
    compute: (input) => computeForce(input, { seed, iterations }),
  }
}
