import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { QuestionBlock } from '../page/QuestionBlock.tsx'
import {
  createReducer,
  initialState,
  numberKeyAction,
  revealKeyAction,
  type Action,
} from '../page/state.ts'
import { exampleManifest } from '../src/example.ts'
import { ManifestSchema, type Manifest, type ManifestInput } from '@titan-design/review-schema'

const recommendation = { answer: 'B', rationale: 'Reads first.', confidence: 0.8, by: 'agent' }

/** The example round; q1 gets `patch`, so one fixture serves a plain question and a packet. */
function round(
  patch: object,
  recommendations: 'shown' | 'after-answer' = 'after-answer'
): Manifest {
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

const packet = round({
  optionDetails: {
    A: { detail: 'Card first.', weakPoint: 'Hides the tiles.', after: 'The card leads.' },
    B: { detail: 'Tiles first.', weakPoint: 'Busy at 1080.', after: 'The tiles lead.' },
    C: { detail: 'Chart first.' },
  },
  recommendation: { ...recommendation, weakPoint: 'Tiles crowd.', fallback: 'A' },
})
const reveal: Action = { type: 'reveal', id: 'q1' }
const BADGE = 'class="option-badge"'

describe('option cards', () => {
  it('show every pros and cons before a reveal, and nothing of the recommendation', () => {
    const markup = render(packet)
    for (const text of ['Card first.', 'Hides the tiles.', 'The card leads.', 'Busy at 1080.'])
      expect(markup).toContain(text)
    expect(markup).toContain('Weak point:')
    expect(markup).toContain('If you pick this:')
    expect(markup).not.toContain(BADGE)
    expect(markup).not.toContain('data-testid="recommendation-q1"')
    expect(markup).not.toContain('Tiles crowd.')
  })

  it('show the badge on the recommended card and the box with weak point and fallback after a reveal', () => {
    const markup = render(packet, [reveal])
    expect(markup.match(/class="option-card is-recommended"[\s\S]*?<\/kbd>/)?.[0]).toContain(
      '<kbd>2</kbd>'
    )
    expect(markup.split(BADGE)).toHaveLength(2)
    expect(markup).toContain('data-testid="recommendation-q1"')
    expect(markup).toContain('Tiles crowd.')
    expect(markup).toContain('Fallback: A · Primary goal card')
    expect(markup).toContain('aria-pressed="true"')
  })

  it('put option n on hotkey n, so pressing 2 picks and checks the second card', () => {
    const action = numberKeyAction(packet, { kind: 'question', id: 'q1' }, '2')
    expect(action).toEqual({ type: 'pick', id: 'q1', option: 'B', many: false })
    const markup = render(packet, [action!])
    const order = [...markup.matchAll(/data-testid="option-card-(\d)"/g)].map((m) => m[1])
    expect(order).toEqual(['1', '2', '3', '4'])
    const card = markup.match(/data-testid="option-card-2"[\s\S]*?<\/button>[\s\S]*?Tiles first/)
    expect(card?.[0]).toContain('aria-checked="true"')
    expect(card?.[0]).toContain('B · Milestone tiles')
  })

  it('tag the recommendation verdict when the pick was made after a reveal', () => {
    const pickB: Action = { type: 'pick', id: 'q1', option: 'B', many: false }
    expect(render(packet, [reveal, pickB])).toContain('Matches your pick · seen before answering')
    expect(render(packet, [pickB, reveal])).not.toContain('seen before answering')
  })
})

describe('the reveal toggle', () => {
  it('shows on a question with a recommendation and not on one without', () => {
    expect(render(round({ recommendation }))).toContain('data-testid="reveal-q1"')
    expect(render(round({}))).not.toContain('data-testid="reveal-q1"')
  })

  it('answers r on a question stop with a reveal, and ignores r elsewhere', () => {
    const m = round({ recommendation })
    expect(revealKeyAction(m, { kind: 'question', id: 'q1' })).toEqual(reveal)
    expect(revealKeyAction(m, { kind: 'question', id: 'q2' })).toBeNull()
    expect(revealKeyAction(m, { kind: 'variant', key: 'A' })).toBeNull()
  })
})

describe('a question without option details', () => {
  it('renders the button row as before, plus only the reveal toggle', () => {
    const hidden = render(round({ recommendation }))
    const shown = render(round({ recommendation }, 'shown'))
    const strip = (markup: string) => markup.replace(/<div class="reveal"[\s\S]*?<\/div>/, '')
    expect(strip(hidden)).toMatchInlineSnapshot(
      `"<section tabindex="-1" data-testid="question-q1" class="stop question"><h3>Which one leads the page?<span class="required"> required</span></h3><div class="choices" role="radiogroup" aria-label="Which one leads the page?"><button type="button" tabindex="-1" role="radio" aria-checked="false" class="choice"><kbd>1</kbd> A · Primary goal card</button><button type="button" tabindex="-1" role="radio" aria-checked="false" class="choice"><kbd>2</kbd> B · Milestone tiles</button><button type="button" tabindex="-1" role="radio" aria-checked="false" class="choice"><kbd>3</kbd> C · Compact goal chart</button><button type="button" tabindex="-1" role="radio" aria-checked="false" class="choice"><kbd>4</kbd> none</button></div><textarea aria-label="Comment on q1" placeholder="Comment (optional)"></textarea></section>"`
    )
    expect(strip(shown)).toMatchInlineSnapshot(
      `"<section tabindex="-1" data-testid="question-q1" class="stop question"><h3>Which one leads the page?<span class="required"> required</span></h3><div class="choices" role="radiogroup" aria-label="Which one leads the page?"><button type="button" tabindex="-1" role="radio" aria-checked="false" class="choice"><kbd>1</kbd> A · Primary goal card</button><button type="button" tabindex="-1" role="radio" aria-checked="false" class="choice"><kbd>2</kbd> B · Milestone tiles</button><button type="button" tabindex="-1" role="radio" aria-checked="false" class="choice"><kbd>3</kbd> C · Compact goal chart</button><button type="button" tabindex="-1" role="radio" aria-checked="false" class="choice"><kbd>4</kbd> none</button></div><aside class="recommendation" data-testid="recommendation-q1"><p><strong>Recommended: B · Milestone tiles</strong></p><div class="md"><p>Reads first.</p></div><p class="recommendation-meta">80% confident · agent</p></aside><textarea aria-label="Comment on q1" placeholder="Comment (optional)"></textarea></section>"`
    )
  })
})
