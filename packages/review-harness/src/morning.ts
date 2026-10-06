import { readFile } from 'node:fs/promises'
import { dirname, isAbsolute, relative, resolve } from 'node:path'
import { z } from 'zod'
import { proposalText } from './morning-text.ts'
import { ReviewError } from './review.ts'
import {
  MANIFEST_SCHEMA_ID,
  RoundSchema,
  THEME_MODES,
  type ManifestInput,
  type Recommendation,
} from './schema.ts'

// A deterministic round from seat Morning items: no agent decides what the owner sees.

export const MORNING_ITEMS_SCHEMA_ID = 'titan-review/morning-items@1'
export const DECIDER_BY = 'decider'

const DEFAULT_STORYBOOK = 'http://127.0.0.1:6006'
const DEFAULT_WIDTHS = [1280]
const ONE_WAY = 'One-way door: hard to undo once done.'
const UNMEASURED = 'a capture supplied with the item; no DOM to measure'

const id = z.string().regex(/^[A-Za-z0-9_-]{1,32}$/, 'letters, digits, _ and - only')
const text = z.string().regex(/\S/, 'must not be blank')

export const DOORS = ['one-way', 'two-way'] as const

/** One option as the owner reads it: the pick, and the text of what picking it proposes. */
const OptionSchema = z
  .object({
    label: text,
    proposal: z.string({ error: 'every option carries its proposal text' }).regex(/\S/, {
      error: 'every option carries its proposal text; a bare heading cannot be decided',
    }),
  })
  .strict()

/** A before or after capture that bears on the item, relative to the items file. */
const ImageSchema = z
  .object({
    key: id,
    file: text,
    label: text,
  })
  .strict()

const ItemSchema = z
  .object({
    id,
    seat: text,
    /** The Morning item's number or label on the seat's list. */
    morning: text.optional(),
    door: z.enum(DOORS),
    title: text,
    /** Markdown: what the item is and why it reaches the owner. */
    body: text,
    options: z.array(OptionSchema).min(2),
    images: z.array(ImageSchema).optional(),
    /** The changed part an answer approves; derived from the title when absent. */
    signsOff: text.optional(),
  })
  .strict()

export const MorningItemsSchema = z
  .object({
    schema: z.literal(MORNING_ITEMS_SCHEMA_ID),
    unit: text,
    round: z.number().int().min(1),
    storybookUrl: z.string().optional(),
    widths: z.array(z.number().int()).min(1).optional(),
    /** Markdown shown at the top of the round. */
    context: z.string().optional(),
    items: z.array(ItemSchema).min(1),
  })
  .strict()

/** The decider's answer to one item, kept in its own file so it never anchors the seat text. */
const DeciderEntrySchema = z
  .object({
    questionId: id,
    answer: text,
    rationale: text,
    confidence: z.number().min(0).max(1),
    /** Where the decider's reasoning is recorded, so the owner can read it. */
    cite: text,
  })
  .strict()

export const DeciderSchema = z.array(DeciderEntrySchema)

export type MorningItems = z.output<typeof MorningItemsSchema>
export type MorningItem = MorningItems['items'][number]
export type DeciderEntry = z.output<typeof DeciderEntrySchema>

type Question = ManifestInput['questions'][number]
type Section = NonNullable<ManifestInput['sections']>[number]
type Variant = ManifestInput['variants'][number]

function itemHeading(item: MorningItem): string {
  return item.morning === undefined ? item.seat : `${item.seat} Morning ${item.morning}`
}

/** A name in the round: an item's own value, or that value qualified by the item's id. */
type OptionName = (item: MorningItem, value: string) => string

/** A value that appears in more than one item carries its item's id in every item. */
function qualifier(
  items: MorningItem[],
  values: (item: MorningItem) => string[],
  qualify: (value: string, id: string) => string
): OptionName {
  const seen = new Map<string, number>()
  for (const item of items)
    for (const value of new Set(values(item))) seen.set(value, (seen.get(value) ?? 0) + 1)
  return (item, value) => ((seen.get(value) ?? 0) > 1 ? qualify(value, item.id) : value)
}

