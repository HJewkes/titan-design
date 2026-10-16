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
  /** Clears the selection to `null` (Escape). */
  clearSelection: () => void
}
