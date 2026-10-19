// @vitest-environment node
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { firstFamily, isMono, loadFontConfig, parseFontConfig } from './font-config.mjs'

const uiDir = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const extendMono = (mono) => ({ theme: { extend: { fontFamily: { mono } } } })

describe('parseFontConfig', () => {
  it('resolves a var() entry through the stylesheet', () => {
    const css = ':root {\n  --font-family-mono: "Sample Mono", monospace;\n}'

    expect(parseFontConfig(extendMono(['var(--font-family-mono)', 'monospace']), css)).toEqual({
      mono: 'Sample Mono',
    })
  })

  it('takes a literal first family as it is', () => {
    expect(parseFontConfig(extendMono(["'Plain Mono'", 'monospace']))).toEqual({
      mono: 'Plain Mono',
    })
  })

  it('reads a family list given as one string', () => {
    expect(parseFontConfig({ theme: { fontFamily: { mono: 'Code Face, monospace' } } })).toEqual({
      mono: 'Code Face',
    })
  })

  it('gives null when there is no mono entry or the var is not declared', () => {
    expect(parseFontConfig({ theme: {} })).toEqual({ mono: null })
    expect(parseFontConfig(extendMono(['var(--font-family-mono)']), '')).toEqual({ mono: null })
  })
})

describe('isMono', () => {
  it('matches the configured family exactly', () => {
    expect(isMono('Sample Mono', { mono: 'Sample Mono' })).toBe(true)
    expect(isMono('Other Mono', { mono: 'Sample Mono' })).toBe(false)
  })

  it('falls back to a mono-looking name when no family is configured', () => {
    expect(isMono('Some Mono', { mono: null })).toBe(true)
    expect(isMono('Inter', { mono: null })).toBe(false)
    expect(isMono(undefined, undefined)).toBe(false)
  })
})

describe('firstFamily', () => {
  it('unquotes the first family of a list', () => {
    expect(firstFamily(`"A B", c`)).toBe('A B')
  })
})

describe('the real config', () => {
  it('resolves the mono family to a plain name', () => {
    const { mono } = loadFontConfig(uiDir)

    expect(mono).toMatch(/^[^'",]+$/)
    expect(mono).not.toMatch(/^var\(/)
  })
})