/** Options are a question's own under the contract, but seats reuse "C: Defer" across items. */
export function optionNamer(items: MorningItem[]): OptionName {
  return qualifier(
    items,
    (item) => item.options.map((o) => o.label),
    (label, id) => `${label} (${id})`
  )
}

/** Variant keys are the round's, but every item's captures are "before" and "after". */
export function imageKeyNamer(items: MorningItem[]): OptionName {
  return qualifier(
    items,
    (item) => (item.images ?? []).map((i) => i.key),
    (key, id) => `${key}-${id}`
  )
}

/** The option's proposal, labelled; an option that is only a heading cannot be decided. */
function proposed(item: MorningItem, option: MorningItem['options'][number]): string {
  const text = proposalText(option.proposal).trim()
  if (!text)
    throw new ReviewError(
      `item ${item.id}: option "${option.label}" has no proposal text; a bare heading cannot be decided`
    )
  return `Proposed: ${text.replace(/^Proposed:\s*/, '')}`
}

function deciding(item: MorningItem, name: OptionName): string {
  const options = item.options.map((o) => `- **${name(item, o.label)}** ${proposed(item, o)}`)
  return [`What to do about ${itemHeading(item)}: ${item.title}`, '', ...options].join('\n')
}

function context(item: MorningItem): string {
  const door = item.door === 'one-way' ? ONE_WAY : 'Two-way door: it can be undone later.'
  const captures = item.images?.length
    ? 'The captures below show the change; nothing else in them is under review.'
    : 'Nothing is rendered for this item, so there are no captures.'
  return `${door} ${captures}`
}

/** The decider's answer names the item's own label; the round carries the option's text. */
function recommendation(item: MorningItem, entry: DeciderEntry | undefined, name: OptionName) {
  if (!entry) return {}
  if (!item.options.some((o) => o.label === entry.answer))
    throw new ReviewError(
      `decider: ${entry.questionId}: the answer "${entry.answer}" is not one of its options`
    )
  const rec: Recommendation = {
    answer: name(item, entry.answer),
    rationale: `${entry.rationale.trim()}\n\nCite: ${entry.cite.trim()}`,
    confidence: entry.confidence,
    by: DECIDER_BY,
  }
  return { recommendation: rec }
}

function question(item: MorningItem, entry: DeciderEntry | undefined, name: OptionName): Question {
  return {
    id: item.id,
    kind: 'pick-one',
    prompt: item.title,
    options: item.options.map((o) => name(item, o.label)),
    required: true,
    signsOff: item.signsOff ?? `the answer to ${itemHeading(item)}: ${item.title}`,
    ...recommendation(item, entry, name),
  }
}

/** Image paths move from the items file's directory to the draft's, which must not escape it. */
function imagePath(item: MorningItem, file: string, paths: MorningPaths): string {
  const path = relative(paths.draftDir, resolve(paths.itemsDir, file)).split('\\').join('/')
  if (path === '..' || path.startsWith('../') || isAbsolute(path))
    throw new ReviewError(
      `item ${item.id}: image ${file} is outside the draft's directory ${paths.draftDir}; ` +
        'write the draft beside the items file, or below it'
    )
  return path
}

interface Names {
  option: OptionName
  imageKey: OptionName
}

function variants(item: MorningItem, paths: MorningPaths, names: Names): Variant[] {
  return (item.images ?? []).map((i) => ({
    key: names.imageKey(item, i.key),
    image: imagePath(item, i.file, paths),
    label: i.label,
  }))
}

function strip(item: MorningItem, names: Names): Partial<Section> {
  const keys = (item.images ?? []).map((i) => names.imageKey(item, i.key))
  if (keys.length === 0) return {}
  const unmeasured = keys.flatMap((variant) =>
    THEME_MODES.map((mode) => ({ variant, mode, reason: UNMEASURED }))
  )
  return { kind: 'STATES', variantKeys: keys, contrast: { unmeasured } }
}

