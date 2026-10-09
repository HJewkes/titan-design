import type { Manifest, Question, Section, Variant } from './schema.ts'

// The layout rules every round builder applies before it writes a round (spike TP-2142 §5.2).
// They are the owner's review rules (items 97, 98, 136 and 140), so a builder that passes them
// renders each decision under its own frames, inside its own PR group, with Ship last.

export const LINT_RULES = [
  'unanchored-question',
  'frame-outside-section',
  'shared-frame-set',
  'split-variant-unit',
  'unequal-alternates',
  'split-pr-group',
  'ship-not-last',
  'ship-head-mismatch',
] as const
export type LintRule = (typeof LINT_RULES)[number]

export interface LintProblem {
  rule: LintRule
  message: string
}

const lint = (rule: LintRule) => (message: string) => ({ rule, message })

type MergeBound = Extract<Question, { kind: 'pick-one' }> & {
  merge: NonNullable<Extract<Question, { kind: 'pick-one' }>['merge']>
}

const isMergeBound = (q: Question): q is MergeBound => q.kind === 'pick-one' && !!q.merge
const prKey = (q: MergeBound) => `${q.merge.repo}#${q.merge.pr}`
const sectionOf = (m: Manifest, questionId: string) =>
  m.sections?.find((s) => s.questionIds.includes(questionId))

/** A question whose answer decides something a frame shows: it names those frames. */
function isDeciding(q: Question, m: Manifest): boolean {
  if (isMergeBound(q) || q.decision === 'decide') return false
  if (q.decision !== undefined) return true
  const showsFrames = (sectionOf(m, q.id)?.variantKeys.length ?? 0) > 0
  return (q.kind === 'pick-one' || q.kind === 'pick-many') && showsFrames
}

function anchoringProblems(m: Manifest): LintProblem[] {
  const unanchored = m.questions
    .filter((q) => !q.frames && isDeciding(q, m))
    .map((q) => `question ${q.id}: it decides something its section shows; name its frames`)
  const outside = m.questions.flatMap((q) => {
    const own = sectionOf(m, q.id)
    if (!q.frames || !own) return []
    return q.frames
      .filter((key) => !own.variantKeys.includes(key))
      .map((key) => {
        const holder = m.sections?.find((s) => s.variantKeys.includes(key))
        const where = holder ? `section ${holder.id}` : 'no section'
        return `question ${q.id}: frame ${key} is in ${where}, not in its own section ${own.id}, so it would not sit directly above the question`
      })
  })
  return [
    ...unanchored.map(lint('unanchored-question')),
    ...outside.map(lint('frame-outside-section')),
    ...sharedFrames(m).map(lint('shared-frame-set')),
  ]
}

/** One decision per frame set: a frame sits above one question only. */
function sharedFrames(m: Manifest): string[] {
  const owners = new Map<string, string[]>()
  for (const q of m.questions)
    for (const key of new Set(q.frames)) owners.set(key, [...(owners.get(key) ?? []), q.id])
  return [...owners]
    .filter(([, ids]) => ids.length > 1)
    .map(
      ([key, ids]) =>
        `frame ${key} sits above ${ids.join(' and ')}; a frame belongs to one question`
    )
}

/** The block a frame renders in: under the question that names it, or in its section's strip. */
function blockOf(m: Manifest, key: string): string {
  const owner = m.questions.find((q) => q.frames?.includes(key))
  if (owner) return `question ${owner.id}`
  const section = m.sections?.find((s) => s.variantKeys.includes(key))
  return section ? `section ${section.id}'s strip` : 'no section'
}

function unitProblems(m: Manifest): LintProblem[] {
  const units = new Map<string, Variant[]>()
  for (const v of m.variants)
    if (v.variantUnit) units.set(v.variantUnit, [...(units.get(v.variantUnit) ?? []), v])
  return [...units].flatMap(([unit, views]) => {
    const blocks = [...new Set(views.map((v) => blockOf(m, v.key)))]
    const columns = [...new Set(views.map((v) => v.alternate ?? 'none'))]
    return [
      ...(blocks.length > 1
        ? [`variant unit ${unit} is split across ${blocks.join(' and ')}; show its views together`]
        : []),
      ...(columns.length > 1
        ? [
            `variant unit ${unit} stands in alternates ${columns.join(' and ')}; a unit is one column`,
          ]
        : []),
    ].map(lint('split-variant-unit'))
  })
}

/** A frame's mode: the globals it renders under (theme, density), so alternates show the same set. */
const modeOf = (v: Variant) =>
  Object.entries(v.globals ?? {})
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, value]) => `${name}=${String(value)}`)
    .join(' ') || 'default'

function alternateProblems(m: Manifest): LintProblem[] {
  return m.questions.flatMap((q) => {
    const views = m.variants.filter((v) => q.frames?.includes(v.key) && v.alternate)
    const columns = new Map<string, string[]>()
    for (const v of views)
      columns.set(v.alternate!, [...(columns.get(v.alternate!) ?? []), modeOf(v)])
    const [first, ...rest] = [...columns].map(([col, modes]) => ({
      col,
      modes: modes.sort().join(', '),
    }))
    const differs = rest.find((c) => c.modes !== first?.modes)
    if (!first || !differs) return []
    return [
      lint('unequal-alternates')(
        `question ${q.id}: alternate ${first.col} shows ${first.modes} but ${differs.col} shows ` +
          `${differs.modes}; compare whole units over the same modes`
      ),
    ]
  })
}

