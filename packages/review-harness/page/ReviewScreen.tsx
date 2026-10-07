import { useEffect, useRef, useState, type Dispatch } from 'react'
import type { Feedback, Manifest } from '../src/schema.ts'
import { Markdown } from './Markdown.tsx'
import { optionLabel, REVISION_LABEL } from './QuestionBlock.tsx'
import type { Action } from './state.ts'

interface ReviewScreenProps {
  manifest: Manifest
  feedback: Feedback
  problems: string[]
  /** Required questions with no answer; any at all turns the send into an explicit partial send. */
  unanswered: string[]
  sending: boolean
  /** The server's answer to a failed send. They never disable Send: the owner can retry. */
  sendErrors: string[]
  dispatch: Dispatch<Action>
  onSubmit: () => void
}

function answerText(manifest: Manifest, a: Feedback['answers'][number]): string {
  if (a.revisionRequested) return `${REVISION_LABEL} (revision request)`
  if (a.pick !== undefined) return optionLabel(manifest, a.pick)
  if (a.picks) return a.picks.map((p) => optionLabel(manifest, p)).join(', ')
  if (a.value !== undefined) return String(a.value)
  return a.text ?? '(no answer)'
}

function Answers({
  manifest,
  feedback,
  unanswered,
  onlyUnanswered,
  rowRefs,
}: Pick<ReviewScreenProps, 'manifest' | 'feedback' | 'unanswered'> & {
  onlyUnanswered: boolean
  rowRefs: { current: Map<string, HTMLDivElement> }
}) {
  const byId = new Map(feedback.answers.map((a) => [a.questionId, a]))
  const pending = new Set(unanswered)
  const shown = onlyUnanswered
    ? manifest.questions.filter((q) => pending.has(q.id))
    : manifest.questions
  return (
    <dl className="summary" data-testid="answers">
      {shown.map((q) => {
        const a = byId.get(q.id)
        const open = pending.has(q.id)
        return (
          <div
            key={q.id}
            ref={(el) => {
              if (el) rowRefs.current.set(q.id, el)
              else rowRefs.current.delete(q.id)
            }}
            tabIndex={-1}
            className={open ? 'is-unanswered' : undefined}
            data-testid={`answer-${q.id}`}
            data-unanswered={open ? 'true' : undefined}
          >
            <dt>
              <Markdown inline>{q.prompt}</Markdown>
            </dt>
            <dd>{a ? answerText(manifest, a) : q.required ? '(no answer)' : '(skipped)'}</dd>
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

/** Filter, and step through, the unanswered rows; a step button shows only with one in its direction. */
function UnansweredNav({
  unanswered,
  onlyUnanswered,
  onToggle,
  rowRefs,
}: Pick<ReviewScreenProps, 'unanswered'> & {
  onlyUnanswered: boolean
  onToggle: () => void
  rowRefs: { current: Map<string, HTMLDivElement> }
}) {
  const [at, setAt] = useState(-1)
  const step = (delta: number) => {
    const next = at + delta
    setAt(next)
    const row = rowRefs.current.get(unanswered[next])
    row?.scrollIntoView?.({ block: 'center' })
    row?.focus({ preventScroll: true })
  }
  const current = Math.min(at, unanswered.length - 1)
  return (
    <div className="unanswered-nav" role="group" aria-label="Unanswered questions">
      <button type="button" aria-pressed={onlyUnanswered} onClick={onToggle} data-testid="filter">
        Show only unanswered
      </button>
      {current > 0 && (
        <button type="button" onClick={() => step(-1)} data-testid="prev-unanswered">
          Previous unanswered
        </button>
      )}
      {current < unanswered.length - 1 && (
        <button type="button" onClick={() => step(1)} data-testid="next-unanswered">
          Next unanswered
        </button>
      )}
    </div>
  )
}

export function ReviewScreen(props: ReviewScreenProps) {
  const { manifest, feedback, problems, sendErrors, unanswered, sending, dispatch } = props
  const alerts = [...problems, ...sendErrors]
  const partial = unanswered.length > 0
  const ref = useRef<HTMLElement>(null)
  const rowRefs = useRef(new Map<string, HTMLDivElement>())
  const [onlyUnanswered, setOnlyUnanswered] = useState(false)
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
      {partial && (
        <UnansweredNav
          unanswered={unanswered}
          onlyUnanswered={onlyUnanswered}
          onToggle={() => setOnlyUnanswered((v) => !v)}
          rowRefs={rowRefs}
        />
      )}
      <Answers
        manifest={manifest}
        feedback={feedback}
        unanswered={unanswered}
        onlyUnanswered={partial && onlyUnanswered}
        rowRefs={rowRefs}
      />
      {feedback.general && <p className="quote">{feedback.general}</p>}
      {partial && <UnansweredNotice manifest={manifest} unanswered={unanswered} />}
      {alerts.length > 0 && (
        <ul className="problems" role="alert">
          {alerts.map((p) => (
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
