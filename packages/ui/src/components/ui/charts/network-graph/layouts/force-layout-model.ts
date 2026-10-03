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

const DEFAULT_SEED = 1
const DEFAULT_ITERATIONS = 300
const MIN_ITERATIONS = 1
const MAX_ITERATIONS = 1000
const VELOCITY_DECAY = 0.6
const FINAL_ALPHA = 0.001

interface Body extends SimulationNodeDatum {
  id: string
  x: number
  y: number
  vx: number
  vy: number
}

const compareText = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0)

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

/** Unframed, unrounded positions in id order. The inputs are never mutated. */
export function simulateForces(
  nodes: readonly Pick<GraphNode, 'id'>[],
  edges: readonly GraphEdge[],
  { seed, iterations }: SimulateOptions
): Record<string, GraphPoint> {
  const ids = nodes.map((node) => node.id).sort(compareText)
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

export function forceLayout(options: ForceLayoutOptions = {}): GraphLayout {
  const seed = toSeed(options.seed ?? DEFAULT_SEED)
  const iterations = clampInt(
    options.iterations,
    MIN_ITERATIONS,
    MAX_ITERATIONS,
    DEFAULT_ITERATIONS
  )
  return {
    key: JSON.stringify(['force', seed, iterations]),
    compute: (input) => computeForce(input, { seed, iterations }),
  }
}
