import type { TableAlign } from './proseFenceTable'

export type ProseBlockType = 'h1' | 'h2' | 'h3' | 'li' | 'p' | 'code' | 'table'

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
}
