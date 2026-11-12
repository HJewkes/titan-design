import { fenceOpenLang, hasPipe, isFenceClose } from './proseLines'
import { isBlank, type LineRange, type ProseSource } from './proseSource'

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

const DELIMITER_CELL = /^:?-+:?$/

/** A fence opened at `start`, or `null` when that line opens none. An unterminated fence takes every remaining line. */
export function readFence(src: ProseSource, lines: LineRange[], start: number): FenceRead | null {
  const lang = fenceOpenLang(src, lines[start]!)
  if (lang === null) return null
  const body: string[] = []
  let i = start + 1
  for (; i < lines.length && !isFenceClose(src, lines[i]!); i++) {
    body.push(src.slice(lines[i]!.start, lines[i]!.end))
  }
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
export function readTable(src: ProseSource, lines: LineRange[], start: number): TableRead | null {
  const head = lines[start]
  const delimiter = lines[start + 1]
  if (head === undefined || delimiter === undefined || !hasPipe(src, head)) return null
  const delimiterText = src.slice(delimiter.start, delimiter.end)
  if (!isDelimiterRow(delimiterText)) return null
  const header = splitRow(src.slice(head.start, head.end))
  const count = header.length
  const align = fit(splitRow(delimiterText), count).map((cell) => alignOf(cell))
  const rows: string[][] = []
  let i = start + 2
  for (; i < lines.length && !isBlank(src, lines[i]!) && hasPipe(src, lines[i]!); i++) {
    rows.push(fit(splitRow(src.slice(lines[i]!.start, lines[i]!.end)), count))
  }
  return { header, align, rows, next: i }
}
