import type { ReactNode } from 'react'

/** One place the user can jump to, or one action they can run. */
export interface CommandItem<T = unknown> {
  id: string
  label: string
  description?: string
  groupId?: string
  /** Matched by the query, never shown. */
  keywords?: string[]
  leading?: ReactNode
  /** For example a key hint. */
  trailing?: ReactNode
  isDisabled?: boolean
  data?: T
}

/** A result class shown under one header. Array order of `groups` is display order. */
export interface CommandGroup {
  id: string
  label: string
}

/** A run of matched characters in an item's label; `end` is exclusive. */
export interface MatchRange {
  start: number
  end: number
}

export interface FuzzyMatch {
  score: number
  ranges: MatchRange[]
}

export interface CommandItemState {
  isActive: boolean
  isDisabled: boolean
  matches: MatchRange[]
}

export interface LoadResultsOptions {
  signal: AbortSignal
}

export type LoadResults<T = unknown> = (
  query: string,
  options: LoadResultsOptions
) => Promise<CommandItem<T>[]>

export interface CommandPaletteProps<T = unknown> {
  /** Controlled open state. */
  isOpen?: boolean
  /** Initial open state when uncontrolled. */
  defaultIsOpen?: boolean
  onOpenChange?: (isOpen: boolean) => void

  query?: string
  defaultQuery?: string
  onQueryChange?: (query: string) => void

  /** Static source; the palette ranks it. */
  items?: CommandItem<T>[]
  groups?: CommandGroup[]
  /** Async source; its results keep the order returned. */
  loadResults?: LoadResults<T>
  debounceMs?: number
  /** Applies to the async source only. */
  minQueryLength?: number
  onLoadError?: (error: unknown) => void

  /** Most recent first; shown when the query is empty. */
  recentItems?: CommandItem<T>[]
  recentLabel?: string
  ungroupedLabel?: string

  onSelect: (item: CommandItem<T>) => void
  closeOnSelect?: boolean
  maxResults?: number

  renderItem?: (item: CommandItem<T>, state: CommandItemState) => ReactNode
  placeholder?: string
  footer?: ReactNode
  /** Shown for a query with no results. */
  emptyState?: ReactNode
  /** Shown when the async source failed. */
  errorState?: ReactNode
  /** The static list is not ready yet. */
  isLoading?: boolean

  /** Names the dialog and the input. */
  accessibilityLabel: string
  className?: string
}
