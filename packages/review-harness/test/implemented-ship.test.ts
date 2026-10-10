import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Form } from '../page/App.tsx'
import { createReducer, initialState, pagesFor } from '../page/state.ts'
import { SHIP_OPTIONS, ManifestSchema } from '@titan-design/review-schema'
import { MANIFEST_SCHEMA_ID } from '@titan-design/review-schema'

const HEAD = '1'.repeat(40)
const PR = 'owner/name#101'

const manifest = ManifestSchema.parse({
  schema: MANIFEST_SCHEMA_ID,
  unit: 'implemented-ship',
  round: 1,
  storybookUrl: 'http://127.0.0.1:6100',
  widths: [1280],
  variants: [],
  questions: [
    {
      id: 'format',
      kind: 'pick-one',
      decision: 'iterate',
      prompt: 'Which format?',
      options: ['Subtle', 'Outline'],
      implemented: 'Subtle',
      page: PR,
    },
    {
      id: 'ship',
      kind: 'pick-one',
      decision: 'ship',
      prompt: 'Ship it?',
      options: [...SHIP_OPTIONS],
      required: true,
      page: PR,
      merge: { repo: 'owner/name', pr: 101, headSha: HEAD, ship: ['Ship'] },
    },
  ],
})

const reduce = createReducer(manifest)
const html = (state: ReturnType<typeof initialState>) =>
  renderToStaticMarkup(
    createElement(Form, { manifest, state, dispatch: () => {}, onHitTesting: () => {} })
  )
const answered = (format: { pick?: string; comment?: string }) => {
  const state = initialState(manifest)
  return {
    ...state,
    draft: {
      ...state.draft,
      answers: { ...state.draft.answers, format: { comment: '', ...format } },
    },
  }
}

describe('the harness Ship control', () => {
  it('is enabled while every answer is the implemented option with no text', () => {
    const markup = html(answered({ pick: 'Subtle' }))
    expect(markup).not.toContain('ship-blocked-ship')
    expect(markup).not.toContain('disabled')
  })

  it('is disabled, with the reason, after a pick that is not the implemented option', () => {
    const markup = html(answered({ pick: 'Outline' }))
    expect(markup).toContain('data-testid="ship-blocked-ship"')
    expect(markup).toContain('picked &quot;Outline&quot;, but the PR implements &quot;Subtle&quot;')
    expect(markup).toMatch(/<button[^>]*disabled=""[^>]*>[^]*?Ship<\/button>/)
  })

  it('is disabled by free text on any question of the PR group', () => {
    const markup = html(answered({ pick: 'Subtle', comment: 'tighten the gap' }))
    expect(markup).toContain('question format: has a written comment')
  })

  it('refuses a Ship pick while the group is blocked, and accepts it once it is not', () => {
    const blocked = answered({ pick: 'Outline' })
    const refused = reduce(blocked, { type: 'pick', id: 'ship', option: 'Ship', many: false })
    expect(refused.draft.answers.ship.pick).toBeUndefined()
    const clear = answered({ pick: 'Subtle' })
    const taken = reduce(clear, { type: 'pick', id: 'ship', option: 'Ship', many: false })
    expect(taken.draft.answers.ship.pick).toBe('Ship')
  })
})

describe('the harness Ship control on a stacked group', () => {
  const head = (n: number) => String(n % 10).repeat(40)
  const shipOf = (n: number) => ({
    id: `ship-${n}`,
    kind: 'pick-one',
    decision: 'ship',
    prompt: `Ship #${n}?`,
    options: [...SHIP_OPTIONS],
    required: true,
    page: `owner/name#${n}`,
    merge: { repo: 'owner/name', pr: n, headSha: head(n), ship: ['Ship'] },
  })
  const stacked = ManifestSchema.parse({
    ...manifest,
    questions: [shipOf(800), shipOf(808)],
    sections: [800, 808].map((n) => ({
      id: `s${n}`,
      title: `#${n}`,
      questionIds: [`ship-${n}`],
      variantKeys: [],
    })),
    prGroups: [
      { pr: 'owner/name#800', headSha: head(800), sectionIds: ['s800'] },
      {
        pr: 'owner/name#808',
        headSha: head(808),
        sectionIds: ['s808'],
        stackedOn: { repo: 'owner/name', pr: 800, headSha: head(800) },
      },
    ],
  })
  const dependentPage = pagesFor(stacked).find((p) => p.sectionIds.includes('s808'))!.first
  const render = (holder?: string) => {
    const state = initialState(stacked)
    const answers = { ...state.draft.answers, 'ship-800': { comment: '', pick: holder } }
    return renderToStaticMarkup(
      createElement(Form, {
        manifest: stacked,
        state: { ...state, active: dependentPage, draft: { ...state.draft, answers } },
        dispatch: () => {},
        onHitTesting: () => {},
      })
    )
  }

  it('shows "ships after #N" on the dependent Ship only', () => {
    const markup = render()
    expect(markup).toContain('data-testid="ships-after-ship-808"')
    expect(markup).toContain('ships after #800')
    expect(markup).not.toContain('ships-after-ship-800')
    expect(markup).not.toContain('ship-blocked-ship-808')
  })

  it("is disabled, naming the holder, while the holder is answered Don't ship", () => {
    const markup = render("Don't ship")
    expect(markup).toContain('data-testid="ship-blocked-ship-808"')
    expect(markup).toContain('stacked on owner/name#800, which may not ship')
  })

  it('stays enabled once the holder is answered Ship', () => {
    expect(render('Ship')).not.toContain('ship-blocked-ship-808')
  })
})
