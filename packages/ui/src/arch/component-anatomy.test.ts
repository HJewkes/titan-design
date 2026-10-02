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

  it('makes a nested ui dir that holds a component its own unit', () => {
    const tree = { 'ui/charts/foo/Foo.tsx': 'export const Foo = () => null' }

    const units = (findUnits(tree) as { path: string }[]).map((unit) => unit.path)

    expect(units).toEqual(['ui/charts/foo'])
  })

  it('does not treat a ui grouping dir with only subdirs as a unit', () => {
    const tree = {
      'ui/charts/README.md': '# Charts',
      'ui/charts/kit/scale.ts': 'export const scale = 1',
      'ui/charts/foo/Foo.tsx': 'export const Foo = () => null',
    }

    const units = (findUnits(tree) as { path: string }[]).map((unit) => unit.path)

    expect(units).not.toContain('ui/charts')
    expect(units).not.toContain('ui/charts/kit')
  })

  it('does not treat a ui dir of only fixtures and notes as a unit yet', () => {
    const tree = {
      'ui/charts/matrix/fixtures.ts': 'export const rows = []',
      'ui/charts/matrix/fixtures.test.ts': "it('has rows', () => {})",
      'ui/charts/matrix/NOTE.md': '# Note',
    }

    expect(findUnits(tree)).toEqual([])
  })

  it('does not treat a ui dir that holds only stories and tests as a unit', () => {
    const tree = {
      'ui/ghost/Ghost.stories.tsx': PASSING_STORY,
      'ui/ghost/Ghost.test.tsx': PASSING_TEST,
    }

    expect(findUnits(tree)).toEqual([])
  })

  it('does not treat a component file directly under ui as a unit', () => {
    const tree = { 'ui/Loose.tsx': 'export const Loose = () => null' }

    expect(findUnits(tree)).toEqual([])
  })

  it('fails status when a variant story is explicit but the main story inherits the default', () => {
    const tree = {
      ...uiTree('| `widget` | atom |\n'),
      'ui/widget/Widget.stories.tsx': "const meta = { tags: ['autodocs'] }",
      'ui/widget/Widget.variant.stories.tsx': PASSING_STORY,
    }

    expect(gapsOf(tree, 'ui/widget')).toEqual(['status'])
  })

  it('skips a !dev story file when checking status', () => {
    const tree = {
      ...uiTree('| `widget` | atom |\n'),
      'ui/widget/Widget.interaction.stories.tsx': "const meta = { tags: ['!dev', '!autodocs'] }",
    }

    expect(gapsOf(tree, 'ui/widget')).toEqual([])
  })

  it('fails status when every story file is !dev', () => {
    const tree = {
      ...uiTree('| `widget` | atom |\n'),
      'ui/widget/Widget.stories.tsx': "const meta = { tags: ['!dev'] }",
    }

    expect(gapsOf(tree, 'ui/widget')).toEqual(['status'])
  })

  it('treats an exported part that its parent story references as part of that parent', () => {
    const tree = familyTree({
      'custom/Fam/index.ts': "export { Foo, FooCell } from './Foo'\n",
      'custom/Fam/FooCell.tsx': 'export const FooCell = () => null',
      'custom/Fam/Foo.stories.tsx': `${PASSING_STORY}\n// renders FooCell`,
    })

    const units = (findUnits(tree) as { path: string }[]).map((unit) => unit.path)

    expect(units).toEqual(['custom/Fam/Foo'])
  })

  it('keeps a new component as a unit when the only prefix match is an exported type', () => {
    const tree = familyTree({
      'custom/Fam/index.ts':
        "export { Foo, MesoTimeline } from './Foo'\nexport type Meso = string\n",
      'custom/Fam/MesoTimeline.tsx': 'export const MesoTimeline = () => null',
    })

    expect(gapsOf(tree, 'custom/Fam/MesoTimeline')).toContain('story')
  })

  it('keeps a stem that continues the parent name without a word boundary as a unit', () => {
    const tree = familyTree({
      'custom/Fam/index.ts': "export { Foo, Foonly } from './Foo'\n",
      'custom/Fam/Foonly.tsx': 'export const Foonly = () => null',
      'custom/Fam/Foo.stories.tsx': `${PASSING_STORY}\n// Foonly`,
    })

    expect(gapsOf(tree, 'custom/Fam/Foonly')).toContain('story')
  })

  it('keeps an exported part as a unit when its parent never references it', () => {
    const tree = familyTree({
      'custom/Fam/index.ts': "export { Foo, FooCell } from './Foo'\n",
      'custom/Fam/FooCell.tsx': 'export const FooCell = () => null',
    })

    expect(gapsOf(tree, 'custom/Fam/FooCell')).toContain('story')
  })

  it('keeps a part that has its own story as a unit', () => {
    const tree = familyTree({
      'custom/Fam/index.ts': "export { Foo, FooCell } from './Foo'\n",
      'custom/Fam/FooCell.tsx': 'export const FooCell = () => null',
      'custom/Fam/Foo.stories.tsx': `${PASSING_STORY}\n// FooCell`,
      'custom/Fam/FooCell.stories.tsx': PASSING_STORY,
    })

    const units = (findUnits(tree) as { path: string }[]).map((unit) => unit.path)

    expect(units).toEqual(['custom/Fam/Foo', 'custom/Fam/FooCell'])
  })

  it('keeps an exported stem that only ends with another stem name as a unit', () => {
    const tree = familyTree({
      'custom/Fam/index.ts': "export { Foo, BarFoo } from './Foo'\n",
      'custom/Fam/BarFoo.tsx': 'export const BarFoo = () => null',
    })

    const units = (findUnits(tree) as { path: string }[]).map((unit) => unit.path)

    expect(units).toEqual(['custom/Fam/BarFoo', 'custom/Fam/Foo'])
  })

  it('reads the status from the meta tags, not from a commented-out tags line', () => {
    const tree = familyTree({
      'custom/Fam/Foo.stories.tsx':
        "// tags: ['status:candidate', '!status:review']\nconst meta = { tags: ['autodocs'] }",
    })

    expect(gapsOf(tree, 'custom/Fam/Foo')).toEqual(['status'])
  })

  it('ignores an axe assertion inside xit and it.skip.each', () => {
    const body = 'async () => { expect(await axe(container)).toHaveNoViolations() }'
    const skipped = ["xit('a', " + body + ')', "it.skip.each([1])('a', " + body + ')']

    for (const source of skipped) {
      const tree = familyTree({ 'custom/Fam/Foo.test.tsx': source })
      expect(gapsOf(tree, 'custom/Fam/Foo')).toEqual(['a11y'])
    }
  })

  it('ignores an axe assertion that sits in a comment', () => {
    const tree = familyTree({
      'custom/Fam/Foo.test.tsx':
        "// expect(await axe(container)).toHaveNoViolations()\n/* await axe(c); .toHaveNoViolations() */\nit('renders', () => {})",
    })

    expect(gapsOf(tree, 'custom/Fam/Foo')).toEqual(['a11y'])
  })

  it('ignores an axe assertion inside a skipped test', () => {
    const tree = familyTree({
      'custom/Fam/Foo.test.tsx':
        "it.skip('is accessible', async () => { expect(await axe(container)).toHaveNoViolations() })",
    })

    expect(gapsOf(tree, 'custom/Fam/Foo')).toEqual(['a11y'])
  })

  it('still counts a live axe test that follows a skipped one', () => {
    const tree = familyTree({
      'custom/Fam/Foo.test.tsx': `it.skip('old', () => { noop() })\n${PASSING_TEST}`,
    })

    expect(gapsOf(tree, 'custom/Fam/Foo')).toEqual([])
  })

  it('lists added and stale keys in sorted order', () => {
    const { added, stale } = compareToBaseline(
      { 'b/two': ['story', 'a11y'], 'a/one': ['test'] },
      { 'z/old': ['story'], 'y/old': ['doc'] }
    )

    expect(added).toEqual(['a/one#test', 'b/two#a11y', 'b/two#story'])
    expect(stale).toEqual(['y/old#doc', 'z/old#story'])
  })

  it('writes the merged baseline with sorted units and sorted checks', () => {
    const live = { 'b/two': ['story', 'a11y'], 'a/one': ['test', 'doc'] }

    const { baseline: merged } = mergeBaseline({}, live, { allowIncrease: true })

    expect(Object.keys(merged)).toEqual(['a/one', 'b/two'])
    expect(merged).toEqual({ 'a/one': ['doc', 'test'], 'b/two': ['a11y', 'story'] })
    expect(Object.values(merged)).toEqual([
      ['doc', 'test'],
      ['a11y', 'story'],
    ])
  })

  it('keeps the committed baseline sorted by unit and by check', () => {
    const units = Object.keys(baseline)

    expect(units).toEqual([...units].sort())
    for (const checks of Object.values(baseline as Gaps)) {
      expect(checks).toEqual([...checks].sort())
    }
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
