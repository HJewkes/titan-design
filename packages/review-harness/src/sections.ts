import { questionScope } from './round.ts'
import {
  AUTO_HEIGHT,
  type FrameHeight,
  type Manifest,
  type Part,
  type Question,
  type StripKind,
  type Variant,
} from '@titan-design/review-schema'

/** What an auto-sized frame shows until (or unless) a measurement arrives. */
export const AUTO_FALLBACK_HEIGHT = 900

export interface ResolvedSection {
  id: string
  title: string
  deciding?: string
  changed?: string
  context?: string
  /** The changed parts as code, rendered as Current/Proposed panes and a settled FYI list. */
  parts?: Part[]
  kind?: StripKind
  questions: Question[]
  variants: Variant[]
  /** Frames shown in another section that this one also bears on. */
  seeAlso: Variant[]
  /** What the section renders, top to bottom; `questions` and `variants` each appear once. */
  blocks: LayoutBlock[]
}

/**
 * One piece of a section: a question with no frames of its own, the strip of frames no question
 * claims, or a question under the frames it names (`frames`).
 */
export type LayoutBlock =
  | { kind: 'question'; question: Question }
  | { kind: 'strip'; variants: Variant[] }
  | { kind: 'anchored'; question: Question; variants: Variant[] }

export interface RoundLayout {
  /** Empty for a manifest without `sections`, which then renders exactly as it always has. */
  sections: ResolvedSection[]
  otherVariants: Variant[]
  overallQuestions: Question[]
}

/** Variant-scoped questions sit right under the variants; round-scoped ones follow. */
export function orderedQuestions(manifest: Manifest): Question[] {
  const byScope = (s: 'variant' | 'round') =>
    manifest.questions.filter((q) => questionScope(q, manifest) === s)
  return [...byScope('variant'), ...byScope('round')]
}

function pick<T>(items: T[], ids: string[], idOf: (item: T) => string): T[] {
  return ids
    .map((id) => items.find((item) => idOf(item) === id))
    .filter((item): item is T => !!item)
}

const isShipQuestion = (q: Question) => q.kind === 'pick-one' && q.merge !== undefined

/**
 * A section top to bottom: its unanchored questions, the strip of unclaimed frames, each
 * anchored question under its own frames, then its Ship, which always reads last (item 140).
 */
export function sectionBlocks(questions: Question[], variants: Variant[]): LayoutBlock[] {
  const anchoredKeys = new Set(questions.flatMap((q) => q.frames ?? []))
  const strip = variants.filter((v) => !anchoredKeys.has(v.key))
  const loose = questions.filter((q) => !q.frames)
  const asQuestion = (question: Question): LayoutBlock => ({ kind: 'question', question })
  return [
    ...loose.filter((q) => !isShipQuestion(q)).map(asQuestion),
    ...(strip.length ? [{ kind: 'strip' as const, variants: strip }] : []),
    ...questions.flatMap((question): LayoutBlock[] =>
      question.frames
        ? [{ kind: 'anchored', question, variants: pick(variants, question.frames, (v) => v.key) }]
        : []
    ),
    ...loose.filter(isShipQuestion).map(asQuestion),
  ]
}

/** The page's reading order: each section's blocks, then the leftovers. */
export function roundLayout(manifest: Manifest): RoundLayout {
  const sections = (manifest.sections ?? []).map((s) => {
    const questions = pick(manifest.questions, s.questionIds, (q) => q.id)
    const variants = pick(manifest.variants, s.variantKeys, (v) => v.key)
    return {
      id: s.id,
      title: s.title,
      ...(s.deciding ? { deciding: s.deciding } : {}),
      ...(s.changed ? { changed: s.changed } : {}),
      ...(s.context ? { context: s.context } : {}),
      ...(s.parts ? { parts: s.parts } : {}),
      ...(s.kind ? { kind: s.kind } : {}),
      questions,
      variants,
      seeAlso: pick(manifest.variants, s.seeAlso, (v) => v.key),
      blocks: sectionBlocks(questions, variants),
    }
  })
  const placedVariants = new Set(sections.flatMap((s) => s.variants.map((v) => v.key)))
  const placedQuestions = new Set(sections.flatMap((s) => s.questions.map((q) => q.id)))
  return {
    sections,
    otherVariants: manifest.variants.filter((v) => !placedVariants.has(v.key)),
    overallQuestions: orderedQuestions(manifest).filter((q) => !placedQuestions.has(q.id)),
  }
}

