import {
  codeOf,
  indentOf,
  isSpace,
  trimRange,
  type LineRange,
  type ProseSource,
} from './proseSource'

/*
 * Line classifiers. Each walks one line forward from its start and never backs up, so a line
 * costs a fixed number of reads per character whatever it holds. A line no classifier claims is
 * paragraph text.
 */

const HASH = codeOf('#')
const COLON = codeOf(':')
const DASH = codeOf('-')
const UNDERSCORE = codeOf('_')
const PERIOD = codeOf('.')
const CLOSE_PAREN = codeOf(')')
const ZERO = codeOf('0')
const NINE = codeOf('9')
const BULLETS = new Set(Array.from('-*+', codeOf))
const LANG_SYMBOLS = new Set(Array.from('_+#.-', codeOf))
const MAX_HEADING_LEVEL = 6
const MAX_ORDINAL_DIGITS = 9

const isDigit = (code: number) => code >= ZERO && code <= NINE
const isLetter = (code: number) => (code | 32) >= codeOf('a') && (code | 32) <= codeOf('z')
const isWordChar = (code: number) => isLetter(code) || isDigit(code) || code === UNDERSCORE

/** The first index at or after `i`, before `end`, that is not white space. */
export function skipSpaces(src: ProseSource, i: number, end: number): number {
  let at = i
  while (at < end && isSpace(src.charCodeAt(at))) at++
  return at
}

/** Whether `text` is spelled at `i` and ends by `end`. */
export function isAt(src: ProseSource, i: number, end: number, text: string): boolean {
  if (i + text.length > end) return false
  for (let k = 0; k < text.length; k++) {
    if (src.charCodeAt(i + k) !== codeOf(text[k]!)) return false
  }
  return true
}

/** The first index of `text` in `[from, end)`, or -1. `text` is a short literal, so this is linear. */
export function findText(src: ProseSource, from: number, end: number, text: string): number {
  for (let i = from; i + text.length <= end; i++) if (isAt(src, i, end, text)) return i
  return -1
}

/** The line, trimmed, is exactly `text`. */
export function isExactly(src: ProseSource, line: LineRange, text: string): boolean {
  const { start, end } = trimRange(src, line)
  return end - start === text.length && isAt(src, start, end, text)
}

function startsWithText(src: ProseSource, line: LineRange, text: string): boolean {
  const { start, end } = trimRange(src, line)
  return isAt(src, start, end, text)
}

export interface HeadingLine {
  level: number
  text: string
}

/** `#` to `######`, white space, then the heading text. */
export function headingLine(src: ProseSource, line: LineRange): HeadingLine | null {
  const { start, end } = trimRange(src, line)
  let i = start
  while (i < end && i - start <= MAX_HEADING_LEVEL && src.charCodeAt(i) === HASH) i++
  const level = i - start
  if (level === 0 || level > MAX_HEADING_LEVEL || i === end || !isSpace(src.charCodeAt(i))) {
    return null
  }
  return { level, text: src.slice(skipSpaces(src, i, end), end) }
}

const isLangChar = (code: number) => isLetter(code) || isDigit(code) || LANG_SYMBOLS.has(code)

/** A fence opener's language label (empty when absent), or `null` when the line opens no fence. */
export function fenceOpenLang(src: ProseSource, line: LineRange): string | null {
  const { start, end } = trimRange(src, line)
  if (!isAt(src, start, end, '```')) return null
  const langStart = skipSpaces(src, start + 3, end)
  for (let i = langStart; i < end; i++) if (!isLangChar(src.charCodeAt(i))) return null
  return src.slice(langStart, end)
}

export const isFenceClose = (src: ProseSource, line: LineRange) => isExactly(src, line, '```')

/** Any line starting with three backticks opens or closes a fence inside a container. */
export const togglesFence = (src: ProseSource, line: LineRange) => startsWithText(src, line, '```')

export interface CalloutOpenLine {
  word: string
  title: string
}

/** `:::`, the kind word in letters, then an optional title. */
export function calloutOpenLine(src: ProseSource, line: LineRange): CalloutOpenLine | null {
  const { start, end } = trimRange(src, line)
  if (!isAt(src, start, end, ':::')) return null
  const wordStart = skipSpaces(src, start + 3, end)
  let i = wordStart
  while (i < end && isLetter(src.charCodeAt(i))) i++
  if (i === wordStart) return null
  return { word: src.slice(wordStart, i), title: src.slice(skipSpaces(src, i, end), end) }
}

export const isCalloutClose = (src: ProseSource, line: LineRange) => isExactly(src, line, ':::')

export interface ListItemLine {
  /** White-space characters before the marker. */
  indent: number
  ordered: boolean
  /** The ordinal of an ordered item, else 1. */
  number: number
  /** Where the item's text starts, as an offset from the line's start. */
  offset: number
}

/** Past a `-`, `*` or `+` bullet or a 1-to-9-digit ordinal with `.` or `)`; -1 when there is none. */
function markerEnd(src: ProseSource, start: number, end: number): number {
  if (start < end && BULLETS.has(src.charCodeAt(start))) return start + 1
  let i = start
  while (i < end && i - start <= MAX_ORDINAL_DIGITS && isDigit(src.charCodeAt(i))) i++
  const digits = i - start
  if (digits === 0 || digits > MAX_ORDINAL_DIGITS || i === end) return -1
  const close = src.charCodeAt(i)
  return close === PERIOD || close === CLOSE_PAREN ? i + 1 : -1
}

/** A marker, at least one white-space character, then text that is not blank. */
export function listItemLine(src: ProseSource, line: LineRange): ListItemLine | null {
  const markerStart = line.start + indentOf(src, line)
  const after = markerEnd(src, markerStart, line.end)
  if (after === -1 || after === line.end || !isSpace(src.charCodeAt(after))) return null
  const textStart = skipSpaces(src, after, line.end)
  if (textStart === line.end) return null
  const ordered = isDigit(src.charCodeAt(markerStart))
  return {
    indent: markerStart - line.start,
    ordered,
    number: ordered ? Number(src.slice(markerStart, after - 1)) : 1,
    offset: textStart - line.start,
  }
}

export const isCommentOpener = (src: ProseSource, line: LineRange) =>
  startsWithText(src, line, '<!--')

/** A YAML key at the very start of the line: word characters or `-`, then `:`. */
export function isFrontmatterKey(src: ProseSource, line: LineRange): boolean {
  for (let i = line.start; i < line.end; i++) {
    const code = src.charCodeAt(i)
    if (code === COLON) return i > line.start
    if (!isWordChar(code) && code !== DASH) return false
  }
  return false
}

export const hasPipe = (src: ProseSource, line: LineRange) =>
  findText(src, line.start, line.end, '|') !== -1
