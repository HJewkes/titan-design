import { stackBase, type Answer, type Feedback, type Manifest, type Question } from './schema.ts'

// The owner's rule for Ship (decisions items 151 and 166): Ship is enabled whenever nothing on the
// PR requests a change. A change request is an answer that carries free text, or picks an option
// other than the one the PR implements. An unanswered question never blocks. A group stacked on
// another group of the round ships after that holder, and is blocked while the holder's Ship is
// answered Don't ship or asks for a revision.

export const SHIP_BLOCKER_KINDS = ['free-text', 'not-implemented', 'holder-not-shipped'] as const
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
  /** The group's questions, Ship aside, still without an answer: shown, never blocking. */
  unansweredQuestionIds: string[]
  /** The holder group's `owner/name#n` when this group is stacked on a group of the same round. */
  shipsAfter?: string
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

function isAnswered(answer: Answer | undefined): boolean {
  if (!answer) return false
  const { pick, picks, value, text, revisionRequested } = answer
  return (
    pick !== undefined ||
    !!picks?.length ||
    value !== undefined ||
    !!text?.trim() ||
    revisionRequested === true
  )
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

const shipQuestion = (round: ShipRound, pr: string) =>
  round.questions.find(
    (q) => q.kind === 'pick-one' && q.merge && `${q.merge.repo}#${q.merge.pr}` === pr
  )

/** The group a PR is stacked on, when that holder is a PR group of the same round. */
function holderOf(round: ShipRound, pr: string): string | undefined {
  const base = stackBase(round.prGroups?.find((g) => g.pr === pr) ?? { pr })
  return base !== undefined && groupPrs(round).includes(base) ? base : undefined
}

function holderBlocker(holder: string, ship: Question, answer: Answer | undefined) {
  if (ship.kind !== 'pick-one' || !ship.merge || !answer) return []
  const why = answer.revisionRequested
    ? 'a revision was requested'
    : answer.pick !== undefined && !ship.merge.ship.includes(answer.pick)
      ? `it is answered ${shown(answer.pick)}`
      : null
  if (!why) return []
  const message = `stacked on ${holder}, which may not ship: ${why}`
  return [{ questionId: ship.id, kind: 'holder-not-shipped' as const, message }]
}

/**
 * Per PR group, whether Ship is blocked and why. Pure: the harness page disables its Ship control
 * with these reasons, the build-time ship gate refuses on them, and a console computes the same
 * from a submitted feedback.
 */
export function shipBlocks(round: ShipRound, feedback: ShipFeedback): PrGroupShipStatus[] {
  const answers = new Map(feedback.answers.map((a) => [a.questionId, a]))
  return groupPrs(round).map((pr) => {
    const questions = groupQuestions(round, pr)
    const holder = holderOf(round, pr)
    const ship = holder === undefined ? undefined : shipQuestion(round, holder)
    const blockers = [
      ...questions.flatMap((q) => blockersFor(q, answers.get(q.id))),
      ...(holder && ship ? holderBlocker(holder, ship, answers.get(ship.id)) : []),
    ]
    const unansweredQuestionIds = questions
      .filter((q) => !isMergeBound(q) && !isAnswered(answers.get(q.id)))
      .map((q) => q.id)
    return {
      pr,
      blocked: blockers.length > 0,
      blockers,
      unansweredQuestionIds,
      ...(holder ? { shipsAfter: holder } : {}),
    }
  })
}
