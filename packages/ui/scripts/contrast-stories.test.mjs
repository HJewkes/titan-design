import { describe, expect, it } from 'vitest'
import {
  BASELINE_FILE,
  changedBaselineIds,
  parseImports,
  selectContrast,
  shardPlan,
} from './contrast-stories.mjs'

// A synthetic tree: Widget is used by Panel, Panel by Page, and each has a story; Chip stands alone.
const TREE = {
  'packages/ui/.storybook/preview.tsx':
    "import '../src/theme/global.css'\nimport { withFrame } from './withFrame'",
  'packages/ui/.storybook/withFrame.tsx': "import { Frame } from '../src/components/ui/frame'",
  'packages/ui/src/components/ui/frame/index.ts': "export { Frame } from './Frame'",
  'packages/ui/src/components/ui/frame/Frame.tsx': "import { View } from 'react-native'",
  'packages/ui/src/theme/global.css': '',
  'packages/ui/src/utils/format.ts': 'export const format = String',
  'packages/ui/src/components/ui/widget/Widget.tsx': "import { format } from '@/utils/format'",
  'packages/ui/src/components/ui/widget/Widget.web.tsx':
    "import { format } from '../../../utils/format'",
  'packages/ui/src/components/ui/widget/Widget.stories.tsx': "import { Widget } from './Widget'",
  'packages/ui/src/components/ui/panel/Panel.tsx': "import {\n  Widget,\n} from '../widget/Widget'",
  'packages/ui/src/components/ui/panel/Panel.stories.tsx': "import { Panel } from './Panel'",
  'packages/ui/src/components/shell/Page.tsx': "const Panel = await import('../ui/panel/Panel')",
  'packages/ui/src/components/shell/Page.stories.tsx': "import { Page } from './Page'",
  'packages/ui/src/components/ui/chip/Chip.tsx': "import React from 'react'",
  'packages/ui/src/components/ui/chip/index.ts': "export { Chip } from './Chip'",
  'packages/ui/src/components/ui/chip/Chip.stories.tsx': "import { Chip } from './Chip'",
  'packages/ui/src/components/ui/chip/ChipGroup.stories.tsx': "import { Chip } from './Chip'",
  'packages/ui/src/components/ui/tag/Tag.tsx': "import { Chip } from '../chip'",
  'packages/ui/src/components/ui/tag/Tag.stories.tsx': "import { Tag } from './Tag'",
  'packages/ui/src/components/ui/tile/Tile.tsx': "import React from 'react'",
  'packages/ui/src/components/ui/tile/Tile.stories.tsx': "import { Tile } from './Tile'",
  'packages/ui/src/components/ui/pill/Pill.tsx': "import React from 'react'",
  'packages/ui/src/components/ui/pill/Pill.stories.tsx': "import { Pill } from './Pill'",
  'packages/ui/src/components/ui/dot/Dot.tsx': "import React from 'react'",
  'packages/ui/src/components/ui/dot/Dot.stories.tsx': "import { Dot } from './Dot'",
  'packages/ui/src/components/ui/orphan/Orphan.tsx': "import React from 'react'",
}

// Like fs.existsSync, a directory exists too.
const exists = (path) =>
  Object.keys(TREE).some((file) => file === path || file.startsWith(`${path}/`))

function select(changedPaths, baselineIds) {
  return selectContrast({
    changedPaths,
    files: Object.keys(TREE).filter((file) => !file.endsWith('.css')),
    readSource: (file) => TREE[file],
    exists,
    baselineIds,
  })
}

