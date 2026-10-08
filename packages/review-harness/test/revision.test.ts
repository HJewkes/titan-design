import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Form } from '../page/App.tsx'
import { createReducer, initialState, numberKeyAction } from '../page/state.ts'
import { buildFeedback, draftAnswer, emptyDraft, unansweredQuestionIds } from '../src/feedback.ts'
import { feedbackProblems, normalizeFeedback } from '../src/round.ts'
import { FeedbackSchema, ManifestSchema, type ManifestInput } from '../src/schema.ts'
import { SHA, manifest, sectionedInput } from './fixtures.ts'

const NOW = new Date('2026-10-05T00:00:00Z')
const base = JSON.parse(JSON.stringify(manifest())) as ManifestInput
// The example round names its own revision option; these tests start from one that does not.
delete (base.questions[0] as { revisionOption?: string }).revisionOption
const m = ManifestSchema.parse(base)
const reduce = createReducer(m)
const build = (m2 = m, draft = emptyDraft(m2)) => buildFeedback(m2, SHA, draft, NOW)
const q1 = () =>
  numberKeyAction(
    m,
    { kind: 'question', id: 'q1' },
    String(m.questions[0].kind === 'pick-one' ? m.questions[0].options.length + 1 : 0)
  )

describe('the built-in revision option', () => {
  it('records a normal pick as a pick', () => {
    const state = reduce(initialState(m), { type: 'pick', id: 'q1', option: 'A', many: false })
    const fb = build(m, state.draft)
    expect(fb.answers[0]).toEqual({ questionId: 'q1', pick: 'A' })
    expect(feedbackProblems(fb, m)).not.toContain('q1: a revision request needs a comment')
  })

  it('records a revision with a comment as revisionRequested, not a pick', () => {
    const action = q1()
    expect(action).toEqual({ type: 'revision', id: 'q1' })
    let state = reduce(initialState(m), { type: 'pick', id: 'q1', option: 'A', many: false })
    state = reduce(state, action!)
    state = reduce(state, { type: 'answerComment', id: 'q1', comment: 'Try a calmer header' })
    const fb = build(m, state.draft)
    expect(fb.answers[0]).toEqual({
      questionId: 'q1',
      revisionRequested: true,
      comment: 'Try a calmer header',
    })
    expect(feedbackProblems(fb, m)).toEqual([])
    expect(unansweredQuestionIds(m, state.draft)).not.toContain('q1')
    expect(FeedbackSchema.parse(JSON.parse(JSON.stringify(fb)))).toEqual(fb)
  })

  it('blocks a revision without a comment', () => {
    const state = reduce(initialState(m), q1()!)
    const fb = build(m, state.draft)
    expect(feedbackProblems(fb, m)).toContain('q1: a revision request needs a comment')
  })

  it('picking an option afterwards clears the revision', () => {
    let state = reduce(initialState(m), q1()!)
    state = reduce(state, { type: 'pick', id: 'q1', option: 'B', many: false })
    expect(build(m, state.draft).answers[0]).toEqual({ questionId: 'q1', pick: 'B' })
  })

  it('rejects an answer that is both a pick and a revision', () => {
    const fb = build()
    fb.answers = [{ questionId: 'q1', pick: 'A', revisionRequested: true, comment: 'x' }]
    expect(feedbackProblems(fb, m)).toContain('q1: a revision request is not a pick')
  })

  it('marks a revision as disagreeing with the recommendation', () => {
    const input = {
      ...(JSON.parse(JSON.stringify(m)) as ManifestInput),
    }
    input.questions[0] = {
      ...input.questions[0],
      recommendation: { answer: 'A', rationale: 'r', confidence: 0.9, by: 'x' },
    } as never
    const withRec = ManifestSchema.parse(input)
    let state = reduce(initialState(withRec), q1()!)
    state = createReducer(withRec)(state, { type: 'answerComment', id: 'q1', comment: 'no' })
    expect(build(withRec, state.draft).answers[0]).toMatchObject({
      revisionRequested: true,
      agreed: false,
    })
  })
})

describe('a revision in a round whose options stand for frames', () => {
  it('leaves no linked frame chosen', () => {
    const input = sectionedInput()
    delete (input.questions[0] as { revisionOption?: string }).revisionOption
    const sec = ManifestSchema.parse(input)
    const reduceSec = createReducer(sec)
    let state = reduceSec(initialState(sec), { type: 'pick', id: 'q1', option: 'A', many: false })
    expect(state.draft.variants.A.verdict).toBe('chosen')
    state = reduceSec(state, { type: 'revision', id: 'q1' })
    state = reduceSec(state, { type: 'answerComment', id: 'q1', comment: 'redo' })
    const fb = build(sec, state.draft)
    expect(fb.answers[0]).toMatchObject({ revisionRequested: true })
    expect(fb.variants.map((v) => v.verdict)).not.toContain('chosen')
  })
})

