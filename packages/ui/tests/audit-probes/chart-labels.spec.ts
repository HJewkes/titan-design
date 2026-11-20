import { test, expect } from '@playwright/test'
import { judge } from '../../scripts/audit-stories/chart-probes.mjs'
import { collect, loadFixture, type Layout } from './load-fixture'

type Finding = { kind: string; selector: string; detail: string }

const WIDTHS = [360, 768, 1280]

const negatives = ['cl-zero', 'cl-one', 'cl-many', 'cl-missing', 'cl-overflow']

const positives: [string, string, RegExp][] = [
  ['cl-crowded', 'chart-label-collision', /^label overlaps .+ by [\d.]+×[\d.]+px \(limit 1px\)$/],
  ['cl-rot-clip', 'chart-label-clip', /^label ink past .+ edge: top [\d.]+px \(limit 0\.5px\)$/],
  [
    'cl-rot-collide',
    'chart-label-collision',
    /^label overlaps .+ by [\d.]+×[\d.]+px \(limit 1px\)$/,
  ],
  ['cl-long', 'chart-label-clip', /^label ink past .+ edge: right [\d.]+px \(limit 0\.5px\)$/],
]

// Each case stands for one chart: its subtree, re-rooted.
function caseLayout(layout: Layout, id: string): Layout {
  const root = layout.nodes.find((n) => n.selector === `[data-testid="${id}"]`)
  if (!root) throw new Error(`fixture case ${id} was not collected`)
  const nodes = layout.nodes
    .filter((n) => n === root || n.id.startsWith(`${root.id}.`))
    .map((n) => (n === root ? { ...n, parent: null } : n))
  return { ...layout, nodes }
}

for (const width of WIDTHS) {
  test.describe(`at ${width}px`, () => {
    const findings = new Map<string, Finding[]>()
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width, height: 1400 })
      await loadFixture(page, 'chart-labels.html')
      const layout = await collect(page)
      for (const id of [...negatives, ...positives.map(([p]) => p)])
        findings.set(id, judge(caseLayout(layout, id)))
    })

    for (const id of negatives) {
      test(`${id} gives no finding`, () => {
        expect(findings.get(id)).toEqual([])
      })
    }

    for (const [id, kind, detail] of positives) {
      test(`${id} gives a ${kind} finding`, () => {
        const found = findings.get(id) ?? []
        expect(found.length).toBeGreaterThan(0)
        expect(found.every((f) => f.kind === kind)).toBe(true)
        expect(found[0].detail).toMatch(detail)
      })
    }
  })
}
