import { describe, expect, it } from 'vitest'

import { shapeColorInventory } from './export-color-inventory.mjs'

const THEME = {
  primitiveRamps: {
    red: { 50: '#FFF4F4', 600: '#D14343' },
    cyan: { 50: '#ECFEFF', 600: '#0891B2' },
  },
  greyRamp: { 50: '#F9F6F3', 950: '#1C1916' },
  semanticColorsDark: {
    'brand-primary': '#FF7900',
    'brand-primary-strong': 'rgba(255, 121, 0, 0.50)',
  },
  semanticColorsLight: { 'brand-primary': '#DA5F00' },
}

describe('shapeColorInventory', () => {
  const { ramps, colors } = shapeColorInventory(THEME)

  it('nests ramps as { ramps: { hue: { step: hex } } } with no extra level', () => {
    expect(Object.keys(ramps)).toEqual(['ramps'])
    expect(Object.keys(ramps.ramps)).toEqual(['red', 'cyan', 'grey'])
    expect(ramps.ramps.red).toEqual({ 50: '#FFF4F4', 600: '#D14343' })
  })

  it('keeps only #RRGGBB hex values in ramps', () => {
    for (const steps of Object.values(ramps.ramps)) {
      for (const hex of Object.values(steps)) expect(hex).toMatch(/^#[0-9A-Fa-f]{6}$/)
    }
  })

  it('emits a flat array of { hex, role, palette } entries for both palettes', () => {
    expect(Array.isArray(colors)).toBe(true)
    expect(colors).toEqual([
      { hex: '#FF7900', role: 'brand-primary', palette: 'dark' },
      { hex: '#DA5F00', role: 'brand-primary', palette: 'light' },
    ])
    for (const entry of colors)
      expect(Object.keys(entry).sort()).toEqual(['hex', 'palette', 'role'])
  })

  it('drops non-hex semantic values such as rgba', () => {
    expect(colors.map((c) => c.role)).not.toContain('brand-primary-strong')
  })
})
