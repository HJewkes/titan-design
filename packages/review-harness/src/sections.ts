import { questionScope } from './round.ts'
import {
  AUTO_HEIGHT,
  type FrameHeight,
  type Manifest,
  type Question,
  type Variant,
} from './schema.ts'

/** What an auto-sized frame shows until (or unless) a measurement arrives. */
export const AUTO_FALLBACK_HEIGHT = 900

export interface ResolvedSection {
  id: string
  title: string
  context?: string
  questions: Question[]
  variants: Variant[]
  /** Frames shown in another section that this one also bears on. */
  seeAlso: Variant[]
}

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

/** The page's reading order: each section's questions then its frames, then the leftovers. */
export function roundLayout(manifest: Manifest): RoundLayout {
  const sections = (manifest.sections ?? []).map((s) => ({
    id: s.id,
    title: s.title,
    ...(s.context ? { context: s.context } : {}),
    questions: pick(manifest.questions, s.questionIds, (q) => q.id),
    variants: pick(manifest.variants, s.variantKeys, (v) => v.key),
    seeAlso: pick(manifest.variants, s.seeAlso, (v) => v.key),
  }))
  const placedVariants = new Set(sections.flatMap((s) => s.variants.map((v) => v.key)))
  const placedQuestions = new Set(sections.flatMap((s) => s.questions.map((q) => q.id)))
  return {
    sections,
    otherVariants: manifest.variants.filter((v) => !placedVariants.has(v.key)),
    overallQuestions: orderedQuestions(manifest).filter((q) => !placedQuestions.has(q.id)),
  }
}

/** The section a frame is shown in, or undefined when it is not in one. */
export function sectionOf(manifest: Manifest, variantKey: string) {
  return manifest.sections?.find((s) => s.variantKeys.includes(variantKey))
}

/** Variant height beats section height beats the round's, which defaults to "auto". */
export function frameHeight(manifest: Manifest, variant: Variant): FrameHeight {
  return variant.height ?? sectionOf(manifest, variant.key)?.height ?? manifest.height
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
  const section = manifest.sections?.find((s) => s.questionIds.includes(question.id))
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
