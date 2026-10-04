import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  TargetError,
  changedFilesFromGit,
  gitDiffArgs,
  selectTargets,
} from './targets.mjs'

const index = JSON.parse(readFileSync(resolve('scripts/audit-stories/fixtures/index.json'), 'utf8'))

const component = (name, dir, dependsOn = []) => ({
  name,
  file: `packages/ui/src/components/ui/${dir}/${name}.tsx`,
  dependsOn,
})
const graph = {
  components: [
    component('Button', 'button'),
    component('Toolbar', 'toolbar', ['Button']),
    component('Panel', 'panel', ['Toolbar']),
  ],
}

const BUTTON_IDS = ['components-atoms-button--default', 'components-atoms-button--loading']
const TOOLBAR_IDS = ['components-molecules-toolbar--default']
const PANEL_IDS = ['components-organisms-panel--default']

const select = (opts) => selectTargets({ index, graph, ...opts })
const refusal = (opts) => {
  try {
    select(opts)
  } catch (error) {
    return error
  }
  return null
}

describe('selectTargets from a diff', () => {
  it('selects the directory stories for a changed component file', () => {
    const ids = select({ changed: ['packages/ui/src/components/ui/button/Button.tsx'] })
    expect(ids).toEqual(BUTTON_IDS)
  })

  it('selects only the story file itself when a stories file changed', () => {
    const ids = select({ changed: ['packages/ui/src/components/ui/toolbar/Toolbar.stories.tsx'] })
    expect(ids).toEqual(TOOLBAR_IDS)
  })

  it('skips docs entries', () => {
    const ids = select({ changed: ['packages/ui/src/components/ui/button/Button.tsx'] })
    expect(ids.some((id) => id.endsWith('--docs'))).toBe(false)
  })

  it('ignores changed files outside packages/ui/src', () => {
    const error = refusal({ changed: ['README.md', 'packages/ui/scripts/foo.mjs'] })
    expect(error.exitCode).toBe(1)
  })
})

describe('--dependents', () => {
  const changed = ['packages/ui/src/components/ui/button/Button.tsx']

  it('adds exactly one arch-graph level', () => {
    const ids = select({ changed, dependents: true })
    expect(ids).toEqual([...BUTTON_IDS, ...TOOLBAR_IDS])
    expect(ids).not.toEqual(expect.arrayContaining(PANEL_IDS))
  })

  it('adds nothing when the flag is off', () => {
    expect(select({ changed })).toEqual(BUTTON_IDS)
  })
})

describe('refusals', () => {
  it.each([
    'packages/ui/src/theme/global.css',
    'packages/ui/tailwind.config.js',
    'packages/ui/.storybook/preview.tsx',
  ])('refuses %s without --stories or --all', (path) => {
    const error = refusal({ changed: [path] })
    expect(error).toBeInstanceOf(TargetError)
    expect(error.exitCode).toBe(64)
    expect(error.message).toContain(path.replace('packages/ui/', ''))
  })

  it('lets --stories override a theme change', () => {
    const ids = select({
      changed: ['packages/ui/src/theme/global.css'],
      stories: ['components-atoms-button--default'],
    })
    expect(ids).toEqual(['components-atoms-button--default'])
  })

  it('lets --all override a theme change', () => {
    const ids = select({ changed: ['packages/ui/tailwind.config.js'], all: true })
    expect(ids).toHaveLength(4)
  })

  it('fails with exit 1 and lists the files when no story is touched', () => {
    const error = refusal({ changed: ['packages/ui/src/hooks/useThing.ts'] })
    expect(error.exitCode).toBe(1)
    expect(error.message).toContain('src/hooks/useThing.ts')
  })

  it('rejects an unknown story id', () => {
    expect(refusal({ stories: ['nope--default'] }).exitCode).toBe(64)
  })
})

describe('the target cap', () => {
  const bigIndex = {
    entries: Object.fromEntries(
      Array.from({ length: 41 }, (_, i) => [
        `big--s${i}`,
        { id: `big--s${i}`, type: 'story', importPath: './src/components/ui/big/Big.stories.tsx' },
      ])
    ),
  }
  const changed = ['packages/ui/src/components/ui/big/Big.tsx']

  it('refuses more than 40 targets without --all', () => {
    let error
    try {
      selectTargets({ changed, index: bigIndex, graph })
    } catch (e) {
      error = e
    }
    expect(error.exitCode).toBe(64)
    expect(error.message).toContain('41')
  })

  it('accepts exactly 40 targets', () => {
    const trimmed = { entries: Object.fromEntries(Object.entries(bigIndex.entries).slice(0, 40)) }
    expect(selectTargets({ changed, index: trimmed, graph })).toHaveLength(40)
  })

  it('allows more than 40 with --all', () => {
    const ids = selectTargets({ changed, index: bigIndex, graph, all: true })
    expect(ids).toHaveLength(41)
  })
})

describe('git wrapper', () => {
  it('diffs against the merge base and adds untracked files', () => {
    const calls = []
    const git = (args) => {
      calls.push(args)
      if (args[0] === 'merge-base') return 'abc123\n'
      if (args[0] === 'diff') return 'a.ts\nb.ts\n'
      return 'b.ts\nc.ts\n'
    }
    expect(changedFilesFromGit('origin/main', git)).toEqual(['a.ts', 'b.ts', 'c.ts'])
    expect(calls[0]).toEqual(['merge-base', 'origin/main', 'HEAD'])
    expect(calls[1]).toEqual(gitDiffArgs('abc123'))
    expect(calls[2]).toEqual(['ls-files', '--others', '--exclude-standard'])
  })
})
