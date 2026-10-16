import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { spliceComponents } from './arch-graph-add.mjs'

const node = (name, extra = {}) => ({
  name,
  file: `packages/ui/src/components/ui/${name}.tsx`,
  exports: [name, `${name}Props`],
  libDependents: 0,
  xproj: { mobile: 0, total: 0 },
  dependsOn: [],
  leak: { rawView: 0, loc: 40, score: 0 },
  verdict: 'keep-core',
  deadByAssociation: false,
  audited: 'unaudited',
  ...extra,
})

const graphOf = (components) => ({
  schema: 2,
  components,
  summary: { extractionTop: ['untouched'] },
})

const committed = JSON.stringify(graphOf([node('Alpha'), node('Gamma')]), null, 2)

describe('spliceComponents', () => {
  it('inserts a new node in name order and keeps the other nodes byte for byte', () => {
    // Fresh metrics for Alpha differ, as they would after a full reindex.
    const fresh = graphOf([
      node('Alpha', { libDependents: 9 }),
      node('Beta', { verdict: 'dead', dependsOn: ['Alpha'] }),
      node('Gamma'),
    ])

    const out = JSON.parse(spliceComponents(committed, fresh, [node('Beta').file]))

    expect(out.components.map((c) => c.name)).toEqual(['Alpha', 'Beta', 'Gamma'])
    expect(out.components[0].libDependents).toBe(0)
    expect(out.components[1].dependsOn).toEqual(['Alpha'])
    expect(out.summary).toEqual({ extractionTop: ['untouched'] })
  })

  it('replaces an existing node in place', () => {
    const fresh = graphOf([node('Alpha'), node('Gamma', { dependsOn: ['Delta'] })])

    const out = JSON.parse(spliceComponents(committed, fresh, [node('Gamma').file]))

    expect(out.components.map((c) => c.name)).toEqual(['Alpha', 'Gamma'])
    expect(out.components[1].dependsOn).toEqual(['Delta'])
  })

  it('leaves the text unchanged when the fresh node matches the committed one', () => {
    expect(spliceComponents(committed, JSON.parse(committed), [node('Alpha').file])).toBe(committed)
  })

  it('refuses a file the fresh graph has no node for', () => {
    expect(() => spliceComponents(committed, JSON.parse(committed), ['nope.tsx'])).toThrow(
      /nope\.tsx is not a component file/
    )
  })
})

describe('two PRs that each splice a new node', () => {
  const GRAPH = 'arch-graph.json'
  const base = graphOf(['Alpha', 'Charlie', 'Echo', 'Golf'].map((name) => node(name)))
  let root
  const git = (...args) => execFileSync('git', ['-C', root, ...args], { encoding: 'utf8' })
  const commit = (message) =>
    git('-c', 'user.name=t', '-c', 'user.email=t@example.com', 'commit', '-qam', message)

  function branchAdding(name) {
    git('checkout', '-q', '-b', `add-${name}`, 'main')
    const fresh = graphOf([...base.components, node(name, { dependsOn: ['Alpha'] })])
    writeFileSync(
      join(root, GRAPH),
      spliceComponents(JSON.stringify(base, null, 2), fresh, [node(name).file])
    )
    commit(name)
  }

  beforeAll(() => {
    root = mkdtempSync(join(tmpdir(), 'arch-graph-merge-'))
    git('init', '-q', '-b', 'main')
    writeFileSync(join(root, GRAPH), JSON.stringify(base, null, 2))
    git('add', GRAPH)
    commit('base')
    // Only Charlie separates the two insertion points: the tightest case one file allows.
    branchAdding('Bravo')
    branchAdding('Delta')
  })

  afterAll(() => rmSync(root, { recursive: true, force: true }))

  it.each([
    ['add-Bravo', 'add-Delta'],
    ['add-Delta', 'add-Bravo'],
  ])('merge without a conflict when %s lands first', (first, second) => {
    const tree = git('merge-tree', '--write-tree', first, second).trim()
    const merged = JSON.parse(git('show', `${tree}:${GRAPH}`))

    expect(merged.components.map((c) => c.name)).toEqual([
      'Alpha',
      'Bravo',
      'Charlie',
      'Delta',
      'Echo',
      'Golf',
    ])
  })
})
