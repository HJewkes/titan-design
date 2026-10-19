import { describe, expect, it } from 'vitest'
import { parsePath } from '../../motion/paths/parse'
import { pathLength, pointAtLength } from '../../motion/paths/model'
import {
  borderPoint,
  placedNodeBoxes,
  placedRoutes,
  polylineMidpoint,
  routedOffsets,
  ROUTED_PARALLEL_GAP,
  routeToPath,
  straightRoute,
} from './network-graph-boxes'
import type { GraphBox, GraphPoint } from './types'

const p = (x: number, y: number): GraphPoint => ({ x, y })
const box = (x: number, y: number, width: number, height: number): GraphBox => ({
  x,
  y,
  width,
  height,
})
/** A right turn, a left turn and a straight-through point: four legs, two bends. */
const ROUTE = [p(0, 0), p(100, 0), p(100, 80), p(220, 80), p(300, 80)]

/** The end point of every command, in order. */
const vertices = (d: string) =>
  parsePath(d).flatMap((command) =>
    'x' in command ? [p(command.x as number, command.y as number)] : []
  )

const distance = (a: GraphPoint, b: GraphPoint) => Math.hypot(a.x - b.x, a.y - b.y)

describe('routeToPath', () => {
  // Mutation caught: a dropped or duplicated bend (the path would skip or repeat a vertex).
  it('passes through every point of the route at radius 0', () => {
    expect(vertices(routeToPath(ROUTE))).toEqual(ROUTE)
  })

  // Mutation caught: an off-by-one that stops the path before the last point.
  it('ends on the last route point', () => {
    const d = routeToPath(ROUTE, { cornerRadius: 12 })
    const end = pointAtLength(d, pathLength(d))
    expect(distance(end, p(300, 80))).toBeLessThan(0.5)
  })

  // Mutation caught: a corner that is not tangent to both legs (a shortcut or a detour).
  it('is shorter by (2 - π/2)·r per right-angle bend with radius r', () => {
    const r = 12
    const sharp = pathLength(routeToPath(ROUTE))
    const rounded = pathLength(routeToPath(ROUTE, { cornerRadius: r }))
    expect(sharp - rounded).toBeCloseTo(2 * (2 - Math.PI / 2) * r, 3)
  })

  // Mutation caught: the arc drawn on the wrong side of the bend (an inverted sweep flag).
  it('rounds each bend on the inside of the turn', () => {
    const r = 12
    const d = routeToPath(ROUTE, { cornerRadius: r })
    const cornerMid = 100 - r + (Math.PI / 4) * r
    expect(distance(pointAtLength(d, cornerMid), p(100, 0))).toBeCloseTo((Math.SQRT2 - 1) * r, 1)
    const secondMid = 100 - r + (Math.PI / 2) * r + (80 - 2 * r) + (Math.PI / 4) * r
    expect(distance(pointAtLength(d, secondMid), p(100, 80))).toBeCloseTo((Math.SQRT2 - 1) * r, 1)
  })

  // Mutation caught: a radius not clamped to half a leg, which overshoots a short leg.
  it('never rounds more than half of the shorter leg', () => {
    const d = routeToPath([p(0, 0), p(10, 0), p(10, 100)], { cornerRadius: 40 })
    expect(d).toBe('M0,0L5,0A5,5 0 0 1 10,5L10,100')
  })

  it('gives no path for fewer than two points', () => {
    expect(routeToPath([p(1, 1)])).toBe('')
    expect(routeToPath([])).toBe('')
  })
})

describe('polylineMidpoint', () => {
  // Mutation caught: taking the middle vertex instead of the middle by length.
  it('is halfway along the route by length', () => {
    expect(polylineMidpoint([p(0, 0), p(100, 0), p(100, 20)])).toEqual(p(60, 0))
  })
})

describe('straight routed edges', () => {
  const a = { id: 'a', box: box(0, 0, 100, 60) }
  const b = { id: 'b', box: box(300, 0, 100, 60) }

  // Mutation caught: the line run centre to centre, through both boxes.
  it('runs from border to border', () => {
    expect(straightRoute(a, b, 0)).toEqual([p(100, 30), p(300, 30)])
  })

  // Mutation caught: zero offset, so an import and a runtime edge between one pair coincide.
  it('puts two edges between one pair 18 px apart', () => {
    const edges = [
      { id: 'a->b:import', source: 'a', target: 'b', kind: 'import' },
      { id: 'a->b:runtime', source: 'a', target: 'b', kind: 'runtime' },
    ]
    const offsets = routedOffsets(edges, (edge) => edge.id as string)
    const [importLine, runtimeLine] = edges.map((edge) =>
      straightRoute(a, b, offsets.get(edge.id) ?? 0)
    )
    expect(ROUTED_PARALLEL_GAP).toBe(18)
    expect(Math.abs((runtimeLine?.[0].y ?? 0) - (importLine?.[0].y ?? 0))).toBe(18)
  })

  // Mutation caught: the side taken from the edge's direction, so a pair each way lands on one line.
  it('separates an edge each way between one pair', () => {
    const offsets = routedOffsets(
      [
        { id: 'ab', source: 'a', target: 'b' },
        { id: 'ba', source: 'b', target: 'a' },
      ],
      (edge) => edge.id as string
    )
    const [forward] = straightRoute(a, b, offsets.get('ab') ?? 0)
    const [, back] = straightRoute(b, a, offsets.get('ba') ?? 0)
    expect(Math.abs(forward.y - back.y)).toBe(18)
  })

  it('stops at the box border from an offset start', () => {
    expect(borderPoint(box(0, 0, 100, 60), p(50, 39), p(350, 39))).toEqual(p(100, 39))
  })
})

describe('placed boxes and routes', () => {
  // Mutation caught: a box node without a rectangle dropped instead of given the default box.
  it('gives a box node without a rectangle a default box on its position', () => {
    const boxes = placedNodeBoxes(
      { nodeShape: 'box', nodeBoxes: { a: box(0, 0, 10, 10), b: box(0, 0, Number.NaN, 4) } },
      { a: p(5, 5), b: p(100, 100) }
    )
    expect(boxes).toEqual({ a: box(0, 0, 10, 10), b: box(40, 80, 120, 40) })
  })

  it('gives dots no boxes', () => {
    expect(placedNodeBoxes({ nodeBoxes: { a: box(0, 0, 10, 10) } }, { a: p(5, 5) })).toEqual({})
  })

  // Mutation caught: a route kept with a non-finite point or for an edge that is not drawn.
  it('keeps only finite routes of two or more points for drawn edges', () => {
    const routes = placedRoutes(
      {
        edgeShape: 'routed',
        routes: {
          ok: [p(0, 0), p(1, 1)],
          short: [p(0, 0)],
          nan: [p(0, 0), p(Number.NaN, 1)],
          gone: [p(0, 0), p(1, 1)],
        },
      },
      new Set(['ok', 'short', 'nan'])
    )
    expect(Object.keys(routes)).toEqual(['ok'])
  })
})
