import { describe, expect, it } from 'vitest'
import { buildFeedback, emptyDraft } from '../src/feedback.ts'
import {
  frameHeight,
  linksForVariant,
  optionVariants,
  questionsForVariant,
  roundLayout,
} from '../src/sections.ts'
import { ManifestSchema, type Manifest, type ManifestInput } from '../src/schema.ts'
import { createReducer, initialState, stopsFor } from '../page/state.ts'
import { SHA, manifest, sectioned, sectionedInput } from './fixtures.ts'

const errors = (input: ManifestInput) => {
  const result = ManifestSchema.safeParse(input)
  return result.success ? [] : result.error.issues.map((i) => i.message)
}

const stopNames = (m: Manifest) =>
  stopsFor(m).map((s) => (s.kind === 'variant' ? s.key : s.kind === 'question' ? s.id : s.kind))

describe('sections', () => {
  it('reads each section as its questions then its frames, leftovers last', () => {
    const layout = roundLayout(sectioned())
    expect(layout.sections.map((s) => s.id)).toEqual(['lead'])
    expect(layout.sections[0].questions.map((q) => q.id)).toEqual(['q1', 'q2'])
    expect(layout.sections[0].variants.map((v) => v.key)).toEqual(['A', 'B'])
    expect(layout.otherVariants.map((v) => v.key)).toEqual(['C'])
    expect(layout.overallQuestions.map((q) => q.id)).toEqual(['q3', 'q4'])
  })

  it('puts a section question ahead of its frames in the keyboard order', () => {
    expect(stopNames(sectioned())).toEqual(['q1', 'q2', 'A', 'B', 'C', 'q3', 'q4', 'general'])
  })

  it('leaves a manifest without sections in exactly the order it had', () => {
    const m = manifest()
    expect(roundLayout(m).sections).toEqual([])
    expect(stopNames(m)).toEqual(['A', 'B', 'C', 'q1', 'q2', 'q3', 'q4', 'general'])
  })

  it('names the questions a frame is shown for, and nothing for an unsectioned round', () => {
    expect(questionsForVariant(sectioned(), 'A')).toEqual(['q1', 'q2'])
    expect(questionsForVariant(sectioned(), 'C')).toEqual([])
    expect(questionsForVariant(manifest(), 'A')).toEqual([])
  })
})

describe('frame heights', () => {
  it('resolves variant over section over round', () => {
    const input = sectionedInput()
    input.height = 700
    input.sections![0].height = 500
    input.variants[0].height = 300
    const m = ManifestSchema.parse(input)
    expect(frameHeight(m, m.variants[0])).toBe(300)
    expect(frameHeight(m, m.variants[1])).toBe(500)
    expect(frameHeight(m, m.variants[2])).toBe(700)
  })

  it('fits every frame to its story when no height is given anywhere', () => {
    const { height: _height, ...rest } = sectionedInput()
    const m = ManifestSchema.parse(rest)
    expect(m.height).toBe('auto')
    expect(m.maxHeight).toBe(1200)
    expect(m.variants.map((v) => frameHeight(m, v))).toEqual(['auto', 'auto', 'auto'])
  })

  it('takes "auto" on one variant of a fixed-height round', () => {
    const input = sectionedInput()
    input.height = 700
    input.variants[0].height = 'auto'
    const m = ManifestSchema.parse(input)
    expect(frameHeight(m, m.variants[0])).toBe('auto')
  })
})

describe('option to variant mapping', () => {
  it('maps an option to the frame it stands for inside a section', () => {
    expect([...optionVariants(sectioned(), sectioned().questions[0])]).toEqual([
      ['A', 'A'],
      ['B', 'B'],
    ])
  })

  it('never infers a mapping for a round without sections', () => {
    const m = manifest()
    expect([...optionVariants(m, m.questions[0])]).toEqual([])
  })

  it('takes an explicit mapping whose options are not variant keys', () => {
    const input = sectionedInput()
    input.questions[0] = {
      id: 'q1',
      kind: 'pick-one',
      prompt: 'Which one leads the page?',
      options: ['the tall one', 'the wide one'],
      optionVariants: { 'the tall one': 'A', 'the wide one': 'B' },
      required: true,
    }
    input.sections![0].questionIds = ['q1']
    const m = ManifestSchema.parse(input)
    expect([...optionVariants(m, m.questions[0])]).toEqual([
      ['the tall one', 'A'],
      ['the wide one', 'B'],
    ])
    expect(linksForVariant(m, 'A').map((l) => l.option)).toEqual(['the tall one'])
  })
})

