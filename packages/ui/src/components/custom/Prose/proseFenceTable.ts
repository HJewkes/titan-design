import { fenceOpenLang, hasPipe, isFenceClose } from './proseLines'
import { codeOf, isBlank, type LineRange, type ProseSource } from './proseSource'

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

const PIPE = codeOf('|')
const BACKSLASH = codeOf('\\')
const COLON = codeOf(':')
const DASH = codeOf('-')

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

/** `:?-+:?`: a run of dashes, optionally colon-capped at either end. */
function isDelimiterCell(cell: string): boolean {
  const start = cell.charCodeAt(0) === COLON ? 1 : 0
  const last = cell.length - 1
  const end = last >= start && cell.charCodeAt(last) === COLON ? last : cell.length
  if (start >= end) return false
  for (let i = start; i < end; i++) if (cell.charCodeAt(i) !== DASH) return false
  return true
}

/** A cell with each escaped pipe unescaped. */
function unescapePipes(cell: string): string {
  let out = ''
  for (let i = 0; i < cell.length; i++) {
    if (cell.charCodeAt(i) !== BACKSLASH || cell.charCodeAt(i + 1) !== PIPE) out += cell[i]
  }
  return out
}

/** A row's cells: split at each pipe not escaped with a backslash, one outer pipe dropped at each end. */
function splitRow(line: string): string[] {
  const trimmed = line.trim()
  const start = trimmed.charCodeAt(0) === PIPE ? 1 : 0
  const last = trimmed.length - 1
  const end = last >= start && trimmed.charCodeAt(last) === PIPE ? last : trimmed.length
  const cells: string[] = []
  let cellStart = start
  for (let i = start; i < end; i++) {
    const escaped = i > start && trimmed.charCodeAt(i - 1) === BACKSLASH
    if (trimmed.charCodeAt(i) !== PIPE || escaped) continue
    cells.push(unescapePipes(trimmed.slice(cellStart, i).trim()))
    cellStart = i + 1
  }
  cells.push(unescapePipes(trimmed.slice(cellStart, end).trim()))
  return cells
}

function isDelimiterRow(line: string): boolean {
  if (!line.includes('|') && !isDelimiterCell(line.trim())) return false
  const cells = splitRow(line)
  return cells.length > 0 && cells.every(isDelimiterCell)
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
