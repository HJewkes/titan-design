import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'
import {
  isCssPropertyManifest,
  validateCssPropertyManifest,
} from './css-property-manifest.validate'

const readJson = (fileName: string): unknown =>
  JSON.parse(readFileSync(join(__dirname, fileName), 'utf-8'))

describe('css-property-manifest.schema.json', () => {
  it('is well-formed JSON Schema with the documented top-level shape', () => {
    const schema = readJson('css-property-manifest.schema.json') as Record<string, unknown>

    expect(schema.$schema).toBe('https://json-schema.org/draft/2020-12/schema')
    expect(schema.required).toEqual(['component', 'properties'])
    expect(schema.$defs).toHaveProperty('cssPropertyEntry')
    expect(schema.$defs).toHaveProperty('variantOverride')
  })
})

describe('validateCssPropertyManifest', () => {
  it('accepts the button example manifest', () => {
    const example = readJson('css-property-manifest.example.json')

    const result = validateCssPropertyManifest(example)

    expect(result).toEqual({ valid: true, errors: [] })
    expect(isCssPropertyManifest(example)).toBe(true)
  })

  it('rejects a manifest missing required top-level fields', () => {
    const result = validateCssPropertyManifest({ component: 'button' })

    expect(result.valid).toBe(false)
    expect(result.errors).toContain('properties must be a non-empty array')
  })

  it('rejects a property entry missing a resolvedValue', () => {
    const candidate = {
      component: 'button',
      properties: [{ property: 'backgroundColor', token: 'brand-primary' }],
    }

    const result = validateCssPropertyManifest(candidate)

    expect(result.valid).toBe(false)
    expect(result.errors).toContain('properties[0].resolvedValue must be a non-empty string')
  })

  it('rejects a variantOverride missing variant axes', () => {
    const candidate = {
      component: 'button',
      properties: [
        {
          property: 'backgroundColor',
          token: 'brand-primary',
          resolvedValue: 'rgb(255, 121, 0)',
          variantOverrides: [{ resolvedValue: 'rgba(0, 0, 0, 0)' }],
        },
      ],
    }

    const result = validateCssPropertyManifest(candidate)

    expect(result.valid).toBe(false)
    expect(result.errors).toContain(
      'properties[0].variantOverrides[0].variant must be a non-empty string-keyed object'
    )
  })

  it('allows token to be null for literal (non-tokenized) values', () => {
    const candidate = {
      component: 'button',
      properties: [{ property: 'borderRadius', token: null, resolvedValue: '6px' }],
    }

    expect(validateCssPropertyManifest(candidate)).toEqual({ valid: true, errors: [] })
  })
})
