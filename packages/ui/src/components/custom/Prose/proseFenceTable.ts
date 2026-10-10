export type TableAlign = 'left' | 'center' | 'right'

export interface FenceRead {
  lang: string
  code: string
  /** Index of the first line after the fence; the end of input when the fence never closes. */
  next: number
}

export interface TableRead {
  header: string[]
  align: TableAlign[]
  rows: string[][]
  next: number
}

const FENCE_OPEN = /^\s*```\s*([\w+#.-]*)\s*$/
const FENCE_CLOSE = /^\s*```\s*$/
const DELIMITER_CELL = /^:?-+:?$/

export function isFenceOpen(line: string): boolean {
  return FENCE_OPEN.test(line)
}

/** Reads a fence opened at `start`. An unterminated fence takes every remaining line. */
export function readFence(lines: string[], start: number): FenceRead {
  const lang = FENCE_OPEN.exec(lines[start]!)?.[1] ?? ''
  const body: string[] = []
  let i = start + 1
  while (i < lines.length && !FENCE_CLOSE.test(lines[i]!)) body.push(lines[i++]!)
  return { lang, code: body.join('\n'), next: Math.min(i + 1, lines.length) }
}

function splitRow(line: string): string[] {
  const inner = line.trim().replace(/^\|/, '').replace(/\|$/, '')
  return inner.split(/(?<!\\)\|/).map((cell) => cell.trim().replace(/\\\|/g, '|'))
}

function isDelimiterRow(line: string): boolean {
  if (!line.includes('|') && !DELIMITER_CELL.test(line.trim())) return false
  const cells = splitRow(line)
  return cells.length > 0 && cells.every((cell) => DELIMITER_CELL.test(cell))
}

function alignOf(cell: string): TableAlign {
  const left = cell.startsWith(':')
  const right = cell.endsWith(':')
  if (left && right) return 'center'
  return right ? 'right' : 'left'
}

/** Pads or truncates a row to the header's column count. */
function fit(cells: string[], count: number): string[] {
  return Array.from({ length: count }, (_, i) => cells[i] ?? '')
}

/** A table is a pipe header line straight above a delimiter row; anything else is prose. */
export function readTable(lines: string[], start: number): TableRead | null {
  const head = lines[start]
  const delimiter = lines[start + 1]
  if (head === undefined || delimiter === undefined) return null
  if (!head.includes('|') || !isDelimiterRow(delimiter)) return null
  const header = splitRow(head)
  const count = header.length
  const align = fit(splitRow(delimiter), count).map((cell) => alignOf(cell))
  const rows: string[][] = []
  let i = start + 2
  while (i < lines.length && lines[i]!.trim() && lines[i]!.includes('|')) {
    rows.push(fit(splitRow(lines[i]!), count))
    i++
  }
  return { header, align, rows, next: i }
}
