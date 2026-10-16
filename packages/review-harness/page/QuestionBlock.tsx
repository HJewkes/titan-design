import { useState, type Dispatch } from 'react'
import { agrees, draftAnswer, type AnswerDraft } from '../src/feedback.ts'
import { isAnswered, offersBuiltInRevision } from '../src/round.ts'
import {
  takesRecommendation,
  type Manifest,
  type OptionDetail,
  type PrGroupShipStatus,
  type Question,
  type Recommendation,
} from '@titan-design/review-schema'
import { BlindAbPairs } from './BlindAb.tsx'
import { Markdown } from './Markdown.tsx'
import { recommendationVisible, revealLocked, type Action } from './state.ts'
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
  /** Set on a merge-bound question whose PR group is stacked on a holder group of the round. */
  shipsAfter?: string
}

export const REVISION_LABEL = 'None of these, request a revision'

export function optionLabel(manifest: Manifest, option: string): string {
  const variant = manifest.variants.find((v) => v.key === option)
  return variant ? `${option} · ${variant.label}` : option
}

function scaleValues(question: Extract<Question, { kind: 'scale' }>): number[] {
  return Array.from({ length: question.max - question.min + 1 }, (_, i) => question.min + i)
}

type ChoiceProps = Omit<QuestionBlockProps, 'index' | 'active' | 'follow'>
type ChoiceQuestion = Exclude<Question, { kind: 'text' | 'blind-ab' }>
type PickQuestion = Extract<Question, { kind: 'pick-one' | 'pick-many' }>

interface ChoiceItem {
  hotkey: number
  label: string
  on: boolean
  blocked: boolean
}

/** One item per option (or scale value) in hotkey order, then the built-in revision request. */
function choiceItems({ manifest, draft, shipBlock }: ChoiceProps, question: ChoiceQuestion) {
  const many = question.kind === 'pick-many'
  const items: ChoiceItem[] =
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
  return items
}

function choiceAction(question: ChoiceQuestion, i: number): Action {
  if (question.kind === 'scale')
    return { type: 'value', id: question.id, value: scaleValues(question)[i] }
  return i === question.options.length
    ? { type: 'revision', id: question.id }
    : {
        type: 'pick',
        id: question.id,
        option: question.options[i],
        many: question.kind === 'pick-many',
      }
}

function ChoiceButton({
  item,
  many,
  onPress,
  className = 'choice',
}: {
  item: ChoiceItem
  many: boolean
  onPress: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      tabIndex={-1}
      role={many ? 'checkbox' : 'radio'}
      aria-checked={item.on}
      className={className}
      disabled={item.blocked}
      onClick={onPress}
    >
      {item.hotkey <= 9 && <kbd>{item.hotkey}</kbd>} <Markdown inline>{item.label}</Markdown>
    </button>
  )
}

function Choices(props: ChoiceProps) {
  const { question, dispatch } = props
  if (question.kind === 'text') return null
  if (question.kind === 'blind-ab')
    return <BlindAbPairs question={question} draft={props.draft} dispatch={dispatch} />
  if (question.kind !== 'scale' && question.optionDetails)
    return <OptionCards {...props} question={question} />
  const many = question.kind === 'pick-many'
  return (
    <div className="choices" role={many ? 'group' : 'radiogroup'} aria-label={question.prompt}>
      {choiceItems(props, question).map((item, i) => (
        <ChoiceButton
          key={item.label}
          item={item}
          many={many}
          onPress={() => dispatch(choiceAction(question, i))}
        />
      ))}
    </div>
  )
}

/** The recommended options, only while the recommendation shows: a hidden one must not leak. */
function recommendedOptions(manifest: Manifest, question: PickQuestion, draft: AnswerDraft) {
  const answer = question.recommendation?.answer
  if (answer === undefined || typeof answer === 'number') return []
  return recommendationVisible(manifest, question, draft) ? [answer].flat() : []
}

/** Pros and cons are always visible, whether or not the recommendation is. */
function OptionTexts({ detail }: { detail: OptionDetail }) {
  return (
    <>
      <Markdown>{detail.detail}</Markdown>
      {detail.weakPoint && (
        <div className="weak-point">
          <span className="packet-tag">Weak point:</span>
          <Markdown>{detail.weakPoint}</Markdown>
        </div>
      )}
      {detail.after && (
        <div className="option-after">
          <span className="packet-tag">If you pick this:</span>
          <Markdown>{detail.after}</Markdown>
        </div>
      )}
    </>
  )
}

function OptionNote({
  option,
  note,
  onNote,
}: {
  option: string
  note: string
  onNote: (note: string) => void
}) {
  const [open, setOpen] = useState(note !== '')
  if (!open)
    return (
      <button type="button" className="option-note-toggle" onClick={() => setOpen(true)}>
        Add a note
      </button>
    )
  return (
    <textarea
      className="option-note"
      aria-label={`Note on ${option}`}
      placeholder="Note on this option (optional)"
      value={note}
      onChange={(e) => onNote(e.target.value)}
    />
  )
}

