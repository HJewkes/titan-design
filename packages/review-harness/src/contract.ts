import type { Manifest, Question, Section, Variant } from './schema.ts'

// The review contract's checks across fields; the fields it requires are in RoundSchema.

export interface Problem {
  path: string
  message: string
}

export function duplicates(values: string[]): string[] {
  return values.filter((v, i) => values.indexOf(v) !== i)
}

// "sign off as built", "merge as built", "approve it as built": approval of everything at once.
const BLANKET_SIGN_OFF =
  /^(?:(?:sign ?-?off|approve|accept|ship|merge|keep)\s+)?(?:(?:it|all|this|everything)\s+)?as[\s-]built$/

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

/** Options are a question's own: none repeats within it or in another pick-one's options. */
function optionProblems(m: Manifest): string[] {
  const frames = new Set(m.variants.map((v) => v.key))
  const pickOnes = m.questions.filter((q) => q.kind === 'pick-one')
  const owner = new Map<string, string>()
  const shared = pickOnes.flatMap((q) =>
    [...new Set(q.options)]
      .filter((o) => !frames.has(o))
      .flatMap((o) => {
        const first = owner.get(o)
        if (first === undefined) owner.set(o, q.id)
        return first === undefined ? [] : [`question ${q.id}: option "${o}" is also in ${first}`]
      })
  )
  const repeated = m.questions.flatMap((q) =>
    q.kind === 'pick-one' || q.kind === 'pick-many'
      ? [...new Set(duplicates(q.options))].map((o) => `question ${q.id}: option "${o}" repeats`)
      : []
  )
  return [...repeated, ...shared]
}

export function contractProblems(m: Manifest): Problem[] {
  return [
    ...(m.sections ?? []).flatMap((s) =>
      stripProblems(s, m).map((message) => ({ path: 'sections', message }))
    ),
    ...looseFrameProblems(m).map((message) => ({ path: 'variants', message })),
    ...[...m.questions.flatMap(blanketProblems), ...optionProblems(m)].map((message) => ({
      path: 'questions',
      message,
    })),
  ]
}
