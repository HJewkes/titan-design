import { test, expect } from '@playwright/test'
import { judge } from '../../scripts/audit-stories/elevation-probes.mjs'
import { collect, loadFixture, type Layout } from './load-fixture'

type Finding = { kind: string; selector: string; detail: string }

const WIDTHS = [360, 768, 1280]

const negatives = [
  'nl-flat-inner',
  'nl-menu-inner',
  'nl-thumb',
  'nl-siblings',
  'gs-one-dot',
  'gs-focus-ring',
  'gs-all-colors',
  'gd-same',
  'gd-selected',
  'gd-on-fill',
  'gd-sizes',
]

const positives: [string, string, RegExp][] = [
  [
    'nl-nested',
    'nested-lift',
    /^lifted [\d.]+×[\d.]+ box inside lifted \[data-testid="nl-nested"\] \(lifted depth 2, limit 1\)$/,
  ],
  ['gs-tile', 'glow-scope', /^glow on a 40×40 box \(limit 24px\)$/],
  ['gs-two-dots', 'glow-scope', /^glow 2 of 2 in one instance \(limit 1\)$/],
  [
    'gd-size',
    'glyph-drift',
    /^glyph \w+: size 18×18 vs 16×16 at \[data-testid="gd-size"\] > svg:nth-of-type\(1\) \(limit 1px\)$/,
  ],
  [
    'gd-colour',
    'glyph-drift',
    /^glyph \w+: colour #6b7280 vs #9ca3af at \[data-testid="gd-colour"\] > svg:nth-of-type\(1\) on #ffffff \(one colour per backdrop\)$/,
  ],
]

// Each case stands for one story: its subtree, re-rooted, judged with a story id ending in the
// case id, so `gs-all-colors` and `gd-sizes` read as variant grids the way instanceRoots reads ids.
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
      await loadFixture(page, 'elevation.html')
      const layout = await collect(page)
      for (const id of [...negatives, ...positives.map(([p]) => p)])
        findings.set(id, judge(caseLayout(layout, id), { story: { id: `fixture--${id}` } }))
    })

    for (const id of negatives) {
      test(`${id} gives no finding`, () => {
        expect(findings.get(id)).toEqual([])
      })
    }

    for (const [id, kind, detail] of positives) {
      test(`${id} gives exactly one ${kind} finding`, () => {
        const found = findings.get(id) ?? []
        expect(found).toHaveLength(1)
        expect(found[0].kind).toBe(kind)
        expect(found[0].detail).toMatch(detail)
      })
    }
  })
}
