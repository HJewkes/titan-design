import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { fcAssert } from '../../../../../test/property'
import { laneFixtureLanes, networkGraphFixtures } from '../fixtures'
import { cleanGraph } from '../network-graph-model'
import type { GraphBox, GraphEdge, GraphGroup, GraphLayoutResult, GraphNode } from '../types'
import { laneLayout } from './lane-layout-model'
import { layeredLayout } from './layered-layout-model'

const lanesFixture = networkGraphFixtures['Three lanes']
const VIEWPORT = { width: 4000, height: 600 }

const n = (id: string, group?: string): GraphNode => ({ id, label: id, group })
const e = (source: string, target: string, kind = 'spawn'): GraphEdge => ({ source, target, kind })
const run = (
  nodes: readonly GraphNode[],
  edges: readonly GraphEdge[],
  lanes: readonly GraphGroup[],
  rankEdgeKinds?: readonly string[]
): GraphLayoutResult => laneLayout({ lanes, rankEdgeKinds }).compute({ nodes, edges, ...VIEWPORT })
const boxOf = (result: GraphLayoutResult, id: string) =>
  result.groups?.find((group) => group.id === id)?.box as GraphBox

const LANES: GraphGroup[] = [
  { id: 'x', label: 'Lane X' },
  { id: 'y', label: 'Lane Y' },
  { id: 'z', label: 'Lane Z' },
]

/** A cleaned graph over lanes x, y, z, an unlisted group and no group, plus shuffled copies. */
const lanedGraph = fc
  .uniqueArray(fc.constantFrom(...'abcdefghijkl'.split('')), { minLength: 1, maxLength: 12 })
  .chain((ids) =>
    fc
      .record({
        groups: fc.array(fc.constantFrom('x', 'y', 'z', 'w', undefined), {
          minLength: ids.length,
          maxLength: ids.length,
        }),
        raw: fc.array(fc.record({ a: fc.nat(ids.length - 1), b: fc.nat(ids.length - 1) }), {
          maxLength: 20,
        }),
      })
      .chain(({ groups, raw }) => {
        const cleaned = cleanGraph(
          ids.map((id, i) => n(id, groups[i])),
          raw
            .filter((r) => r.a !== r.b)
            .map((r) => e(ids[r.a] as string, ids[r.b] as string, r.a < r.b ? 'spawn' : 'message'))
        )
        return fc.record({
          nodes: fc.constant(cleaned.nodes),
          edges: fc.constant(cleaned.edges),
          shuffledNodes: fc.shuffledSubarray(cleaned.nodes, { minLength: cleaned.nodes.length }),
          shuffledEdges: fc.shuffledSubarray(cleaned.edges, { minLength: cleaned.edges.length }),
        })
      })
  )

