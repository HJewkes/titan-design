import { test, expect } from '@playwright/test'
import { judge } from '../../scripts/audit-stories/relation-probes.mjs'
import { collect, loadFixture } from './load-fixture'

type Finding = { kind: string; selector: string; detail: string }

const WIDTHS = [360, 768, 1280]
const SPACING_VARS = ['--space-stack-lg', '--space-section-sm']

const inCase = (findings: Finding[], id: string) =>
  findings.filter((f) => f.selector.startsWith(`[data-testid="${id}"]`))

const negatives = [
  'hd-ok',
  'hd-card-first',
  'hd-hidden',
  'no-ok',
  'no-pill',
  'no-grid',
  'sg-token',
  'sg-outside',
  'sg-spread',
  'sg-row',
  'db-ok',
  'db-centred',
  'ce-same',
  'ce-indent',
  'ce-centred',
  'ce-rtl',
]

const positives: [string, string, RegExp][] = [
  [
    'hd-far-from-list',
    'heading-detached',
    /sits 24px above .+: body items 8px apart \(limit \+4px\)$/,
  ],
  [
    'hd-tight-section',
    'heading-detached',
    /sits 12px above .+: 12px above it \(limit 1\.5× below\)$/,
  ],
  ['no-inner-loose', 'nesting-order', /^items 16px apart > padding 12px \(want inner ≤ padding/],
  ['no-outer-tight', 'nesting-order', /^padding 16px > 8px to sibling surface .+ \(want inner/],
  ['sg-literal', 'in-surface-section-gap', /^gap 20px between .+ \(limit --space-stack-lg 16px/],
  ['db-tall', 'dead-band', /^56px empty at the bottom \(limit max\(2 × padding 16px, 24px\)\)$/],
  ['db-stretched', 'dead-band', /^100px empty at the bottom .+\(height set by a stretching row\)$/],
  ['ce-near', 'column-edge-near-miss', /: left edge Δ3 \(band 1px < Δ ≤ 6px\)$/],
]

for (const width of WIDTHS) {
  test.describe(`at ${width}px`, () => {
    let findings: Finding[]
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      await loadFixture(page, 'relations.html')
      const layout = await collect(page, { spacingVars: SPACING_VARS })
      findings = judge(layout, { declared: layout.declared })
    })

    test('reads the stack and section tokens from the page', async ({ page }) => {
      const layout = await collect(page, { spacingVars: SPACING_VARS })
      expect(layout.declared).toEqual({ '--space-stack-lg': 16, '--space-section-sm': 24 })
    })

    for (const id of negatives) {
      test(`${id} gives no finding`, () => {
        expect(inCase(findings, id)).toEqual([])
      })
    }

    for (const [id, kind, detail] of positives) {
      test(`${id} gives exactly one ${kind} finding`, () => {
        const found = inCase(findings, id)
        expect(found).toHaveLength(1)
        expect(found[0].kind).toBe(kind)
        expect(found[0].detail).toMatch(detail)
      })
    }

    test('every finding belongs to a planted case', () => {
      const planted = positives.map(([id]) => `[data-testid="${id}"]`)
      expect(findings.filter((f) => !planted.some((p) => f.selector.startsWith(p)))).toEqual([])
    })
  })
}
