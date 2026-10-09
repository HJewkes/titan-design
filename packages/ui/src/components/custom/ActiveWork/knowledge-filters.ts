import { NOTE_KINDS, SOURCE_TYPES, type NoteKind, type SourceType } from './knowledge-class'

/** The two record kinds the knowledge list shows. */
export type KnowledgeRecord = 'note' | 'source'

/**
 * One note or source, as the knowledge list renders it. The host maps the
 * `note.list` and `source.list` entries onto this shape: `slug` to `initiative`,
 * `kind` to `noteKind`, `type` to `sourceType`, `nested` to `isNested`.
 */
export interface KnowledgeItem {
  /** Opaque row key, never parsed: `<slug>:notes:<filename>` or `<slug>:sources:<filename>` on the wire. */
  id: string
  /** The wire ref a navigation or chip reads (`note:<slug>/<file>`). Not the row key. */
  ref?: string
  record: KnowledgeRecord
  initiative: string
  title: string
  /** Absolute path. Display text only; a filename repeats across initiatives, so it is never the identity. */
  path: string
  noteKind?: NoteKind
  sourceType?: SourceType
  /** ISO date the note was written. Sources carry none. */
  created?: string
  /** ISO time the file last changed. Both records carry it; null on the wire maps to absent. */
  mtime?: string
  tags?: string[]
  /** A source under a `sources/<dir>/` subdirectory: listed by path, not in the search index. */
  isNested?: boolean
}

/** A file the source could not read. Reported, never dropped. */
export interface KnowledgeProblem {
  initiative: string
  filename: string
  error: string
}

export type KnowledgeDateRange = 'all' | '7d' | '30d' | '90d'

export interface KnowledgeFilters {
  /** Literal words, matched case-insensitively against title, path, initiative and tags. */
  query: string
  initiatives: string[]
  records: KnowledgeRecord[]
  noteKinds: NoteKind[]
  sourceTypes: SourceType[]
  dateRange: KnowledgeDateRange
}

/** An empty facet means "any", never "none". */
export const EMPTY_KNOWLEDGE_FILTERS: KnowledgeFilters = {
  query: '',
  initiatives: [],
  records: [],
  noteKinds: [],
  sourceTypes: [],
  dateRange: 'all',
}

const DAY_MS = 86_400_000

export const KNOWLEDGE_DATE_RANGE_DAYS: Record<Exclude<KnowledgeDateRange, 'all'>, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
}

const ISO_DAY = /^(\d{4})-(\d{2})-(\d{2})/

/**
 * Epoch ms for an ISO date or time, or undefined. Stricter than `Date.parse`,
 * which rolls `2026-02-30` over into March instead of refusing it.
 */
export function parseKnowledgeDate(iso: string | undefined): number | undefined {
  const day = iso ? ISO_DAY.exec(iso) : null
  if (!iso || !day) return undefined
  const [year, month, date] = [Number(day[1]), Number(day[2]), Number(day[3])]
  const calendar = new Date(Date.UTC(year, month - 1, date))
  const isRealDay =
    calendar.getUTCFullYear() === year &&
    calendar.getUTCMonth() === month - 1 &&
    calendar.getUTCDate() === date
  const ms = Date.parse(iso)
  return isRealDay && Number.isFinite(ms) ? ms : undefined
}

/** The date an item is listed and filtered by: when a note was written, else when the file last changed. */
export function knowledgeDate(item: KnowledgeItem): number | undefined {
  return parseKnowledgeDate(item.created ?? item.mtime)
}

/** The kind of a note or the type of a source: the one "what is it" value a row shows. */
export function knowledgeKind(item: KnowledgeItem): NoteKind | SourceType | undefined {
  return item.record === 'note' ? item.noteKind : item.sourceType
}

function matchesQuery(item: KnowledgeItem, words: string[]): boolean {
  if (words.length === 0) return true
  const haystack = [item.title, item.path, item.initiative, ...(item.tags ?? [])]
    .join('\n')
    .toLowerCase()
  return words.every((word) => haystack.includes(word))
}

/**
 * Kinds and types are one facet: picking `gotcha` asks for gotchas, so it hides
 * every source unless a source type is picked beside it.
 */