describe('picking a variant and answering are one action', () => {
  const m = sectioned()
  const reduce = createReducer(m)

  it('sets the chosen verdict from a pick, and moves it when the pick moves', () => {
    let state = reduce(initialState(m), { type: 'pick', id: 'q1', option: 'A', many: false })
    expect(state.draft.variants.A.verdict).toBe('chosen')
    state = reduce(state, { type: 'pick', id: 'q1', option: 'B', many: false })
    expect(state.draft.variants.A.verdict).toBeNull()
    expect(state.draft.variants.B.verdict).toBe('chosen')
  })

  it('clears the verdict when the same pick is pressed again', () => {
    let state = reduce(initialState(m), { type: 'pick', id: 'q1', option: 'A', many: false })
    state = reduce(state, { type: 'pick', id: 'q1', option: 'A', many: false })
    expect(state.draft.answers.q1.pick).toBeUndefined()
    expect(state.draft.variants.A.verdict).toBeNull()
  })

  it('answers the single-choice question when a frame is marked chosen, and clears it again', () => {
    let state = reduce(initialState(m), { type: 'verdict', key: 'B', verdict: 'chosen' })
    expect(state.draft.answers.q1.pick).toBe('B')
    state = reduce(state, { type: 'verdict', key: 'B', verdict: 'rejected' })
    expect(state.draft.answers.q1.pick).toBeUndefined()
  })

  it('treats a multi-select question as a set in both directions', () => {
    let state = reduce(initialState(m), { type: 'pick', id: 'q2', option: 'A', many: true })
    state = reduce(state, { type: 'verdict', key: 'B', verdict: 'chosen' })
    expect(state.draft.answers.q2.picks).toEqual(['A', 'B'])
    expect(state.draft.variants.A.verdict).toBe('chosen')
    state = reduce(state, { type: 'pick', id: 'q2', option: 'A', many: true })
    expect(state.draft.answers.q2.picks).toEqual(['B'])
    expect(state.draft.variants.A.verdict).toBeNull()
  })

  it('leaves verdicts and picks independent in a round without sections', () => {
    const plain = manifest()
    const state = createReducer(plain)(initialState(plain), {
      type: 'pick',
      id: 'q1',
      option: 'A',
      many: false,
    })
    expect(state.draft.answers.q1.pick).toBe('A')
    expect(state.draft.variants.A.verdict).toBeNull()
  })
})

describe('a comment on a frame reaches its question', () => {
  it('links the comment both ways in the written feedback', () => {
    const m = sectioned()
    const draft = emptyDraft(m)
    draft.variants.A = { verdict: null, comment: 'the number is too quiet', annotations: [] }
    draft.answers.q1 = { pick: 'B', comment: '' }
    const feedback = buildFeedback(m, SHA, draft, new Date('2026-09-20T00:00:00Z'))
    expect(feedback.answers[0]).toEqual({
      questionId: 'q1',
      pick: 'B',
      variantComments: [{ key: 'A', comment: 'the number is too quiet' }],
    })
    expect(feedback.variants[0].relatedQuestionIds).toEqual(['q1', 'q2'])
    expect(feedback.variants[0].comment).toBe('the number is too quiet')
  })

  it('keeps a question that was only commented on through its frames', () => {
    const m = sectioned()
    const draft = emptyDraft(m)
    draft.variants.B = { verdict: null, comment: 'crowded at 360', annotations: [] }
    const feedback = buildFeedback(m, SHA, draft, new Date())
    expect(feedback.answers.map((a) => a.questionId)).toEqual(['q1', 'q2'])
  })

  it('adds nothing to the feedback of a round without sections', () => {
    const m = manifest()
    const draft = emptyDraft(m)
    draft.variants.A = { verdict: 'chosen', comment: 'keep it', annotations: [] }
    const feedback = buildFeedback(m, SHA, draft, new Date())
    expect(feedback.answers).toEqual([])
    expect(feedback.variants[0]).not.toHaveProperty('relatedQuestionIds')
  })
})

describe('validation', () => {
  it('names an unknown variant, an unknown question and a duplicate section id', () => {
    const input = sectionedInput()
    input.sections = [
      { id: 'lead', title: 'Lead', questionIds: ['q1'], variantKeys: ['A', 'Z'] },
      { id: 'lead', title: 'Again', questionIds: ['nope'], variantKeys: ['B'] },
    ]
    expect(errors(input)).toEqual([
      'section lead: unknown variant Z',
      'section lead: unknown question nope',
      'duplicate section id lead',
    ])
  })

  it('refuses one frame or question claimed by two sections', () => {
    const input = sectionedInput()
    input.sections = [
      { id: 'one', title: 'One', questionIds: ['q1'], variantKeys: ['A'] },
      { id: 'two', title: 'Two', questionIds: ['q1'], variantKeys: ['A'] },
    ]
    expect(errors(input)).toEqual([
      'variant A is in two sections',
      'question q1 is in two sections',
    ])
  })

  it('accepts a frame named by seeAlso that lives in another section', () => {
    const input = sectionedInput()
    input.sections = [
      { id: 'one', title: 'One', questionIds: ['q1'], variantKeys: ['A'] },
      { id: 'two', title: 'Two', questionIds: ['q2'], variantKeys: ['B'], seeAlso: ['A'] },
    ]
    const m = ManifestSchema.parse(input)
    expect(roundLayout(m).sections[1].seeAlso.map((v) => v.key)).toEqual(['A'])
  })

  it('refuses an optionVariants entry that is not an option or not a variant', () => {
    const input = sectionedInput()
    input.questions[0] = {
      id: 'q1',
      kind: 'pick-one',
      prompt: 'Which?',
      options: ['A', 'B'],
      optionVariants: { A: 'Z', missing: 'B' },
    }
    expect(errors(input)).toEqual([
      'question q1: optionVariants points at unknown variant Z',
      'question q1: "missing" is not one of its options',
    ])
  })

  it('refuses a frame height below the minimum and a non-numeric one', () => {
    const input = sectionedInput()
    input.variants[0].height = 10
    expect(errors(input).length).toBeGreaterThan(0)
    input.variants[0].height = 'fit' as unknown as number
    expect(errors(input).length).toBeGreaterThan(0)
  })
})
