import { describe, expect, it } from 'vitest'
import {
  deriveFootprint,
  importedBy,
  reverseClosure,
  tokenDiff,
  tokenName,
  tokenReadPattern,
} from '../src/locks-footprint.ts'
import { themeLeaves } from '../src/tailwind-theme.ts'
import {
  ALERT,
  BADGE,
  CARD,
  DRAWER,
  FRAME,
  HEADER,
  INPUT,
  SELECT,
  SHELL_EYEBROW,
  STACK,
  TABS,
  TASK_TABLE,
  TOAST,
  UI_EYEBROW,
  css,
  sources,
  tailwindConfig,
} from './fixtures/locks/sources.ts'

const GLOBAL_CSS = 'packages/ui/src/theme/global.css'
const SEMANTIC = 'packages/ui/src/theme/tokens/semantic.ts'
const theme = themeLeaves(tailwindConfig())

describe('deriveFootprint on a #800-shaped change', () => {
  const footprint = deriveFootprint({
    baseCss: css('base'),
    headCss: css('head'),
    theme,
    changedFiles: [SEMANTIC, GLOBAL_CSS, ALERT, `${ALERT.replace('.tsx', '.test.tsx')}`],
    sources: sources(),
  })

  it('lists each moved property per mode, with its values, and no unchanged token', () => {
    expect(footprint.tokens).toEqual([
      { name: 'space-inset-md', mode: 'dark', from: '12px', to: '16px' },
      { name: 'surface-raised', mode: 'light', from: '#edeae7', to: '#ffffff' },
      { name: 'text-secondary', mode: 'light', from: '#5a5958', to: '#424140' },
      {
        name: 'hairline-default',
        mode: 'light',
        from: 'rgba(0, 0, 0, 0.15)',
        to: 'rgba(0, 0, 0, 0.16)',
      },
      { name: 'space-inset-md', mode: 'light', from: '12px', to: '16px' },
    ])
  })

  it('finds readers through theme classes, DEFAULT keys, var() and name, plus importers', () => {
    expect(footprint.components.direct).toEqual([ALERT])
    expect(footprint.components.readers).toEqual([
      TASK_TABLE,
      FRAME,
      CARD,
      INPUT,
      SELECT,
      STACK,
      TABS,
      TOAST,
    ])
  })

  it('leaves out look-alike classes and readers of unchanged tokens', () => {
    expect(footprint.components.readers).not.toContain(BADGE)
    expect(footprint.components.readers).not.toContain(DRAWER)
  })

  it('counts the reverse closure over direct and readers as where frames render', () => {
    expect(footprint.components.rendersCount).toBe(9)
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

  it('reports a dark change as dark and a light change as light, with the property', () => {
    const base = wrap('--color-a: #000;\n--color-b: #000;', '--color-a: #fff;')
    const head = wrap('--color-a: #111;\n--color-b: #000;', '--color-a: #eee;')

    expect(tokenDiff(base, head)).toEqual([
      { name: 'a', mode: 'dark', from: '#000', to: '#111', property: '--color-a' },
      { name: 'a', mode: 'light', from: '#fff', to: '#eee', property: '--color-a' },
    ])
  })

  it('gives an added token only to and a removed token only from', () => {
    const base = wrap('--color-old: #000;', '')
    const head = wrap('--color-new: #111;', '')

    expect(tokenDiff(base, head)).toEqual([
      { name: 'old', mode: 'dark', from: '#000', property: '--color-old' },
      { name: 'new', mode: 'dark', to: '#111', property: '--color-new' },
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
  const pattern = tokenReadPattern(
    [
      '--color-surface-raised',
      '--color-text-secondary',
      '--color-hairline-default',
      '--space-inset-md',
    ],
    theme
  )!

  it('matches the classes the theme maps to the property, under any variant prefix', () => {
    for (const cls of [
      'bg-surface-raised',
      'web:hover:bg-surface-raised',
      '[.light_&]:border-surface-raised',
      'text-text-secondary',
      'bg-surface-raised/50',
      "cn('a', isOpen && 'text-text-secondary')",
      'border-hairline',
      'divide-hairline',
      'gap-inset-md',
      'p-inset-md',
      'web:-mt-inset-md',
    ])
      expect(cls, cls).toMatch(pattern)
  })

  it('matches a raw var() read and a colour token name read as a string literal', () => {
    for (const code of [
      'placeholderTextColor="var(--color-text-secondary)"',
      "'var( --space-inset-md )'",
      "resolveColor('surface-raised')",
      'getSemanticColors(mode)["text-secondary"]',
      'const token = `surface-raised`',
    ])
      expect(code, code).toMatch(pattern)
  })

  it('does not match a longer stem, a bare name, an unchanged token or a non-colour name', () => {
    for (const cls of [
      'text-brand-secondary',
      'bg-surface-raised-ish',
      'surface-raised',
      'text-secondary',
      'bg-text-secondary-foo',
      'border-hairline-subtle',
      'gap-inset-mdx',
      'bg-scrim',
      'h-control-md',
      'var(--color-text-secondary-muted)',
      "resolveColor('text-secondary-muted')",
      "'on-surface-raised'",
      "'space-inset-md'",
    ])
      expect(cls, cls).not.toMatch(pattern)
  })

  it('is null with no properties', () => {
    expect(tokenReadPattern([], theme)).toBeNull()
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
