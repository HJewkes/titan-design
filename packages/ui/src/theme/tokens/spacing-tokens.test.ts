import { describe, it, expect } from 'vitest'
import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { primitiveSpacing, spacingUnit, toSpacingValue } from './primitives'
import { space, size } from './semantic'

/**
 * Three-way drift guard for the spacing + sizing foundation (AW-142).
 *
 * The numbers live once, in `space` / `size`, but they have to arrive intact at
 * two places that cannot import them: `tailwind.config.js` (CJS, so it holds
 * only key NAMES) and `global.css` (hand-written, so it holds only VALUES).
 * These tests walk the JS export, follow each key through the resolved Tailwind
 * theme to a custom property, and read that property back out of `global.css` —
 * so changing a number in any one of the three fails here.
 */

const require = createRequire(import.meta.url)
const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const resolveConfig = require('tailwindcss/resolveConfig') as (config: unknown) => any
const theme = resolveConfig(require(path.join(packageRoot, 'tailwind.config.js'))).theme

const css = readFileSync(path.join(packageRoot, 'src/theme/global.css'), 'utf8')

/** The declared value of a custom property, read straight out of global.css. */
function declaredValue(varName: string): string | undefined {
  return css.match(new RegExp(`^\\s*${varName}:\\s*(.+?);\\s*$`, 'm'))?.[1]
}

type NestedNumbers = { [key: string]: number | NestedNumbers }

/** `{ 'inset-md': 12, 'squish-x-sm': 8, … }` — every leaf under its dashed path. */
function leaves(node: NestedNumbers, prefix = ''): Array<[string, number]> {
  return Object.entries(node).flatMap(([key, value]) => {
    const name = prefix ? `${prefix}-${key}` : key
    return typeof value === 'number' ? [[name, value] as [string, number]] : leaves(value, name)
  })
}

const spaceLeaves = leaves(space)
const controlHeights = Object.entries(size.control)

describe('semantic spacing keys reach Tailwind and global.css intact', () => {
  it('covers every key in the spec table', () => {
    expect(spaceLeaves.map(([key]) => key)).toEqual([
      'inset-xs',
      'inset-sm',
      'inset-md',
      'inset-lg',
      'inset-xl',
      'squish-x-xs',
      'squish-x-sm',
      'squish-x-md',
      'squish-x-lg',
      'squish-y-xs',
      'squish-y-sm',
      'squish-y-md',
      'squish-y-lg',
      'stack-sm',
      'stack-md',
      'stack-lg',
      'stack-xl',
      'inline-sm',
      'inline-md',
      'inline-lg',
      'control-x-sm',
      'control-x-md',
      'control-x-lg',
      'control-y-sm',
      'control-y-md',
      'control-y-lg',
      'section-sm',
      'section-md',
      'section-lg',
      'gutter-sm',
      'gutter-md',
    ])
  })

  it.each(spaceLeaves)('%s is the same number in the JS export and in the CSS', (key, px) => {
    expect(theme.spacing[key]).toBe(`var(--space-${key})`)
    expect(declaredValue(`--space-${key}`)).toBe(toSpacingValue(px))
  })

  it.each(controlHeights)('control height %s is the same number in both', (level, px) => {
    expect(theme.height[`control-${level}`]).toBe(`var(--size-control-${level})`)
    expect(theme.minHeight[`control-${level}`]).toBe(`var(--size-control-${level})`)
    expect(declaredValue(`--size-control-${level}`)).toBe(toSpacingValue(px))
  })

  it.each(Object.entries(size.icon))(
    'icon size %s is declared as a custom property',
    (name, px) => {
      expect(declaredValue(`--size-icon-${name}`)).toBe(toSpacingValue(px))
    }
  )
})

describe('the numeric scale', () => {
  it('is what tailwind.config.js sets theme.spacing to', () => {
    const numeric = Object.fromEntries(
      Object.entries(theme.spacing as Record<string, string>).filter(
        ([, value]) => !value.startsWith('var(')
      )
    )
    expect(numeric).toEqual({ ...primitiveSpacing })
  })

  it('keeps every step up to 96, because w-/h-/size-/inset- share the namespace', () => {
    expect(primitiveSpacing['96']).toBe(toSpacingValue(384))
    expect(primitiveSpacing['64']).toBe(toSpacingValue(256))
  })

  it('is emitted in px, so native and web agree', () => {
    expect(spacingUnit).toBe('px')
    expect(primitiveSpacing['4']).toBe('16px')
    expect(toSpacingValue(0)).toBe('0')
  })
})
