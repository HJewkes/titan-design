import { rankItems } from './match-model'
import type { RankedItem } from './match-model'
import type { CommandGroup, CommandItem, MatchRange } from './types'

export { fuzzyMatch, rankItems } from './match-model'
export type { RankedItem } from './match-model'

export const DEFAULT_MAX_RESULTS = 50
export const DEFAULT_RECENT_LABEL = 'Recent'
export const DEFAULT_UNGROUPED_LABEL = 'Other'
/** Section ids the palette reserves; the NUL prefix keeps them apart from any consumer group id. */
export const RECENT_SECTION_ID = '\u0000recent'
export const UNGROUPED_SECTION_ID = '\u0000other'

export interface PaletteOption<T = unknown> {
  item: CommandItem<T>
  sectionId: string
  matches: MatchRange[]
}

export interface PaletteSection<T = unknown> {
  id: string
  label: string
  options: PaletteOption<T>[]
}

export interface PaletteSections<T = unknown> {
  sections: PaletteSection<T>[]
  /** Every option in display order; the arrow keys walk exactly this list. */
  options: PaletteOption<T>[]
}

export interface BuildSectionsInput<T = unknown> {
  query: string
  items?: CommandItem<T>[]
  groups?: CommandGroup[]
  /** Results of the async source for `query`, in the order returned. */
  asyncItems?: CommandItem<T>[]
  recentItems?: CommandItem<T>[]
  recentLabel?: string
  ungroupedLabel?: string
  maxResults?: number
}

function emptySections<T>(input: BuildSectionsInput<T>): PaletteSection<T>[] {
  const sections: PaletteSection<T>[] = []
  const seen = new Set<string>()
  for (const group of input.groups ?? []) {
    if (seen.has(group.id)) continue
    seen.add(group.id)
    sections.push({ id: group.id, label: group.label, options: [] })
  }
  const ungroupedLabel = input.ungroupedLabel ?? DEFAULT_UNGROUPED_LABEL
  return [...sections, { id: UNGROUPED_SECTION_ID, label: ungroupedLabel, options: [] }]
}

function placeInGroups<T>(sections: PaletteSection<T>[], ranked: RankedItem<T>[]): void {
  const byId = new Map(sections.map((section) => [section.id, section]))
  for (const { item, ranges } of ranked) {
    const section = byId.get(item.groupId ?? UNGROUPED_SECTION_ID) ?? byId.get(UNGROUPED_SECTION_ID)
    section?.options.push({ item, sectionId: section.id, matches: ranges })
  }
}

const unranked = <T>(items: CommandItem<T>[]): RankedItem<T>[] =>
  items.map((item) => ({ item, score: 0, ranges: [] }))

function candidateSections<T>(input: BuildSectionsInput<T>, query: string): PaletteSection<T>[] {
  const grouped = emptySections(input)
  if (query.length === 0) {
    placeInGroups(grouped, unranked(input.items ?? []))
    const recentLabel = input.recentLabel ?? DEFAULT_RECENT_LABEL
    const recent: PaletteSection<T> = { id: RECENT_SECTION_ID, label: recentLabel, options: [] }
    recent.options = (input.recentItems ?? []).map((item) => ({
      item,
      sectionId: RECENT_SECTION_ID,
      matches: [],
    }))
    return [recent, ...grouped]
  }
  placeInGroups(grouped, rankItems(input.items ?? [], query))
  placeInGroups(grouped, unranked(input.asyncItems ?? []))
  return grouped
}

/** Drops repeated ids (first in display order wins), cuts at `limit`, and drops empty sections. */
function dedupeAndCut<T>(sections: PaletteSection<T>[], limit: number): PaletteSection<T>[] {
  const seen = new Set<string>()
  let remaining = Math.max(0, limit)
  return sections
    .map((section) => {
      const options = section.options.filter((option) => {
        if (remaining === 0 || seen.has(option.item.id)) return false
        seen.add(option.item.id)
        remaining -= 1
        return true
      })
      return { ...section, options }
    })
    .filter((section) => section.options.length > 0)
}

/** Orders recents, static matches and async results into sections, in the order the list draws them. */
export function buildSections<T>(input: BuildSectionsInput<T>): PaletteSections<T> {
  const query = input.query.trim()
  const limit = input.maxResults ?? DEFAULT_MAX_RESULTS
  const sections = dedupeAndCut(candidateSections(input, query), limit)
  return { sections, options: sections.flatMap((section) => section.options) }
}

export type NavigationKey = 'ArrowDown' | 'ArrowUp'

/**
 * The next enabled option from `index` in the direction of `key`, wrapping at both ends. An `index`
 * of -1 means no option is active. Returns `index` unchanged when no option is enabled.
 */
export function nextOptionIndex(
  options: readonly { item: { isDisabled?: boolean } }[],
  index: number,
  key: NavigationKey
): number {
  const count = options.length
  const step = key === 'ArrowDown' ? 1 : -1
  let candidate = index < 0 && step < 0 ? count : index
  for (let tried = 0; tried < count; tried += 1) {
    candidate = (((candidate + step) % count) + count) % count
    if (!options[candidate].item.isDisabled) return candidate
  }
  return index
}

export type AsyncStatus = 'idle' | 'pending' | 'resolved' | 'rejected'

export interface AsyncResultsState<T = unknown> {
  status: AsyncStatus
  /** The latest request; only its response is applied. */
  requestId: number
  query: string
  items: CommandItem<T>[]
  error: unknown
}

export type AsyncResultsEvent<T = unknown> =
  | { type: 'request'; requestId: number; query: string }
  | { type: 'resolve'; requestId: number; items: CommandItem<T>[] }
  | { type: 'reject'; requestId: number; error: unknown }
  | { type: 'reset' }

export const initialAsyncResults: AsyncResultsState<never> = {
  status: 'idle',
  requestId: 0,
  query: '',
  items: [],
  error: undefined,
}

const isAwaited = <T>(state: AsyncResultsState<T>, requestId: number): boolean =>
  state.status === 'pending' && state.requestId === requestId

/** The async source's request lifecycle; a response to any request but the pending one is discarded. */
export function asyncResultsReducer<T>(
  state: AsyncResultsState<T>,
  event: AsyncResultsEvent<T>
): AsyncResultsState<T> {
  switch (event.type) {
    case 'request':
      return {
        ...initialAsyncResults,
        status: 'pending',
        requestId: event.requestId,
        query: event.query,
      }
    case 'resolve':
      if (!isAwaited(state, event.requestId)) return state
      return { ...state, status: 'resolved', items: event.items }
    case 'reject':
      if (!isAwaited(state, event.requestId)) return state
      return { ...state, status: 'rejected', error: event.error }
    case 'reset':
      return { ...initialAsyncResults, requestId: state.requestId }
  }
}
