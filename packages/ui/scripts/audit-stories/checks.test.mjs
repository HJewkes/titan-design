import { describe, expect, it } from 'vitest'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  auditPage,
  domChecks,
  offScaleWarnings,
  splitContrast,
  themeGeometryShift,
  tokenColours,
} from './checks.mjs'
import { buildScale, isOnScale, loadSpacingConfig, parseSpacingConfig } from './spacing-scale.mjs'

const uiDir = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const tokens = { '#111111': ['--color-surface-base'], '#eeeeee': ['--color-text-primary'] }
const node = (target, fg, bg) => ({ target, summary: 'ratio 2:1', fg, bg })
const contrast = (...nodes) => [{ id: 'color-contrast', nodes }]

// A page double: dispatches on the function the audit sends into the browser.
const fakePage = ({ violations, tokenMap, dom }) => ({
  evaluate: async (fn) => {
    if (fn === domChecks) return dom
    if (fn === tokenColours) return tokenMap
    return fn.toString().includes('window.axe.run') ? violations : true
  },
})
const emptyDom = {
  blockers: [],
  warnings: [],
  spacing: [],
  spacingVars: {},
  metrics: {},
  geometry: [],
}
const spacingConfig = { px: [4, 8], vars: [] }

describe('contrast split', () => {
  it('reports a token-on-token pair as contrast-token, not a blocker', () => {
    const out = splitContrast(contrast(node('.a', '#EEEEEE', '#111111')), tokens)
    expect(out.blockers).toEqual([])
    expect(out.contrastToken).toEqual([
      {
        kind: 'contrast-token',
        selector: '.a',
        detail: 'ratio 2:1',
        tokens: ['--color-text-primary', '--color-surface-base'],
      },
    ])
  })

  it('reports a pair with a non-token colour as a blocker', () => {
    const out = splitContrast(contrast(node('.b', '#EEEEEE', '#123456')), tokens)
    expect(out.contrastToken).toEqual([])
    expect(out.blockers).toEqual([{ kind: 'contrast', selector: '.b', detail: 'ratio 2:1' }])
  })

  it('lands each kind in its own audit field', async () => {
    const violations = contrast(node('.a', '#eeeeee', '#111111'), node('.b', '#eeeeee', '#123456'))
    const page = fakePage({ violations, tokenMap: tokens, dom: emptyDom })
    const res = await auditPage(page, { axeSource: '', spacingConfig })
    expect(res.contrast_token.map((f) => f.selector)).toEqual(['.a'])
    expect(res.blockers.map((f) => f.selector)).toEqual(['.b'])
  })
})

describe('spacing scale', () => {
  const scale = buildScale([0, 4, 8], { '--space-md': 12 })

  it('treats a 1px hairline as on scale', () => {
    expect(isOnScale(1, scale)).toBe(true)
    expect(offScaleWarnings([{ selector: '.h', values: [['borderTop', 1]] }], scale)).toEqual([])
  })

  it('warns on a 5px gap', () => {
    const out = offScaleWarnings(
      [
        {
          selector: '.g',
          values: [
            ['rowGap', 5],
            ['columnGap', 8],
          ],
        },
      ],
      scale
    )
    expect(out).toEqual([{ kind: 'off-scale-spacing', selector: '.g', detail: 'rowGap 5px' }])
  })

  it('accepts a resolved custom-property step', () => {
    expect(isOnScale(12, scale)).toBe(true)
  })

  it('splits literal px steps from custom properties', () => {
    const parsed = parseSpacingConfig({
      theme: { spacing: { 0: '0', 1: '4px' }, extend: { spacing: { md: 'var(--space-md)' } } },
    })
    expect(parsed).toEqual({ px: [0, 4], vars: ['--space-md'] })
  })

  it('is read from the real tailwind config', () => {
    const real = loadSpacingConfig(uiDir)
    expect(real.vars.length).toBeGreaterThan(0)
    expect(real.vars.every((v) => v.startsWith('--space-'))).toBe(true)
    expect(real.px).toContain(4)
  })
})

describe('theme geometry shift', () => {
  const row = (path, sel, w) => [path, sel, 0, 0, w, 10]

  it('reports a 2px shift at the outermost box only', () => {
    const dark = [row('0', 'div', 100), row('0.0', 'div > span', 50)]
    const light = [row('0', 'div', 102), row('0.0', 'div > span', 52)]
    const out = themeGeometryShift(dark, light, 'dark')
    expect(out).toEqual([
      {
        kind: 'theme-geometry-shift',
        selector: 'div',
        detail: 'box 0,0,100,10 in dark vs 0,0,102,10',
      },
    ])
  })

  it('keeps an unrelated sibling whose selector merely starts with another', () => {
    const dark = [row('0', 'div', 100), row('1.0', 'div[role="button"]', 50)]
    const light = [row('0', 'div', 102), row('1.0', 'div[role="button"]', 52)]
    expect(themeGeometryShift(dark, light, 'dark').map((f) => f.selector)).toEqual([
      'div',
      'div[role="button"]',
    ])
  })

  it('drops a descendant whose selector starts with a test id', () => {
    const dark = [row('0', 'div', 100), row('0.0', '[data-testid="x"]', 50)]
    const light = [row('0', 'div', 102), row('0.0', '[data-testid="x"]', 52)]
    expect(themeGeometryShift(dark, light, 'dark').map((f) => f.selector)).toEqual(['div'])
  })

  it('drops a descendant deeper than the selector depth cap', () => {
    const dark = [row('0', 'a', 100), row('0.0.0.0.0.0', 'x > y > z > w', 50)]
    const light = [row('0', 'a', 102), row('0.0.0.0.0.0', 'x > y > z > w', 52)]
    expect(themeGeometryShift(dark, light, 'dark').map((f) => f.selector)).toEqual(['a'])
  })

  it('ignores a 1px shift', () => {
    expect(themeGeometryShift([row('0', 'div', 100)], [row('0', 'div', 101)], 'dark')).toEqual([])
  })
})
