import { test, expect } from '@playwright/test'
import { tokenColours } from '../../scripts/audit-stories/checks.mjs'
import { judge } from '../../scripts/audit-stories/colour-probes.mjs'
import { collect, loadFixture } from './load-fixture'

type Finding = { kind: string; selector: string; detail: string }

const WIDTHS = [360, 768, 1280]

const inCase = (findings: Finding[], id: string) =>
  findings.filter((f) => f.selector.startsWith(`[data-testid="${id}"]`))

const negatives = [
  'fc-solid-label',
  'fc-subtle-wash',
  'fc-neutral-faded',
  'fc-disabled',
  'fc-black-faded',
  'gc-on-blue',
  'gc-grey-on-dark',
  'gc-grey-on-wash',
  'gc-gradient',
  'ct-same',
  'ct-two-concepts',
  'ct-declared-one',
]

const positives: [string, string, RegExp][] = [
  [
    'fc-faded-label',
    'full-chroma',
    /^text #22c55e \(--color-status-success\) at opacity 0\.6 \(floor 0\.95\)$/,
  ],
  [
    'fc-alpha-dot',
    'full-chroma',
    /^background #dc2626 \(--color-status-error\) at alpha 0\.4 \(floor 0\.95\)$/,
  ],
  [
    'gc-grey-on-blue',
    'grey-on-colour',
    /^neutral text #9ca3af \(--color-text-secondary\) on #2563eb \(L 0\.55, C 0\.22\) is not an on-\* token value/,
  ],
  [
    'ct-drift',
    'concept-token-drift',
    /^concept "alpha": #22c55e \(--color-status-success\) ×2, #16a34a \(raw\) ×1; max ΔE 9\.8 \(limit 2\)$/,
  ],
  [
    'ct-declared',
    'concept-token-drift',
    /^concept "declared": #22c55e \(--color-status-success\) ×1, #16a34a \(raw\) ×1; max ΔE 9\.8 \(limit 2\)$/,
  ],
]

for (const width of WIDTHS) {
  test.describe(`at ${width}px`, () => {
    let findings: Finding[]
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width, height: 1400 })
      await loadFixture(page, 'colour.html')
      const tokens = await page.evaluate(tokenColours)
      findings = judge(await collect(page), { tokens })
    })

    test('every finding belongs to a planted case', () => {
      const planted = positives.map(([id]) => `[data-testid="${id}"]`)
      expect(findings.filter((f) => !planted.some((p) => f.selector.startsWith(p)))).toEqual([])
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
