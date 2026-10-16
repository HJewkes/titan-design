import { describe, expect, it } from 'vitest'
import { draftKey } from '../page/draftStore.ts'
import { createReducer, initialState, restoredState, type Action } from '../page/state.ts'
import { exampleManifest } from '../src/example.ts'
import { buildFeedback, draftShipBlocks, emptyDraft } from '../src/feedback.ts'
import { feedbackProblems } from '../src/round.ts'
import {
  ManifestSchema,
  type Answer,
  type Manifest,
  type ManifestInput,
} from '@titan-design/review-schema'
import { SHA } from './fixtures.ts'

const PR = 'owner/name#7'

/** The example round with a packet on q1: every option has details, and A is recommended. */
function packetRound(patch: Partial<ManifestInput> = {}): Manifest {
  const input = exampleManifest('http://127.0.0.1:6100')
  const [q1, ...rest] = input.questions
  input.questions = [
    {
      ...q1,
      page: PR,
      optionDetails: {
        A: { detail: 'Card first.', after: 'The card leads the page.' },
        B: { detail: 'Tiles first.', after: 'The tiles lead the page.' },
        C: { detail: 'Chart first.' },
      },
      recommendation: { answer: 'A', rationale: 'Reads first.', confidence: 0.8, by: 'agent' },
    },
    ...rest,
    {
      id: 'ship',
      kind: 'pick-one',
      prompt: 'Ship?',
      options: ['Ship', "Don't ship"],
      required: true,
      page: PR,
      merge: { repo: 'owner/name', pr: 7, headSha: '1'.repeat(40), ship: ['Ship'] },
    },
  ] as ManifestInput['questions']
  return ManifestSchema.parse({ ...input, ...patch })
}

const m = packetRound()

function q1After(round: Manifest, actions: Action[]): Answer | undefined {
  const reduce = createReducer(round)
  const state = actions.reduce(reduce, initialState(round))
  return buildFeedback(round, SHA, state.draft, new Date(0)).answers.find(
    (a) => a.questionId === 'q1'
  )
}

const pick = (option: string): Action => ({ type: 'pick', id: 'q1', option, many: false })
const reveal: Action = { type: 'reveal', id: 'q1' }
const note = (option: string, text: string): Action => ({
  type: 'optionNote',
  id: 'q1',
  option,
  note: text,
})

describe('an answer to a decision packet', () => {
  it("echoes the picked option's after, not the recommended one's", () => {
    expect(q1After(m, [pick('B')])?.after).toBe('The tiles lead the page.')
  })

  it('carries no after on a revision request', () => {
    const answer = q1After(m, [pick('none'), { type: 'answerComment', id: 'q1', comment: 'redo' }])
    expect(answer).toMatchObject({ revisionRequested: true })
    expect(answer).not.toHaveProperty('after')
  })

  it('drops a whitespace-only option note and keeps the rest in option order', () => {
    const answer = q1After(m, [pick('A'), note('C', 'too dense'), note('B', '   ')])
    expect(answer?.optionNotes).toEqual([{ option: 'C', note: 'too dense' }])
  })

  it('is rejected by the server when a note names a string that is not an option', () => {
    const feedback = buildFeedback(m, SHA, emptyDraft(m), new Date(0))
    feedback.answers = [
      { questionId: 'q1', pick: 'A', optionNotes: [{ option: 'Z', note: 'x' }] },
      { questionId: 'ship', pick: 'Ship' },
    ]
    expect(feedbackProblems(feedback, m)).toEqual(['q1: a note on "Z", which is not an option'])
  })

  it("is rejected when after is not the picked option's, or seen has no recommendation", () => {
    const feedback = buildFeedback(m, SHA, emptyDraft(m), new Date(0))
    feedback.answers = [
      { questionId: 'q1', pick: 'B', after: 'The card leads the page.' },
      { questionId: 'q2', recommendationSeen: true },
      { questionId: 'ship', pick: 'Ship' },
    ]
    expect(feedbackProblems(feedback, m)).toEqual([
      "q1: after is not the picked option's",
      'q2: recommendationSeen on a question with no recommendation',
    ])
  })

  it('blocks Ship on a PR group whose question carries only an option note', () => {
    const reduce = createReducer(m)
    const state = reduce(initialState(m), note('B', 'try a darker tile'))
    expect(draftShipBlocks(m, state.draft).find((g) => g.pr === PR)).toMatchObject({
      blocked: true,
      blockers: [{ questionId: 'q1', kind: 'free-text' }],
    })
  })
})

describe('the seen tag', () => {
  it('stays off when the pick came before the reveal', () => {
    expect(q1After(m, [pick('B'), reveal])).not.toHaveProperty('recommendationSeen')
  })

  it('is set when the pick came after the reveal', () => {
    expect(q1After(m, [reveal, pick('B')])?.recommendationSeen).toBe(true)
  })

  it('is set when a blind pick is changed after the reveal', () => {
    expect(q1After(m, [pick('B'), reveal, pick('C')])?.recommendationSeen).toBe(true)
  })

  it('stays set when the recommendation is hidden again, and clears with the answer', () => {
    expect(q1After(m, [reveal, pick('B'), reveal])?.recommendationSeen).toBe(true)
    const cleared = q1After(m, [reveal, pick('B'), pick('B'), note('A', 'maybe')])
    expect(cleared).not.toHaveProperty('recommendationSeen')
  })

  it("is set on every answer in a round whose recommendations are 'shown'", () => {
    const shown = packetRound({ recommendations: 'shown' })
    expect(q1After(shown, [pick('B')])?.recommendationSeen).toBe(true)
  })
})

describe('a stored draft', () => {
  it('restores when it was saved without notes, reveal or seen flags', () => {
    const draft = emptyDraft(m)
    draft.answers.q1 = { pick: 'B', comment: '' }
    const items = new Map([[draftKey(SHA), JSON.stringify(draft)]])
    const storage = {
      getItem: (k: string) => items.get(k) ?? null,
      setItem: () => undefined,
      removeItem: () => undefined,
    }
    expect(restoredState(m, SHA, storage).draft.answers.q1).toEqual({ pick: 'B', comment: '' })
  })
})
