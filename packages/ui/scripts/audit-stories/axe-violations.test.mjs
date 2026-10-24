/* global document, window */
import { createRequire } from 'node:module'
import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { AXE_VIOLATION_KIND, auditPage, axeWarnings, domChecks, tokenColours } from './checks.mjs'

const realAxe = createRequire(createRequire(import.meta.url).resolve('jest-axe'))('axe-core')

const emptyDom = { blockers: [], warnings: [], spacing: [], spacingVars: {}, metrics: {} }
const emptyLayout = { nodes: [], truncated: false, declared: {} }
// Runs the audit's in-page functions in jsdom; the layout-bound ones get empty results.
const jsdomPage = () => ({
  evaluate: async (fn, arg) => {
    if (fn === domChecks) return emptyDom
    if (fn === tokenColours) return {}
    if (fn.toString().includes('collectLayout')) return arg ? emptyLayout : true
    return fn(arg)
  },
})
const audit = () =>
  auditPage(jsdomPage(), {
    axeSource: '',
    spacingConfig: { px: [4], vars: [] },
    story: { id: 'components-atoms-sample--default', title: 'Components/Atoms/Sample' },
    fonts: {},
  })
const render = (html) => {
  document.body.innerHTML = `<main><div id="storybook-root">${html}</div></main>`
}
const axeFindings = (res, rule) =>
  res.warnings.filter((w) => w.kind === AXE_VIOLATION_KIND && w.axe_rule === rule)

describe('axe violations in the stories audit', () => {
  beforeAll(() => {
    window.axe = realAxe
  })
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('reports a rule other than color-contrast as a warning keyed by its axe rule id', async () => {
    render('<button type="button"></button>')

    const res = await audit()

    expect(axeFindings(res, 'button-name')).toEqual([
      expect.objectContaining({ impact: 'critical', selector: 'button' }),
    ])
    expect(res.blockers).toEqual([])
  })

  it('reports a field labelled by its placeholder alone through the axe label rule', async () => {
    render('<input type="text" placeholder="Search sessions" />')

    const res = await audit()

    expect(axeFindings(res, 'label').map((w) => w.selector)).toEqual(['input'])
  })

  it('accepts a field with a visible label beside its placeholder', async () => {
    render('<label for="q">Query</label><input id="q" type="text" placeholder="Search sessions" />')

    const res = await audit()

    expect(axeFindings(res, 'label')).toEqual([])
  })

  it('runs axe target-size and reports the largest unobscured rect of a failing target', async () => {
    const seen = []
    window.axe = {
      run: async (_root, options) => {
        seen.push(options)
        return targetSizeResult
      },
    }
    render('<button type="button">x</button>')

    const res = await audit()
    window.axe = realAxe

    expect(seen[0].rules['target-size']).toEqual({ enabled: true })
    expect(axeFindings(res, 'target-size')).toEqual([
      expect.objectContaining({
        selector: '.close',
        unobscured_rect: { width: 20, height: 12, obscured: true },
      }),
    ])
  })
})

// The shape axe-core 4.9 returns for a target overlapped by a neighbour (target-size-evaluate).
const targetSizeResult = {
  violations: [
    {
      id: 'target-size',
      impact: 'serious',
      help: 'All touch targets must be 24px large, or leave sufficient space',
      nodes: [
        {
          target: ['.close'],
          failureSummary: 'Fix any of the following:\n  Target has insufficient size',
          any: [
            {
              id: 'target-size',
              data: { messageKey: 'partiallyObscured', minSize: 24, width: 20, height: 12 },
            },
            { id: 'target-offset', data: { closestOffset: 14, minOffset: 24 } },
          ],
        },
      ],
    },
  ],
}

describe('axe warning mapping', () => {
  const violation = (id, count) => ({
    id,
    impact: 'serious',
    help: `${id} help`,
    nodes: Array.from({ length: count }, (_, i) => ({ target: `.n${i}`, summary: 'fix it' })),
  })

  it('leaves color-contrast to the contrast split', () => {
    expect(axeWarnings([violation('color-contrast', 2)])).toEqual([])
  })

  it('caps each axe rule at 25 nodes on its own', () => {
    const out = axeWarnings([violation('label', 30), violation('button-name', 3)])

    expect(out.filter((w) => w.axe_rule === 'label')).toHaveLength(25)
    expect(out.filter((w) => w.axe_rule === 'button-name')).toHaveLength(3)
  })

  it('names the rule, impact and failure in the detail', () => {
    const [finding] = axeWarnings([violation('list', 1)])

    expect(finding).toEqual({
      kind: AXE_VIOLATION_KIND,
      axe_rule: 'list',
      impact: 'serious',
      selector: '.n0',
      detail: 'list (serious): list help :: fix it',
    })
  })
})
