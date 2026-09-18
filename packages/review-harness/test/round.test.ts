import { describe, expect, it } from 'vitest'
import { captureFileName } from '../src/capture.ts'
import { buildFeedback, emptyDraft } from '../src/feedback.ts'
import { feedbackProblems, questionScope, storyUrl, urlParamProblems } from '../src/round.ts'
import { FeedbackSchema } from '../src/schema.ts'
import { SHA, manifest, validFeedback } from './fixtures.ts'

describe('story urls', () => {
  it('builds the bare-canvas embed url with args and globals', () => {
    const url = storyUrl('http://127.0.0.1:6100/', {
      key: 'A',
      storyId: 'lab-x--wall',
      label: 'x',
      args: { frame: 'wall', rows: 4, dense: true },
      globals: { theme: 'light' },
    })
    const params = new URL(url).searchParams
    expect(url.startsWith('http://127.0.0.1:6100/iframe.html?')).toBe(true)
    expect(params.get('id')).toBe('lab-x--wall')
    expect(params.get('singleStory')).toBe('true')
    expect(params.get('args')).toBe('frame:wall;rows:4;dense:!true')
    expect(params.get('globals')).toBe('theme:light')
  })

  it('flags args Storybook would silently drop', () => {
    const m = manifest()
    m.variants[0].args = { label: 'a/b', ok: 'fine value', n: 1.5 }
    m.variants[1].globals = { 'bad key!': 'x' }
    expect(urlParamProblems(m)).toEqual([
      'variant A args.label = "a/b"',
      'variant B globals key "bad key!"',
    ])
  })
})

describe('capture file names', () => {
  it('names a normal variant <width>-<key>-<story-name>.png', () => {
    const variant = { key: 'A', storyId: 'lab-x--wall', label: 'x' }
    expect(captureFileName(variant, 1920)).toBe('1920-A-wall.png')
  })
})

describe('question scope', () => {
  it('treats questions over variant keys as variant-scoped unless told otherwise', () => {
    const m = manifest()
    const [q1, q2, q3, q4] = m.questions
    expect([q1, q2, q3, q4].map((q) => questionScope(q, m))).toEqual([
      'variant',
      'variant',
      'round',
      'round',
    ])
    expect(questionScope({ ...q1, scope: 'round' }, m)).toBe('round')
  })
})

describe('building feedback from the page draft', () => {
  it('produces schema-valid feedback that agrees with its manifest', () => {
    const feedback = validFeedback()
    expect(FeedbackSchema.safeParse(feedback).success).toBe(true)
    expect(feedbackProblems(feedback, manifest())).toEqual([])
    expect(feedback.variants.map((v) => v.verdict)).toEqual(['chosen', null, null])
    expect(feedback.answers).toEqual([{ questionId: 'q1', pick: 'A' }])
  })

  it('keeps a comment on an unanswered question and drops untouched ones', () => {
    const m = manifest()
    const draft = emptyDraft(m)
    draft.answers.q1 = { pick: 'B', comment: '' }
    draft.answers.q3 = { comment: 'not sure yet' }
    const feedback = buildFeedback(m, SHA, draft, new Date())
    expect(feedback.answers).toEqual([
      { questionId: 'q1', pick: 'B' },
      { questionId: 'q3', comment: 'not sure yet' },
    ])
  })

  it('reports a missing required answer and picks outside the options', () => {
    const m = manifest()
    const feedback = validFeedback(m)
    feedback.answers = [{ questionId: 'q2', picks: ['A', 'Z'] }]
    expect(feedbackProblems(feedback, m)).toEqual(['q1: required', 'q2: unknown options Z'])
  })
})
