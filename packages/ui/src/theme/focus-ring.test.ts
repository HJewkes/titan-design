import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { contrast } from './color-checks'
import { getSemanticColors, type ThemeMode } from './tokens/semantic'

/**
 * TD-765: keyboard focus is the owner's two-tone pick, a 2px `text-brand` outline at a 2px
 * offset. The offset is the gap, so the ring touches only the plane the element sits on and
 * must clear the WCAG 2.4.11 / 1.4.11 3:1 floor against every plane in both modes.
 */
const css = readFileSync(
  path.join(path.dirname(fileURLToPath(import.meta.url)), 'global.css'),
  'utf8'
)

function focusRule() {
  const match = css.match(/\*:focus-visible,\s*\.focus-ring\s*\{([^}]*)\}/)
  if (!match) throw new Error('global.css has no `*:focus-visible, .focus-ring` rule')
  return match[1]
}

// `background-frame` is the bezel: only lab frames paint it and nothing focusable ships on it.
// Light measures 2.75 there (the old border-focus ring was 1.86); it is pinned, not floored.
const PLANES = [
  'background-base',
  'background-default',
  'background-subtle',
  'surface-base',
  'surface-elevated',
  'surface-raised',
  'surface-overlay',
  'surface-input',
] as const
const MODES: ThemeMode[] = ['light', 'dark']

describe('focus ring', () => {
  it('paints a 2px text-brand outline at a 2px offset for :focus-visible and .focus-ring', () => {
    const rule = focusRule()
    expect(rule).toMatch(/outline:\s*2px solid var\(--color-text-brand\);/)
    expect(rule).toMatch(/outline-offset:\s*2px;/)
  })

  it.each(MODES)('clears 3:1 against every plane in %s', (mode) => {
    const colors = getSemanticColors(mode)
    const ratios = PLANES.map((plane) => [plane, contrast(colors['text-brand'], colors[plane])])
    const below = ratios.filter(([, ratio]) => (ratio as number) < 3)
    expect(below).toEqual([])
  })

  it('pins the ring on the light frame bezel, the one plane under 3:1', () => {
    const colors = getSemanticColors('light')
    expect(contrast(colors['text-brand'], colors['background-frame'])).toBeCloseTo(2.75, 2)
  })
})