describe('laneLayout', () => {
  it('places each node inside the box of its own lane', () => {
    const check = (nodes: readonly GraphNode[], result: GraphLayoutResult) => {
      const groupOf = new Map(nodes.map((node) => [node.id, node.group]))
      for (const region of result.groups ?? []) {
        const box = region.box as GraphBox
        for (const id of region.nodeIds) {
          const { x, y } = result.positions[id] as { x: number; y: number }
          if (region.id !== '') expect(groupOf.get(id)).toBe(region.id)
          expect(x).toBeGreaterThan(box.x)
          expect(x).toBeLessThan(box.x + box.width)
          expect(y).toBeGreaterThan(box.y)
          expect(y).toBeLessThan(box.y + box.height)
        }
      }
    }
    check(lanesFixture.nodes, run(lanesFixture.nodes, lanesFixture.edges, laneFixtureLanes))
    fcAssert(fc.property(lanedGraph, ({ nodes, edges }) => check(nodes, run(nodes, edges, LANES))))
  })

  it('puts a node in the same column layeredLayout gives it', () => {
    const check = (nodes: readonly GraphNode[], edges: readonly GraphEdge[], kinds?: string[]) => {
      const lanes = run(nodes, edges, LANES, kinds)
      const layered = layeredLayout({ rankEdgeKinds: kinds }).compute({ nodes, edges, ...VIEWPORT })
      for (const [id, point] of Object.entries(lanes.positions)) {
        expect(point.x).toBe(layered.positions[id]?.x)
      }
    }
    check(lanesFixture.nodes, lanesFixture.edges)
    check(lanesFixture.nodes, lanesFixture.edges, ['spawn'])
    fcAssert(fc.property(lanedGraph, ({ nodes, edges }) => check(nodes, edges)))
  })

  it('puts a node whose group is not a lane in a trailing Other band', () => {
    const nodes = [n('a', 'x'), n('b', 'w'), n('c'), n('d', ''), n('e', 'y')]
    const result = run(nodes, [e('a', 'b')], LANES)
    const other = result.groups?.[(result.groups?.length ?? 0) - 1]
    expect(other).toMatchObject({ id: '', label: 'Other', nodeIds: ['c', 'd', 'b'] })
    expect(result.groups?.map((group) => group.id)).toEqual(['x', 'y', 'z', ''])
  })

  it('adds no Other band when every node is in a lane', () => {
    const result = run([n('a', 'x'), n('b', 'z')], [], LANES)
    expect(result.groups?.map((group) => group.id)).toEqual(['x', 'y', 'z'])
  })

  it('keeps lanes in the order the caller passes', () => {
    const lanes = [
      { id: 'z', label: 'Charlie' },
      { id: 'x', label: 'Alpha' },
      { id: 'y', label: 'Bravo' },
    ]
    const result = run([n('a', 'x'), n('b', 'y'), n('c', 'z')], [], lanes)
    expect(result.groups?.map((group) => group.label)).toEqual(['Charlie', 'Alpha', 'Bravo'])
  })

  it('stacks nodes that share a lane and a column in rows, one row apart', () => {
    const nodes = [n('r', 'x'), n('a', 'x'), n('b', 'x'), n('c', 'y')]
    const result = run(nodes, [e('r', 'a'), e('r', 'b'), e('r', 'c')], LANES)
    const ys = ['r', 'a', 'b', 'c'].map((id) => result.positions[id]?.y as number)
    expect(ys[2] as number).toBe((ys[1] as number) + 30)
    expect(ys[0]).toBe(ys[1])
    expect(boxOf(result, 'x').height).toBeGreaterThan(boxOf(result, 'y').height)
  })

  it('returns one box group per band, stacked without overlap inside the natural size', () => {
    const result = run(lanesFixture.nodes, lanesFixture.edges, laneFixtureLanes)
    const groups = result.groups ?? []
    expect(groups.every((group) => group.variant === 'box' && group.radius === 0)).toBe(true)
    for (const [i, group] of groups.entries()) {
      const box = group.box as GraphBox
      expect(box.x + box.width).toBeLessThanOrEqual(result.width)
      expect(box.y + box.height).toBeLessThanOrEqual(result.height)
      const next = groups[i + 1]?.box
      if (next) expect(next.y).toBeGreaterThan(box.y + box.height)
    }
  })

  it('stretches the bands to a viewport wider than the graph', () => {
    const narrow = laneLayout({ lanes: LANES }).compute({
      nodes: [n('a', 'x')],
      edges: [],
      width: 0,
      height: 0,
    })
    expect(narrow.width).toBeLessThan(VIEWPORT.width)
    expect(run([n('a', 'x')], [], LANES).width).toBe(VIEWPORT.width)
  })

  it('orders nodes band by band, then by column', () => {
    const result = run(lanesFixture.nodes, lanesFixture.edges, laneFixtureLanes)
    expect(result.order).toEqual((result.groups ?? []).flatMap((group) => group.nodeIds))
    expect(result.order.slice(0, 2)).toEqual(['alpha-01', 'alpha-02'])
  })

  it('property: any permutation of nodes and edges gives the same result', () => {
    fcAssert(
      fc.property(lanedGraph, ({ nodes, edges, shuffledNodes, shuffledEdges }) => {
        expect(run(shuffledNodes, shuffledEdges, LANES)).toEqual(run(nodes, edges, LANES))
      })
    )
  })

  it('keys on the cleaned lanes and the sorted rank kinds', () => {
    const key = (options: Parameters<typeof laneLayout>[0]) => laneLayout(options).key
    expect(key({ lanes: LANES, rankEdgeKinds: ['b', 'a'] })).toBe(
      key({ lanes: [...LANES, { id: 'x', label: 'Again' }], rankEdgeKinds: ['a', 'b'] })
    )
    expect(key({ lanes: LANES })).not.toBe(key({ lanes: [...LANES].reverse() }))
    expect(key({ lanes: LANES })).not.toBe(key({ lanes: LANES, rankEdgeKinds: [] }))
  })

  it('stays finite for no nodes, no lanes and hostile lanes', () => {
    const hostile = [{ id: '', label: 'Empty' }, null, { id: 3 }] as unknown as GraphGroup[]
    for (const result of [
      run([], [], LANES),
      run([n('a', 'x')], [], []),
      run([n('a', 'x')], [], hostile),
    ]) {
      const numbers = [
        result.width,
        result.height,
        ...Object.values(result.positions).flatMap((p) => [p.x, p.y]),
      ]
      expect(numbers.every(Number.isFinite)).toBe(true)
    }
    const kept = run([n('a', 'x')], [], [...hostile, { id: 'x', label: 'Lane X' }])
    expect(kept.groups?.map((group) => group.label)).toEqual(['Lane X'])
  })
})