const TITLE_PR = /^(?:([^\s#]+\/[^\s#]+))?#(\d+)\b/

/** Each grouped section's PR, from the round's explicit `prGroups`. */
export function explicitPrs(groups: { pr: string; sectionIds: string[] }[] = []) {
  return new Map(groups.flatMap((g) => g.sectionIds.map((id): [string, string] => [id, g.pr])))
}

/**
 * The PR a section is about: its explicit PR group, else its questions' `page`, else the `#n`
 * its title opens with, resolved against the pages the round's questions name.
 */
export function sectionPr(
  section: { id?: string; title: string; questionIds?: string[] },
  questions: Map<string, { page?: string }>,
  known: string[],
  explicit: Map<string, string> = new Map()
): string | undefined {
  const grouped = section.id === undefined ? undefined : explicit.get(section.id)
  if (grouped) return grouped
  const pages = (section.questionIds ?? []).flatMap((id) => questions.get(id)?.page ?? [])
  if (pages[0]) return pages[0]
  const match = TITLE_PR.exec(section.title)
  if (!match) return undefined
  const [, repo, pr] = match
  return repo ? `${repo}#${pr}` : (known.find((k) => k.endsWith(`#${pr}`)) ?? `#${pr}`)
}

/**
 * Section ids grouped so that consecutive sections about one PR share a page, and a page never
 * splits a PR group. `prGroups` names a group outright; `lintRound` keeps its sections together.
 */
export function prGroups(manifest: Manifest): string[][] {
  const byId = new Map(manifest.questions.map((q) => [q.id, q]))
  const known = manifest.questions.flatMap((q) => q.page ?? [])
  const explicit = explicitPrs(manifest.prGroups)
  const groups: { pr?: string; ids: string[] }[] = []
  for (const section of manifest.sections ?? []) {
    const pr = sectionPr(section, byId, known, explicit)
    const last = groups.at(-1)
    if (pr && last?.pr === pr) last.ids.push(section.id)
    else groups.push({ pr, ids: [section.id] })
  }
  return groups.map((g) => g.ids)
}

/** The section a frame is shown in, or undefined when it is not in one. */
function sectionOf(manifest: Manifest, variantKey: string) {
  return manifest.sections?.find((s) => s.variantKeys.includes(variantKey))
}

/** The section that asks a question, or undefined when it is not in one. */
export function sectionOfQuestion(manifest: Manifest, questionId: string) {
  return manifest.sections?.find((s) => s.questionIds.includes(questionId))
}

/** Variant height beats section height beats the round's, which defaults to "auto". */
export function frameHeight(manifest: Manifest, variant: Variant): FrameHeight {
  return variant.height ?? sectionOf(manifest, variant.key)?.height ?? manifest.height
}

export interface FrameSizing {
  height: FrameHeight
  maxHeight: number
}

/** The page's sizing: a round-level number caps fitted frames; a variant or section one fixes them. */
export function frameSizing(manifest: Manifest, variant: Variant): FrameSizing {
  const own = variant.height ?? sectionOf(manifest, variant.key)?.height
  const cap = isAuto(manifest.height) ? manifest.maxHeight : manifest.height
  return { height: own ?? AUTO_HEIGHT, maxHeight: cap }
}

/** The questions whose section shows this frame, so a comment on it has an address. */
export function questionsForVariant(manifest: Manifest, variantKey: string): string[] {
  return sectionOf(manifest, variantKey)?.questionIds ?? []
}

/**
 * Option to variant key, for the questions where picking an option IS picking a frame.
 * Explicit `optionVariants` always wins; inside a section, options that are variant keys
 * of that section map to themselves. Never inferred for a manifest without sections, so
 * an old round keeps exactly the behaviour it had.
 */
export function optionVariants(manifest: Manifest, question: Question): Map<string, string> {
  if (question.kind !== 'pick-one' && question.kind !== 'pick-many') return new Map()
  if (question.optionVariants) return new Map(Object.entries(question.optionVariants))
  const section = sectionOfQuestion(manifest, question.id)
  if (!section) return new Map()
  const shown = new Set(section.variantKeys)
  return new Map(question.options.filter((o) => shown.has(o)).map((o) => [o, o]))
}

export interface VariantLink {
  question: Question
  option: string
}

/** Every question whose option stands for this frame, for the verdict-to-pick direction. */
export function linksForVariant(manifest: Manifest, variantKey: string): VariantLink[] {
  return manifest.questions.flatMap((question) =>
    [...optionVariants(manifest, question)]
      .filter(([, key]) => key === variantKey)
      .map(([option]) => ({ question, option }))
  )
}

export function isAuto(height: FrameHeight): height is typeof AUTO_HEIGHT {
  return height === AUTO_HEIGHT
}