interface OptionCardProps {
  option: string
  item: ChoiceItem
  many: boolean
  recommended: boolean
  detail?: OptionDetail
  note: string
  onPress: () => void
  onNote: (note: string) => void
}

function OptionCard({ option, item, many, recommended, detail, note, ...on }: OptionCardProps) {
  const classes = ['option-card', item.on && 'is-on', recommended && 'is-recommended']
  return (
    <div className={classes.filter(Boolean).join(' ')} data-testid={`option-card-${item.hotkey}`}>
      <div className="option-head">
        <ChoiceButton item={item} many={many} onPress={on.onPress} className="choice option-pick" />
        {recommended && <span className="option-badge">Recommended</span>}
      </div>
      {detail && <OptionTexts detail={detail} />}
      <OptionNote option={option} note={note} onNote={on.onNote} />
    </div>
  )
}

/** Each option as a card that is also its radio or checkbox, so hotkeys and picks are unchanged. */
function OptionCards(props: ChoiceProps & { question: PickQuestion }) {
  const { manifest, question, draft, dispatch } = props
  const many = question.kind === 'pick-many'
  const items = choiceItems(props, question)
  const recommended = recommendedOptions(manifest, question, draft)
  const press = (i: number) => () => dispatch(choiceAction(question, i))
  const revision = items[question.options.length]
  return (
    <div
      className="option-packet"
      role={many ? 'group' : 'radiogroup'}
      aria-label={question.prompt}
    >
      <div className="option-cards">
        {question.options.map((option, i) => (
          <OptionCard
            key={option}
            option={option}
            item={items[i]}
            many={many}
            recommended={recommended.includes(option)}
            detail={question.optionDetails?.[option]}
            note={draft.notes?.[option] ?? ''}
            onPress={press(i)}
            onNote={(note) => dispatch({ type: 'optionNote', id: question.id, option, note })}
          />
        ))}
      </div>
      {revision && <ChoiceButton item={revision} many={many} onPress={press(items.length - 1)} />}
    </div>
  )
}

/** Off by default so the owner can answer blind; an answer given while it shows is tagged seen. */
function RevealToggle({ manifest, question, draft, dispatch }: ChoiceProps) {
  if (!takesRecommendation(question) || !question.recommendation) return null
  const visible = recommendationVisible(manifest, question, draft)
  const locked = revealLocked(manifest, question, draft)
  const help = locked
    ? manifest.recommendations === 'shown'
      ? 'This round shows every recommendation.'
      : 'Shown because you answered.'
    : visible
      ? 'Your answer will be marked as seen.'
      : 'Showing it first marks your answer as seen.'
  return (
    <div className="reveal">
      <button
        type="button"
        aria-pressed={visible}
        disabled={locked}
        data-testid={`reveal-${question.id}`}
        onClick={() => dispatch({ type: 'reveal', id: question.id })}
      >
        {visible ? 'Hide recommendation' : 'Show recommendation'} <kbd>r</kbd>
      </button>
      <span className="reveal-help">{help}</span>
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
  const verdict = agrees(answer, recommendation) ? 'Matches your pick' : 'Differs from your pick'
  return draft.seen ? `${verdict} · seen before answering` : verdict
}

function RecommendationExtras({ manifest, rec }: { manifest: Manifest; rec: Recommendation }) {
  return (
    <>
      {rec.weakPoint && (
        <div className="weak-point">
          <span className="packet-tag">Weak point:</span>
          <Markdown>{rec.weakPoint}</Markdown>
        </div>
      )}
      {rec.fallback && (
        <p className="recommendation-fallback">
          Fallback: <Markdown inline>{optionLabel(manifest, rec.fallback)}</Markdown>
        </p>
      )}
    </>
  )
}

function RecommendationNote({ manifest, question, draft }: QuestionBlockProps) {
  if (!takesRecommendation(question) || !question.recommendation) return null
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
      <RecommendationExtras manifest={manifest} rec={rec} />
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

function ShipsAfterNote({
  question,
  shipsAfter,
}: Pick<QuestionBlockProps, 'question' | 'shipsAfter'>) {
  if (!shipsAfter || question.kind !== 'pick-one' || !question.merge) return null
  const sameRepo = `${question.merge.repo}#`
  const holder = shipsAfter.startsWith(sameRepo)
    ? shipsAfter.slice(sameRepo.length - 1)
    : shipsAfter
  return (
    <p className="ships-after" data-testid={`ships-after-${question.id}`}>
      ships after {holder}
    </p>
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
      <RevealToggle {...props} />
      <ShipsAfterNote question={question} shipsAfter={props.shipsAfter} />
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