function section(item: MorningItem, names: Names): Section {
  return {
    id: item.id,
    title: `${itemHeading(item)}: ${item.title}`,
    deciding: deciding(item, names.option),
    changed: proposalText(item.body),
    context: context(item),
    questionIds: [item.id],
    ...strip(item, names),
  }
}

/** Items in their seats' order of first appearance, each seat's items together, in file order. */
export function groupBySeat(items: MorningItem[]): MorningItem[] {
  const seats = [...new Set(items.map((i) => i.seat))]
  return seats.flatMap((seat) => items.filter((i) => i.seat === seat))
}

function deciderByQuestion(items: MorningItem[], entries: DeciderEntry[]) {
  const ids = new Set(items.map((i) => i.id))
  const unknown = entries.filter((e) => !ids.has(e.questionId)).map((e) => e.questionId)
  if (unknown.length) throw new ReviewError(`decider: no item has the id ${unknown.join(', ')}`)
  return new Map(entries.map((e) => [e.questionId, e]))
}

export interface MorningPaths {
  /** Where the items file is; image paths resolve against it. */
  itemsDir: string
  /** Where the draft will be written; image paths are rewritten relative to it. */
  draftDir: string
}

/** The round@2 draft for these items, or the first way it falls short of the contract. */
export function roundFromMorning(
  input: MorningItems,
  decider: DeciderEntry[],
  paths: MorningPaths
): ManifestInput {
  const items = groupBySeat(input.items)
  const entries = deciderByQuestion(items, decider)
  const names = { option: optionNamer(items), imageKey: imageKeyNamer(items) }
  const draft: ManifestInput = {
    schema: MANIFEST_SCHEMA_ID,
    unit: input.unit,
    round: input.round,
    storybookUrl: input.storybookUrl ?? DEFAULT_STORYBOOK,
    ...(input.context === undefined ? {} : { context: proposalText(input.context) }),
    widths: input.widths ?? DEFAULT_WIDTHS,
    variants: items.flatMap((i) => variants(i, paths, names)),
    questions: items.map((i) => question(i, entries.get(i.id), names.option)),
    sections: items.map((i) => section(i, names)),
    recommendations: 'after-answer',
  }
  const parsed = RoundSchema.safeParse(draft)
  if (!parsed.success)
    throw new ReviewError(
      `the items build a round that fails the contract:\n${parsed.error.issues
        .map((i) => `  ${i.path.map(String).join('.')}: ${i.message}`)
        .join('\n')}`
    )
  return draft
}

async function readJson(path: string, what: string): Promise<unknown> {
  const raw = await readFile(path, 'utf8').catch(() => {
    throw new ReviewError(`cannot read ${what} ${path}`)
  })
  try {
    return JSON.parse(raw)
  } catch {
    throw new ReviewError(`${what} ${path} is not JSON`)
  }
}

function parseOrThrow<T>(schema: z.ZodType<T>, json: unknown, what: string, path: string): T {
  const parsed = schema.safeParse(json)
  if (parsed.success) return parsed.data
  const issues = parsed.error.issues.map((i) => `  ${i.path.map(String).join('.')}: ${i.message}`)
  throw new ReviewError(`invalid ${what} ${path}:\n${issues.join('\n')}`)
}

export async function readMorningItems(path: string): Promise<MorningItems> {
  return parseOrThrow(MorningItemsSchema, await readJson(path, 'items file'), 'items file', path)
}

export async function readDecider(path: string | undefined): Promise<DeciderEntry[]> {
  if (path === undefined) return []
  return parseOrThrow(DeciderSchema, await readJson(path, 'decider file'), 'decider file', path)
}

/** `round from-morning <items.json>`: the draft, built from the files, as it will be written. */
export async function buildMorningDraft(
  itemsPath: string,
  deciderPath: string | undefined,
  draftPath: string
): Promise<ManifestInput> {
  const [items, decider] = await Promise.all([
    readMorningItems(itemsPath),
    readDecider(deciderPath),
  ])
  return roundFromMorning(items, decider, {
    itemsDir: dirname(itemsPath),
    draftDir: dirname(draftPath),
  })
}
