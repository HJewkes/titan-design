import { mkdtemp, writeFile } from 'node:fs/promises'
import { readdirSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Form } from '../page/App.tsx'
import { initialState, recommendationVisible, type ReviewState } from '../page/state.ts'
import { calibrationReport } from '../src/calibration.ts'
import { exampleManifest } from '../src/example.ts'
import { buildFeedback, emptyDraft, type ReviewDraft } from '../src/feedback.ts'
import { runCli, type CliIo } from '../src/run.ts'
import {
  FeedbackSchema,
  ManifestSchema,
  type Feedback,
  type ManifestInput,
  type Recommendation,
} from '@titan-design/review-schema'
import { SHA, manifest, validFeedback } from './fixtures.ts'

const rec = (answer: Recommendation['answer'], confidence = 0.8): Recommendation => ({
  answer,
  rationale: 'Reads first at wall distance.',
  confidence,
  by: 'design-coord',
})

/** The example round with a recommendation on q1 (pick-one), q2 (pick-many) and q3 (scale). */
function recommendedInput(): ManifestInput {
  const input = exampleManifest('http://127.0.0.1:6100')
  const [q1, q2, q3, q4] = input.questions
  input.questions = [
    { ...q1, recommendation: rec('A') },
    { ...q2, recommendation: rec(['A', 'C'], 0.6) },
    { ...q3, recommendation: rec(4, 0.3) },
    q4,
  ] as ManifestInput['questions']
  return input
}

const recommended = (patch: Partial<ManifestInput> = {}) =>
  ManifestSchema.parse({ ...recommendedInput(), ...patch })

const messages = (input: unknown) => {
  const result = ManifestSchema.safeParse(input)
  return result.success ? [] : result.error.issues.map((i) => i.message)
}

function withQuestion(index: number, patch: Record<string, unknown>): ManifestInput {
  const input = recommendedInput()
  input.questions[index] = { ...input.questions[index], ...patch } as never
  return input
}

describe('a recommendation in the round manifest', () => {
  it('is accepted on pick-one, pick-many and scale questions', () => {
    const m = recommended()
    expect(m.questions.map((q) => (q.kind === 'text' ? undefined : q.recommendation))).toEqual([
      rec('A'),
      rec(['A', 'C'], 0.6),
      rec(4, 0.3),
      undefined,
    ])
    expect(m.recommendations).toBe('after-answer')
  })

  it('is refused on a free-text question', () => {
    expect(messages(withQuestion(3, { recommendation: rec('anything') }))).toEqual([
      expect.stringContaining('recommendation'),
    ])
  })

  it.each([
    ['a pick-one answer outside its options', 0, rec('D'), 'is not among its options'],
    ['a pick-one answer given as a list', 0, rec(['A']), 'is not one of its options'],
    ['a pick-many answer with an unknown option', 1, rec(['A', 'Z']), 'is not among its options'],
    ['a pick-many answer given as one string', 1, rec('A'), 'is not a list of its options'],
    ['a pick-many answer that repeats an option', 1, rec(['A', 'A']), 'repeats an option'],
    ['a scale answer off the scale', 2, rec(9), 'is not on its scale'],
  ])('rejects %s', (_name, index, recommendation, problem) => {
    expect(messages(withQuestion(index, { recommendation }))).toEqual([
      expect.stringContaining(problem),
    ])
  })

  it('rejects a confidence outside 0 to 1 and an unknown display mode', () => {
    expect(messages(withQuestion(0, { recommendation: rec('A', 1.2) }))).toHaveLength(1)
    expect(messages({ ...recommendedInput(), recommendations: 'never' })).toHaveLength(1)
  })
})

const formWith = (m: ReturnType<typeof recommended>, draft: ReviewDraft) => {
  const state: ReviewState = { ...initialState(m), draft }
  return renderToStaticMarkup(
    createElement(Form, { manifest: m, state, dispatch: () => {}, onHitTesting: () => {} })
  )
}

describe('the page', () => {
  it('hides every recommendation until its question is answered', () => {
    const m = recommended()
    const markup = formWith(m, emptyDraft(m))
    expect(markup).toContain('data-testid="question-q1"')
    expect(markup).not.toContain('data-testid="recommendation-')
    expect(markup).not.toContain('Reads first at wall distance.')
  })

  it('reveals the recommendation beside the pick once the owner answers', () => {
    const m = recommended()
    const draft = emptyDraft(m)
    draft.answers.q1 = { pick: 'B', comment: '' }
    const markup = formWith(m, draft)
    expect(markup).toContain('data-testid="recommendation-q1"')
    expect(markup).toContain('Recommended: A · Primary goal card')
    expect(markup).toContain('Differs from your pick')
    expect(markup).toContain('80% confident · design-coord')
    expect(markup).not.toContain('data-testid="recommendation-q2"')
  })

  it('shows recommendations up front when the manifest says shown', () => {
    const m = recommended({ recommendations: 'shown' })
    const markup = formWith(m, emptyDraft(m))
    expect(markup).toContain('data-testid="recommendation-q1"')
    expect(markup).toContain('data-testid="recommendation-q3"')
    expect(markup).not.toContain('Matches your pick')
  })

  it('treats a comment alone as no answer', () => {
    const m = recommended()
    const q1 = m.questions[0]
    expect(recommendationVisible(m, q1, { comment: 'not sure' })).toBe(false)
    expect(recommendationVisible(m, q1, { pick: 'A', comment: '' })).toBe(true)
  })
})

