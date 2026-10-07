import { readFileSync } from 'node:fs'
import path from 'node:path'
import { test, expect, type Page } from '@playwright/test'
import {
  judgeAlignmentNearMiss,
  judgeFontSizeNearMiss,
} from '../../scripts/audit-stories/layout-probes.mjs'
import { collect, loadFixture } from './load-fixture'

type Finding = { kind: string; selector: string; detail: string }

const WIDTHS = [360, 768, 1280]
const INTER = readFileSync(path.join(__dirname, '../../src/theme/fonts/inter/latin.woff2'))

// One bundled face, so the glyph metrics are the same on every machine.
async function loadWithFont(page: Page, width: number) {
  await page.setViewportSize({ width, height: 900 })
  await loadFixture(page, 'alignment.html')
  await page.addStyleTag({
    content: `@font-face { font-family: Fixture; src: url(data:font/woff2;base64,${INTER.toString('base64')}) format('woff2'); }`,
  })
  await page.evaluate(async () => {
    await document.fonts.load('16px Fixture')
    await document.fonts.ready
  })
}

const inCase = (findings: Finding[], id: string) =>
  findings.filter((f) => f.selector.startsWith(`[data-testid="${id}"]`))

const negatives = [
  'icon-text',
  'top-labels',
  'tag-row',
  'baseline-hit',
  'matched-cards',
  'hero-unit',
]

const positives: [string, RegExp][] = [
  [
    'centre-drift',
    /: baseline Δ[\d.]+, top Δ[\d.]+, centre Δ[\d.]+, bottom Δ[\d.]+ \(band ≤ 6px\)$/,
  ],
  ['baseline-miss', /: baseline Δ[\d.]+ \(align-items: baseline\)$/],
  ['uneven-cards', /: height Δ8 \(both paint; limit 16px\)$/],
  ['one-line-two-sizes', / 14px vs .* 13px on one line: Δ1 \(limit 2px\)$/],
]

for (const width of WIDTHS) {
  test.describe(`at ${width}px`, () => {
    let findings: Finding[]
    test.beforeEach(async ({ page }) => {
      await loadWithFont(page, width)
      const layout = await collect(page)
      findings = [...judgeAlignmentNearMiss(layout), ...judgeFontSizeNearMiss(layout)]
    })

    for (const id of negatives) {
      test(`${id} gives no finding`, () => {
        expect(inCase(findings, id)).toEqual([])
      })
    }

    for (const [id, detail] of positives) {
      test(`${id} gives exactly one finding`, () => {
        const found = inCase(findings, id)
        expect(found).toHaveLength(1)
        expect(found[0].detail).toMatch(detail)
      })
    }
  })
}
