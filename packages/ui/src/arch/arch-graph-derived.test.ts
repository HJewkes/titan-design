// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { archGraph, deriveCounts, deriveEdges } from './arch-graph-derived'

type Component = Parameters<typeof deriveEdges>[0][number]

const component = (name: string, extra: Partial<Component> = {}): Component => ({
  ...archGraph.components[0],
  name,
  dependsOn: [],
  verdict: 'keep-core',
  deadByAssociation: false,
  audited: 'unaudited',
  ...extra,
})

describe('arch-graph derived figures', () => {
  it('draws one edge per dependency, once even when two nodes share a name', () => {
    const icons = component('icons', { dependsOn: ['Icon'] })

    const edges = deriveEdges([component('Card', { dependsOn: ['Icon', 'Text'] }), icons, icons])

    expect(edges).toEqual([
      ['Card', 'Icon'],
      ['Card', 'Text'],
      ['icons', 'Icon'],
    ])
  })

  it('counts the dead, the dead by association and the audited from the nodes', () => {
    const counts = deriveCounts([
      component('Zed', { verdict: 'dead' }),
      component('Alp', { verdict: 'dead', deadByAssociation: true }),
      component('Mid', { audited: 'audited' }),
    ])

    expect(counts).toEqual({
      total: 3,
      dead: ['Alp', 'Zed'],
      deadByAssociation: ['Alp'],
      auditedCount: 1,
    })
  })

  it('keeps the stored whole-library summary alongside the derived counts', () => {
    expect(archGraph.summary.total).toBe(archGraph.components.length)
    expect(archGraph.summary.consumers.length).toBeGreaterThan(0)
  })
})