describe('affected-story selector for the PR contrast run (TD-869)', () => {
  it('selects the stories of a component and of everything importing it, through any depth', () => {
    const selection = select(['packages/ui/src/utils/format.ts'])

    expect(selection.mode).toBe('subset')
    expect(selection.storyFiles).toEqual([
      'packages/ui/src/components/shell/Page.stories.tsx',
      'packages/ui/src/components/ui/panel/Panel.stories.tsx',
      'packages/ui/src/components/ui/widget/Widget.stories.tsx',
    ])
  })

  it('selects a changed story file on its own', () => {
    const selection = select(['packages/ui/src/components/ui/chip/ChipGroup.stories.tsx'])

    expect(selection.storyFiles).toEqual([
      'packages/ui/src/components/ui/chip/ChipGroup.stories.tsx',
    ])
  })

  it('selects every story file sharing a changed module, through a directory index', () => {
    const selection = select(['packages/ui/src/components/ui/chip/Chip.tsx'])

    expect(selection.storyFiles).toEqual([
      'packages/ui/src/components/ui/chip/Chip.stories.tsx',
      'packages/ui/src/components/ui/chip/ChipGroup.stories.tsx',
      'packages/ui/src/components/ui/tag/Tag.stories.tsx',
    ])
  })

  it.each([
    ['a token change', 'packages/ui/src/theme/tokens/semantic.ts'],
    ['global.css', 'packages/ui/src/theme/global.css'],
    ['the Tailwind config', 'packages/ui/tailwind.config.js'],
    ['a Storybook config change', 'packages/ui/.storybook/main.ts'],
    ['the contrast spec', 'packages/ui/tests/visual/contrast.spec.ts'],
    ['the contrast config', 'packages/ui/playwright.contrast.config.ts'],
    ['the lockfile', 'pnpm-lock.yaml'],
    ['ci.yml', '.github/workflows/ci.yml'],
    ['this selector', 'packages/ui/scripts/contrast-stories.mjs'],
    ['a module the Storybook preview imports', 'packages/ui/src/components/ui/frame/Frame.tsx'],
  ])('falls back to every story for %s', (_scenario, path) => {
    expect(select([path]).mode).toBe('full')
  })

  it('falls back to every story for a baseline edit whose entries are unknown', () => {
    expect(select([BASELINE_FILE]).mode).toBe('full')
  })

  it('selects the stories whose baseline entries a PR edits, beside the files it reaches', () => {
    const selection = select(
      [BASELINE_FILE, 'packages/ui/src/components/ui/dot/Dot.tsx'],
      ['ui-chip--default']
    )

    expect(selection).toMatchObject({
      mode: 'subset',
      storyFiles: ['packages/ui/src/components/ui/dot/Dot.stories.tsx'],
      storyIds: ['ui-chip--default'],
    })
  })

  it.each([
    ['a theme test', 'packages/ui/src/theme/token-contrast.test.ts'],
    ['a theme story', 'packages/ui/src/theme/ColorPalettes.stories.tsx'],
  ])('does not fall back for %s', (_scenario, path) => {
    expect(select([path]).mode).not.toBe('full')
  })

  it('falls back to every story when more than a third of the story files are affected', () => {
    const selection = select([
      'packages/ui/src/utils/format.ts',
      'packages/ui/src/components/ui/chip/Chip.tsx',
    ])

    expect(selection.mode).toBe('full')
  })

  it.each([
    ['a module no story imports', ['packages/ui/src/components/ui/orphan/Orphan.tsx']],
    ['a docs change', ['packages/ui/docs/guide.md']],
    ['another workflow', ['.github/workflows/mutation.yml']],
    ['no changed paths', []],
  ])('checks no story for %s', (_scenario, paths) => {
    expect(select(paths)).toMatchObject({ mode: 'none', storyFiles: [] })
  })
})

describe('baseline edit', () => {
  it('names each story whose entry is added, removed or changed, or whose blank listing flips', () => {
    const previous = {
      baseline: {
        'a--x|dark': { 'f|b': 1 },
        'b--x|light': { 'f|b': 2 },
        'c--x|dark': { 'f|b': 1 },
      },
      blank: ['d--x'],
    }
    const next = {
      baseline: {
        'a--x|dark': { 'f|b': 1 },
        'c--x|dark': { 'f|b': 3 },
        'e--x|light': { 'f|b': 1 },
      },
      blank: ['g--x'],
    }

    expect(changedBaselineIds(previous, next)).toEqual(['b--x', 'c--x', 'd--x', 'e--x', 'g--x'])
  })
})

describe('import parsing', () => {
  it('reads static, multi-line, side-effect, re-export and dynamic imports', () => {
    const source = [
      "import { a } from './a'",
      "import {\n  b,\n} from '@/b'",
      "import './c.css'",
      "export * from '../d'",
      "const e = await import('./e')",
    ].join('\n')

    expect(parseImports(source)).toEqual(['./a', '@/b', './c.css', '../d', './e'])
  })
})

describe('shard plan', () => {
  const subset = { mode: 'subset', storyFiles: ['x.stories.tsx'], reason: '' }

  it('runs a subset whole on shard 1 and ends the other shards green without running', () => {
    expect([1, 2, 3].map((shard) => shardPlan(subset, shard, 3))).toEqual([
      { run: true, shardArg: '' },
      { run: false, shardArg: '' },
      { run: false, shardArg: '' },
    ])
  })

  it('splits a full run across every shard', () => {
    expect(shardPlan({ mode: 'full', storyFiles: [] }, 2, 3)).toEqual({
      run: true,
      shardArg: '--shard=2/3',
    })
  })

  it('runs no shard when no story is affected', () => {
    expect(shardPlan({ mode: 'none', storyFiles: [] }, 1, 3).run).toBe(false)
  })
})
