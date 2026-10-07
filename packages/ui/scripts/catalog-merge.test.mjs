import { execFileSync } from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { CATALOG, DIGEST, buildCatalog, serializeCatalog } from './catalog.mjs'
import { renderDigest } from './catalog/digest.mjs'
import { foldFragments, parseFragment } from './changelog-compile.mjs'

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
const GRAPH = 'packages/ui/src/arch/arch-graph.json'
const TSCONFIG = 'packages/ui/tsconfig.json'
const CHANGELOG = 'packages/ui/CHANGELOG.md'
const DIR = 'packages/ui/src/components/ui/widgets'
const BASE_COMPONENTS = ['Alpha', 'Charlie', 'Echo', 'Golf']
// Each regeneration runs docgen; CI under coverage is several times slower than a laptop.
const DOCGEN_TIMEOUT = 60_000

let root
const git = (...args) => execFileSync('git', ['-C', root, ...args], { encoding: 'utf8' })
const write = (rel, text) => {
  mkdirSync(dirname(join(root, rel)), { recursive: true })
  writeFileSync(join(root, rel), text)
}
const read = (rel) => readFileSync(join(root, rel), 'utf8')

const graphComponent = (name) => ({
  name,
  file: `${DIR}/${name}.tsx`,
  family: 'ui/widgets',
  tier: 'atom',
  exports: [name],
  dependsOn: [],
})

function writeStory(name) {
  write(
    `${DIR}/${name}.stories.tsx`,
    `const meta = { title: 'Components/Atoms/${name}', component: ${name}, tags: ['autodocs'] }\n` +
      `export default meta\nexport const Default = {}\n`
  )
}

function writeComponent(name) {
  write(
    `${DIR}/${name}.tsx`,
    `/** ${name} widget. */\nexport function ${name}({ label }: { label: string }) {\n  return label\n}\n`
  )
}

/** The real generator over the working tree, written to the catalog and digest paths. */
function regenerate() {
  const serialized = serializeCatalog(buildCatalog(root))
  write(CATALOG, serialized)
  write(DIGEST, renderDigest(JSON.parse(serialized)))
}

function addComponent(name) {
  const graph = JSON.parse(read(GRAPH))
  graph.components = [...graph.components, graphComponent(name)].sort((a, b) =>
    a.file < b.file ? -1 : 1
  )
  write(GRAPH, `${JSON.stringify(graph, null, 2)}\n`)
  writeComponent(name)
  writeStory(name)
  regenerate()
}

function addFragment(id, text) {
  write(`packages/ui/changelog.d/${id}.md`, `---\nsection: Added\n---\n${text}\n`)
}

function branchFrom(base, name, change) {
  git('checkout', '-q', '-b', name, base)
  change()
  git('add', '-A')
  git('-c', 'user.name=t', '-c', 'user.email=t@example.com', 'commit', '-q', '-m', name)
}

function mergeInto(target, other) {
  git('checkout', '-q', '-B', `merge-${target}`, target)
  try {
    git('-c', 'user.name=t', '-c', 'user.email=t@example.com', 'merge', '--no-edit', other)
    return true
  } catch {
    git('merge', '--abort')
    return false
  }
}

beforeAll(() => {
  root = mkdtempSync(join(tmpdir(), 'catalog-merge-'))
  git('init', '-q', '-b', 'base')
  cpSync(join(REPO_ROOT, 'packages/ui/MATURITY.md'), join(root, 'packages/ui/MATURITY.md'))
  cpSync(
    join(REPO_ROOT, 'packages/ui/.storybook/preview.tsx'),
    join(root, 'packages/ui/.storybook/preview.tsx'),
    { recursive: true }
  )
  write(
    TSCONFIG,
    `${JSON.stringify({ compilerOptions: { strict: true, noLib: true } }, null, 2)}\n`
  )
  write(GRAPH, `${JSON.stringify({ components: [] }, null, 2)}\n`)
  for (const name of BASE_COMPONENTS) addComponent(name)
  write(CHANGELOG, '# Changelog\n\n## [Unreleased]\n\n### Added\n\n- shipped earlier\n')
  git('add', '-A')
  git('-c', 'user.name=t', '-c', 'user.email=t@example.com', 'commit', '-q', '-m', 'base')
  branchFrom('base', 'pr-bravo', () => {
    addComponent('Bravo')
    addFragment('TD-1-bravo', 'Bravo widget (TD-1).')
  })
  branchFrom('base', 'pr-foxtrot', () => {
    addComponent('Foxtrot')
    addFragment('TD-2-foxtrot', 'Foxtrot widget (TD-2).')
  })
}, DOCGEN_TIMEOUT)

afterAll(() => rmSync(root, { recursive: true, force: true }))

describe('two PRs that each add a component and a changelog entry', () => {
  it.each([
    ['pr-bravo', 'pr-foxtrot'],
    ['pr-foxtrot', 'pr-bravo'],
  ])(
    'merge with no conflict when %s lands before %s',
    (first, second) => {
      expect(mergeInto(first, second)).toBe(true)

      const merged = JSON.parse(read(CATALOG))
      expect(merged.entries.map((entry) => entry.name)).toEqual([
        'Alpha',
        'Bravo',
        'Charlie',
        'Echo',
        'Foxtrot',
        'Golf',
      ])
      expect(merged.entries.find((entry) => entry.name === 'Foxtrot').purpose).toBe(
        'Foxtrot widget.'
      )
      expect(read(CATALOG)).toBe(serializeCatalog(buildCatalog(root)))
      expect(read(DIGEST)).toBe(renderDigest(merged))
    },
    DOCGEN_TIMEOUT
  )

  it('fold both fragments into the changelog after the merge', () => {
    mergeInto('pr-bravo', 'pr-foxtrot')
    const fragments = ['TD-1-bravo', 'TD-2-foxtrot'].map((id) =>
      parseFragment(id, read(`packages/ui/changelog.d/${id}.md`))
    )
    const out = foldFragments(read(CHANGELOG), fragments)
    expect(out).toContain('- Bravo widget (TD-1).\n- Foxtrot widget (TD-2).\n- shipped earlier')
  })
})
