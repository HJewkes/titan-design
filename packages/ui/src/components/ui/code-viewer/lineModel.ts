import type {
  DevWarn,
  HighlightRun,
  LineModel,
  LineModelInput,
  LineRange,
  RangeEdge,
} from './types'

// Bundlers replace `process.env.NODE_ENV` literally; the DTS build has no Node types.
declare const process: { env: { NODE_ENV?: string } }
const warned = new Set<string>()

/** Warns once per message in development; the model rebuilds whenever its inputs change. */
export const devWarn: DevWarn = (message) => {
  if (typeof process === 'undefined' || process.env.NODE_ENV === 'production') return
  if (warned.has(message)) return
  warned.add(message)
  console.warn(`titan: CodeViewer ${message}`)
}

const BOM = '﻿'

/** Splits on LF, CRLF and lone CR. One trailing terminator adds no line, matching editor numbering. */
export function splitLines(text: string): string[] {
  const body = text.startsWith(BOM) ? text.slice(1) : text
  if (body === '') return []
  return body.replace(/(\r\n|\r|\n)$/, '').split(/\r\n|\r|\n/)
}

const DEFAULT_TAB_SIZE = 4
const tabStop = (tabSize: number) =>
  Number.isInteger(tabSize) && tabSize >= 1 ? tabSize : DEFAULT_TAB_SIZE

/** Replaces each tab with spaces up to the next multiple of `tabSize`; a code point is one column. */
export function expandTabs(line: string, tabSize: number = DEFAULT_TAB_SIZE): string {
  if (!line.includes('\t')) return line
  const size = tabStop(tabSize)
  let column = 0
  let expanded = ''
  for (const char of line) {
    const width = char === '\t' ? size - (column % size) : 1
    expanded += char === '\t' ? ' '.repeat(width) : char
    column += width
  }
  return expanded
}

function columnCount(line: string, tabSize: number): number {
  let column = 0
  for (const char of line) column += char === '\t' ? tabSize - (column % tabSize) : 1
  return column
}

/**
 * The width of the longest line: its column count, tabs expanded, times the mono `advance`. Known
 * before any row mounts, so the horizontal scrollbar does not jump as windowed rows come and go.
 */
export function contentWidth(
  lines: readonly string[],
  advance: number,
  tabSize: number = DEFAULT_TAB_SIZE
): number {
  const size = tabStop(tabSize)
  let columns = 0
  for (const line of lines) columns = Math.max(columns, columnCount(line, size))
  return columns * advance
}

/** A start line that is not an integer of 1 or more becomes 1. */
export function normalizeStartLine(startLine: number, warn: DevWarn = devWarn): number {
  if (Number.isInteger(startLine) && startLine >= 1) return startLine
  warn(`startLine ${startLine} is not an integer of 1 or more; using 1`)
  return 1
}

function isUsable(range: LineRange, warn: DevWarn): boolean {
  if (!Number.isInteger(range.startLine) || !Number.isInteger(range.endLine)) return false
  if (range.endLine >= range.startLine) return true
  // Dropped, not swapped: a swap would hide the upstream bug that produced it.
  warn(`dropped inverted range ${range.startLine} to ${range.endLine}`)
  return false
}

function clip(range: LineRange, firstLine: number, lastLine: number): HighlightRun | null {
  const startLine = Math.max(range.startLine, firstLine)
  const endLine = Math.min(range.endLine, lastLine)
  if (startLine > endLine) return null
  return { startLine, endLine, labels: range.label === undefined ? [] : [range.label] }
}

function mergeSorted(runs: HighlightRun[]): HighlightRun[] {
  const merged: HighlightRun[] = []
  for (const run of runs) {
    const previous = merged[merged.length - 1]
    if (previous && run.startLine <= previous.endLine) {
      previous.endLine = Math.max(previous.endLine, run.endLine)
      previous.labels.push(...run.labels)
    } else {
      merged.push({ ...run, labels: [...run.labels] })
    }
  }
  return merged
}

/**
 * Drops non-integer and inverted ranges, clips to `firstLine..lastLine`, drops ranges wholly
 * outside, merges overlapping and nested ranges, and sorts by start line.
 */
export function normalizeRanges(
  ranges: readonly LineRange[],
  firstLine: number,
  lastLine: number,
  warn: DevWarn = devWarn
): HighlightRun[] {
  const clipped = ranges
    .filter((range) => isUsable(range, warn))
    .map((range) => clip(range, firstLine, lastLine))
    .filter((run): run is HighlightRun => run !== null)
  // Array.prototype.sort is stable, so equal starts keep input order and labels stay in order.
  clipped.sort((a, b) => a.startLine - b.startLine)
  return mergeSorted(clipped)
}

/** Maps each covered file line to its run index, in O(covered lines). */
export function rangesByLine(runs: readonly HighlightRun[]): Map<number, number> {
  const byLine = new Map<number, number>()
  runs.forEach((run, index) => {
    for (let line = run.startLine; line <= run.endLine; line++) byLine.set(line, index)
  })
  return byLine
}

/** Digits in the widest gutter number, taken from the last line number, not the line count. */
export function gutterDigits(lastLine: number): number {
  return String(Math.max(1, Math.trunc(lastLine))).length
}

/** The line's place in the run that covers it, or `null` when no run does. */
export function rangeEdges(line: number, runs: readonly HighlightRun[]): RangeEdge | null {
  const run = runs.find(({ startLine, endLine }) => startLine <= line && line <= endLine)
  if (!run) return null
  if (run.startLine === run.endLine) return 'single'
  if (line === run.startLine) return 'first'
  return line === run.endLine ? 'last' : 'middle'
}

const describeRun = ({ startLine, endLine, labels }: HighlightRun): string => {
  const span = startLine === endLine ? `line ${startLine}` : `lines ${startLine} to ${endLine}`
  return labels.length > 0 ? `${span} (${labels.join(', ')})` : span
}

/** One sentence naming every flagged run and its labels, or `null` when nothing is flagged. */
export function highlightSummary(runs: readonly HighlightRun[]): string | null {
  if (runs.length === 0) return null
  return `Flagged: ${runs.map(describeRun).join(', ')}`
}

/** The row index of a file line, clamped to the rows that exist. */
export function scrollIndexFor(line: number, startLine: number, lineCount: number): number {
  return Math.min(Math.max(line - startLine, 0), Math.max(lineCount - 1, 0))
}

export function buildLineModel(
  { text, startLine = 1, endLine, highlights = [] }: LineModelInput,
  warn: DevWarn = devWarn
): LineModel {
  const lines = splitLines(text)
  const first = normalizeStartLine(startLine, warn)
  const lastLine = first + lines.length - 1
  if (endLine !== undefined && lines.length > 0 && endLine !== lastLine) {
    warn(
      `endLine ${endLine} disagrees with the text, which ends at line ${lastLine}; using the text`
    )
  }
  const runs = normalizeRanges(highlights, first, lastLine, warn)
  return {
    lines,
    startLine: first,
    lastLine,
    runs,
    runByLine: rangesByLine(runs),
    gutterDigits: gutterDigits(lastLine),
  }
}
