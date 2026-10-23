import { describe, expect, it } from 'vitest'
import { architectureFixture, architectureLayout, egoLayout, TIERS } from './fixtures'
import {
  cleanDependencies,
  dependencyEdgeId,
  egoSubgraph,
  muteOutsideFocus,
  neighbourhood,
  toNetworkGraph,
} from './dependency-graph-model'

const ids = (nodes: readonly { id: string }[]) => nodes.map((node) => node.id)
const input = (nodes: readonly { id: string; label: string }[]) => ({
  nodes,
  edges: [],
  width: 800,
  height: 600,
})

describe('cleanDependencies', () => {
  it('keeps the first of a repeated id and drops self, unknown and repeated edges', () => {
    const data = {
      nodes: [
        { id: 'a', label: 'A', tier: 't' },
        { id: 'b', label: 'B', tier: 't' },
        { id: 'a', label: 'again', tier: 't' },
      ],
      edges: [
        { source: 'a', target: 'b' },
        { source: 'a', target: 'b' },
        { source: 'a', target: 'a' },
        { source: 'a', target: 'ghost' },
      ],
    }

    const clean = cleanDependencies(data)

    expect(clean.nodes.map((n) => n.label)).toEqual(['A', 'B'])
    expect(clean.edges).toEqual([{ source: 'a', target: 'b' }])
  })
})

describe('neighbourhood', () => {
  it('lists direct dependencies and direct dependents only', () => {
    const { dependsOn, usedBy } = neighbourhood(architectureFixture, 'api')

    expect(ids(dependsOn)).toEqual(['schema', 'logger', 'config'])
    expect(ids(usedBy)).toEqual(['console', 'mobile', 'studio'])
  })

  it('is empty for a node with no edges and for an unknown id', () => {
    const lone = neighbourhood({ nodes: [{ id: 'x', label: 'X', tier: 't' }], edges: [] }, 'x')

    expect(lone).toEqual({ dependsOn: [], usedBy: [] })
    expect(neighbourhood(architectureFixture, 'ghost')).toEqual({ dependsOn: [], usedBy: [] })
  })
})

describe('egoSubgraph', () => {
  it('holds exactly the focus, its dependencies and its dependents, never a second hop', () => {
    const ego = egoSubgraph(architectureFixture, 'api')

    expect(new Set(ids(ego.nodes))).toEqual(
      new Set(['api', 'schema', 'logger', 'config', 'console', 'mobile', 'studio'])
    )
    expect(ids(ego.nodes)).not.toContain('kernel')
  })

  it('keeps only the edges that touch the focus', () => {
    const ego = egoSubgraph(architectureFixture, 'api')

    expect(ego.edges.every((e) => e.source === 'api' || e.target === 'api')).toBe(true)
    expect(ego.edges).toHaveLength(6)
  })

  it('is empty for an unknown focus', () => {
    expect(egoSubgraph(architectureFixture, 'ghost')).toEqual({ nodes: [], edges: [] })
  })
})

describe('toNetworkGraph', () => {
  it('turns every dependency into an edge keyed for its route', () => {
    const network = toNetworkGraph({
      ...architectureFixture,
      tiers: TIERS,
      layout: architectureLayout,
    })

    expect(network.edges).toHaveLength(architectureFixture.edges.length)
    expect(network.edges[0]).toEqual({ id: 'console->api', source: 'console', target: 'api' })
    expect(dependencyEdgeId('console', 'api')).toBe('console->api')
  })

  it('colours each node by its tier and lists the tiers as kinds', () => {
    const network = toNetworkGraph({
      ...architectureFixture,
      tiers: TIERS,
      layout: architectureLayout,
    })

    expect(network.nodes.find((n) => n.id === 'kernel')?.kind).toBe('core')
    expect(network.nodeKinds).toEqual([
      { id: 'app', label: 'Apps' },
      { id: 'service', label: 'Services' },
      { id: 'core', label: 'Core' },
    ])
  })

  it('places every node inside its own tier box, on routed edges', () => {
    const network = toNetworkGraph({
      ...architectureFixture,
      tiers: TIERS,
      layout: architectureLayout,
    })

    const result = network.layout.compute(input(network.nodes))

    expect(result.edgeShape).toBe('routed')
    expect(result.nodeShape).toBe('box')
    for (const tier of TIERS) {
      const group = result.groups?.find((g) => g.id === `tier:${tier.id}`)
      const members = architectureFixture.nodes.filter((n) => n.tier === tier.id)
      expect(group?.label).toBe(tier.label)
      expect(new Set(group?.nodeIds)).toEqual(new Set(ids(members)))
    }
  })

  it('passes each route through to its edge', () => {
    const network = toNetworkGraph({
      ...architectureFixture,
      tiers: TIERS,
      layout: architectureLayout,
    })

    const result = network.layout.compute(input(network.nodes))

    expect(result.routes?.['api->schema']).toEqual(architectureLayout.routes?.['api->schema'])
  })

  it('draws no box for a tier without a drawn node', () => {
    const ego = egoSubgraph(architectureFixture, 'billing')

    const network = toNetworkGraph({ ...ego, tiers: TIERS, layout: architectureLayout })
    const groups = network.layout.compute(input(network.nodes)).groups ?? []

    expect(new Set(groups.map((g) => g.id))).toEqual(new Set(['tier:service', 'tier:core']))
  })

  it('leaves a node out when the layout gives it no box', () => {
    const network = toNetworkGraph({ ...architectureFixture, tiers: TIERS, layout: egoLayout })

    const result = network.layout.compute(input(network.nodes))

    expect(result.order).not.toContain('kernel')
    expect(result.order).toContain('api')
  })
})

describe('muteOutsideFocus', () => {
  const network = toNetworkGraph({
    ...architectureFixture,
    tiers: TIERS,
    layout: architectureLayout,
  })
  const mutedIds = (items: readonly { id?: string; isMuted?: boolean }[]) =>
    items.filter((item) => item.isMuted).map((item) => item.id)

  it('mutes every node and edge outside the focus and its direct neighbours', () => {
    const lit = muteOutsideFocus(network, 'auth')

    expect(mutedIds(lit.nodes)).toEqual(['docs', 'studio', 'api', 'search', 'schema', 'kernel'])
    expect(lit.edges.filter((e) => !e.isMuted).map((e) => e.id)).toEqual([
      'console->auth',
      'mobile->auth',
      'auth->config',
      'auth->logger',
      'billing->auth',
    ])
  })

  it('mutes nothing without a focus', () => {
    const lit = muteOutsideFocus(network, null)

    expect(mutedIds(lit.nodes)).toEqual([])
    expect(mutedIds(lit.edges)).toEqual([])
  })
})
