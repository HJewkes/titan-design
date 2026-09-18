import type { Dispatch } from 'react'
import type { AnswerDraft } from '../src/feedback.ts'
import type { Manifest, Question } from '../src/schema.ts'
import type { Action } from './state.ts'
import { Stop } from './Stop.tsx'

interface QuestionBlockProps {
  manifest: Manifest
  question: Question
  draft: AnswerDraft
  index: number
  active: boolean
  follow: boolean
  dispatch: Dispatch<Action>
}

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
}: Omit<QuestionBlockProps, 'index' | 'active'>) {
  if (question.kind === 'text') return null
  const many = question.kind === 'pick-many'
  const items =
    question.kind === 'scale'
      ? scaleValues(question).map((v) => ({ hotkey: v, label: String(v), on: draft.value === v }))
      : question.options.map((o, i) => ({
          hotkey: i + 1,
          label: optionLabel(manifest, o),
          on: many ? (draft.picks ?? []).includes(o) : draft.pick === o,
        }))
  const act = (i: number): Action =>
    question.kind === 'scale'
      ? { type: 'value', id: question.id, value: scaleValues(question)[i] }
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
          onClick={() => dispatch(act(i))}
        >
          {item.hotkey <= 9 && <kbd>{item.hotkey}</kbd>} {item.label}
        </button>
      ))}
    </div>
  )
}

export function QuestionBlock(props: QuestionBlockProps) {
  const { question, draft, index, active, dispatch } = props
  const isText = question.kind === 'text'
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
        {question.prompt}
        {question.required && <span className="required"> required</span>}
      </h3>
      <Choices {...props} />
      <textarea
        aria-label={isText ? question.prompt : `Comment on ${question.id}`}
        placeholder={isText ? 'Your answer' : 'Comment (optional)'}
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
