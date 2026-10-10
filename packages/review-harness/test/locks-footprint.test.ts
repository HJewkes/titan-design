import { describe, expect, it } from 'vitest'
import {
  deriveFootprint,
  importedBy,
  reverseClosure,
  tokenDiff,
  tokenName,
  tokenReadPattern,
} from '../src/locks-footprint.ts'
import {
  ALERT,
  BADGE,
  CARD,
  FRAME,
  HEADER,
  SELECT,
  SHELL_EYEBROW,
  TASK_TABLE,
  TOAST,
  UI_EYEBROW,
  css,
  sources,
} from './fixtures/locks/sources.ts'

const GLOBAL_CSS = 'packages/ui/src/theme/global.css'
const SEMANTIC = 'packages/ui/src/theme/tokens/semantic.ts'

describe('deriveFootprint on a #800-shaped change', () => {
  const footprint = deriveFootprint({
    baseCss: css('base'),
    headCss: css('head'),
    changedFiles: [SEMANTIC, GLOBAL_CSS, ALERT, `${ALERT.replace('.tsx', '.test.tsx')}`],
    sources: sources(),
  })

  it('lists the light tokens that moved, with their values, and no dark or unchanged token', () => {
    expect(footprint.tokens).toEqual([
      { name: 'surface-raised', mode: 'light', from: '#edeae7', to: '#ffffff' },
      { name: 'text-secondary', mode: 'light', from: '#5a5958', to: '#424140' },
    ])
  })

  it('puts class readers, by-name readers and importers of a changed component among readers', () => {
    expect(footprint.components.direct).toEqual([ALERT])
    expect(footprint.components.readers).toEqual([TASK_TABLE, FRAME, CARD, SELECT, TOAST])
    expect(footprint.components.readers).not.toContain(BADGE)
  })

  it('follows an import clause wrapped across lines', () => {
    expect(footprint.components.readers).toContain(TASK_TABLE)
  })

  it('counts the reverse closure over direct and readers as where frames render', () => {
    expect(footprint.components.rendersCount).toBe(6)
  })

  it('keeps every changed file, sorted, including the ones that are not components', () => {
    expect(footprint.files).toEqual([
      `${ALERT.replace('.tsx', '.test.tsx')}`,
      ALERT,
      GLOBAL_CSS,
      SEMANTIC,
    ])
  })
})

describe('tokenDiff', () => {
  const wrap = (dark: string, light: string) =>
    `@layer base {\n:root {\n${dark}\n}\n.light,\n:root.light {\n${light}\n}\n}`

  it('reports a dark change as dark and a light change as light', () => {
    const base = wrap('--color-a: #000;\n--color-b: #000;', '--color-a: #fff;')
    const head = wrap('--color-a: #111;\n--color-b: #000;', '--color-a: #eee;')

    expect(tokenDiff(base, head)).toEqual([
      { name: 'a', mode: 'dark', from: '#000', to: '#111' },
      { name: 'a', mode: 'light', from: '#fff', to: '#eee' },
    ])
  })

  it('gives an added token only to and a removed token only from', () => {
    const base = wrap('--color-old: #000;', '')
    const head = wrap('--color-new: #111;', '')

    expect(tokenDiff(base, head)).toEqual([
      { name: 'old', mode: 'dark', from: '#000' },
      { name: 'new', mode: 'dark', to: '#111' },
    ])
  })

  it('ignores comments, spacing and blocks that are not a theme', () => {
    const base = wrap('--color-a: #000; /* old note */', '') + '\n.x { --color-a: #1; }'
    const head = wrap('/* new note */\n--color-a:   #000;', '') + '\n.x { --color-a: #2; }'

    expect(tokenDiff(base, head)).toEqual([])
  })

  it('names a colour property by its token and any other property by its stem', () => {
    expect(tokenName('--color-surface-raised')).toBe('surface-raised')
    expect(tokenName('--space-inset-md')).toBe('space-inset-md')
  })
})

describe('tokenReadPattern', () => {
  const pattern = tokenReadPattern(['surface-raised', 'text-secondary'])!

  it('matches a utility reading the token under any variant prefixes', () => {
    for (const cls of [
      'bg-surface-raised',
      'web:hover:bg-surface-raised',
      '[.light_&]:border-surface-raised',
      'text-text-secondary',
      'bg-surface-raised/50',
      "cn('a', isOpen && 'text-text-secondary')",
    ])
      expect(cls, cls).toMatch(pattern)
  })

  it('matches the token name read as a string literal', () => {
    for (const code of [
      "resolveColor('surface-raised')",
      'getSemanticColors(mode)["text-secondary"]',
      'const token = `surface-raised`',
    ])
      expect(code, code).toMatch(pattern)
  })

  it('does not match a longer token, a bare token name or a longer literal', () => {
    for (const cls of [
      'text-brand-secondary',
      'bg-surface-raised-ish',
      'surface-raised',
      'text-secondary',
      'bg-text-secondary-foo',
      "resolveColor('text-secondary-muted')",
      "'on-surface-raised'",
    ])
      expect(cls, cls).not.toMatch(pattern)
  })

  it('is null with no tokens', () => {
    expect(tokenReadPattern([])).toBeNull()
  })
})

describe('reverseClosure', () => {
  it('is keyed by file, so two components with one name never merge', () => {
    const edges = importedBy(sources())

    expect([...reverseClosure([SHELL_EYEBROW], edges)].sort()).toEqual([SHELL_EYEBROW, HEADER])
    expect([...reverseClosure([UI_EYEBROW], edges)]).toEqual([UI_EYEBROW])
  })

  it('follows imports transitively and resolves @/ and index files', () => {
    const edges = importedBy(
      new Map([
        ['packages/ui/src/components/ui/a/index.ts', 'export const a = 1'],
        ['packages/ui/src/components/ui/b/B.tsx', "import { a } from '../a'"],
        ['packages/ui/src/components/ui/c/C.tsx', "import { B } from '@/components/ui/b/B'"],
      ])
    )

    expect([...reverseClosure(['packages/ui/src/components/ui/a/index.ts'], edges)]).toEqual([
      'packages/ui/src/components/ui/a/index.ts',
      'packages/ui/src/components/ui/b/B.tsx',
      'packages/ui/src/components/ui/c/C.tsx',
    ])
  })
})
