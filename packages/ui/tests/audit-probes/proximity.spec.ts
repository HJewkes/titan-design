import { test, expect } from '@playwright/test'
import {
  judgeGapOutlier,
  judgeProximityInversion,
} from '../../scripts/audit-stories/layout-probes.mjs'
import { collect, loadFixture } from './load-fixture'

type Finding = { kind: string; selector: string; detail: string }

const WIDTHS = [360, 768, 1280]
const SECTION_VARS = ['--space-section-sm', '--space-section-md', '--space-section-lg']

const inCase = (findings: Finding[], id: string) =>
  findings.filter((f) => f.selector.startsWith(`[data-testid="${id}"]`))

const negatives = [
  'section-token',
  'uniform-rhythm',
  'wrapper-chains',
  'grid-2x2',
  'divider-split',
  'grouped-tight',
  'painted-group',
  'controls-row',
  'space-between-row',
  'auto-margin-row',
]

const positives: [string, string, RegExp][] = [
  [
    'outlier-literal',
    'gap-outlier',
    /^gap [\d.]+px between .+ and .+ is [\d.]+× the [\d.]+px gaps beside it$/,
  ],
  [
    'outlier-padding',
    'gap-outlier',
    /^gap [\d.]+px between .+ and .+ is [\d.]+× the [\d.]+px gaps beside it$/,
  ],
  [
    'outlier-row',
    'gap-outlier',
    /^gap [\d.]+px between .+ and .+ is [\d.]+× the [\d.]+px gaps beside it$/,
  ],
  ['inverted-groups', 'proximity-inversion', /: items 16px apart inside, 4px from .+ outside$/],
  ['loose-controls', 'proximity-inversion', /: items 16px apart inside, 16px from .+ outside$/],
]

for (const width of WIDTHS) {
  test.describe(`at ${width}px`, () => {
    let findings: Finding[]
    let declared: Record<string, number>
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      await loadFixture(page, 'proximity.html')
      const layout = await collect(page, { spacingVars: SECTION_VARS })
      declared = layout.declared
      findings = [...judgeGapOutlier(layout), ...judgeProximityInversion(layout)]
    })

    test('resolves the inline section token and the stack stays quiet', () => {
      expect(declared['--space-section-sm']).toBe(40)
      expect(findings.filter((f) => f.selector === '#storybook-root')).toEqual([])
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
  })
}