function matchesKind(item: KnowledgeItem, filters: KnowledgeFilters): boolean {
  if (filters.noteKinds.length === 0 && filters.sourceTypes.length === 0) return true
  if (item.record === 'note') return !!item.noteKind && filters.noteKinds.includes(item.noteKind)
  return !!item.sourceType && filters.sourceTypes.includes(item.sourceType)
}

function matchesDate(item: KnowledgeItem, range: KnowledgeDateRange, now: number): boolean {
  if (range === 'all') return true
  const date = knowledgeDate(item)
  // An undated item cannot be shown to fall inside a range; the list counts it instead.
  return date !== undefined && date >= now - KNOWLEDGE_DATE_RANGE_DAYS[range] * DAY_MS
}

const queryWords = (query: string) => query.toLowerCase().split(/\s+/).filter(Boolean)

/** The items the filters keep, in input order. Never sorts and never mutates the input. */
export function filterKnowledge(
  items: KnowledgeItem[],
  filters: KnowledgeFilters,
  now: number
): KnowledgeItem[] {
  const words = queryWords(filters.query)
  return items.filter(
    (item) =>
      (filters.initiatives.length === 0 || filters.initiatives.includes(item.initiative)) &&
      (filters.records.length === 0 || filters.records.includes(item.record)) &&
      matchesKind(item, filters) &&
      matchesQuery(item, words) &&
      matchesDate(item, filters.dateRange, now)
  )
}

/** How many items every other filter keeps but the date range drops for having no valid date. */
export function countUndatedExcluded(
  items: KnowledgeItem[],
  filters: KnowledgeFilters,
  now: number
): number {
  if (filters.dateRange === 'all') return 0
  const undated = filterKnowledge(items, { ...filters, dateRange: 'all' }, now)
  return undated.filter((item) => knowledgeDate(item) === undefined).length
}

export interface KnowledgeFacetCounts {
  /** Initiatives in first-seen order. */
  initiatives: Record<string, number>
  records: Record<KnowledgeRecord, number>
  noteKinds: Record<NoteKind, number>
  sourceTypes: Record<SourceType, number>
}

const zeroes = <K extends string>(keys: K[]) =>
  Object.fromEntries(keys.map((key) => [key, 0])) as Record<K, number>

/** Items per facet value. A note counts under its kind only, a source under its type only. */
export function knowledgeFacetCounts(items: KnowledgeItem[]): KnowledgeFacetCounts {
  const counts: KnowledgeFacetCounts = {
    initiatives: {},
    records: { note: 0, source: 0 },
    noteKinds: zeroes(NOTE_KINDS),
    sourceTypes: zeroes(SOURCE_TYPES),
  }
  for (const item of items) {
    counts.initiatives[item.initiative] = (counts.initiatives[item.initiative] ?? 0) + 1
    counts.records[item.record]++
    if (item.record === 'note' && item.noteKind) counts.noteKinds[item.noteKind]++
    if (item.record === 'source' && item.sourceType) counts.sourceTypes[item.sourceType]++
  }
  return counts
}

/**
 * An item with the values the list sorts on. `useTable` ranks a blank field last
 * in both directions only for a plain field, not under a custom comparator, so an
 * invalid date becomes an absent `date` here rather than a comparator branch.
 */
export interface KnowledgeSortRow extends KnowledgeItem {
  date?: number
  kind?: string
}

export function toKnowledgeSortRows(items: KnowledgeItem[]): KnowledgeSortRow[] {
  return items.map((item) => ({ ...item, date: knowledgeDate(item), kind: knowledgeKind(item) }))
}

/** Text columns compare by locale, not code unit, so `b` does not sort after `Z`. */
export const KNOWLEDGE_COMPARATORS = {
  title: (a: KnowledgeSortRow, b: KnowledgeSortRow) => a.title.localeCompare(b.title),
  initiative: (a: KnowledgeSortRow, b: KnowledgeSortRow) =>
    a.initiative.localeCompare(b.initiative) || a.title.localeCompare(b.title),
}

/** One item per id; the first wins, so a duplicate on the wire cannot render two rows with one key. */
export function uniqueKnowledge(items: KnowledgeItem[]): KnowledgeItem[] {
  const seen = new Set<string>()
  return items.filter((item) => {
    if (seen.has(item.id)) return false
    seen.add(item.id)
    return true
  })
}
