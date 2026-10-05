import { useEffect, useRef, type Dispatch } from 'react'
import type { Feedback, Manifest } from '../src/schema.ts'
import { Markdown } from './Markdown.tsx'
import { optionLabel } from './QuestionBlock.tsx'
import type { Action } from './state.ts'

interface ReviewScreenProps {
  manifest: Manifest
  feedback: Feedback
  problems: string[]
  /** Questions with no answer; any at all turns the send into an explicit partial send. */
  unanswered: string[]
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
            <dt>
              <Markdown inline>{q.prompt}</Markdown>
            </dt>
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

function UnansweredNotice({
  manifest,
  unanswered,
}: Pick<ReviewScreenProps, 'manifest' | 'unanswered'>) {
  return (
    <p className="unanswered" role="status" data-testid="unanswered">
      {unanswered.length} of {manifest.questions.length} questions are unanswered. Go back to answer
      them, or send a partial review that lists them as unanswered.
    </p>
  )
}

export function ReviewScreen(props: ReviewScreenProps) {
  const { manifest, feedback, problems, unanswered, sending, dispatch } = props
  const partial = unanswered.length > 0
  const ref = useRef<HTMLElement>(null)
  // Focus left in the now-hidden form (a story iframe above all) would swallow this screen's keys.
  useEffect(() => ref.current?.focus({ preventScroll: true }), [])
  return (
    <section
      ref={ref}
      tabIndex={-1}
      className="review"
      data-testid="review-screen"
      aria-labelledby="review-title"
    >
      <h2 id="review-title">Check before sending</h2>
      <Variants manifest={manifest} feedback={feedback} />
      <Answers manifest={manifest} feedback={feedback} />
      {feedback.general && <p className="quote">{feedback.general}</p>}
      {partial && <UnansweredNotice manifest={manifest} unanswered={unanswered} />}
      {problems.length > 0 && (
        <ul className="problems" role="alert">
          {problems.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      )}
      <div className="actions">
        <button
          type="button"
          className={partial ? 'primary' : undefined}
          onClick={() => dispatch({ type: 'screen', screen: 'form' })}
        >
          Back <kbd>Esc</kbd>
        </button>
        <button
          type="button"
          className={partial ? undefined : 'primary'}
          disabled={sending || problems.length > 0}
          onClick={props.onSubmit}
          data-testid="send"
        >
          {partial ? (
            `Send partial: ${unanswered.length} unanswered`
          ) : (
            <>
              Send to the agent <kbd>⌘ Enter</kbd>
            </>
          )}
        </button>
      </div>
    </section>
  )
}
