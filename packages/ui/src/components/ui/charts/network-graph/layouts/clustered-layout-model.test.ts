import fc from 'fast-check'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { fcAssert } from '../../../../../test/property'
import { seededRandom } from '../../kit/seededRandom'
import { groupedGroups, hostileLayoutOptions, largeFixture, networkGraphFixtures } from '../fixtures'
import { cleanGraph } from '../network-graph-model'
import type { GraphEdge, GraphGroupRegion, GraphLayoutResult, GraphNode } from '../types'
import { clusteredLayout, type ClusteredLayoutOptions } from './clustered-layout-model'
import { LAYOUT_DEFAULTS } from './layout-geometry'

const { PADDING, LABEL_ROOM, REGION_PADDING, REGION_LABEL_BAND } = LAYOUT_DEFAULTS
const n = (id: string, group?: string): GraphNode => ({
  id,
  label: id,
  ...(group === undefined ? {} : { group }),
})
const link = (source: string, target: string): GraphEdge => ({ source, target })
const viewport = { width: 800, height: 600 }
const FAST = { iterations: 40 }
const run = (
  nodes: readonly GraphNode[],
  edges: readonly GraphEdge[],
  options: ClusteredLayoutOptions = {},
  size = viewport
): GraphLayoutResult => {
  const clean = cleanGraph(nodes, edges)
  return clusteredLayout(options).compute({ nodes: clean.nodes, edges: clean.edges, ...size })
}
const fixtureRun = (name: keyof typeof networkGraphFixtures, options: ClusteredLayoutOptions = {}) =>
  run(networkGraphFixtures[name].nodes, networkGraphFixtures[name].edges, options)
const regions = (result: GraphLayoutResult) => result.groups ?? []
const regionOf = (result: GraphLayoutResult, id: string) =>
  regions(result).find((region) => region.nodeIds.includes(id)) as GraphGroupRegion
const fromCentre = (result: GraphLayoutResult, id: string) => {
  const p = result.positions[id] ?? { x: Number.NaN, y: Number.NaN }
  const region = regionOf(result, id)
  return { x: p.x - region.cx, y: p.y - region.cy }
}
/** A seeded Fisher-Yates shuffle, so a failure replays. */
function shuffle<T>(items: readonly T[], seed: number): T[] {
  const random = seededRandom(seed)
  const out = [...items]
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1))
    ;[out[i], out[j]] = [out[j] as T, out[i] as T]
  }
  return out
}
const allFinite = (result: GraphLayoutResult) =>
  [
    result.width,
    result.height,
    ...Object.values(result.positions).flatMap((p) => [p.x, p.y]),
    ...regions(result).flatMap((r) => [r.cx, r.cy, r.radius]),
  ].every(Number.isFinite)

function expectRegionsApart(result: GraphLayoutResult) {
  const all = regions(result)
  all.forEach((a, i) =>
    all.slice(i + 1).forEach((b) => {
      expect(Math.hypot(a.cx - b.cx, a.cy - b.cy)).toBeGreaterThanOrEqual(a.radius + b.radius)
    })
  )
}

function expectMembersInside(result: GraphLayoutResult) {
  for (const region of regions(result))
    for (const id of region.nodeIds) {
      const { x, y } = fromCentre(result, id)
      expect(Math.hypot(x, y)).toBeLessThanOrEqual(region.radius - REGION_PADDING + 0.02)
    }
}

