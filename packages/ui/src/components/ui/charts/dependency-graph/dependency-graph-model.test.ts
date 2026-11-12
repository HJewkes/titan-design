import { describe, expect, it } from 'vitest'
import { architectureFixture, architectureLayout, egoLayout, TIERS } from './fixtures'
import {
  cleanDependencies,
  dependencyEdgeId,
  egoSubgraph,
  LIT_MARK,
  LIT_PREFIX,
  lightFocus,
  REST_MARK,
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
    expect(network.edges[0]).toEqual({
      id: 'console->api',
      source: 'console',
      target: 'api',
      kind: 'dependency',
    })
    expect(dependencyEdgeId('console', 'api')).toBe('console->api')
  })

  it('gives each node its tier as kind and lists each tier at rest and lit', () => {
    const network = toNetworkGraph({
      ...architectureFixture,
      tiers: TIERS,
      layout: architectureLayout,
    })

    expect(network.nodes.find((n) => n.id === 'kernel')?.kind).toBe('core')
    expect(network.nodeKinds.map((k) => `${k.id}=${k.label}`)).toEqual([
      'app=Apps',
      'lit:app=Apps',
      'service=Services',
      'lit:service=Services',
      'core=Core',
      'lit:core=Core',
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

describe('lightFocus', () => {
  const network = toNetworkGraph({
    ...architectureFixture,
    tiers: TIERS,
    layout: architectureLayout,
  })
  const litIds = (items: readonly { id?: string; kind?: string }[]) =>
    items.filter((item) => item.kind?.startsWith(LIT_PREFIX)).map((item) => item.id)

  it('lights the focus, its direct neighbours and the edges between them, and nothing else', () => {
    const lit = lightFocus(network, 'auth')

    expect(litIds(lit.nodes)).toEqual(['console', 'mobile', 'auth', 'billing', 'logger', 'config'])
    expect(litIds(lit.edges)).toEqual([
      'console->auth',
      'mobile->auth',
      'auth->config',
      'auth->logger',
      'billing->auth',
    ])
  })

  it('keeps a lit node in its tier, under the same label', () => {
    const lit = lightFocus(network, 'auth')
    const kind = lit.nodes.find((n) => n.id === 'logger')?.kind
    const label = (id: string | undefined) => network.nodeKinds.find((k) => k.id === id)?.label

    expect(kind).toBe('lit:core')
    expect(label(kind)).toBe('Core')
  })

  it('lights nothing without a focus', () => {
    const lit = lightFocus(network, null)

    expect(litIds(lit.nodes)).toEqual([])
    expect(litIds(lit.edges)).toEqual([])
  })
})

describe('mark colours', () => {
  const network = toNetworkGraph({
    ...architectureFixture,
    tiers: TIERS,
    layout: architectureLayout,
  })

  it('paints every mark at rest in REST_MARK and every lit kind in LIT_MARK', () => {
    const kinds = [...network.nodeKinds, ...network.edgeKinds]

    expect(
      kinds.filter((k) => !k.id.startsWith(LIT_PREFIX)).every((k) => k.color === REST_MARK)
    ).toBe(true)
    expect(
      kinds.filter((k) => k.id.startsWith(LIT_PREFIX)).every((k) => k.color === LIT_MARK)
    ).toBe(true)
  })

  it('outlines every tier box in REST_MARK', () => {
    const groups = network.layout.compute(input(network.nodes)).groups ?? []

    expect(groups.map((g) => g.stroke)).toEqual([REST_MARK, REST_MARK, REST_MARK])
  })
})
