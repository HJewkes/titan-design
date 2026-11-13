/**
 * What a prose scanner reads. A plain `string` satisfies it; a test passes a wrapper that counts
 * every read, which is how the scanners prove they read each character a bounded number of times.
 */
export interface ProseSource {
  readonly length: number
  charCodeAt(index: number): number
  slice(start: number, end?: number): string
}

/** A line as a half-open range of the source, its line ending excluded. */
export interface LineRange {
  start: number
  end: number
}

/** The UTF-16 code of a one-character string. */
export const codeOf = (char: string): number => char.charCodeAt(0)

const LF = codeOf('\n')
const CR = codeOf('\r')
const LINE_SEPARATOR = codeOf('\u2028')
const PARAGRAPH_SEPARATOR = codeOf('\u2029')

/** Exactly the characters JavaScript's `\s` and `String#trim` treat as white space. */
const SPACES = new Set(
  Array.from(
    '\t\n\v\f\r \u00a0\u1680\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u2028\u2029\u202f\u205f\u3000\ufeff',
    codeOf
  )
)

const SPACE = codeOf(' ')
const NO_BREAK_SPACE = codeOf('\u00a0')

export function isSpace(code: number): boolean {
  // Printable ASCII, the common case, holds no white space past the space itself.
  if (code > SPACE && code < NO_BREAK_SPACE) return false
  return SPACES.has(code)
}

function isLineEnd(code: number): boolean {
  return code === LF || code === CR || code === LINE_SEPARATOR || code === PARAGRAPH_SEPARATOR
}

/**
 * The lines of a source in one pass. CRLF, CR, LF, U+2028 and U+2029 each end a line. Like
 * `split('\n')`, a trailing line ending leaves a final empty line and an empty source is one line.
 */
export function splitLines(src: ProseSource): LineRange[] {
  const lines: LineRange[] = []
  let start = 0
  for (let i = 0; i < src.length; i++) {
    const code = src.charCodeAt(i)
    if (!isLineEnd(code)) continue
    lines.push({ start, end: i })
    if (code === CR && i + 1 < src.length && src.charCodeAt(i + 1) === LF) i++
    start = i + 1
  }
  lines.push({ start, end: src.length })
  return lines
}

/** How many white-space characters open the line. */
export function indentOf(src: ProseSource, line: LineRange): number {
  let i = line.start
  while (i < line.end && isSpace(src.charCodeAt(i))) i++
  return i - line.start
}

/** The line without its leading and trailing white space. */
export function trimRange(src: ProseSource, line: LineRange): LineRange {
  const start = line.start + indentOf(src, line)
  let end = line.end
  while (end > start && isSpace(src.charCodeAt(end - 1))) end--
  return { start, end }
}

export function isBlank(src: ProseSource, line: LineRange): boolean {
  return indentOf(src, line) === line.end - line.start
}

export function sliceTrimmed(src: ProseSource, line: LineRange): string {
  const { start, end } = trimRange(src, line)
  return src.slice(start, end)
}
