import type { TableAlign } from './proseFenceTable'

export type ProseBlockType = 'h1' | 'h2' | 'h3' | 'li' | 'p' | 'code' | 'table' | 'callout'

/** A `::: kind` container's kind. Unknown kinds read as `info`. */
export type ProseCalloutKind = 'tip' | 'info' | 'warning' | 'danger'

export interface ProseBlock {
  type: ProseBlockType
  /** Plain text of the block; for a code block the code, for a table its cells in reading order. */
  text: string
  /** Code blocks: the fence's language label, empty when absent. */
  lang?: string
  /** Tables: the header cells. */
  header?: string[]
  /** Tables: one alignment per column, from the delimiter row. */
  align?: TableAlign[]
  /** Tables: body rows, each padded or truncated to the header count. */
  rows?: string[][]
  /** Headings: the source level, 1 to 6 (`type` flattens 4 to 6 into `h3`). */
  level?: number
  /** Headings: the anchor id, from `{#id}` or the slug of the heading text. */
  id?: string
  /** Ordered list items: set. */
  ordered?: true
  /** Ordered list items: the number shown, counting on from the list's first. */
  n?: number
  /** List items and callouts: the blocks nested inside. */
  children?: ProseBlock[]
  /** Callouts: the container kind. */
  kind?: ProseCalloutKind
  /** Callouts: the title after the kind, empty when the kind's name stands in. */
  title?: string
}
