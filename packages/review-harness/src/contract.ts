import type { Manifest, Question, Section, Variant } from './schema.ts'

// The review contract's checks across fields; the fields it requires are in RoundSchema.

export interface Problem {
  path: string
  message: string
}

export function duplicates(values: string[]): string[] {
  return values.filter((v, i) => values.indexOf(v) !== i)
}

// "sign off as built", "approve it as built", "LGTM", "looks good": approval of everything at once.
const BLANKET_SIGN_OFF =
  /^(?:(?:(?:sign ?-?off|approve|accept|ship|merge|keep)\s+)?(?:(?:it|all|this|everything)\s+)?as[\s-]built|lgtm|looks good(?: to me)?|approve(?: it)?|ship it)$/

export function isBlanketSignOff(text: string): boolean {
  const words = text
    .toLowerCase()
    .replace(/[^a-z\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return BLANKET_SIGN_OFF.test(words)
}

function frameSettings(variant: Variant): Record<string, string> {
  return {
    source: variant.image === undefined ? 'live story' : 'image',
    height: String(variant.height ?? 'the section default'),
    globals: JSON.stringify(variant.globals ?? {}),
  }
}

/** The settings two frames of one CHOICE strip disagree on, as "setting (A: x, B: y)". */
export function settingMismatches(settings: Map<string, Record<string, string>>): string[] {
  const [first, ...rest] = [...settings]
  if (!first) return []
  return Object.keys(first[1]).flatMap((name) => {
    const differs = rest.find(([, s]) => s[name] !== first[1][name])
    return differs
      ? [`${name} (${first[0]}: ${first[1][name]}, ${differs[0]}: ${differs[1][name]})`]
      : []
  })
}

export function choiceMismatchMessage(sectionId: string, mismatches: string[]): string {
  return (
    `section ${sectionId}: its CHOICE frames differ in ${mismatches.join(', ')}; ` +
    'a choice holds every frame setting constant except the property decided'
  )
}

function picksAFrame(question: Question, frames: Set<string>): boolean {
  if (question.kind !== 'pick-one' && question.kind !== 'pick-many') return false
  return !!question.optionVariants || question.options.some((o) => frames.has(o))
}

function stripProblems(section: Section, m: Manifest): string[] {
  const where = `section ${section.id}`
  if (section.variantKeys.length === 0) return []
  if (!section.kind) return [`${where}: a strip of frames needs kind CHOICE or STATES`]
  const frames = new Set(section.variantKeys)
  const questions = m.questions.filter((q) => section.questionIds.includes(q.id))
  if (section.kind === 'STATES')
    return questions
      .filter((q) => picksAFrame(q, frames))
      .map((q) => `${where}: a STATES strip asks no choice, but question ${q.id} picks a frame`)
  if (frames.size < 2) return [`${where}: a CHOICE strip needs two frames to choose between`]
  const settings = new Map(
    m.variants.filter((v) => frames.has(v.key)).map((v) => [v.key, frameSettings(v)])
  )
  const mismatches = settingMismatches(settings)
  return mismatches.length ? [choiceMismatchMessage(section.id, mismatches)] : []
}

function looseFrameProblems(m: Manifest): string[] {
  const placed = new Set(m.sections?.flatMap((s) => s.variantKeys))
  return m.variants
    .filter((v) => !placed.has(v.key))
    .map((v) => `variant ${v.key} is in no section; every frame belongs to a section's strip`)
}

function blanketProblems(q: Question): string[] {
  const texts = [
    q.prompt,
    ...(q.kind === 'pick-one' || q.kind === 'pick-many' ? q.options : []),
    ...(q.kind === 'pick-one' && q.signsOff ? [q.signsOff] : []),
  ]
  return texts
    .filter(isBlanketSignOff)
    .map((t) => `question ${q.id}: "${t}" is a blanket sign-off; name the changed part instead`)
}

/** The only options a merge-bound question may offer; schema.ts holds it to them. */
export const SHIP_OPTIONS = ['Ship', "Don't ship"]

type PickOne = Extract<Question, { kind: 'pick-one' }>

const isShipWording = (q: PickOne, option: string) =>
  q.merge !== undefined && SHIP_OPTIONS.includes(option)

/** Options are a question's own: none repeats within it or in another pick-one's options.
 * A question's own `revisionOption` is exempt from the cross-question check: rounds share one wording.
 * So are the fixed Ship options, between two merge-bound questions: a round binds one PR per question. */
function optionProblems(m: Manifest): string[] {
  const frames = new Set(m.variants.map((v) => v.key))
  const pickOnes = m.questions.filter((q) => q.kind === 'pick-one')
  const owner = new Map<string, PickOne>()
  const shared = pickOnes.flatMap((q) =>
    [...new Set(q.options)]
      .filter((o) => !frames.has(o) && o !== q.revisionOption)
      .flatMap((o) => {
        const first = owner.get(o)
        if (first === undefined) owner.set(o, q)
        if (first === undefined || (isShipWording(first, o) && isShipWording(q, o))) return []
        return [`question ${q.id}: option "${o}" is also in ${first.id}`]
      })
  )
  const repeated = m.questions.flatMap((q) =>
    q.kind === 'pick-one' || q.kind === 'pick-many'
      ? [...new Set(duplicates(q.options))].map((o) => `question ${q.id}: option "${o}" repeats`)
      : []
  )
  return [...repeated, ...shared]
}

/** Part ids are unique across the round, so a signsOff names one part wherever it is read. */
function partIdProblems(m: Manifest): string[] {
  const sections = m.sections ?? []
  const ids = sections.flatMap((s) => (s.parts ?? []).map((p) => p.id))
  return [...new Set(duplicates(ids))].map((id) => {
    const holders = sections.filter((s) => s.parts?.some((p) => p.id === id)).map((s) => s.id)
    if (holders.length === 1) return `part ${id} repeats in section ${holders[0]}`
    return `part ${id} is in sections ${holders.slice(0, -1).join(', ')} and ${holders.at(-1)}`
  })
}

/**
 * In a section with `parts`, a pick-one's signsOff is the id of one of its unsettled parts.
 * A section without `parts` keeps free-text signsOff, so a round written before parts still loads.
 */
function signsOffProblems(section: Section, m: Manifest): string[] {
  if (!section.parts) return []
  const parts = new Map(section.parts.map((p) => [p.id, p]))
  return m.questions
    .filter((q) => section.questionIds.includes(q.id))
    .flatMap((q) => {
      if (q.kind !== 'pick-one' || !q.signsOff) return []
      const part = parts.get(q.signsOff)
      if (!part)
        return [`question ${q.id}: signsOff "${q.signsOff}" names no part in section ${section.id}`]
      if (part.settled)
        return [
          `question ${q.id}: signsOff "${q.signsOff}" names a settled part in section ${section.id}; a pick-one signs off an unsettled one`,
        ]
      return []
    })
}

export function contractProblems(m: Manifest): Problem[] {
  const sections = m.sections ?? []
  return [
    ...[...sections.flatMap((s) => stripProblems(s, m)), ...partIdProblems(m)].map((message) => ({
      path: 'sections',
      message,
    })),
    ...looseFrameProblems(m).map((message) => ({ path: 'variants', message })),
    ...[
      ...m.questions.flatMap(blanketProblems),
      ...optionProblems(m),
      ...sections.flatMap((s) => signsOffProblems(s, m)),
    ].map((message) => ({ path: 'questions', message })),
  ]
}
