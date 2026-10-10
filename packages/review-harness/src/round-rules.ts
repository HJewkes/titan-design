import type { ManifestInput } from '@titan-design/review-schema'
import { explicitPrs, sectionPr } from './sections.ts'

/**
 * The rules `build` applies to a draft before it becomes round.json (TD-768):
 * - a question's identity across rounds is its id, kept as the draft supplied it, plus an `ask:`
 *   topic (a Ship question's is `ask:<repo>#<pr>/ship`, any other's `ask:<unit>/<id>`);
 * - every question is labelled ITERATION or SHIP, in its prompt and in a `topic:` key;
 * - each PR's sections sit together, its Ship question in the last section and last in it;
 * - frames of a stacked base (the round's or a PR group's) not itself asked about are context.
 */
type Draft = ManifestInput
type DraftQuestion = Draft['questions'][number]
type DraftSection = NonNullable<Draft['sections']>[number]

export const QUESTION_LABELS = ['ITERATION', 'SHIP'] as const
export type QuestionLabel = (typeof QUESTION_LABELS)[number]

const LABEL_PREFIX = new RegExp(`^(${QUESTION_LABELS.join('|')}): `)

export function isShip(question: DraftQuestion): boolean {
  return question.kind === 'pick-one' && question.merge !== undefined
}

export function labelOf(question: DraftQuestion): QuestionLabel {
  return isShip(question) ? 'SHIP' : 'ITERATION'
}

function shipRepoPr(question: DraftQuestion): string | undefined {
  return question.kind === 'pick-one' && question.merge
    ? `${question.merge.repo}#${question.merge.pr}`
    : undefined
}

function withTopics(question: DraftQuestion, unit: string): DraftQuestion {
  const ship = shipRepoPr(question)
  const ask = ship ? `ask:${ship}/ship` : `ask:${unit}/${question.id}`
  const added = [ask, `topic:${labelOf(question).toLowerCase()}`]
  return { ...question, topics: [...new Set([...(question.topics ?? []), ...added])] }
}

function withLabel(question: DraftQuestion): DraftQuestion {
  const prompt = `${labelOf(question)}: ${question.prompt.replace(LABEL_PREFIX, '')}`
  return { ...question, prompt }
}

function shipLast(section: DraftSection, questions: Map<string, DraftQuestion>): DraftSection {
  const ids = section.questionIds ?? []
  const isShipId = (id: string) => {
    const q = questions.get(id)
    return q !== undefined && isShip(q)
  }
  return { ...section, questionIds: [...ids.filter((i) => !isShipId(i)), ...ids.filter(isShipId)] }
}

/** Sections grouped by PR at the first member's place; within a group the Ship section is last. */
function groupSections(draft: Draft, questions: DraftQuestion[]): DraftSection[] {
  const byId = new Map(questions.map((q) => [q.id, q]))
  const known = questions.flatMap((q) => q.page ?? [])
  const explicit = explicitPrs(draft.prGroups)
  const keyed = (draft.sections ?? []).map((s) => ({
    s: shipLast(s, byId),
    pr: sectionPr(s, byId, known, explicit),
  }))
  const holdsShip = (s: DraftSection) => (s.questionIds ?? []).some((i) => isShip(byId.get(i)!))
  const out: DraftSection[] = []
  const seen = new Set<string>()
  for (const { s, pr } of keyed) {
    if (!pr) out.push(s)
    else if (!seen.has(pr)) {
      seen.add(pr)
      const group = keyed.filter((k) => k.pr === pr).map((k) => k.s)
      out.push(...group.filter((g) => !holdsShip(g)), ...group.filter(holdsShip))
    }
  }
  return out
}

interface StackBase {
  key: string
  pr: number
  prefix: string
}

/**
 * Every base the round renders on: the round-level `stackedOn`, labelled `base PR #n, not under
 * review: `, and each PR group's own, labelled `rendered on #n at <short sha>, context, not under
 * review: `. A group's label wins when it names the round-level base too.
 */
function stackBases(draft: Draft): StackBase[] {
  const base = (on: NonNullable<Draft['stackedOn']>, prefix: string) => ({
    key: `${on.repo}#${on.pr}`,
    pr: on.pr,
    prefix,
  })
  const round = draft.stackedOn
    ? [base(draft.stackedOn, `base PR #${draft.stackedOn.pr}, not under review: `)]
    : []
  const groups = (draft.prGroups ?? []).flatMap((g) =>
    g.stackedOn
      ? [
          base(
            g.stackedOn,
            `rendered on #${g.stackedOn.pr} at ${g.stackedOn.headSha.slice(0, 7)}, context, not under review: `
          ),
        ]
      : []
  )
  return [...new Map([...round, ...groups].map((b) => [b.key, b])).values()]
}

/** Each base's label on every frame of its sections, unless a question is about that base. */
function labelBaseFrames(draft: Draft, sections: DraftSection[]): Draft['variants'] {
  const byId = new Map(draft.questions.map((q) => [q.id, q]))
  const known = draft.questions.flatMap((q) => q.page ?? [])
  const explicit = explicitPrs(draft.prGroups)
  const prefixes = new Map<string, string>()
  for (const base of stackBases(draft)) {
    if (draft.questions.some((q) => q.page === base.key)) continue
    const isBase = (pr: string | undefined) => pr === base.key || pr === `#${base.pr}`
    sections
      .filter((s) => isBase(sectionPr(s, byId, known, explicit)))
      .flatMap((s) => s.variantKeys ?? [])
      .forEach((key) => prefixes.set(key, base.prefix))
  }
  return draft.variants.map((v) => {
    const prefix = prefixes.get(v.key)
    return prefix && !v.label.startsWith(prefix) ? { ...v, label: prefix + v.label } : v
  })
}

/** The draft with every builder rule applied; calling it again changes nothing. */
export function applyRoundRules(draft: Draft): Draft {
  const questions = draft.questions.map((q) => withLabel(withTopics(q, draft.unit)))
  const sections = draft.sections && groupSections(draft, questions)
  const labelled: Draft = { ...draft, questions, ...(sections ? { sections } : {}) }
  return { ...labelled, variants: labelBaseFrames(labelled, sections ?? []) }
}
