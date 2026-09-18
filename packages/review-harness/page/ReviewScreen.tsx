import type { Dispatch } from 'react'
import type { Feedback, Manifest } from '../src/schema.ts'
import { optionLabel } from './QuestionBlock.tsx'
import type { Action } from './state.ts'

interface ReviewScreenProps {
  manifest: Manifest
  feedback: Feedback
  problems: string[]
  sending: boolean
  dispatch: Dispatch<Action>
  onSubmit: () => void
}

function answerText(manifest: Manifest, a: Feedback['answers'][number]): string {
  if (a.pick !== undefined) return optionLabel(manifest, a.pick)
  if (a.picks) return a.picks.map((p) => optionLabel(manifest, p)).join(', ')
  if (a.value !== undefined) return String(a.value)
  return a.text ?? '(no answer)'
}

function Answers({ manifest, feedback }: Pick<ReviewScreenProps, 'manifest' | 'feedback'>) {
  const byId = new Map(feedback.answers.map((a) => [a.questionId, a]))
  return (
    <dl className="summary">
      {manifest.questions.map((q) => {
        const a = byId.get(q.id)
        return (
          <div key={q.id}>
            <dt>{q.prompt}</dt>
            <dd>{a ? answerText(manifest, a) : '(no answer)'}</dd>
            {a?.comment && <dd className="quote">{a.comment}</dd>}
          </div>
        )
      })}
    </dl>
  )
}

function Variants({ manifest, feedback }: Pick<ReviewScreenProps, 'manifest' | 'feedback'>) {
  return (
    <dl className="summary">
      {feedback.variants.map((v) => (
        <div key={v.key} data-testid={`summary-${v.key}`}>
          <dt>{optionLabel(manifest, v.key)}</dt>
          <dd className={`verdict-${v.verdict ?? 'none'}`}>{v.verdict ?? 'no verdict'}</dd>
          {v.comment && <dd className="quote">{v.comment}</dd>}
          {v.annotations.map((p) => (
            <dd key={p.id}>
              Pin {p.id} at {p.width}px ({p.x}, {p.y})
              {p.target?.testId && ` on #${p.target.testId}`}: {p.note || '(no note)'}
            </dd>
          ))}
        </div>
      ))}
    </dl>
  )
}

export function ReviewScreen(props: ReviewScreenProps) {
  const { manifest, feedback, problems, sending, dispatch } = props
  return (
    <section className="review" data-testid="review-screen" aria-labelledby="review-title">
      <h2 id="review-title">Check before sending</h2>
      <Variants manifest={manifest} feedback={feedback} />
      <Answers manifest={manifest} feedback={feedback} />
      {feedback.general && <p className="quote">{feedback.general}</p>}
      {problems.length > 0 && (
        <ul className="problems" role="alert">
          {problems.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      )}
      <div className="actions">
        <button type="button" onClick={() => dispatch({ type: 'screen', screen: 'form' })}>
          Back <kbd>Esc</kbd>
        </button>
        <button
          type="button"
          className="primary"
          disabled={sending || problems.length > 0}
          onClick={props.onSubmit}
        >
          Send to the agent <kbd>⌘ Enter</kbd>
        </button>
      </div>
    </section>
  )
}
