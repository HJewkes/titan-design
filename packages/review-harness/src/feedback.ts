import {
  FEEDBACK_SCHEMA_ID,
  type Annotation,
  type Answer,
  type Feedback,
  type Manifest,
  type Question,
  type Recommendation,
  type Verdict,
} from './schema.ts'
import { isAnswered } from './round.ts'
import { questionsForVariant } from './sections.ts'

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
  const section = manifest.sections?.find((s) => s.questionIds.includes(questionId))
  return (section?.variantKeys ?? [])
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

/** The draft as an answer; a revision request (built-in or the author's own option) is never a pick. */
export function draftAnswer(question: Question, draft: AnswerDraft): Answer {
  const answer: Answer = { questionId: question.id }
  if (question.kind === 'pick-one' && draft.pick !== undefined) {
    if (draft.pick === question.revisionOption) answer.revisionRequested = true
    else answer.pick = draft.pick
  }
  if (question.kind === 'pick-one' && draft.revision && answer.pick === undefined)
    answer.revisionRequested = true
  return answer
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
