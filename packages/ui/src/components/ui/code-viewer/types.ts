import type { ReactNode } from 'react'
import type { ViewProps } from 'react-native'

/** An inclusive span of 1-based file line numbers. `{ startLine: 10, endLine: 10 }` is one line. */
export interface LineRange {
  startLine: number
  endLine: number
  label?: string
}

/** One merged highlight after normalization: clipped to the window, never overlapping another run. */
export interface HighlightRun {
  startLine: number
  endLine: number
  /** Labels of every range merged into this run, in input order. */
  labels: string[]
}

/** Where a line sits inside its run, so a row can draw the run's caps. */
export type RangeEdge = 'single' | 'first' | 'middle' | 'last'

export type DevWarn = (message: string) => void

export interface LineModel {
  lines: string[]
  /** File line number of `lines[0]`, clamped to 1 or more. */
  startLine: number
  /** File line number of the last row; `startLine - 1` when there are no lines. */
  lastLine: number
  runs: HighlightRun[]
  /** File line number to the index of the run covering it. */
  runByLine: Map<number, number>
  gutterDigits: number
}

export interface LineModelInput {
  text: string
  startLine?: number
  /** Informational (`excerpt.endLine`): the text wins, and a disagreement warns in development. */
  endLine?: number
  highlights?: readonly LineRange[]
}

export interface UseLineRangeOptions extends LineModelInput {
  highlights?: LineRange[]
  /** Controlled selection; `null` is "nothing selected", `undefined` leaves it uncontrolled. */
  selectedRange?: LineRange | null
  defaultSelectedRange?: LineRange | null
  onSelectedRangeChange?: (range: LineRange | null) => void
  /** Ignores every selection action; an existing selection stays visible. */
  isDisabled?: boolean
}

export interface LineRangeState {
  model: LineModel
  selectedRange: LineRange | null
  /** The gutter's active line (the listbox's `aria-activedescendant`). */
  activeLine: number
  /** Moves the active line by `delta`, stopping at the first and last line. */
  moveActive: (delta: number) => void
  /** Moves the active line to a file line number (Home and End), clamped to the window. */
  moveActiveTo: (line: number) => void
  /** Moves the active line by `delta` and selects from the anchor to it (Shift+Up and Shift+Down). */
  extendSelection: (delta: number) => void
  /** Selects the active line alone, or clears the selection if it is exactly that line (Space). */
  toggleActive: () => void
  /** Moves the active line to `line` and toggles it as a one-line selection (a gutter press). */
  selectLine: (line: number) => void
  /** Clears the selection to `null` (Escape). */
  clearSelection: () => void
}

/** Row density. `sm` is the Typography `mono` line box; `md` is one type step up. */
export type CodeViewerSize = 'sm' | 'md'

export interface CodeViewerProps extends Omit<ViewProps, 'children'> {
  /** The source text. Lines split on LF, CRLF and lone CR; one trailing newline adds no line. */
  text: string
  /** File line number of the first line. Default 1. */
  startLine?: number
  /** Flagged lines: evidence, with one neutral treatment and no per-range colour. */
  highlights?: LineRange[]
  /** One-way command: scrolls this file line into view on mount and on change. It never selects. */
  focusLine?: number
  /** Controlled selection; `null` is "nothing selected", `undefined` leaves it uncontrolled. */
  selectedRange?: LineRange | null
  defaultSelectedRange?: LineRange | null
  onSelectedRangeChange?: (range: LineRange | null) => void
  /** Reserved for the syntax-colouring slice; it has no effect yet. */
  language?: string
  /** Wraps long lines and turns windowing off. Thousands of wrapped lines are unsupported. */
  wrap?: boolean
  /** Shows the line-number gutter, which is also the line-selection listbox. Default true. */
  showLineNumbers?: boolean
  /** Columns per tab stop. Default 4. */
  tabSize?: number
  size?: CodeViewerSize
  /** Viewport cap in px. Above 500 unwrapped lines the viewer windows and caps itself at 480. */
  maxHeight?: number
  /** Shows the default truncation notice when `footer` is not set. */
  isTruncated?: boolean
  isLoading?: boolean
  /** Skeleton rows shown while loading. Default 8. */
  loadingLineCount?: number
  /** Stops selection; scrolling and copying keep working, and a selection stays visible. */
  isDisabled?: boolean
  /** Consumer vocabulary above the code: path, origin badge, copy action. */
  header?: ReactNode
  /** Replaces the default truncation notice. */
  footer?: ReactNode
  /** Replaces the default "No source to show" state for an empty `text`. */
  emptyState?: ReactNode
  /** Names the region, for example "Tooltip.tsx, lines 78 to 157". */
  accessibilityLabel: string
  className?: string
}
