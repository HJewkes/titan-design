import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Form } from '../page/App.tsx'
import { createReducer, initialState } from '../page/state.ts'
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
