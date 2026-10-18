import { test, expect } from '@playwright/test'
import { judge } from '../../scripts/audit-stories/type-probes.mjs'
import { collect, loadFixture, type Layout } from './load-fixture'

type Finding = { kind: string; selector: string; detail: string }
type Story = { id: string; title: string }

const WIDTHS = [360, 768, 1280]
const fonts = { mono: 'Fixture Mono' }
const COMPONENT: Story = { id: 'fixture-typography--default', title: 'Components/Fixture' }
const PAGE: Story = { id: 'fixture-page--default', title: 'Pages/Fixture' }
const GALLERY: Story = { id: 'fixture-typography--all-sizes', title: 'Components/Fixture' }

// One case's subtree as its own frame, the way a story's root reaches the judges.
function caseLayout(layout: Layout, id: string): Layout {
  const root = layout.nodes.find((n) => n.selector === `[data-testid="${id}"]`)
  if (!root) throw new Error(`no case ${id}`)
  const nodes = layout.nodes
    .filter((n) => n.id === root.id || n.id.startsWith(`${root.id}.`))
    .map((n) => (n === root ? { ...n, parent: null } : n))
  return { ...layout, nodes }
}

const negatives: [string, Story?][] = [
  ['ct-widest'],
  ['ct-mono'],
  ['ct-mixed'],
  ['cl-one-look'],
  ['cl-tabs'],
  ['cl-table-ok'],
  ['cl-table-sorted'],
  ['tf-ten'],
  ['sz-four'],
  ['sz-gallery', GALLERY],
  ['wf-two'],
  ['wf-three-faces'],
  ['lt-zero'],
  ['lt-tracking-tight'],
  ['lt-small-open'],
  ['lt-uppercase'],
  ['ls-hero'],
  ['ls-badge'],
  ['ls-near'],
]

const positives: [string, string, RegExp, Story?][] = [
  ['ct-tight', 'caps-tracking', /^caps "Section" 12px tracked 0\.2px = 1\.7% \(range 5%–12%\)$/],
  [
    'cl-two-looks',
    'caps-label-looks',
    /^component has 2 caps label looks \(limit 1\): 12px\/600\/1\.25px\/Fixture Sans\/#6b7280, 10px\/600\/1px\/Fixture Sans\/#9ca3af$/,
  ],
  [
    'cl-table-header',
    'caps-label-looks',
    /^column header 14px is larger than body cell text 12px$/,
  ],
  [
    'tf-under',
    'text-floor',
    /^8\.5px text under the 10px floor \(error tier; reported as a warning/,
  ],
  [
    'sz-five',
    'sizes-per-component',
    /^component uses 5 text sizes \(limit 4\): 10, 12, 14, 16, 20px$/,
  ],
  [
    'sz-page',
    'sizes-per-component',
    /^page uses 7 text sizes \(limit 6\): 10, 12, 14, 16, 20, 24, 32px$/,
    PAGE,
  ],
  ['wf-three', 'weights-faces', /^component uses 3 weights \(limit 2\): 400, 600, 700$/],
  ['wf-light', 'weights-faces', /^weight 300 is under 400$/],
  [
    'wf-families',
    'weights-faces',
    /^frame uses 4 font families \(limit 3\): Fixture Sans, Fixture Display, Fixture Mono, Fixture Serif$/,
  ],
  [
    'lt-open',
    'lowercase-tracking',
    /^mixed-case 14px tracked 0\.7px = 5% \(limit 2% at 12px or more\)$/,
  ],
  ['lt-tight', 'lowercase-tracking', /^mixed-case 32px tracked -1\.6px = -5% \(floor -3%\)$/],
  [
    'ls-sizes',
    'line-style-budget',
    /^one line has 3 sizes 12, 13, 16px \(max\/min 1\.33 < 1\.5, Δ4 > 2px\)$/,
  ],
  [
    'ls-colours',
    'line-style-budget',
    /^one line has 3 colours #111827, #6b7280, #2563eb \(limit 2\)$/,
  ],
]

for (const width of WIDTHS) {
  test.describe(`at ${width}px`, () => {
    let layout: Layout
    const judgeCase = (id: string, story = COMPONENT): Finding[] =>
      judge(caseLayout(layout, id), { story, fonts })

    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width, height: 2400 })
      await loadFixture(page, 'typography.html')
      layout = await collect(page)
    })

    for (const [id, story] of negatives) {
      test(`${id} gives no finding`, () => {
        expect(judgeCase(id, story)).toEqual([])
      })
    }

    for (const [id, kind, detail, story] of positives) {
      test(`${id} gives exactly one ${kind} finding`, () => {
        const found = judgeCase(id, story)
        expect(found).toHaveLength(1)
        expect(found[0].kind).toBe(kind)
        expect(found[0].selector.startsWith(`[data-testid="${id}"]`)).toBe(true)
        expect(found[0].detail).toMatch(detail)
      })
    }
  })
}
