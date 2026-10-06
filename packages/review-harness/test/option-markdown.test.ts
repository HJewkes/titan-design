import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { QuestionBlock, optionLabel } from '../page/QuestionBlock.tsx'
import { initialState } from '../page/state.ts'
import { ManifestSchema, type Question } from '../src/schema.ts'
import { sectionedInput } from './fixtures.ts'

const render = (question: Question, recommendations: 'shown' | 'after-answer' = 'after-answer') => {
  const m = ManifestSchema.parse(sectionedInput())
  return renderToStaticMarkup(
    createElement(QuestionBlock, {
      manifest: { ...m, recommendations },
      question,
      draft: initialState(m).draft.answers.q1 ?? { comment: '' },
      index: 0,
      active: false,
      follow: false,
      dispatch: () => {},
    })
  )
}

describe('option labels', () => {
  it('render inline code and emphasis in a pick-one, as prompts do', () => {
    const markup = render({
      id: 'q1',
      kind: 'pick-one',
      prompt: 'Which?',
      options: ['Proposed: `size` grows', 'Alternative: *keep* two sizes'],
    })
    expect(markup).toContain('Proposed: <code>size</code> grows')
    expect(markup).toContain('Alternative: <em>keep</em> two sizes')
    expect(markup).not.toContain('`size`')
  })

  it('render inline code in a pick-many', () => {
    const markup = render({
      id: 'q1',
      kind: 'pick-many',
      prompt: 'Which?',
      options: ['drop `tone`', 'keep **both**'],
    })
    expect(markup).toContain('drop <code>tone</code>')
    expect(markup).toContain('keep <strong>both</strong>')
  })

  it('stay phrasing inside the button: no paragraph box around a label', () => {
    const markup = render({
      id: 'q1',
      kind: 'pick-one',
      prompt: 'Which?',
      options: ['one\n\ntwo', 'three'],
    })
    expect(markup).not.toMatch(/<button[^>]*>[^<]*<kbd>\d<\/kbd> <p>/)
  })

  it('render the recommended answer with the same inline markdown', () => {
    const markup = render(
      {
        id: 'q1',
        kind: 'pick-one',
        prompt: 'Which?',
        options: ['Proposed: `size` grows', 'Alternative: keep two sizes'],
        recommendation: {
          answer: 'Proposed: `size` grows',
          rationale: 'Smaller change.',
          confidence: 0.8,
          by: 'agent',
        },
      },
      'shown'
    )
    expect(markup).toContain('Recommended: Proposed: <code>size</code> grows')
  })

  it('keep optionLabel a plain string for the review screen', () => {
    const m = ManifestSchema.parse(sectionedInput())
    expect(optionLabel(m, 'Proposed: `size` grows')).toBe('Proposed: `size` grows')
    expect(optionLabel(m, 'A')).toBe(`A · ${m.variants[0].label}`)
  })
})