function answered(m: ReturnType<typeof recommended>, answers: ReviewDraft['answers']) {
  const draft = emptyDraft(m)
  Object.assign(draft.answers, answers)
  return buildFeedback(m, SHA, draft, new Date('2026-10-03T10:00:00Z'))
}

describe('feedback.json', () => {
  it('records the recommendation and whether the owner agreed', () => {
    const m = recommended()
    const feedback = answered(m, {
      q1: { pick: 'A', comment: '' },
      q2: { picks: ['C', 'A'], comment: '' },
      q3: { value: 2, comment: '' },
    })
    expect(feedback.answers.map((a) => [a.questionId, a.agreed])).toEqual([
      ['q1', true],
      ['q2', true],
      ['q3', false],
    ])
    expect(feedback.answers[0].recommendation).toEqual(rec('A'))
    expect(FeedbackSchema.parse(feedback)).toEqual(feedback)
  })

  it('counts a pick-many subset as disagreement', () => {
    const feedback = answered(recommended(), { q2: { picks: ['A'], comment: '' } })
    expect(feedback.answers[0].agreed).toBe(false)
  })

  it('leaves agreed out when the owner only commented', () => {
    const [answer] = answered(recommended(), { q1: { comment: 'unsure' } }).answers
    expect(answer).toEqual({ questionId: 'q1', comment: 'unsure', recommendation: rec('A') })
  })

  it('is unchanged for a round without recommendations', () => {
    expect(validFeedback().answers).toEqual([{ questionId: 'q1', pick: 'A' }])
  })

  const dir = new URL('./fixtures/rounds/', import.meta.url)
  it.each(readdirSync(dir).filter((f) => f.endsWith('.json')))(
    'adds no recommendation fields for %s',
    (file) => {
      const m = ManifestSchema.parse(JSON.parse(readFileSync(new URL(file, dir), 'utf8')))
      const draft = emptyDraft(m)
      for (const q of m.questions)
        draft.answers[q.id] =
          q.kind === 'pick-one'
            ? { pick: q.options[0], comment: '' }
            : { text: 'ok', value: 1, picks: q.kind === 'pick-many' ? q.options : [], comment: '' }
      const json = JSON.stringify(buildFeedback(m, SHA, draft, new Date()))
      expect(json).not.toMatch(/"recommendation"|"agreed"/)
    }
  )
})

function roundFeedback(unit: string, round: number, scored: [boolean, number][]): Feedback {
  return {
    ...validFeedback(),
    unit,
    round,
    answers: scored.map(([agreed, confidence], i) => ({
      questionId: `q${i}`,
      pick: 'A',
      recommendation: rec('A', confidence),
      agreed,
    })),
  }
}

const ROUNDS = [
  roundFeedback('vw-1', 1, [
    [true, 0.9],
    [false, 0.4],
  ]),
  roundFeedback('vw-1', 2, [
    [true, 0.6],
    [true, 0.75],
    [false, 0.5],
  ]),
  validFeedback(),
]

describe('the calibration report', () => {
  it('prints agreement per round, overall and by confidence band', () => {
    expect(calibrationReport(ROUNDS).split('\n')).toEqual([
      'By round',
      '  vw-1 round 1                         1/2   50%',
      '  vw-1 round 2                         2/3   67%',
      '  vw-385-goal-card round 1             0/0     -',
      'Overall',
      '  all rounds                           3/5   60%',
      'By confidence',
      '  <0.5                                 0/1    0%',
      '  0.5-0.75                             1/2   50%',
      '  >=0.75                               2/2  100%',
    ])
  })

  it('reads feedback files from `titan-review calibration`', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'titan-calibration-'))
    const paths = ROUNDS.slice(0, 2).map((_, i) => join(dir, `feedback-${i}.json`))
    await Promise.all(paths.map((p, i) => writeFile(p, JSON.stringify(ROUNDS[i]))))
    const out = { stdout: '', stderr: [] as string[] }
    const io = {
      stdout: (t: string) => (out.stdout += t),
      stderr: (t: string) => out.stderr.push(t),
    } as unknown as CliIo
    expect(await runCli(['calibration', ...paths], io)).toBe(0)
    expect(out.stdout).toContain('  all rounds                           3/5   60%')
    expect(await runCli(['calibration'], io)).toBe(2)
    expect(await runCli(['calibration', join(dir, 'missing.json')], io)).toBe(2)
    expect(out.stderr.join('\n')).toContain('at least one feedback.json')
  })
})

describe('the example round', () => {
  it('still parses with recommendations left out', () => {
    expect(manifest().recommendations).toBe('after-answer')
  })
})
