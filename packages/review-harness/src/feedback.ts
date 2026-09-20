import {
  FEEDBACK_SCHEMA_ID,
  type Annotation,
  type Answer,
  type Feedback,
  type Manifest,
  type Question,
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

function toAnswer(
  question: Question,
  draft: AnswerDraft,
  variantComments: { key: string; comment: string }[]
): Answer | null {
  const answer: Answer = { questionId: question.id }
  if (question.kind === 'pick-one' && draft.pick !== undefined) answer.pick = draft.pick
  if (question.kind === 'pick-many' && draft.picks?.length) answer.picks = draft.picks
  if (question.kind === 'scale' && draft.value !== undefined) answer.value = draft.value
  if (question.kind === 'text' && draft.text?.trim()) answer.text = draft.text
  if (draft.comment.trim()) answer.comment = draft.comment
  if (variantComments.length) answer.variantComments = variantComments
  return isAnswered(question, answer) || answer.comment || variantComments.length ? answer : null
}

export function buildFeedback(
  manifest: Manifest,
  manifestSha256: string,
  draft: ReviewDraft,
  now: Date
): Feedback {
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
        storyId: v.storyId,
        ...(draft.variants[v.key] ?? { verdict: null, comment: '', annotations: [] }),
        ...(related.length ? { relatedQuestionIds: related } : {}),
      }
    }),
    general: draft.general,
  }
}
