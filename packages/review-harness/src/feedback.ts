import {
  FEEDBACK_SCHEMA_ID,
  type Annotation,
  type Answer,
  type Feedback,
  type Manifest,
  type PrGroupShipStatus,
  type Question,
  type Recommendation,
  type Verdict,
  shipBlocks,
} from '@titan-design/review-schema'
import { isAnswered, normalizeAnswer, offersBuiltInRevision } from './round.ts'
import { questionsForVariant, sectionOfQuestion } from './sections.ts'

export interface VariantDraft {
  verdict: Verdict
  comment: string
  annotations: Annotation[]
}

export interface AnswerDraft {
  pick?: string
  /** The built-in "None of these, request a revision" is on; excludes `pick`. */
  revision?: boolean
  picks?: string[]
  value?: number
  text?: string
  comment: string
}

export interface ReviewDraft {
  variants: Record<string, VariantDraft>
  answers: Record<string, AnswerDraft>
  general: string
}

export function emptyDraft(manifest: Manifest): ReviewDraft {
  return {
    variants: Object.fromEntries(
      manifest.variants.map((v) => [v.key, { verdict: null, comment: '', annotations: [] }])
    ),
    answers: Object.fromEntries(manifest.questions.map((q) => [q.id, { comment: '' }])),
    general: '',
  }
}

/** Comments left on the frames this question's section showed, so he never repeats one. */
function sectionComments(manifest: Manifest, questionId: string, draft: ReviewDraft) {
  return (sectionOfQuestion(manifest, questionId)?.variantKeys ?? [])
    .map((key) => ({ key, comment: draft.variants[key]?.comment.trim() ?? '' }))
    .filter((v) => v.comment !== '')
}

/** True when the owner's answer equals the recommended one; pick-many compares sets. */
export function agrees(answer: Answer, recommendation: Recommendation): boolean {
  if (answer.revisionRequested) return false
  const given = answer.picks ?? answer.pick ?? answer.value
  const wanted = recommendation.answer
  if (!Array.isArray(wanted) || !Array.isArray(given)) return given === wanted
  return given.length === wanted.length && wanted.every((w) => given.includes(w))
}

/** Echo the question's recommendation; `agreed` only once there is an answer to compare. */
function withRecommendation(question: Question, answer: Answer): Answer {
  if (question.kind === 'text' || !question.recommendation) return answer
  const { recommendation } = question
  return isAnswered(question, answer)
    ? { ...answer, recommendation, agreed: agrees(answer, recommendation) }
    : { ...answer, recommendation }
}

/**
 * The draft as an answer; a revision request (built-in or the author's own option) is never a
 * pick. A stale `revision` flag on a question that no longer offers the built-in is dropped.
 */
export function draftAnswer(question: Question, draft: AnswerDraft): Answer {
  const answer: Answer = { questionId: question.id }
  if (question.kind !== 'pick-one') return answer
  if (draft.pick !== undefined) return normalizeAnswer(question, { ...answer, pick: draft.pick })
  return draft.revision && offersBuiltInRevision(question)
    ? { ...answer, revisionRequested: true }
    : answer
}

function toAnswer(
  question: Question,
  draft: AnswerDraft,
  variantComments: { key: string; comment: string }[]
): Answer | null {
  const answer = draftAnswer(question, draft)
  if (question.kind === 'pick-many' && draft.picks?.length) answer.picks = draft.picks
  if (question.kind === 'scale' && draft.value !== undefined) answer.value = draft.value
  if (question.kind === 'text' && draft.text?.trim()) answer.text = draft.text
  if (draft.comment.trim()) answer.comment = draft.comment
  if (variantComments.length) answer.variantComments = variantComments
  return isAnswered(question, answer) || answer.comment || variantComments.length
    ? withRecommendation(question, answer)
    : null
}

/** The questions a draft leaves without an answer, in manifest order; a comment alone does not answer. */
export function unansweredQuestionIds(manifest: Manifest, draft: ReviewDraft): string[] {
  return manifest.questions
    .filter(
      (q) =>
        !isAnswered(q, {
          ...draft.answers[q.id],
          ...draftAnswer(q, draft.answers[q.id] ?? { comment: '' }),
        })
    )
    .map((q) => q.id)
}

/** The unanswered questions that still need an answer: an optional one left blank counts as skipped. */
export function pendingQuestionIds(manifest: Manifest, draft: ReviewDraft): string[] {
  const unanswered = new Set(unansweredQuestionIds(manifest, draft))
  return manifest.questions.filter((q) => q.required && unanswered.has(q.id)).map((q) => q.id)
}

/** A partial build lists what was left out, which is what lets a required question go unanswered. */
export function buildFeedback(
  manifest: Manifest,
  manifestSha256: string,
  draft: ReviewDraft,
  now: Date,
  partial = false
): Feedback {
  const unanswered = partial ? unansweredQuestionIds(manifest, draft) : []
  return {
    schema: FEEDBACK_SCHEMA_ID,
    unit: manifest.unit,
    round: manifest.round,
    manifestSha256,
    submittedAt: now.toISOString(),
    answers: manifest.questions
      .map((q) =>
        toAnswer(q, draft.answers[q.id] ?? { comment: '' }, sectionComments(manifest, q.id, draft))
      )
      .filter((a): a is Answer => a !== null),
    variants: manifest.variants.map((v) => {
      const related = questionsForVariant(manifest, v.key)
      return {
        key: v.key,
        ...(v.storyId !== undefined ? { storyId: v.storyId } : { image: v.image }),
        ...(draft.variants[v.key] ?? { verdict: null, comment: '', annotations: [] }),
        ...(related.length ? { relatedQuestionIds: related } : {}),
      }
    }),
    general: draft.general,
    ...(unanswered.length ? { unansweredQuestionIds: unanswered } : {}),
  }
}

/** Each PR group's Ship status for the draft as it stands, by the owner's Ship rule. */
export function draftShipBlocks(manifest: Manifest, draft: ReviewDraft): PrGroupShipStatus[] {
  return shipBlocks(manifest, buildFeedback(manifest, '', draft, new Date(0)))
}

/** The holder PR a merge-bound question's group ships after, when it is stacked on one in the round. */
export function shipsAfter(manifest: Manifest, question: Question): string | undefined {
  if (question.kind !== 'pick-one' || !question.merge) return undefined
  const pr = `${question.merge.repo}#${question.merge.pr}`
  return shipBlocks(manifest, { answers: [] }).find((g) => g.pr === pr)?.shipsAfter
}

/** The blocked group a merge-bound question's Ship option belongs to, or null when it may be picked. */
export function blockedShipGroup(
  manifest: Manifest,
  draft: ReviewDraft,
  question: Question,
  option?: string
): PrGroupShipStatus | null {
  if (question.kind !== 'pick-one' || !question.merge) return null
  if (option !== undefined && !question.merge.ship.includes(option)) return null
  const pr = `${question.merge.repo}#${question.merge.pr}`
  return draftShipBlocks(manifest, draft).find((g) => g.pr === pr && g.blocked) ?? null
}
