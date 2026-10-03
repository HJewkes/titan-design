import { describe, expect, it, vi } from 'vitest'
import {
  hostileFixture,
  largeFixture,
  mediumFixture,
  networkGraphFixtures,
  smallFixture,
  suppliedFixture,
} from './fixtures'
import { layeredLayout } from './layouts/layered-layout-model'
import { buildGraphModel } from './network-graph-model'
import { summarizeGraph } from './network-graph-text'

const count = (fixture: typeof smallFixture, kind: string) =>
  fixture.edges.filter((edge) => edge.kind === kind).length

describe('network graph fixtures', () => {
  it('Small has 5 nodes, 4 spawn edges and 3 message edges, one back to the lead', () => {
    expect(smallFixture.nodes).toHaveLength(5)
    expect([count(smallFixture, 'spawn'), count(smallFixture, 'message')]).toEqual([4, 3])
    expect(smallFixture.edges.some((e) => e.kind === 'message' && e.target === 'lead-01')).toBe(
      true
    )
  })

  it('Medium has 30 nodes, 28 spawn edges, 16 weighted message edges and a message cycle', () => {
    expect(mediumFixture.nodes).toHaveLength(30)
    expect([count(mediumFixture, 'spawn'), count(mediumFixture, 'message')]).toEqual([28, 16])
    const weights = mediumFixture.edges
      .filter((e) => e.kind === 'message')
      .map((e) => e.weight as number)
    expect([Math.min(...weights), Math.max(...weights)]).toEqual([1, 40])
    const has = (from: string, to: string) =>
      mediumFixture.edges.some((e) => e.kind === 'message' && e.source === from && e.target === to)
    expect([
      has('lead-02', 'lead-03'),
      has('lead-03', 'worker-04'),
      has('worker-04', 'lead-02'),
    ]).toEqual([true, true, true])
  })

  it('Large has 150 nodes, 145 spawn edges and 150 message edges over 5 roots', () => {
    expect(largeFixture.nodes).toHaveLength(150)
    expect([count(largeFixture, 'spawn'), count(largeFixture, 'message')]).toEqual([145, 150])
    const targets = new Set(
      largeFixture.edges.filter((e) => e.kind === 'spawn').map((e) => e.target)
    )
    expect(largeFixture.nodes.filter((node) => !targets.has(node.id))).toHaveLength(5)
  })

  it('gives the same data on every import', async () => {
    vi.resetModules()
    const again = await import('./fixtures')
    expect(again.largeFixture).toEqual(largeFixture)
    expect(again.mediumFixture).toEqual(mediumFixture)
  })

  it('uses invented ids and no duplicate ids outside Hostile', () => {
    for (const [name, fixture] of Object.entries(networkGraphFixtures)) {
      const ids = fixture.nodes.map((node) => node.id)
      expect(ids.every((id) => /^[a-z]+-\d+$/.test(id))).toBe(true)
      if (name !== 'Hostile') expect(new Set(ids).size).toBe(ids.length)
    }
  })

  it('lays out every fixture without throwing, with every clean node placed', () => {
    for (const [name, fixture] of Object.entries(networkGraphFixtures)) {
      const viewport = { width: fixture.width ?? 800, height: 600 }
      const model = buildGraphModel(
        fixture.nodes,
        fixture.edges,
        fixture.layout ?? layeredLayout(),
        viewport
      )
      expect(summarizeGraph(model, fixture)).toEqual(expect.any(String))
      if (name !== 'Hostile' && name !== 'Supplied') expect(model.unplacedNodes).toBe(0)
    }
  })

  it('Supplied places the Small nodes on a ring with its own layout', () => {
    const model = buildGraphModel(
      suppliedFixture.nodes,
      suppliedFixture.edges,
      suppliedFixture.layout ?? layeredLayout(),
      { width: 400, height: 400 }
    )
    expect(model.order).toHaveLength(5)
    expect(suppliedFixture.layout?.key.startsWith('supplied:')).toBe(true)
  })

  it('Hostile carries every hostile input and a zero width', () => {
    const model = buildGraphModel(hostileFixture.nodes, hostileFixture.edges, layeredLayout(), {
      width: 0,
      height: 0,
    })
    expect(model.report).toEqual({
      duplicateNodes: 1,
      selfEdges: 1,
      unknownEndpointEdges: 1,
      mergedEdges: 1,
    })
    expect(hostileFixture.width).toBe(0)
    expect(hostileFixture.edges.some((e) => Number.isNaN(e.weight))).toBe(true)
    expect(hostileFixture.edges.some((e) => (e.weight ?? 0) < 0)).toBe(true)
  })

  it('Two components holds components of 8 and 5 nodes and 3 isolated nodes', () => {
    const { nodes, edges } = networkGraphFixtures['Two components']
    const linked = new Set(edges.flatMap((e) => [e.source, e.target]))
    expect(nodes).toHaveLength(16)
    expect(linked.size).toBe(13)
    expect(nodes.filter((n) => !linked.has(n.id))).toHaveLength(3)
  })

  it('Mutual pair has an edge each way and a second kind one way', () => {
    const { nodes, edges } = networkGraphFixtures['Mutual pair']
    const between = (from: string, to: string) =>
      edges.filter((e) => e.source === from && e.target === to).map((e) => e.kind)
    expect(nodes).toHaveLength(2)
    expect(between('alpha-01', 'alpha-02')).toEqual(['spawn', 'message'])
    expect(between('alpha-02', 'alpha-01')).toEqual(['message'])
  })

  it('Wide fan-out has 60 children and Deep chain has 12 nodes', () => {
    expect(networkGraphFixtures['Wide fan-out'].nodes).toHaveLength(61)
    expect(networkGraphFixtures['Deep chain'].nodes).toHaveLength(12)
  })

  it('Long label holds a 120-character, an unbroken, an emoji and an empty label', () => {
    const labels = networkGraphFixtures['Long label'].nodes.map((node) => node.label)
    expect(labels.map((l) => l.length)[0]).toBe(120)
    expect(labels).toContain('')
    expect(labels.some((l) => /\p{Extended_Pictographic}/u.test(l))).toBe(true)
  })
})
