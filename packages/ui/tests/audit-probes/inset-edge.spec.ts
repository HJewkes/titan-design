import { test, expect } from '@playwright/test'
import { judgeLayout } from '../../scripts/audit-stories/layout-probes.mjs'
import { collect, loadFixture } from './load-fixture'

type Finding = { kind: string; selector: string; detail: string }

test.beforeEach(async ({ page }) => {
  await loadFixture(page, 'inset-edge.html')
})

const inCase = (findings: Finding[], id: string) =>
  findings.filter((f) => f.selector.startsWith(`[data-testid="${id}"]`))

const positives: [string, string, string][] = [
  ['stacked-pos', 'stacked-inset', '[data-testid="stacked-pos"] > div:nth-of-type(1)'],
  ['edge-pushed', 'edge-clearance', '[data-testid="edge-pushed"] > div'],
  ['edge-unpadded', 'edge-clearance', '[data-testid="edge-unpadded"] > div'],
  ['asym-short', 'inset-asymmetry', '[data-testid="asym-short"]'],
]

for (const [id, kind, selector] of positives) {
  test(`${id} gives one ${kind} finding on the offending element`, async ({ page }) => {
    const found = inCase(judgeLayout(await collect(page)), id)
    expect(found.map((f) => [f.kind, f.selector])).toEqual([[kind, selector]])
  })
}

const negatives = [
  'stacked-interactive',
  'stacked-painted',
  'stacked-rhythm',
  'asym-even',
  'label-short',
  'pill',
  'numeral',
  'page',
  'icon-button',
]

for (const id of negatives) {
  test(`${id} gives no finding`, async ({ page }) => {
    expect(inCase(judgeLayout(await collect(page)), id)).toEqual([])
  })
}