const graph = fc
  .uniqueArray(fc.constantFrom(...'abcdefghijkl'.split('')), { minLength: 1, maxLength: 12 })
  .chain((ids) =>
    fc.record({
      nodes: fc
        .array(fc.constantFrom<string | undefined>('g1', 'g2', 'g3', '', undefined), {
          minLength: ids.length,
          maxLength: ids.length,
        })
        .map((groups) => ids.map((id, i) => n(id, groups[i]))),
      edges: fc
        .array(fc.tuple(fc.constantFrom(...ids), fc.constantFrom(...ids)), { maxLength: 18 })
        .map((pairs) => pairs.filter(([a, b]) => a !== b).map(([a, b]) => link(a, b))),
    })
  )

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('clusteredLayout regions', () => {
  it('property: every node is placed once, lies inside its group region, and no two regions overlap', () => {
    fcAssert(
      fc.property(graph, ({ nodes, edges }) => {
        const result = run(nodes, edges, FAST)
        const ids = nodes.map((node) => node.id).sort()
        expect(Object.keys(result.positions).sort()).toEqual(ids)
        expect(regions(result).flatMap((r) => r.nodeIds).sort()).toEqual(ids)
        for (const node of nodes) expect(regionOf(result, node.id).id).toBe(node.group ?? '')
        expectMembersInside(result)
        expectRegionsApart(result)
      })
    )
  })

  it("nodes with no group and with group '' share one last region labelled 'Ungrouped'; ungroupedLabel replaces the label", () => {
    const result = fixtureRun('Grouped (40)')
    const last = regions(result).at(-1)
    expect([last?.id, last?.label, last?.nodeIds.length]).toEqual(['', 'Ungrouped', 5])
    expect(regions(result).filter((r) => r.id === '')).toHaveLength(1)
    expect(regions(fixtureRun('Grouped (40)', { ungroupedLabel: 'Loose' })).at(-1)?.label).toBe(
      'Loose'
    )
  })

  it('Medium (30), which has no groups, gives one region holding every node', () => {
    const result = fixtureRun('Medium (30)')
    expect(regions(result)).toHaveLength(1)
    expect(regions(result)[0]?.nodeIds).toHaveLength(30)
  })

  it('region order is the option order, then unlisted ids sorted, then ungrouped', () => {
    const groups = [
      { id: 'gamma', label: 'Gamma' },
      { id: 'alpha', label: 'Alpha' },
    ]
    const result = fixtureRun('Grouped (40)', { groups })
    expect(regions(result).map((r) => r.id)).toEqual(['gamma', 'alpha', 'beta', 'delta', ''])
  })

  it('a listed group with no member gives no region; a duplicate listed id keeps the first label', () => {
    const result = fixtureRun('Grouped (40)', { groups: hostileLayoutOptions.groups })
    expect(regions(result).map((r) => r.id)).toEqual(['alpha', 'beta', 'delta', 'gamma', ''])
    expect(regions(result)[0]?.label).toBe('Alpha')
  })

  it("a region's label is the option's label, else the group id", () => {
    const result = fixtureRun('Grouped (40)', { groups: groupedGroups.slice(0, 2) })
    expect(regions(result).map((r) => r.label)).toEqual([
      'Alpha',
      'Beta',
      'delta',
      'gamma',
      'Ungrouped',
    ])
  })

  it('every region and its label band fit inside the natural size, and every region is a disc', () => {
    const result = fixtureRun('Many groups')
    for (const r of regions(result)) {
      expect(r.variant).toBe('region')
      expect([r.cx - r.radius, r.cy - r.radius - REGION_LABEL_BAND].every((v) => v >= 0)).toBe(true)
      expect(r.cx + r.radius).toBeLessThanOrEqual(result.width)
      expect(r.cy + r.radius).toBeLessThanOrEqual(result.height)
    }
  })

  it('Many groups wraps: the natural width is at most the larger of the viewport and the widest region', () => {
    const result = fixtureRun('Many groups')
    const widest = Math.max(...regions(result).map((r) => r.radius * 2))
    expect(result.width).toBeLessThanOrEqual(
      Math.max(viewport.width, widest + PADDING * 2 + LABEL_ROOM) + 0.01
    )
    expect(new Set(regions(result).map((r) => r.cy)).size).toBeGreaterThan(1)
    expectRegionsApart(result)
  })
})

describe('clusteredLayout independence', () => {
  it('adding a node to one group does not move any other group nodes relative to their region centre', () => {
    const { nodes, edges } = networkGraphFixtures['Grouped (40)']
    const before = run(nodes, edges)
    const after = run([...nodes, n('alpha-99', 'alpha')], [...edges, link('alpha-01', 'alpha-99')])
    for (const node of nodes.filter((x) => x.group !== 'alpha')) {
      const [p, q] = [fromCentre(before, node.id), fromCentre(after, node.id)]
      expect(Math.abs(p.x - q.x) + Math.abs(p.y - q.y)).toBeLessThanOrEqual(0.02)
    }
  })

  it('adding an edge between two groups changes no position', () => {
    const { nodes, edges } = networkGraphFixtures['Grouped (40)']
    const after = run(nodes, [...edges, link('beta-03', 'gamma-05'), link('delta-02', 'solo-01')])
    expect(after.positions).toEqual(run(nodes, edges).positions)
  })
})

