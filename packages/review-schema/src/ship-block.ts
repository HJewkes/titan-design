import type { Answer, Feedback, Manifest, Question } from './schema.ts'

// The owner's rule for Ship (decisions item 151): a PR group is not shipped while any answer in it
// carries free text, or picks an option other than the one the PR implements. A question left
// unanswered does not block by itself.

export const SHIP_BLOCKER_KINDS = ['free-text', 'not-implemented'] as const
export type ShipBlockerKind = (typeof SHIP_BLOCKER_KINDS)[number]

export interface ShipBlocker {
  questionId: string
  kind: ShipBlockerKind
  /** One sentence naming the question and why it withholds Ship. */
  message: string
}

export interface PrGroupShipStatus {
  /** `owner/name#pr`. */
  pr: string
  blocked: boolean
  blockers: ShipBlocker[]
}

/** The answers the rule reads: a submitted feedback, or the page's draft built the same way. */
export type ShipFeedback = Pick<Feedback, 'answers'>
type ShipRound = Pick<Manifest, 'questions' | 'sections' | 'prGroups'>

const shown = (option: string) => `"${option}"`
const isMergeBound = (q: Question) => q.kind === 'pick-one' && q.merge !== undefined

function groupPrs(round: ShipRound): string[] {
  const fromQuestions = round.questions.flatMap((q) =>
    q.kind === 'pick-one' && q.merge ? [`${q.merge.repo}#${q.merge.pr}`] : q.page ? [q.page] : []
  )
  return [...new Set([...(round.prGroups ?? []).map((g) => g.pr), ...fromQuestions])]
}

/** A group's questions: those in its sections, and those whose `page` is its PR. */
function groupQuestions(round: ShipRound, pr: string): Question[] {
  const sectionIds = new Set(round.prGroups?.find((g) => g.pr === pr)?.sectionIds)
  const inSections = new Set(
    (round.sections ?? []).filter((s) => sectionIds.has(s.id)).flatMap((s) => s.questionIds)
  )
  return round.questions.filter((q) => q.page === pr || inSections.has(q.id))
}

function hasFreeText(answer: Answer): boolean {
  const written = [
    answer.comment,
    answer.text,
    ...(answer.variantComments ?? []).map((c) => c.comment),
  ]
  return written.some((t) => t !== undefined && t.trim() !== '')
}

function pickProblem(q: Question, answer: Answer): string | null {
  if (q.kind !== 'pick-one' && q.kind !== 'pick-many') return null
  if (q.implemented === undefined || isMergeBound(q)) return null
  const want = [q.implemented].flat()
  if (answer.revisionRequested)
    return `question ${q.id}: a revision was requested, but the PR implements ${want.map(shown).join(', ')}`
  const given =
    q.kind === 'pick-many' ? answer.picks : answer.pick === undefined ? [] : [answer.pick]
  if (!given?.length) return null
  const same = given.length === want.length && want.every((w) => given.includes(w))
  return same
    ? null
    : `question ${q.id}: picked ${given.map(shown).join(', ')}, but the PR implements ${want.map(shown).join(', ')}`
}

function blockersFor(q: Question, answer: Answer | undefined): ShipBlocker[] {
  if (!answer) return []
  const pick = pickProblem(q, answer)
  return [
    ...(pick ? [{ questionId: q.id, kind: 'not-implemented' as const, message: pick }] : []),
    ...(hasFreeText(answer)
      ? [
          {
            questionId: q.id,
            kind: 'free-text' as const,
            message: `question ${q.id}: has a written comment`,
          },
        ]
      : []),
  ]
}

/**
 * Per PR group, whether Ship is blocked and why. Pure: the harness page disables its Ship control
 * with these reasons, the build-time ship gate refuses on them, and a console computes the same
 * from a submitted feedback.
 */
export function shipBlocks(round: ShipRound, feedback: ShipFeedback): PrGroupShipStatus[] {
  const answers = new Map(feedback.answers.map((a) => [a.questionId, a]))
  return groupPrs(round).map((pr) => {
    const blockers = groupQuestions(round, pr).flatMap((q) => blockersFor(q, answers.get(q.id)))
    return { pr, blocked: blockers.length > 0, blockers }
  })
}
