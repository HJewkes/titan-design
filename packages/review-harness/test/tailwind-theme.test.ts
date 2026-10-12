import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { themeLeaves, utilitiesFor, type ThemeLeaf } from '../src/tailwind-theme.ts'
import { tailwindConfig } from './fixtures/locks/sources.ts'

const realConfig = () =>
  readFileSync(new URL('../../ui/tailwind.config.js', import.meta.url), 'utf8')

const find = (leaves: ThemeLeaf[], property: string) =>
  leaves.filter((l) => l.property === property).map((l) => `${l.key}:${l.stem}`)

describe('themeLeaves', () => {
  const leaves = themeLeaves(tailwindConfig())

  it('maps each var() leaf to its class stem, DEFAULT segments dropped', () => {
    expect(find(leaves, '--color-hairline-default')).toEqual(['colors:hairline'])
    expect(find(leaves, '--color-hairline-subtle')).toEqual(['colors:hairline-subtle'])
    expect(find(leaves, '--color-brand-primary')).toEqual(['colors:brand-primary'])
    expect(find(leaves, '--color-text-brand-secondary')).toEqual(['colors:text-brand-secondary'])
  })

  it('reads entries the config builds in code, arrays and vars inside longer values', () => {
    expect(find(leaves, '--space-inset-md')).toEqual(['spacing:inset-md'])
    expect(find(leaves, '--size-control-md')).toEqual(['height:control-md'])
    expect(find(leaves, '--font-family-mono')).toEqual(['fontFamily:mono'])
    expect(find(leaves, '--color-brand-primary-rgb')).toEqual(['boxShadow:glow-primary'])
  })

  it('skips literal values and never loads presets', () => {
    expect(leaves.some((l) => l.key === 'borderRadius')).toBe(false)
    expect(leaves.some((l) => l.stem === 'px')).toBe(false)
  })

  it('reads the real packages/ui config the same way', () => {
    const real = themeLeaves(realConfig())

    expect(find(real, '--color-hairline-default')).toEqual(['colors:hairline'])
    expect(find(real, '--color-scrim-default')).toEqual(['colors:scrim'])
    expect(find(real, '--color-background-default')).toEqual(['colors:background'])
    expect(find(real, '--space-inset-md')).toEqual(['spacing:inset-md'])
    expect(find(real, '--size-control-md').sort()).toEqual([
      'height:control-md',
      'minHeight:control-md',
    ])
    expect(real.filter((l) => l.key === 'colors').length).toBeGreaterThan(100)
  })
})

describe('utilitiesFor', () => {
  it('gives each theme key its Tailwind utilities, colour aliases included', () => {
    expect('bg-x').toMatch(new RegExp(`^(?:${utilitiesFor('colors')})-x$`))
    expect('border-t-x').toMatch(new RegExp(`^(?:${utilitiesFor('backgroundColor')})-x$`))
    expect('min-h-x').toMatch(new RegExp(`^(?:${utilitiesFor('minHeight')})-x$`))
    expect('scroll-mt-x').toMatch(new RegExp(`^(?:${utilitiesFor('spacing')})-x$`))
    expect('anything-at-all-x').toMatch(new RegExp(`^(?:${utilitiesFor('unknownKey')})-x$`))
  })
})