describe('clusteredLayout determinism', () => {
  it('property: any permutation of nodes and edges gives the same result', () => {
    fcAssert(
      fc.property(
        graph.chain((g) =>
          fc.record({
            g: fc.constant(g),
            nodes: fc.shuffledSubarray(g.nodes, { minLength: g.nodes.length }),
            edges: fc.shuffledSubarray(g.edges, { minLength: g.edges.length }),
          })
        ),
        ({ g, nodes, edges }) => {
          expect(run(nodes, edges, FAST)).toEqual(run(g.nodes, g.edges, FAST))
        }
      )
    )
  })

  it('shuffled raw input with duplicate nodes and edges gives bit-identical positions', () => {
    const { nodes, edges } = networkGraphFixtures['Grouped (40)']
    const layout = clusteredLayout({ seed: 5 })
    const rawNodes = [...nodes, n('alpha-02', 'beta'), n('solo-01', 'gamma'), ...nodes.slice(0, 6)]
    const rawEdges = [...edges, ...edges.slice(0, 9), link('alpha-01', 'zz-01')]
    const first = layout.compute({ nodes: rawNodes, edges: rawEdges, ...viewport })
    const second = layout.compute({
      nodes: shuffle(rawNodes, 11),
      edges: shuffle(rawEdges, 12),
      ...viewport,
    })
    expect(JSON.stringify(second)).toBe(JSON.stringify(first))
    expect(regionOf(first, 'alpha-02').id).toBe('alpha')
  })

  it('compute calls no Math.random, Date.now, performance.now or timer', () => {
    for (const name of ['setTimeout', 'setInterval', 'requestAnimationFrame'])
      vi.stubGlobal(name, () => {
        throw new Error(`${name} called`)
      })
    for (const [target, key] of [
      [Math, 'random'],
      [Date, 'now'],
      [performance, 'now'],
    ] as const)
      vi.spyOn(target, key).mockImplementation(() => {
        throw new Error(`${key} called`)
      })
    expect(() => fixtureRun('Grouped (40)', FAST)).not.toThrow()
  })

  it('the key is equal for equal sanitised options and differs by each option', () => {
    const base = clusteredLayout().key
    expect(clusteredLayout({ seed: 1, iterations: 300, groups: [], ungroupedLabel: 'Ungrouped' }).key).toBe(base)
    expect(clusteredLayout({ seed: Number.NaN, iterations: Number.NaN }).key).toBe(base)
    const others = [
      { seed: 2 },
      { iterations: 50 },
      { groups: groupedGroups },
      { ungroupedLabel: 'Loose' },
    ].map((options) => clusteredLayout(options).key)
    expect(new Set([base, ...others]).size).toBe(5)
  })

  it("the result sets edgeShape 'arc' and labelMode 'declutter'", () => {
    const result = fixtureRun('One group', FAST)
    expect([result.edgeShape, result.labelMode]).toEqual(['arc', 'declutter'])
  })
})

describe('clusteredLayout degenerate input', () => {
  it('stays finite for 0 nodes, 1 node, a group of one, all ungrouped and hostile options', () => {
    const cases: GraphLayoutResult[] = [
      run([], []),
      run([n('a')], []),
      run([n('a', 'g'), n('b', 'h'), n('c', 'h')], [link('b', 'c')]),
      fixtureRun('No edges', FAST),
      ...hostileLayoutOptions.seeds.map((seed) => fixtureRun('Grouped (40)', { seed, ...FAST })),
      ...hostileLayoutOptions.iterations.map((iterations) => fixtureRun('One group', { iterations })),
      run([n('a', 'g')], [], { seed: Infinity, iterations: Infinity }, { width: Number.NaN, height: 0 }),
    ]
    for (const result of cases) expect(allFinite(result)).toBe(true)
    expect(regions(cases[0] as GraphLayoutResult)).toEqual([])
    expect(regions(cases[2] as GraphLayoutResult)[0]?.radius).toBe(REGION_PADDING)
    expect(regions(cases[3] as GraphLayoutResult)).toHaveLength(1)
  })

  it('Large (150) lays out in under 1 s', () => {
    const started = performance.now()
    run(largeFixture.nodes, largeFixture.edges)
    expect(performance.now() - started).toBeLessThan(1000)
  })
})
