import type { ManifestInput } from '@titan-design/review-schema'
import { sectionPr } from './sections.ts'

/**
 * The rules `build` applies to a draft before it becomes round.json (TD-768):
 * - a question's identity across rounds is its id, kept as the draft supplied it, plus an `ask:`
 *   topic (a Ship question's is `ask:<repo>#<pr>/ship`, any other's `ask:<unit>/<id>`);
 * - every question is labelled ITERATION or SHIP, in its prompt and in a `topic:` key;
 * - each PR's sections sit together, its Ship question in the last section and last in it;
 * - frames of a stacked PR's base that is not itself asked about are labelled as context.
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
function groupSections(sections: DraftSection[], questions: DraftQuestion[]): DraftSection[] {
  const byId = new Map(questions.map((q) => [q.id, q]))
  const known = questions.flatMap((q) => q.page ?? [])
  const keyed = sections.map((s) => ({ s: shipLast(s, byId), pr: sectionPr(s, byId, known) }))
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

/** `base PR #n, not under review: <label>` on every frame of the base PR's sections. */
function labelBaseFrames(draft: Draft, sections: DraftSection[]): Draft['variants'] {
  const base = draft.stackedOn
  if (!base) return draft.variants
  const byId = new Map(draft.questions.map((q) => [q.id, q]))
  const known = draft.questions.flatMap((q) => q.page ?? [])
  const baseKey = `${base.repo}#${base.pr}`
  const asked = draft.questions.some((q) => q.page === baseKey)
  if (asked) return draft.variants
  const isBase = (pr: string | undefined) => pr === baseKey || pr === `#${base.pr}`
  const frames = new Set(
    sections.filter((s) => isBase(sectionPr(s, byId, known))).flatMap((s) => s.variantKeys ?? [])
  )
  const prefix = `base PR #${base.pr}, not under review: `
  return draft.variants.map((v) =>
    frames.has(v.key) && !v.label.startsWith(prefix) ? { ...v, label: prefix + v.label } : v
  )
}

/** The draft with every builder rule applied; calling it again changes nothing. */
export function applyRoundRules(draft: Draft): Draft {
  const questions = draft.questions.map((q) => withLabel(withTopics(q, draft.unit)))
  const sections = draft.sections && groupSections(draft.sections, questions)
  const labelled: Draft = { ...draft, questions, ...(sections ? { sections } : {}) }
  return { ...labelled, variants: labelBaseFrames(labelled, sections ?? []) }
}
