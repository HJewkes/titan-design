import { describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  BLOCKER_KINDS,
  CONTRAST_TOKEN_KIND,
  WARNING_KINDS,
  auditPage,
  domChecks,
  offScaleWarnings,
  splitContrast,
  themeGeometryShift,
  tokenColours,
} from './checks.mjs'
import { judgeLayout } from './layout-probes.mjs'
import { PROBE_KINDS, PROBE_MODULES, judgeAll } from './probe-suite.mjs'
import { buildScale, isOnScale, loadSpacingConfig, parseSpacingConfig } from './spacing-scale.mjs'
import * as typeProbes from './type-probes.mjs'

vi.mock('./type-probes.mjs', async (original) => ({
  ...(await original()),
  judge: vi.fn(() => []),
}))

const uiDir = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const tokens = { '#111111': ['--color-surface-base'], '#eeeeee': ['--color-text-primary'] }
const node = (target, fg, bg) => ({ target, summary: 'ratio 2:1', fg, bg })
const contrast = (...nodes) => [{ id: 'color-contrast', nodes }]

const emptyLayout = { nodes: [], truncated: false, declared: { '--space-stack-lg': 16 } }
// A page double: dispatches on the function the audit sends into the browser.
const fakePage = ({ violations, tokenMap, dom, onCollect = () => {}, onDom = () => {} }) => ({
  evaluate: async (fn, arg) => {
    if (fn === domChecks) {
      onDom(arg)
      return dom
    }
    if (fn === tokenColours) return tokenMap
    if (fn.toString().includes('collectLayout')) {
      if (arg) onCollect(arg)
      return emptyLayout
    }
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
const story = { id: 'components-atoms-sample--default', title: 'Components/Atoms/Sample' }
const fonts = { mono: 'Sample Mono' }

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
    const res = await auditPage(page, { axeSource: '', spacingConfig, story, fonts })
    expect(res.contrast_token.map((f) => f.selector)).toEqual(['.a'])
    expect(res.blockers.map((f) => f.selector)).toEqual(['.b'])
  })
})

describe('probe suite wiring', () => {
  it('lists every probe module kind as a warning', () => {
    const kinds = PROBE_MODULES.flatMap((m) => m.KINDS)

    expect(WARNING_KINDS).toEqual(expect.arrayContaining([...PROBE_KINDS, ...kinds]))
  })

  it('hands each probe module the tokens, story, fonts and declared spacing', async () => {
    const page = fakePage({ violations: [], tokenMap: tokens, dom: emptyDom })
    vi.mocked(typeProbes.judge).mockClear()

    await auditPage(page, { axeSource: '', spacingConfig, story, fonts })

    expect(typeProbes.judge).toHaveBeenCalledWith(emptyLayout, {
      tokens,
      story,
      fonts,
      declared: emptyLayout.declared,
    })
  })

  it('declares the large stack step to the collector beside the config vars', async () => {
    const seen = []
    const page = fakePage({
      violations: [],
      tokenMap: {},
      dom: emptyDom,
      onCollect: (v) => seen.push(v),
    })

    await auditPage(page, {
      axeSource: '',
      spacingConfig: { px: [4], vars: ['--space-stack-sm', '--space-stack-lg'] },
      story,
      fonts,
    })

    expect(seen).toEqual([['--space-stack-sm', '--space-stack-lg']])
  })

  it('hands the page checks the 10–11px small-text band, leaving under 10px to text-floor', async () => {
    const seen = []
    const page = fakePage({
      violations: [],
      tokenMap: {},
      dom: emptyDom,
      onDom: (arg) => seen.push(arg.smallText),
    })

    await auditPage(page, { axeSource: '', spacingConfig, story, fonts })

    expect(seen).toEqual([[10, 11]])
  })

  it('caps the layout judges and module findings together at 25 per kind', () => {
    const finding = (kind, i) => ({ kind, selector: `.n${i}`, detail: 'measured' })
    const many = (kind) => ({ judge: () => Array.from({ length: 20 }, (_, i) => finding(kind, i)) })

    const out = judgeAll({ nodes: [], declared: {} }, {}, [
      many('sample-a'),
      many('sample-a'),
      many('sample-b'),
    ])

    expect(out.filter((f) => f.kind === 'sample-a')).toHaveLength(25)
    expect(out.filter((f) => f.kind === 'sample-b')).toHaveLength(20)
  })

  it('keeps every ratcheted text-floor finding while still capping other kinds', () => {
    const finding = (kind, i) => ({ kind, selector: `.n${i}`, detail: 'measured' })
    const many = (kind) => ({ judge: () => Array.from({ length: 20 }, (_, i) => finding(kind, i)) })

    const out = judgeAll({ nodes: [], declared: {} }, {}, [
      many('text-floor'),
      many('text-floor'),
      many('sample-a'),
      many('sample-a'),
    ])

    expect(out.filter((f) => f.kind === 'text-floor')).toHaveLength(40)
    expect(out.filter((f) => f.kind === 'sample-a')).toHaveLength(25)
  })

  it('leaves judgeAll equal to judgeLayout on an unpadded, undeclared stack', () => {
    // Padless surfaces are outside every module's scope, so no real module may add a finding here.
    const row = (id, parent, box) => ({
      id,
      parent,
      selector: `#n${id}`,
      tag: 'div',
      role: null,
      interactive: false,
      box,
      pad: [0, 0, 0, 0],
      border: [0, 0, 0, 0],
      margin: [0, 0, 0, 0],
      marginAuto: [false, false, false, false],
      layout: { display: 'block', flexDirection: 'row', flexWrap: 'nowrap', position: 'static' },
      paints: true,
      text: null,
      ink: box,
    })
    const layout = {
      nodes: [
        row('0', null, [0, 0, 100, 100]),
        row('0.0', '0', [0, 0, 100, 10]),
        row('0.1', '0', [0, 14, 100, 10]),
        row('0.2', '0', [0, 48, 100, 10]),
      ],
      declared: {},
    }

    expect(judgeLayout(layout).length).toBeGreaterThan(0)
    expect(judgeAll(layout, {})).toEqual(judgeLayout(layout))
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

describe('usage doc', () => {
  const read = (path) => readFileSync(resolve(uiDir, path), 'utf8')
  const doc = read('docs/audit-stories.md')
  const kinds = [...BLOCKER_KINDS, ...WARNING_KINDS, CONTRAST_TOKEN_KIND]

  it.each(kinds)('names the %s kind', (kind) => {
    expect(doc, `docs/audit-stories.md does not name the \`${kind}\` kind`).toContain(`\`${kind}\``)
  })

  it('lists every kind the in-page checks emit', () => {
    const source = read('scripts/audit-stories/checks.mjs')
    const emitted = [...source.matchAll(/finding\(\s*'([a-z-]+)'/g)].map((m) => m[1])
    expect(emitted.length).toBeGreaterThan(0)
    expect(kinds).toEqual(expect.arrayContaining(emitted))
  })
})
