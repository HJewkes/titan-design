import fs from 'node:fs'
import path from 'node:path'
import fixOptions from '../../eslint-rules/fix-options'
import tsSource from '../../eslint-rules/ts-source'
import preview from '../../.storybook/preview'
import { space } from '../theme/tokens/semantic'
import { onSurfaceColors } from '../components/ui/surface/SurfaceContext'

const PKG_ROOT = path.join(__dirname, '..', '..')
const TYPOGRAPHY = path.join(PKG_ROOT, 'src/components/ui/typography/Typography.tsx')

type SpaceTree = { [key: string]: number | SpaceTree }

function flattenSpace(node: SpaceTree, prefix: string[] = []): Record<string, number> {
  return Object.entries(node).reduce<Record<string, number>>((out, [key, value]) => {
    const next = [...prefix, key]
    return typeof value === 'number'
      ? { ...out, [next.join('-')]: value }
      : { ...out, ...flattenSpace(value, next) }
  }, {})
}

describe('fix-options: derived from the Tailwind config', () => {
  const fixtureConfig = {
    theme: {
      spacing: { 0: '0', 2: '8px', 2.5: '10px' },
      extend: {
        spacing: { 'stack-md': 'var(--space-stack-md)' },
        colors: {
          scrim: {
            DEFAULT: 'var(--color-scrim-default)',
            subtle: 'var(--color-scrim-subtle)',
            heavy: 'var(--color-scrim-heavy)',
          },
          divider: 'var(--color-divider)',
        },
        fontSize: { huge: '9rem' },
      },
    },
  }

  it('lists a scrim rung that only the fixture config adds', () => {
    const options = fixOptions.fromConfig(fixtureConfig)

    expect(options.colorsByRoot.scrim).toEqual(['scrim', 'scrim-subtle', 'scrim-heavy'])
    expect(options.rungsByRole.scrim).toEqual(['DEFAULT', 'subtle', 'heavy'])
    expect(options.rungsByRole.divider).toBeUndefined()
    expect(options.fontSizes).toEqual(['huge'])
  })

  it('names the steps either side of an off-scale px value and their space keys', () => {
    const css = ':root {\n  --space-stack-md: 8px;\n}\n.light {\n  --space-stack-md: 99px;\n}'
    const options = fixOptions.fromConfig(fixtureConfig, css)

    const { below, above } = options.nearestSpacing(9)

    expect(below).toEqual({ key: '2', px: 8, spaceKeys: ['space.stack.md'] })
    expect(above).toEqual({ key: '2.5', px: 10, spaceKeys: [] })
  })

  it('picks the exact step as both neighbours when the px sits on the scale', () => {
    const { below, above } = fixOptions.fromConfig(fixtureConfig).nearestSpacing(8)

    expect(below).toMatchObject({ key: '2', px: 8 })
    expect(above).toMatchObject({ key: '2', px: 8 })
  })

  it('keeps a root rung from theme.colors when extend.colors adds another to the same root', () => {
    const config = {
      theme: {
        colors: { brand: { DEFAULT: '#111111', dark: '#000000' } },
        extend: { colors: { brand: { light: '#eeeeee' } } },
      },
    }

    const options = fixOptions.fromConfig(config)

    expect(options.colorsByRoot.brand).toEqual(['brand', 'brand-dark', 'brand-light'])
    expect(options.rungsByRole.brand).toEqual(['DEFAULT', 'dark', 'light'])
  })

  it('reads every semantic spacing px from global.css equal to semantic.ts space', () => {
    const parsed = Object.fromEntries(fixOptions.semanticSpacing.map((s) => [s.key, s.px]))

    expect(parsed).toEqual(flattenSpace(space as unknown as SpaceTree))
  })

  it('gives each semantic spacing key a space.* JS key that resolves to its px', () => {
    for (const { jsKey, px } of fixOptions.semanticSpacing) {
      const value = jsKey
        .split('.')
        .slice(1)
        .reduce<unknown>((node, key) => (node as SpaceTree)[key], space)
      expect(value, jsKey).toBe(px)
    }
  })
})

