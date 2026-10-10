import { readFileSync } from 'node:fs'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Form } from '../page/App.tsx'
import { createReducer, initialState, type ReviewState } from '../page/state.ts'
import { diffFrames, tabBadges } from '../src/pr-tabs.ts'
import { draftShipBlocks } from '../src/feedback.ts'
import { RoundSchema, lintRound, type Manifest } from '@titan-design/review-schema'
import { sectioned } from './fixtures.ts'

const fixture = new URL('./fixtures/pr-tabs/round.json', import.meta.url)
const manifest = RoundSchema.parse(JSON.parse(readFileSync(fixture, 'utf8')))
const group = manifest.prGroups![0]
const reduce = createReducer(manifest)

const render = (state: ReviewState, m: Manifest = manifest) =>
  renderToStaticMarkup(
    createElement(Form, { manifest: m, state, dispatch: () => {}, onHitTesting: () => {} })
  )

/** The markup from an element's opening tag marker to the next marker, so a test reads one region. */
const region = (markup: string, from: string, to: string) => {
  const start = markup.indexOf(from)
  expect(start).toBeGreaterThan(-1)
  const end = markup.indexOf(to, start)
  return markup.slice(start, end === -1 ? undefined : end)
}

const asBuilt = initialState(manifest)
const enabled: ReviewState = {
  ...asBuilt,
  draft: {
    ...asBuilt.draft,
    answers: {
      ...asBuilt.draft.answers,
      'pill-format': { pick: 'Filled', comment: '' },
    },
  },
}
const blocked: ReviewState = {
  ...enabled,
  draft: {
    ...enabled.draft,
    answers: {
      ...enabled.draft.answers,
      'row-spacing': { pick: 'Gap inline-md', comment: 'The gap reads loose at 1280.' },
    },
  },
}
const onTab = (state: ReviewState, tab: ReviewState['tab']) => reduce(state, { type: 'tab', tab })

describe('the PR tabs fixture round', () => {
  it('passes the round contract and every layout rule', () => {
    expect(lintRound(manifest)).toEqual([])
  })

  it('heads the page with the PR, its short head and its kind, then three tabs', () => {
    const markup = render(enabled)
    expect(markup).toContain('example/widgets#42')
    expect(markup).toContain('title="4242424242424242424242424242424242424242">4242424</code>')
    expect(markup).toContain('<span class="pr-kind">feature</span>')
    expect(markup.match(/role="tab"/g)).toHaveLength(3)
  })
})

describe('the Ship bar (owner item 166)', () => {
  it('enables Ship with a question still unanswered, and says it does not block', () => {
    const bar = region(render(enabled), 'data-testid="ship-bar"', '</aside>')
    expect(bar).toContain('Ship enabled.')
    expect(bar).toContain('1 question(s) still open, which do not block.')
    expect(bar).not.toMatch(/data-testid="ship-bar-Ship"[^>]*disabled/)
  })

  it('withholds Ship on a free-text answer and links the change request to its question', () => {
    const bar = region(render(blocked), 'data-testid="ship-bar"', '</aside>')
    expect(bar).toContain('Ship withheld.')
    expect(bar).toContain(
      '<a href="#question-row-spacing">question row-spacing: has a written comment</a>'
    )
    expect(bar).toMatch(
      /disabled=""[^>]*data-testid="ship-bar-Ship"|data-testid="ship-bar-Ship"[^>]*disabled=""/
    )
  })

  it('withholds Ship on a pick other than the implemented one', () => {
    const outline: ReviewState = {
      ...asBuilt,
      draft: {
        ...asBuilt.draft,
        answers: { ...asBuilt.draft.answers, 'pill-format': { pick: 'Outline', comment: '' } },
      },
    }
    expect(render(outline)).toContain(
      'picked &quot;Outline&quot;, but the PR implements &quot;Filled&quot;'
    )
  })

  it('shows under every tab', () => {
    for (const tab of ['review', 'diff', 'context'] as const)
      expect(render(onTab(blocked, tab))).toContain('data-testid="ship-bar"')
  })

  it('answers the same Ship question as the Review block', () => {
    const shipped = reduce(enabled, { type: 'pick', id: 'ship-42', option: 'Ship', many: false })
    expect(shipped.draft.answers['ship-42'].pick).toBe('Ship')
    const bar = region(render(shipped), 'data-testid="ship-bar"', '</aside>')
    expect(bar).toMatch(/aria-checked="true"[^>]*data-testid="ship-bar-Ship"/)
  })
})

describe('the tab badges', () => {
  it('count open questions and change requests on Review, frames on Diff', () => {
    const status = draftShipBlocks(manifest, blocked.draft).find((g) => g.pr === group.pr)
    expect(tabBadges(manifest, group, status)).toEqual({ open: 0, changes: 1, frames: 3 })
    const tabs = region(render(blocked), 'role="tablist"', 'role="tabpanel"')
    expect(tabs).toContain('aria-label="1 changes"')
    expect(tabs).toContain('aria-label="3 frames"')
  })
})

describe('the Review, Diff and Context tabs', () => {
  it('asks every question in Review and none in Diff or Context', () => {
    const review = region(render(enabled), 'id="tabpanel-review"', 'data-testid="ship-bar"')
    for (const id of ['pill-format', 'row-spacing', 'ship-42'])
      expect(review).toContain(`data-testid="question-${id}"`)
    for (const tab of ['diff', 'context'] as const) {
      const panel = region(
        render(onTab(enabled, tab)),
        `id="tabpanel-${tab}"`,
        'data-testid="ship-bar"'
      )
      expect(panel).not.toMatch(/<textarea|role="radio"|data-testid="question-/)
    }
  })

  it('keeps Review mounted but hidden on another tab, so frames do not reload', () => {
    const markup = render(onTab(enabled, 'diff'))
    expect(markup).toMatch(/id="tabpanel-review"[^>]*hidden=""/)
  })

  it('sets base beside head in Diff, with the change class and a link to the Review block', () => {
    expect(diffFrames(manifest, group).map((v) => v.key)).toEqual([
      'pill-built',
      'pill-outline',
      'row',
    ])
    const diff = region(
      render(onTab(enabled, 'diff')),
      'id="tabpanel-diff"',
      'data-testid="ship-bar"'
    )
    expect(diff).toContain('src="api/image/row.base"')
    expect(diff).toContain('src="api/image/row"')
    expect(diff).toContain('New at head: not on base')
    expect(diff).toContain('<a href="#variant-row">Its Review block</a>')
  })

  it('shows the description, task, codewatch report and files in Context', () => {
    const context = region(
      render(onTab(enabled, 'context')),
      'id="tabpanel-context"',
      'data-testid="ship-bar"'
    )
    expect(context).toContain('Task EX-1: Outline Pill')
    expect(context).toContain('Done when')
    expect(context).toContain('Codewatch report')
    expect(context).toContain('Files changed (3)')
    expect(context).toContain('<code>src/components/ui/pill/Pill.tsx</code>')
  })

  it('goes back to Review when a link or the keyboard moves to a stop', () => {
    const jumped = reduce(onTab(enabled, 'diff'), { type: 'jump', index: 0 })
    expect(jumped.tab).toBe('review')
    expect(reduce(onTab(enabled, 'context'), { type: 'advance' }).tab).toBe('review')
  })
})

describe('older rounds', () => {
  it('render without tabs or a Ship bar when the round names no PR group', () => {
    const old = sectioned()
    const markup = render(initialState(old), old)
    expect(markup).not.toContain('role="tablist"')
    expect(markup).not.toContain('data-testid="ship-bar"')
  })
})
