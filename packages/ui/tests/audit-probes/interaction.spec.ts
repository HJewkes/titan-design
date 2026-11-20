import { readFileSync } from 'node:fs'
import path from 'node:path'
import { test, expect } from '@playwright/test'
import { runInteraction } from '../../scripts/audit-stories/interaction.mjs'

type Finding = { kind: string; selector: string; detail: string }
type Run = { findings: Finding[]; targets: number; ms: number }

const sel = (id: string) => `[data-testid="${id}"]`

// Each case's exact findings. A ringless focus also looks like rest, and a covered button cannot be
// hovered or pressed, so it looks the same as rest in those states.
const expected: [string, [string, RegExp][]][] = [
  ['ix-plain', [['state-no-change', /^hover, press look the same as rest \(/]]],
  [
    'ix-margin',
    [['state-shift', /^hover moves \[data-testid="ix-margin-sibling"\] by 8px \(limit 1px\)$/]],
  ],
  ['ix-good', []],
  [
    'ix-no-ring',
    [
      ['focus-ring-missing', /^no focus indicator: outline, box-shadow and border match rest$/],
      ['state-no-change', /^focus looks the same as rest \(/],
    ],
  ],
  [
    'ix-clipped',
    [
      [
        'focus-ring-clipped',
        /^outline ring clipped by 4px at \[data-testid="ix-clip-box"\] \(limit 0px\)$/,
      ],
    ],
  ],
  [
    'ix-tooltip',
    [['hover-only-content', /^hover shows "Only on hover"; keyboard focus does not$/]],
  ],
  ['ix-tooltip-ok', []],
  [
    'ix-covered',
    [
      [
        'focus-ring-obscured',
        /^none of 5 sampled points is topmost; covered by \[data-testid="ix-cover"\]$/,
      ],
      ['state-no-change', /^hover, press look the same as rest \(/],
    ],
  ],
]

// One driven page for the file: the driver walks every case, so the tests share its result.
test.describe.configure({ mode: 'default' })

let run: Run

test.beforeAll(async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 } })
  const html = readFileSync(path.join(__dirname, 'fixtures', 'interaction.html'), 'utf8')
  await page.setContent(html)
  run = (await runInteraction(page)) as Run
  console.log(`interaction driver: ${run.targets} targets in ${run.ms}ms`)
  await page.close()
})

test('Tabs through every focusable in the story root', () => {
  expect(run.targets).toBe(expected.length)
})

for (const [id, findings] of expected) {
  test(`${id} gives ${findings.length ? findings.map(([k]) => k).join(' and ') : 'no finding'}`, () => {
    const found = run.findings
      .filter((f) => f.selector === sel(id))
      .sort((a, b) => a.kind.localeCompare(b.kind))

    expect(found.map((f) => f.kind)).toEqual(findings.map(([kind]) => kind))
    findings.forEach(([, detail], i) => expect(found[i].detail).toMatch(detail))
  })
}