/** The PR a section is about: its explicit group, else the page its questions name. */
function sectionPrs(m: Manifest): Map<string, string | undefined> {
  const explicit = new Map(m.prGroups?.flatMap((g) => g.sectionIds.map((id) => [id, g.pr])))
  const byId = new Map(m.questions.map((q) => [q.id, q]))
  const pageOf = (s: Section) => s.questionIds.flatMap((id) => byId.get(id)?.page ?? [])[0]
  return new Map((m.sections ?? []).map((s) => [s.id, explicit.get(s.id) ?? pageOf(s)]))
}

/** Each PR's sections in page order; a PR whose sections are not consecutive is split. */
function groupProblems(m: Manifest, prs: Map<string, string | undefined>): LintProblem[] {
  const order = (m.sections ?? []).map((s) => s.id)
  const byPr = new Map<string, number[]>()
  order.forEach((id, i) => {
    const pr = prs.get(id)
    if (pr) byPr.set(pr, [...(byPr.get(pr) ?? []), i])
  })
  return [...byPr].flatMap(([pr, at]) => {
    const between = order.slice(at[0], at.at(-1)! + 1).filter((id) => prs.get(id) !== pr)
    return between.length
      ? [
          lint('split-pr-group')(
            `PR group ${pr} is split by section ${between.join(', ')}; keep a PR's sections together`
          ),
        ]
      : []
  })
}

/** A Ship renders last in its section when it is unanchored, or is the last anchored question. */
function lastInSection(ship: Question, section: Section, m: Manifest): boolean {
  if (!ship.frames) return true
  const anchored = section.questionIds.filter((id) => m.questions.find((q) => q.id === id)?.frames)
  return anchored.at(-1) === ship.id
}

function shipOrderProblems(m: Manifest, prs: Map<string, string | undefined>): LintProblem[] {
  const order = (m.sections ?? []).map((s) => s.id)
  return m.questions.filter(isMergeBound).flatMap((ship) => {
    const own = sectionOf(m, ship.id)
    if (!own) return []
    const pr = prKey(ship)
    const last = order.filter((id) => prs.get(id) === pr).at(-1)
    const problem =
      prs.get(own.id) !== pr
        ? `question ${ship.id}: it ships ${pr} but sits in section ${own.id}, which is about ${prs.get(own.id) ?? 'no PR'}`
        : own.id !== last
          ? `question ${ship.id}: Ship sits in section ${own.id}, but ${pr}'s last section is ${last}`
          : !lastInSection(ship, own, m)
            ? `question ${ship.id}: Ship is not the last question in section ${own.id}`
            : null
    return problem ? [lint('ship-not-last')(problem)] : []
  })
}

const NAMED_PR = /(?:^|\s)([^\s/#]+\/[^\s/#]+#\d+)/g
// A run of hex with a digit in it, so a word such as "defaced" is not read as a sha.
const NAMED_SHA = /\b(?=[a-f]*\d)[0-9a-f]{7,40}\b/g

/** A Ship names one PR at one head: its group's, and no other in its prompt. */
function shipHeadProblems(m: Manifest): LintProblem[] {
  const groups = new Map(m.prGroups?.map((g) => [g.pr, g.headSha]))
  return m.questions.filter(isMergeBound).flatMap((ship) => {
    const pr = prKey(ship)
    const head = ship.merge.headSha
    const groupHead = groups.get(pr)
    const otherPrs = [...ship.prompt.matchAll(NAMED_PR)].map((x) => x[1]).filter((p) => p !== pr)
    const otherShas = (ship.prompt.match(NAMED_SHA) ?? []).filter((s) => !head.startsWith(s))
    return [
      ...(groupHead && groupHead !== head
        ? [`question ${ship.id}: it ships ${pr} at ${head}, but its PR group is at ${groupHead}`]
        : []),
      ...[...new Set(otherPrs)].map(
        (p) => `question ${ship.id}: its prompt names ${p}, but it ships ${pr}`
      ),
      ...otherShas.map(
        (s) => `question ${ship.id}: its prompt names head ${s}, but it ships ${pr} at ${head}`
      ),
    ].map(lint('ship-head-mismatch'))
  })
}

/**
 * The review-layout problems of a parsed round, empty when it passes. Pure: builders refuse a
 * round with any problem, and a console lists one with its reasons.
 */
export function lintRound(round: Manifest): LintProblem[] {
  const prs = sectionPrs(round)
  return [
    ...anchoringProblems(round),
    ...unitProblems(round),
    ...alternateProblems(round),
    ...groupProblems(round, prs),
    ...shipOrderProblems(round, prs),
    ...shipHeadProblems(round),
  ]
}
