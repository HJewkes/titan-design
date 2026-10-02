import fs from 'node:fs'
import path from 'node:path'
import { describe, it, expect } from 'vitest'
import axeBaseline from './stories-axe-baseline.json'
import baseline from './stable-layers-baseline.json'
import {
  STABLE_BASELINE_FILE,
  declarationProblems,
  isStable,
  missingLayers,
  stableBaselineProblems,
  type ComponentDir,
  type StableLayersBaseline,
} from './stable-layers'

const UI_ROOT = path.resolve(__dirname, '../components/ui')
const NON_COMPONENT_DIRS = new Set(['charts', 'charts/kit'])

function readDir(name: string): ComponentDir {
  const abs = path.join(UI_ROOT, name)
  const files: Record<string, string> = {}
  for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
    if (entry.isFile()) files[entry.name] = fs.readFileSync(path.join(abs, entry.name), 'utf8')
  }
  return { name, files }
}

function subdirs(rel: string): string[] {
  return fs
    .readdirSync(path.join(UI_ROOT, rel), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.posix.join(rel, entry.name))
}

function componentDirs(): ComponentDir[] {
  const names = [...subdirs(''), ...subdirs('charts')].filter((n) => !NON_COMPONENT_DIRS.has(n))
  return names.sort().map(readDir)
}

function isSorted(values: string[]): boolean {
  return values.every((value, index) => index === 0 || values[index - 1] < value)
}

const ratchet: StableLayersBaseline = baseline
const stable = componentDirs().filter(isStable)

describe('stable-layers (MATURITY clause 5)', () => {
  it('finds the stable ui/ components from their status tags', () => {
    const names = stable.map((dir) => dir.name)
    expect(names).toContain('button')
    expect(names).not.toContain('select')
  })

  it('reads the axe layer from the stories-axe baseline', () => {
    const skeleton = stable.find((dir) => dir.name === 'skeleton')
    expect(skeleton && missingLayers(skeleton, axeBaseline)).toContain('axe')
  })

  it.each(stable.map((dir) => [dir.name, dir] as const))(
    '%s has every applicable layer or a baselined gap',
    (name, dir) => {
      const problems = [
        ...declarationProblems(dir),
        ...stableBaselineProblems(name, missingLayers(dir, axeBaseline), ratchet[name]),
      ]
      expect(problems).toEqual([])
    }
  )

  it('lists only components that are still stable', () => {
    const names = new Set(stable.map((dir) => dir.name))
    const gone = Object.keys(ratchet).filter((name) => !names.has(name))
    expect(gone, `Remove these entries from ${STABLE_BASELINE_FILE}`).toEqual([])
  })

  it('is sorted with no empty entries, so a diff shows exactly what changed', () => {
    expect(isSorted(Object.keys(ratchet)), 'component names are not sorted').toBe(true)
    for (const [name, layers] of Object.entries(ratchet)) {
      expect(layers.length > 0 && isSorted(layers), `${name}: layers empty or unsorted`).toBe(true)
    }
  })
})

const STABLE_STORY = (parameters = '') => `
const meta = {
  title: 'Components/Molecules/Fixture',
  tags: ['autodocs', 'status:stable', '!status:review'],
  ${parameters}
}
export default meta
`

const FOCUSABLE_SOURCE = `import { Pressable } from 'react-native'
export function Fixture() { return <Pressable /> }`

const PROPERTY_TEST = `import { fcAssert } from '../../../test/property'`

function fixture(files: Record<string, string>): ComponentDir {
  return { name: 'fixture', files }
}

describe('stable-layers failure paths', () => {
  it('fails a stable component that takes focus and has no keyboard story', () => {
    const dir = fixture({
      'Fixture.tsx': FOCUSABLE_SOURCE,
      'Fixture.stories.tsx': STABLE_STORY(),
      'fixtureMath.test.ts': PROPERTY_TEST,
    })

    expect(isStable(dir)).toBe(true)
    expect(missingLayers(dir, {})).toEqual(['keyboard'])
    expect(stableBaselineProblems('fixture', missingLayers(dir, {}))).toEqual([
      expect.stringMatching(/fixture lacks layer\(s\) keyboard/),
    ])
  })

  it('accepts a keyboard layer declared n/a with a reason', () => {
    const dir = fixture({
      'Fixture.tsx': FOCUSABLE_SOURCE,
      'Fixture.stories.tsx': STABLE_STORY(
        "parameters: { layers: { keyboard: 'n/a: focus belongs to the wrapped Button' } },"
      ),
      'fixtureMath.test.ts': PROPERTY_TEST,
    })

    expect(missingLayers(dir, {})).toEqual([])
    expect(declarationProblems(dir)).toEqual([])
  })

  it('fails an n/a declaration with an empty reason', () => {
    const dir = fixture({
      'Fixture.tsx': FOCUSABLE_SOURCE,
      'Fixture.stories.tsx': STABLE_STORY("parameters: { layers: { keyboard: 'n/a: ' } },"),
      'fixtureMath.test.ts': PROPERTY_TEST,
    })

    expect(declarationProblems(dir)).toEqual([
      expect.stringMatching(/fixture declares layers\.keyboard .* needs 'n\/a: <reason>'/),
    ])
    expect(missingLayers(dir, {})).toEqual(['keyboard'])
  })

  it('fails a baseline entry whose layer now passes as stale', () => {
    expect(stableBaselineProblems('fixture', [], ['keyboard'])).toEqual([
      expect.stringMatching(/fixture now has layer\(s\) keyboard\. Remove them/),
    ])
  })

  it('counts a play-tagged story with a play function as the keyboard layer', () => {
    const dir = fixture({
      'Fixture.tsx': FOCUSABLE_SOURCE,
      'Fixture.stories.tsx': STABLE_STORY(),
      'Fixture.interaction.stories.tsx': `const meta = { title: 'X', tags: ['play'] }
export const Tab = { play: async () => {} }`,
      'fixtureMath.test.ts': PROPERTY_TEST,
    })

    expect(missingLayers(dir, {})).toEqual([])
  })

  it('requires types for a generic export and scale for a windowed one', () => {
    const dir = fixture({
      'Fixture.tsx': `import { FlatList } from 'react-native'
export function Fixture<T extends string>() { return <FlatList /> }`,
      'Fixture.stories.tsx': STABLE_STORY(),
      'fixtureMath.test.ts': PROPERTY_TEST,
    })

    expect(missingLayers(dir, {})).toEqual(['types', 'scale'])
  })

  it('fails axe for a component with a story in the stories-axe baseline', () => {
    const dir = fixture({
      'Fixture.tsx': 'export function Fixture() { return null }',
      'Fixture.stories.tsx': STABLE_STORY(),
      'fixtureMath.test.ts': PROPERTY_TEST,
    })

    expect(
      missingLayers(dir, { 'components-molecules-fixture--default': ['button-name'] })
    ).toEqual(['axe'])
  })
})
