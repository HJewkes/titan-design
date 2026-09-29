import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  compareToBaseline,
  describeGap,
  detectGaps,
  findUnits,
  mergeBaseline,
  readComponentTree,
  // @ts-expect-error — plain-ESM build tooling, shared with scripts/update-component-anatomy-baseline.mjs
} from '../../scripts/component-anatomy.mjs'
import baseline from './component-anatomy-baseline.json'

type Tree = Record<string, string>
type Gaps = Record<string, string[]>

const PKG_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

const PASSING_STORY = "const meta = { tags: ['autodocs', 'status:candidate', '!status:review'] }"
const PASSING_TEST =
  "it('is accessible', async () => { expect(await axe(container)).toHaveNoViolations() })"

function familyTree(extra: Tree = {}): Tree {
  return {
    'custom/Fam/index.ts': "export { Foo, type FooProps } from './Foo'\n",
    'custom/Fam/README.md': '# Fam',
    'custom/Fam/Foo.tsx': 'export const Foo = () => null',
    'custom/Fam/Foo.stories.tsx': PASSING_STORY,
    'custom/Fam/Foo.test.tsx': PASSING_TEST,
    ...extra,
  }
}

function uiTree(readme: string): Tree {
  return {
    'ui/README.md': readme,
    'ui/widget/index.ts': "export * from './Widget'",
    'ui/widget/Widget.tsx': 'export const Widget = () => null',
    'ui/widget/Widget.stories.tsx': PASSING_STORY,
    'ui/widget/Widget.test.tsx': PASSING_TEST,
  }
}

const gapsOf = (tree: Tree, unit: string): string[] => (detectGaps(tree) as Gaps)[unit] ?? []

describe('component anatomy ratchet', () => {
  const live = detectGaps(readComponentTree(PKG_ROOT)) as Gaps
  const { added, stale } = compareToBaseline(live, baseline) as { added: string[]; stale: string[] }

  it('finds no anatomy gap that the baseline does not list', () => {
    expect(added, added.map((key) => describeGap(key, 'added')).join('\n')).toEqual([])
  })

  it('lists no gap in the baseline that has since closed', () => {
    expect(stale, stale.map((key) => describeGap(key, 'stale')).join('\n')).toEqual([])
  })
})

describe('component anatomy detector', () => {
  it('flags a new exported stem without a story, naming it and the fix', () => {
    const before = familyTree()
    const after = familyTree({
      'custom/Fam/index.ts': "export { Foo } from './Foo'\nexport { Bar } from './Bar'\n",
      'custom/Fam/Bar.tsx': 'export const Bar = () => null',
    })

    const { added } = compareToBaseline(detectGaps(after), detectGaps(before))

    expect(added).toContain('custom/Fam/Bar#story')
    const message = describeGap('custom/Fam/Bar#story', 'added')
    expect(message).toContain('custom/Fam/Bar')
    expect(message).toContain('Bar.stories.tsx')
    expect(message).toContain('update-component-anatomy-baseline.mjs')
  })

  it('reports a baseline entry whose gap has closed as stale', () => {
    const { added, stale } = compareToBaseline(detectGaps(familyTree()), {
      'custom/Fam/Foo': ['story'],
    })

    expect(added).toEqual([])
    expect(stale).toEqual(['custom/Fam/Foo#story'])
    expect(describeGap(stale[0], 'stale')).toContain('update-component-anatomy-baseline.mjs')
  })

  it('treats a test that imports axe without asserting on it as an a11y gap', () => {
    const tree = familyTree({
      'custom/Fam/Foo.test.tsx': "import { axe } from 'jest-axe'\nit('renders', () => {})",
    })

    expect(gapsOf(tree, 'custom/Fam/Foo')).toEqual(['a11y'])
  })

  it('accepts only an explicit stable or candidate status that negates the default', () => {
    const withTags = (tags: string) =>
      familyTree({ 'custom/Fam/Foo.stories.tsx': `const meta = { tags: [${tags}] }` })

    expect(gapsOf(withTags("'autodocs'"), 'custom/Fam/Foo')).toEqual(['status'])
    expect(gapsOf(withTags("'status:review'"), 'custom/Fam/Foo')).toEqual(['status'])
    expect(gapsOf(withTags("'status:candidate'"), 'custom/Fam/Foo')).toEqual(['status'])
    expect(gapsOf(withTags("'status:candidate', '!status:review'"), 'custom/Fam/Foo')).toEqual([])
    expect(gapsOf(withTags("'status:stable', '!status:review'"), 'custom/Fam/Foo')).toEqual([])
  })

  it('counts a ui README row as doc but not a mention of the dir in prose', () => {
    const prose = uiTree('The `widget` primitive draws a widget.\n')
    const row = uiTree('| Component | Tier |\n| --- | --- |\n| `widget` | atom |\n')

    expect(gapsOf(prose, 'ui/widget')).toEqual(['doc'])
    expect(gapsOf(row, 'ui/widget')).toEqual([])
  })

  it('does not treat a stem the barrel never exports as a unit', () => {
    const tree = familyTree({ 'custom/Fam/FooPart.tsx': 'export const FooPart = () => null' })

    const units = (findUnits(tree) as { path: string }[]).map((unit) => unit.path)

    expect(units).toEqual(['custom/Fam/Foo'])
  })

  it('finds the real component library, not an empty glob', () => {
    const units = (findUnits(readComponentTree(PKG_ROOT)) as { path: string }[]).map((u) => u.path)

    expect(units.length).toBeGreaterThanOrEqual(150)
    expect(units).toContain('ui/button')
  })

  it('refuses to add a gap to the baseline unless the increase is allowed', () => {
    const live = { 'custom/Fam/Foo': ['story'], 'custom/Fam/Bar': ['a11y'] }
    const previous = { 'custom/Fam/Foo': ['story'] }

    const refused = mergeBaseline(previous, live)
    const allowed = mergeBaseline(previous, live, { allowIncrease: true })

    expect(refused).toMatchObject({ ok: false, added: ['custom/Fam/Bar#a11y'], baseline: previous })
    expect(allowed).toMatchObject({ ok: true, baseline: live })
    expect(mergeBaseline(live, previous)).toMatchObject({ ok: true, baseline: previous })
  })
})
