import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { QuestionBlock } from '../page/QuestionBlock.tsx'
import { createReducer, initialState, type Action } from '../page/state.ts'
import { exampleManifest } from '../src/example.ts'
import { ManifestSchema, type Manifest, type ManifestInput } from '@titan-design/review-schema'

const recommendation = { answer: 'B', rationale: 'Reads first.', confidence: 0.8, by: 'agent' }

/** The example round; q1 gets `patch`, so one fixture serves a plain question and a packet. */
function round(patch: object, recommendations: 'shown' | 'after-answer' = 'after-answer'): Manifest {
  const input = exampleManifest('http://127.0.0.1:6100')
  const [q1, ...rest] = input.questions
  input.questions = [{ ...q1, ...patch }, ...rest] as ManifestInput['questions']
  return ManifestSchema.parse({ ...input, recommendations })
}

function render(m: Manifest, actions: Action[] = []): string {
  const state = actions.reduce(createReducer(m), initialState(m))
  return renderToStaticMarkup(
    createElement(QuestionBlock, {
      manifest: m,
      question: m.questions[0],
      draft: state.draft.answers.q1,
      index: 0,
      active: false,
      follow: false,
      dispatch: () => {},
    })
  )
}

describe('a question without option details', () => {
  it('renders the button row as before, plus only the reveal toggle', () => {
    const hidden = render(round({ recommendation }))
    const shown = render(round({ recommendation }, 'shown'))
    const strip = (markup: string) => markup.replace(/<div class="reveal"[\s\S]*?<\/div>/, '')
    expect(strip(hidden)).toMatchInlineSnapshot(`"<section tabindex="-1" data-testid="question-q1" class="stop question"><h3>Which one leads the page?<span class="required"> required</span></h3><div class="choices" role="radiogroup" aria-label="Which one leads the page?"><button type="button" tabindex="-1" role="radio" aria-checked="false" class="choice"><kbd>1</kbd> A · Primary goal card</button><button type="button" tabindex="-1" role="radio" aria-checked="false" class="choice"><kbd>2</kbd> B · Milestone tiles</button><button type="button" tabindex="-1" role="radio" aria-checked="false" class="choice"><kbd>3</kbd> C · Compact goal chart</button><button type="button" tabindex="-1" role="radio" aria-checked="false" class="choice"><kbd>4</kbd> none</button></div><textarea aria-label="Comment on q1" placeholder="Comment (optional)"></textarea></section>"`)
    expect(strip(shown)).toMatchInlineSnapshot(`"<section tabindex="-1" data-testid="question-q1" class="stop question"><h3>Which one leads the page?<span class="required"> required</span></h3><div class="choices" role="radiogroup" aria-label="Which one leads the page?"><button type="button" tabindex="-1" role="radio" aria-checked="false" class="choice"><kbd>1</kbd> A · Primary goal card</button><button type="button" tabindex="-1" role="radio" aria-checked="false" class="choice"><kbd>2</kbd> B · Milestone tiles</button><button type="button" tabindex="-1" role="radio" aria-checked="false" class="choice"><kbd>3</kbd> C · Compact goal chart</button><button type="button" tabindex="-1" role="radio" aria-checked="false" class="choice"><kbd>4</kbd> none</button></div><aside class="recommendation" data-testid="recommendation-q1"><p><strong>Recommended: B · Milestone tiles</strong></p><div class="md"><p>Reads first.</p></div><p class="recommendation-meta">80% confident · agent</p></aside><textarea aria-label="Comment on q1" placeholder="Comment (optional)"></textarea></section>"`)
  })
})
