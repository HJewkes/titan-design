import type { Dispatch } from 'react'
import { agrees, draftAnswer, type AnswerDraft } from '../src/feedback.ts'
import { isAnswered, offersBuiltInRevision } from '../src/round.ts'
import type {
  Manifest,
  PrGroupShipStatus,
  Question,
  Recommendation,
} from '@titan-design/review-schema'
import { Markdown } from './Markdown.tsx'
import { recommendationVisible, type Action } from './state.ts'
import { Stop } from './Stop.tsx'

interface QuestionBlockProps {
  manifest: Manifest
  question: Question
  draft: AnswerDraft
  index: number
  active: boolean
  follow: boolean
  dispatch: Dispatch<Action>
  /** Set on a merge-bound question whose PR group may not ship: its Ship option is disabled. */
  shipBlock?: PrGroupShipStatus
}

export const REVISION_LABEL = 'None of these, request a revision'

export function optionLabel(manifest: Manifest, option: string): string {
  const variant = manifest.variants.find((v) => v.key === option)
  return variant ? `${option} · ${variant.label}` : option
}

function scaleValues(question: Extract<Question, { kind: 'scale' }>): number[] {
  return Array.from({ length: question.max - question.min + 1 }, (_, i) => question.min + i)
}

function Choices({
  manifest,
  question,
  draft,
  dispatch,
  shipBlock,
}: Omit<QuestionBlockProps, 'index' | 'active'>) {
  if (question.kind === 'text') return null
  const many = question.kind === 'pick-many'
  const items =
    question.kind === 'scale'
      ? scaleValues(question).map((v) => ({
          hotkey: v,
          label: String(v),
          on: draft.value === v,
          blocked: false,
        }))
      : question.options.map((o, i) => ({
          hotkey: i + 1,
          label: optionLabel(manifest, o),
          on: many ? (draft.picks ?? []).includes(o) : draft.pick === o,
          blocked:
            shipBlock !== undefined &&
            question.kind === 'pick-one' &&
            !!question.merge?.ship.includes(o),
        }))
  if (offersBuiltInRevision(question))
    items.push({
      hotkey: items.length + 1,
      label: REVISION_LABEL,
      on: draft.revision === true,
      blocked: false,
    })
  const act = (i: number): Action =>
    question.kind === 'scale'
      ? { type: 'value', id: question.id, value: scaleValues(question)[i] }
      : i === question.options.length
        ? { type: 'revision', id: question.id }
        : { type: 'pick', id: question.id, option: question.options[i], many }
  return (
    <div className="choices" role={many ? 'group' : 'radiogroup'} aria-label={question.prompt}>
      {items.map((item, i) => (
        <button
          key={item.label}
          type="button"
          tabIndex={-1}
          role={many ? 'checkbox' : 'radio'}
          aria-checked={item.on}
          className="choice"
          disabled={item.blocked}
          onClick={() => dispatch(act(i))}
        >
          {item.hotkey <= 9 && <kbd>{item.hotkey}</kbd>} <Markdown inline>{item.label}</Markdown>
        </button>
      ))}
    </div>
  )
}

function recommendedText(manifest: Manifest, answer: Recommendation['answer']): string {
  if (typeof answer === 'number') return String(answer)
  return (Array.isArray(answer) ? answer : [answer]).map((o) => optionLabel(manifest, o)).join(', ')
}

function verdictText(question: Question, draft: AnswerDraft, recommendation: Recommendation) {
  const answer = { ...draft, ...draftAnswer(question, draft) }
  if (!isAnswered(question, answer)) return null
  if (answer.revisionRequested) return 'You asked for a revision'
  return agrees(answer, recommendation) ? 'Matches your pick' : 'Differs from your pick'
}

function RecommendationNote({ manifest, question, draft }: QuestionBlockProps) {
  if (question.kind === 'text' || !question.recommendation) return null
  if (!recommendationVisible(manifest, question, draft)) return null
  const rec = question.recommendation
  const verdict = verdictText(question, draft, rec)
  return (
    <aside className="recommendation" data-testid={`recommendation-${question.id}`}>
      <p>
        <strong>
          Recommended: <Markdown inline>{recommendedText(manifest, rec.answer)}</Markdown>
        </strong>
        {verdict && <span className="recommendation-verdict"> · {verdict}</span>}
      </p>
      <Markdown>{rec.rationale}</Markdown>
      <p className="recommendation-meta">
        {Math.round(rec.confidence * 100)}% confident · {rec.by}
      </p>
    </aside>
  )
}

function ShipBlockedNotice({
  shipBlock,
  question,
}: Pick<QuestionBlockProps, 'shipBlock' | 'question'>) {
  if (!shipBlock) return null
  return (
    <div className="problems" role="alert" data-testid={`ship-blocked-${question.id}`}>
      <p>Ship is withheld for {shipBlock.pr} until these are resolved:</p>
      <ul>
        {shipBlock.blockers.map((b) => (
          <li key={`${b.questionId}-${b.kind}`}>{b.message}</li>
        ))}
      </ul>
    </div>
  )
}

function RevisionNotice({ question, draft }: Pick<QuestionBlockProps, 'question' | 'draft'>) {
  const asked = draftAnswer(question, draft).revisionRequested
  if (!asked || draft.comment.trim()) return null
  return (
    <p className="problems" role="alert" data-testid={`revision-needs-comment-${question.id}`}>
      A revision request needs a comment saying what to change.
    </p>
  )
}

export function QuestionBlock(props: QuestionBlockProps) {
  const { question, draft, index, active, dispatch } = props
  const isText = question.kind === 'text'
  const revising = draftAnswer(question, draft).revisionRequested === true
  return (
    <Stop
      index={index}
      active={active}
      follow={props.follow}
      dispatch={dispatch}
      className="question"
      testId={`question-${question.id}`}
    >
      <h3>
        <Markdown inline>{question.prompt}</Markdown>
        {question.required && <span className="required"> required</span>}
      </h3>
      <Choices {...props} />
      <ShipBlockedNotice question={question} shipBlock={props.shipBlock} />
      <RecommendationNote {...props} />
      <RevisionNotice question={question} draft={draft} />
      <textarea
        aria-label={isText ? question.prompt : `Comment on ${question.id}`}
        placeholder={
          isText ? 'Your answer' : revising ? 'Comment (required)' : 'Comment (optional)'
        }
        value={isText ? (draft.text ?? '') : draft.comment}
        onChange={(e) =>
          dispatch(
            isText
              ? { type: 'text', id: question.id, text: e.target.value }
              : { type: 'answerComment', id: question.id, comment: e.target.value }
          )
        }
      />
    </Stop>
  )
}
