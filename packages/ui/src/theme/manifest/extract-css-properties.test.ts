import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  DEFAULT_VISUAL_PROPERTIES,
  buildCssPropertyManifest,
  readComputedStyleMap,
  styleMapToProperties,
  toKebabCase,
  parseArgs,
} from '../../../scripts/extract-css-properties.mjs'
import { validateCssPropertyManifest } from './css-property-manifest.validate'

const loadFixtureBody = (fileName: string): string => {
  const html = readFileSync(join(__dirname, fileName), 'utf-8')
  return new DOMParser().parseFromString(html, 'text/html').body.innerHTML
}

describe('toKebabCase', () => {
  it('converts camelCase CSS property names to kebab-case', () => {
    expect(toKebabCase('backgroundColor')).toBe('background-color')
    expect(toKebabCase('paddingLeft')).toBe('padding-left')
    expect(toKebabCase('color')).toBe('color')
  })
})

describe('styleMapToProperties', () => {
  it('drops empty computed values and tags each entry with a null token', () => {
    const properties = styleMapToProperties({
      backgroundColor: 'rgb(255, 121, 0)',
      borderRadius: '  6px  ',
      letterSpacing: '',
      lineHeight: '   ',
    })

    expect(properties).toEqual([
      { property: 'backgroundColor', token: null, resolvedValue: 'rgb(255, 121, 0)' },
      { property: 'borderRadius', token: null, resolvedValue: '6px' },
    ])
  })
})

describe('buildCssPropertyManifest', () => {
  it('throws when no property has a non-empty computed value', () => {
    expect(() =>
      buildCssPropertyManifest({ component: 'button', styleMap: { color: '' } })
    ).toThrow(/No non-empty computed CSS properties/)
  })

  it('includes baseVariant and description only when provided', () => {
    const manifest = buildCssPropertyManifest({
      component: 'button',
      styleMap: { color: 'rgb(255, 255, 255)' },
      baseVariant: { variant: 'solid' },
      description: 'from fixture',
    })

    expect(manifest).toMatchObject({
      component: 'button',
      description: 'from fixture',
      baseVariant: { variant: 'solid' },
    })
  })
})

describe('parseArgs', () => {
  it('parses positional args, --out, and repeated --variant flags', () => {
    const result = parseArgs([
      'specimen/index.html',
      '.btn',
      'button',
      '--out',
      'out.json',
      '--variant',
      'variant=solid',
      '--variant',
      'size=md',
    ])

    expect(result).toEqual({
      htmlPath: 'specimen/index.html',
      selector: '.btn',
      component: 'button',
      out: 'out.json',
      baseVariant: { variant: 'solid', size: 'md' },
    })
  })
})

describe('extraction pipeline against a fixture specimen', () => {
  it('produces a manifest that validates against the css-property-manifest schema', () => {
    document.body.innerHTML = loadFixtureBody('extract-css-properties.fixture.html')
    const element = document.querySelector('[data-testid="button"]')
    expect(element).not.toBeNull()

    const styleMap = readComputedStyleMap(element as Element, DEFAULT_VISUAL_PROPERTIES, (el) =>
      getComputedStyle(el as Element)
    )
    const manifest = buildCssPropertyManifest({
      component: 'button',
      styleMap,
      baseVariant: { variant: 'solid' },
      description: 'Extracted from extract-css-properties.fixture.html',
    })

    expect(validateCssPropertyManifest(manifest)).toEqual({ valid: true, errors: [] })
    const properties = manifest.properties.map((entry) => entry.property)
    expect(properties).toContain('backgroundColor')
    expect(properties).toContain('paddingLeft')
    expect(manifest.properties.every((entry) => entry.token === null)).toBe(true)
  })
})
