import { describe, expect, it, vi } from 'vitest'
import {
  groupedGroups,
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

  it('Grouped (40) has groups of 12, 10, 8 and 5, five ungrouped nodes, 44 inner and 9 cross edges', () => {
    const { nodes, edges, groups, focusId } = networkGraphFixtures['Grouped (40)']
    const sizes = [...groupedGroups.map((g) => g.id), ''].map(
      (id) => nodes.filter((n) => (n.group || '') === id).length
    )
    expect(sizes).toEqual([12, 10, 8, 5, 5])
    expect(nodes.filter((n) => n.group === '')).toHaveLength(2)
    const regionOf = new Map(nodes.map((n) => [n.id, n.group || n.id]))
    const inner = edges.filter((e) => regionOf.get(e.source) === regionOf.get(e.target))
    expect([inner.length, edges.length - inner.length]).toEqual([44, 9])
    expect([groups, focusId]).toEqual([groupedGroups, 'alpha-01'])
  })

  it('Hub and spokes has one hub, 24 spokes and up to 2 leaves per spoke', () => {
    const { nodes, edges, focusId } = networkGraphFixtures['Hub and spokes']
    const from = (id: string) => edges.filter((e) => e.source === id).length
    expect(from('hub-01')).toBe(24)
    const spokes = nodes.filter((n) => n.id.startsWith('spoke'))
    expect(spokes.every((n) => from(n.id) <= 2)).toBe(true)
    expect(nodes).toHaveLength(25 + edges.length - 24)
    expect(focusId).toBe('hub-01')
  })

  it('Directed chain points 6 nodes along a line with the focus on the third', () => {
    const { nodes, edges, focusId } = networkGraphFixtures['Directed chain']
    expect(nodes).toHaveLength(6)
    expect(edges.map((e) => `${e.source}>${e.target}`)).toHaveLength(5)
    expect(focusId).toBe('alpha-03')
  })

  it('One group holds 10 nodes in one group; Many groups holds 14 groups of 1 to 3', () => {
    const one = networkGraphFixtures['One group'].nodes
    expect([one.length, new Set(one.map((n) => n.group)).size]).toEqual([10, 1])
    const many = networkGraphFixtures['Many groups'].nodes
    const sizes = [...new Set(many.map((n) => n.group))].map(
      (g) => many.filter((n) => n.group === g).length
    )
    expect(sizes).toHaveLength(14)
    expect(sizes.every((size) => size >= 1 && size <= 3)).toBe(true)
  })

  it('Large gives every node the group of its root, five groups in all', () => {
    const groups = new Set(largeFixture.nodes.map((n) => n.group))
    expect(groups.size).toBe(5)
    expect(groups.has(undefined)).toBe(false)
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