describe('fix-options: parseRootVars', () => {
  it('skips a :root { inside a comment and parses the real block', () => {
    const css = '/* was :root { --x: 1px; } */\n:root {\n  --y: 2px;\n}'

    expect(fixOptions.parseRootVars(css)).toEqual({ y: '2px' })
  })

  it('throws a named error when there is no :root block', () => {
    expect(() => fixOptions.parseRootVars('.light { --y: 2px; }')).toThrow(/no :root block/)
  })

  it('throws a named error when the :root block declares no vars', () => {
    expect(() => fixOptions.parseRootVars(':root { }')).toThrow(/declares no vars/)
  })
})

describe('fix-options: derived from TypeScript source', () => {
  it('returns a TypographyVariant that only the fixture source adds', () => {
    const source = fs
      .readFileSync(TYPOGRAPHY, 'utf8')
      .replace("| 'boldLabel'", "| 'boldLabel'\n  | 'display'")

    const variants = tsSource.readStringUnion(TYPOGRAPHY, 'TypographyVariant', source)

    expect(variants).toContain('display')
    expect(variants).toContain('h1')
  })

  it('loads the real Typography variants', () => {
    expect(fixOptions.typographyVariants).toHaveLength(17)
    expect(fixOptions.typographyVariants).toContain('monoLabel')
  })

  it('lists story roots in the order .storybook/preview.tsx sorts them', () => {
    const order = preview.parameters?.options?.storySort?.order as unknown[]

    expect(fixOptions.storyRoots).toEqual(order.filter((entry) => typeof entry === 'string'))
  })

  it('returns a story root that only the fixture preview source adds', () => {
    const file = path.join(PKG_ROOT, '.storybook/preview.tsx')
    const source = fs.readFileSync(file, 'utf8').replace("'Docs',", "'Docs',\n          'Recipes',")

    expect(fixOptions.storyRootsOf(file, source).slice(-2)).toEqual(['Docs', 'Recipes'])
  })

  it('lists the on-surface roles onSurfaceColors resolves', () => {
    expect(fixOptions.onSurfaceRoles).toEqual(Object.keys(onSurfaceColors('dark')))
  })

  it('reads exported function names from fixture source', () => {
    const source = [
      'export function formatA() {}',
      'export const formatB = () => 1',
      'export const LIMIT = 3',
      'function local() {}',
      'export type T = string',
    ].join('\n')

    expect(tsSource.readExportedFunctions('fixture.ts', source)).toEqual(['formatA', 'formatB'])
  })

  it('maps every formatter export to the module that exports it', () => {
    for (const [mod, names] of Object.entries(fixOptions.formatterExports)) {
      expect(names.length, mod).toBeGreaterThan(0)
      for (const name of names) expect(fixOptions.SYMBOLS[name]).toBe(mod)
    }
  })

  it('reads a nested array literal through as const and nested objects', () => {
    const source = "const cfg = { a: { list: ['x', ['y'], 'z'] as const } }"

    expect(tsSource.readArrayAt('fixture.ts', 'cfg.a.list', source)).toEqual(['x', ['y'], 'z'])
  })

  it('resolves a same-file alias inside a union', () => {
    const source = "type Base = 'a' | 'b'\nexport type T = Base | 'c'"

    expect(tsSource.readStringUnion('fixture.ts', 'T', source)).toEqual(['a', 'b', 'c'])
  })

  it('throws when a union member is an alias that is not in the file', () => {
    const source = "export type T = Imported | 'c'"

    expect(() => tsSource.readStringUnion('fixture.ts', 'T', source)).toThrow(
      /cannot resolve Imported/
    )
  })

  it('throws when a union holds a member it cannot read', () => {
    expect(() => tsSource.readStringUnion('fixture.ts', 'T', 'export type T = string')).toThrow(
      /unsupported/
    )
  })

  it('includes a function exported through an export list, under its exported name', () => {
    const source = 'const c = () => 1\nfunction d() {}\nexport { c, d as e }'

    expect(tsSource.readExportedFunctions('fixture.ts', source)).toEqual(['c', 'e'])
  })

  it('throws on a re-export it cannot resolve', () => {
    const source = "export { c } from './other'"

    expect(() => tsSource.readExportedFunctions('fixture.ts', source)).toThrow(/re-export/)
  })

  it('throws when a module exports no functions', () => {
    expect(() => tsSource.readExportedFunctions('fixture.ts', 'export const N = 1')).toThrow(
      /no exported functions/
    )
  })
})