describe("a round's own revision option in a round whose options stand for frames", () => {
  it('leaves no linked frame chosen', () => {
    const input = sectionedInput()
    input.questions[0] = { ...input.questions[0], revisionOption: 'none' } as never
    const sec = ManifestSchema.parse(input)
    const reduceSec = createReducer(sec)
    let state = reduceSec(initialState(sec), { type: 'pick', id: 'q1', option: 'A', many: false })
    state = reduceSec(state, { type: 'pick', id: 'q1', option: 'none', many: false })
    state = reduceSec(state, { type: 'answerComment', id: 'q1', comment: 'redo' })
    const fb = build(sec, state.draft)
    expect(fb.answers[0]).toMatchObject({ revisionRequested: true })
    expect(fb.variants.map((v) => v.verdict)).not.toContain('chosen')
  })
})

describe('the revision option is offered only where it applies', () => {
  const html = (mm = m) =>
    renderToStaticMarkup(
      createElement(Form, {
        manifest: mm,
        state: initialState(mm),
        dispatch: () => {},
        onHitTesting: () => {},
      })
    )

  it('renders as the last choice of a required pick-one', () => {
    const q = html().split('data-testid="question-q1"')[1].split('data-testid="question-q2"')[0]
    expect(q).toContain('None of these, request a revision')
    expect(q.indexOf('None of these')).toBeGreaterThan(q.indexOf('none</button>'))
  })

  it('is not offered on optional or pick-many questions', () => {
    const q2 = html().split('data-testid="question-q2"')[1]
    expect(q2).not.toContain('request a revision')
  })

  it('is not doubled when the round names its own revision option', () => {
    const input = JSON.parse(JSON.stringify(m)) as ManifestInput
    input.questions[0] = { ...input.questions[0], revisionOption: 'none' } as never
    const own = ManifestSchema.parse(input)
    expect(html(own)).not.toContain('request a revision')
    expect(numberKeyAction(own, { kind: 'question', id: 'q1' }, '5')).toBeNull()
    let state = createReducer(own)(initialState(own), {
      type: 'pick',
      id: 'q1',
      option: 'none',
      many: false,
    })
    state = createReducer(own)(state, { type: 'answerComment', id: 'q1', comment: 'redo' })
    expect(build(own, state.draft).answers[0]).toEqual({
      questionId: 'q1',
      revisionRequested: true,
      comment: 'redo',
    })
  })

  it('refuses a revisionOption that is not one of the options', () => {
    const input = JSON.parse(JSON.stringify(m)) as ManifestInput
    input.questions[0] = { ...input.questions[0], revisionOption: 'zzz' } as never
    expect(() => ManifestSchema.parse(input)).toThrow(/revisionOption.*zzz/)
  })
})

describe('every reader agrees on what a revision request is', () => {
  const own = ManifestSchema.parse(manifest())
  const ownBuild = (answers: object[]) =>
    ({ ...buildFeedback(own, SHA, emptyDraft(own), NOW), answers }) as never

  it("refuses the round's own revision option sent as a pick without a comment", () => {
    const fb = ownBuild([{ questionId: 'q1', pick: 'none' }])
    expect(feedbackProblems(fb, own)).toContain('q1: a revision request needs a comment')
  })

  it("stores the round's own revision option sent as a pick as a revision request", () => {
    const fb = ownBuild([{ questionId: 'q1', pick: 'none', comment: 'redo' }])
    expect(feedbackProblems(fb, own)).toEqual([])
    expect(normalizeFeedback(fb, own).answers[0]).toEqual({
      questionId: 'q1',
      revisionRequested: true,
      comment: 'redo',
    })
  })

  it('drops a stale built-in revision on a question that now names its own option', () => {
    expect(draftAnswer(own.questions[0], { revision: true, comment: 'x' })).toEqual({
      questionId: 'q1',
    })
  })

  it('refuses a revision request on a pick-one that offers none', () => {
    const input = JSON.parse(JSON.stringify(base)) as ManifestInput
    input.questions[0] = { ...input.questions[0], required: false } as never
    const optional = ManifestSchema.parse(input)
    expect(draftAnswer(optional.questions[0], { revision: true, comment: 'x' })).toEqual({
      questionId: 'q1',
    })
    const fb = {
      ...build(optional),
      answers: [{ questionId: 'q1', revisionRequested: true as const, comment: 'x' }],
    }
    expect(feedbackProblems(fb, optional)).toContain('q1: this question offers no revision request')
  })
})
