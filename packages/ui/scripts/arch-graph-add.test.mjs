import { describe, expect, it } from 'vitest'

import { spliceComponents } from './arch-graph-add.mjs'

const node = (name, extra = {}) => ({
  name,
  file: `packages/ui/src/components/ui/${name}.tsx`,
  libDependents: 0,
  verdict: 'keep-core',
  deadByAssociation: false,
  audited: 'unaudited',
  ...extra,
})

const graphOf = (components, edges, summary = {}) => ({
  schema: 1,
  componentBarrelHash: 'sha256:old',
  components,
  edges,
  summary: {
    total: components.length,
    dead: [],
    deadByAssociation: [],
    auditedCount: 0,
    extractionTop: ['untouched'],
    ...summary,
  },
})

const committed = JSON.stringify(
  graphOf([node('Alpha'), node('Gamma')], [['Gamma', 'Alpha']]),
  null,
  2
)

describe('spliceComponents', () => {
  it('inserts a new node in name order and keeps the other nodes byte for byte', () => {
    // Fresh metrics for Alpha differ, as they would after a full reindex.
    const fresh = graphOf(
      [node('Alpha', { libDependents: 9 }), node('Beta', { verdict: 'dead' }), node('Gamma')],
      [
        ['Beta', 'Alpha'],
        ['Gamma', 'Alpha'],
        ['Gamma', 'Beta'],
      ]
    )
    fresh.componentBarrelHash = 'sha256:new'

    const out = JSON.parse(spliceComponents(committed, fresh, [node('Beta').file]))

    expect(out.components.map((c) => c.name)).toEqual(['Alpha', 'Beta', 'Gamma'])
    expect(out.components[0].libDependents).toBe(0)
    expect(out.edges).toEqual([
      ['Gamma', 'Alpha'],
      ['Beta', 'Alpha'],
    ])
    expect(out.summary).toMatchObject({ total: 3, dead: ['Beta'], extractionTop: ['untouched'] })
    expect(out.componentBarrelHash).toBe('sha256:new')
  })

  it('replaces an existing node and its outgoing edges only', () => {
    const fresh = graphOf(
      [node('Alpha'), node('Gamma', { audited: 'audited' })],
      [['Gamma', 'Delta']]
    )

    const out = JSON.parse(spliceComponents(committed, fresh, [node('Gamma').file]))

    expect(out.components.map((c) => c.name)).toEqual(['Alpha', 'Gamma'])
    expect(out.edges).toEqual([['Gamma', 'Delta']])
    expect(out.summary).toMatchObject({ total: 2, auditedCount: 1 })
  })

  it('leaves the text unchanged when the fresh node matches the committed one', () => {
    const fresh = JSON.parse(committed)
    fresh.componentBarrelHash = 'sha256:old'

    expect(spliceComponents(committed, fresh, [node('Alpha').file])).toBe(committed)
  })

  it('refuses a file the fresh graph has no node for', () => {
    expect(() => spliceComponents(committed, JSON.parse(committed), ['nope.tsx'])).toThrow(
      /nope\.tsx is not a component file/
    )
  })
})
