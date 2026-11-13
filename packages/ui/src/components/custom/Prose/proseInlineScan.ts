import { isAt } from './proseLines'
import { codeOf, isSpace, type ProseSource } from './proseSource'

/** The inline spans the prose understands. At one position a comment wins, then code, link, bold, italic. */
export type InlineKind = 'comment' | 'code' | 'link' | 'bold' | 'italic'

/** A span of the scanned range, or the plain text between spans. Indices are into the source. */
export interface InlineToken {
  kind: InlineKind | 'text'
  start: number
  end: number
  /** The text inside the markers: a link's label, a code span's code; empty for a comment. */
  innerStart: number
  innerEnd: number
  /** Links: the target as written, its title dropped. */
  targetStart?: number
  targetEnd?: number
}

/** Spans nest this deep at most (link > `_` > `**` > `*`); markup deeper than that reads as text. */
export const MAX_INLINE_DEPTH = 4

const NONE = -1
const STAR = codeOf('*')
const UNDERSCORE = codeOf('_')
const BACKTICK = codeOf('`')
const LESS_THAN = codeOf('<')
const GREATER_THAN = codeOf('>')
const DASH = codeOf('-')
const LF = codeOf('\n')
const QUOTE = codeOf('"')
const OPEN_BRACKET = codeOf('[')
const CLOSE_BRACKET = codeOf(']')
const OPEN_PAREN = codeOf('(')
const CLOSE_PAREN = codeOf(')')
const COMMENT_OPENER = '<!--'

/** Entry `i` is the first index at or after `i` holding the mark, or NONE. */
interface NextTables {
  backtick: Int32Array
  star: Int32Array
  underscore: Int32Array
  doubleStar: Int32Array
  angle: Int32Array
  newline: Int32Array
  quote: Int32Array
  nonSpace: Int32Array
}

/** Closers found by a forward pass. Entry `i` belongs to the opener at `i`; NONE when it has none. */
interface PairTables {
  /** `[` to its `]`, with at most one bracket pair inside and no line break. */
  bracketClose: Int32Array
  /** `(` to its `)`, with at most one paren pair inside and no white space. */
  parenClose: Int32Array
  /** `(` whose run met white space before any `)`: where, so a link title can follow. */
  parenSpace: Int32Array
}

/** The tables of a whole source, viewed through the range one scan reads. */
interface Tables extends NextTables, PairTables {
  src: ProseSource
  from: number
  to: number
}

const filled = (size: number) => new Int32Array(size).fill(NONE)

/** Records the marks the character at `i` carries, `next` being the character after it. */
function mark(t: NextTables, i: number, code: number, next: number) {
  if (!isSpace(code)) t.nonSpace[i] = i
  if (code === STAR) {
    t.star[i] = i
    if (next === STAR) t.doubleStar[i] = i
  } else if (code === BACKTICK) t.backtick[i] = i
  else if (code === UNDERSCORE) t.underscore[i] = i
  else if (code === LESS_THAN || code === GREATER_THAN) t.angle[i] = i
  else if (code === LF) t.newline[i] = i
  else if (code === QUOTE) t.quote[i] = i
}

/** One backward pass, reading each character once. */
function nextTables(src: ProseSource): NextTables {
  const size = src.length + 1
  const t: NextTables = {
    backtick: filled(size),
    star: filled(size),
    underscore: filled(size),
    doubleStar: filled(size),
    angle: filled(size),
    newline: filled(size),
    quote: filled(size),
    nonSpace: filled(size),
  }
  const all = Object.values(t)
  let next = NONE
  for (let i = src.length - 1; i >= 0; i--) {
    const code = src.charCodeAt(i)
    for (const table of all) table[i] = table[i + 1]!
    mark(t, i, code, next)
    next = code
  }
  return t
}

/**
 * Pushes an opener; a third open level kills the outermost, whose content would then nest two deep.
 * The stack never holds more than two openers.
 */
function pushOpener(open: number[], at: number) {
  if (open.length === 2) open.shift()
  open.push(at)
}

/** One forward pass, reading each character once. */
function pairTables(src: ProseSource): PairTables {
  const size = src.length
  const tables = { bracketClose: filled(size), parenClose: filled(size), parenSpace: filled(size) }
  const brackets: number[] = []
  const parens: number[] = []
  for (let i = 0; i < src.length; i++) {
    const code = src.charCodeAt(i)
    if (code === LF) brackets.length = 0
    else if (code === OPEN_BRACKET) pushOpener(brackets, i)
    else if (code === CLOSE_BRACKET && brackets.length) {
      tables.bracketClose[brackets.pop()!] = i
    }
    if (isSpace(code)) {
      // The innermost open paren may go on to a title; any outer one held the space inside a pair.
      if (parens.length) tables.parenSpace[parens[parens.length - 1]!] = i
      parens.length = 0
    } else if (code === OPEN_PAREN) pushOpener(parens, i)
    else if (code === CLOSE_PAREN && parens.length) tables.parenClose[parens.pop()!] = i
  }
  return tables
}

const codeAt = (t: Tables, i: number) => (i >= t.from && i < t.to ? t.src.charCodeAt(i) : NONE)
/** A table entry, or NONE when it falls outside the range being scanned. */
const within = (t: Tables, at: number) => (at >= t.to ? NONE : at)
const nextOf = (t: Tables, table: Int32Array, i: number) =>
  i >= t.to ? NONE : within(t, table[i]!)
const isAlnum = (code: number) =>
  (code >= codeOf('0') && code <= codeOf('9')) ||
  ((code | 32) >= codeOf('a') && (code | 32) <= codeOf('z'))
const noNewlineBefore = (t: Tables, from: number, at: number) => {
  const newline = nextOf(t, t.newline, from)
  return newline === NONE || newline > at
}

function span(
  kind: InlineKind,
  start: number,
  end: number,
  innerStart: number,
  innerEnd: number
): InlineToken {
  return { kind, start, end, innerStart, innerEnd }
}

/** `<!--`, no `<` or `>`, then `-->`. */
function commentAt(t: Tables, p: number): InlineToken | null {
  const bodyStart = p + COMMENT_OPENER.length
  if (!isAt(t.src, p, t.to, COMMENT_OPENER)) return null
  const angle = nextOf(t, t.angle, bodyStart)
  if (angle === NONE || angle - 2 < bodyStart || codeAt(t, angle) !== GREATER_THAN) return null
  if (codeAt(t, angle - 1) !== DASH || codeAt(t, angle - 2) !== DASH) return null
  return span('comment', p, angle + 1, bodyStart, bodyStart)
}

/** A backtick, at least one other character, then the next backtick. */
function codeSpanAt(t: Tables, p: number): InlineToken | null {
  const close = nextOf(t, t.backtick, p + 1)
  if (close === NONE || close === p + 1) return null
  return span('code', p, close + 1, p + 1, close)
}

/** Past `"title")` after the white space at `space`, or NONE. */
function titleEnd(t: Tables, space: number): number {
  const open = nextOf(t, t.nonSpace, space)
  if (open === NONE || codeAt(t, open) !== QUOTE) return NONE
  const close = nextOf(t, t.quote, open + 1)
  if (close === NONE || !noNewlineBefore(t, open + 1, close)) return NONE
  return codeAt(t, close + 1) === CLOSE_PAREN ? close + 2 : NONE
}

/** `[label](target)` or `[label](target "title")`. */
function linkAt(t: Tables, p: number): InlineToken | null {
  const labelEnd = within(t, t.bracketClose[p]!)
  if (labelEnd === NONE || labelEnd === p + 1 || codeAt(t, labelEnd + 1) !== OPEN_PAREN) return null
  const close = within(t, t.parenClose[labelEnd + 1]!)
  const space = within(t, t.parenSpace[labelEnd + 1]!)
  const end = close !== NONE ? close + 1 : space !== NONE ? titleEnd(t, space) : NONE
  if (end === NONE) return null
  const link = span('link', p, end, p + 1, labelEnd)
  return { ...link, targetStart: labelEnd + 2, targetEnd: close !== NONE ? close : space }
}

/** `**`, a character that is not white space, then the first later `**` on the line. */
function boldAt(t: Tables, p: number): InlineToken | null {
  if (codeAt(t, p + 1) !== STAR) return null
  const first = codeAt(t, p + 2)
  if (first === NONE || isSpace(first) || (first === STAR && codeAt(t, p + 3) === STAR)) return null
  const close = nextOf(t, t.doubleStar, p + 3)
  if (close === NONE || !noNewlineBefore(t, p + 2, close)) return null
  return span('bold', p, close + 2, p + 2, close)
}

/** Never intraword: `2*3*4` and `snake_case` stay literal. Closes at the next marker or not at all. */
function italicAt(t: Tables, p: number, marker: number, next: Int32Array): InlineToken | null {
  const before = codeAt(t, p - 1)
  if (before === marker || isAlnum(before)) return null
  const first = codeAt(t, p + 1)
  if (first === NONE || first === marker || isSpace(first)) return null
  const close = nextOf(t, next, p + 1)
  if (close === NONE || !noNewlineBefore(t, p + 1, close)) return null
  if (isSpace(codeAt(t, close - 1))) return null
  const after = codeAt(t, close + 1)
  if (after === marker || isAlnum(after)) return null
  return span('italic', p, close + 1, p + 1, close)
}

/** The span opening at `p`, or `null`: an opener without a valid closer is text. */
function spanAt(t: Tables, p: number): InlineToken | null {
  const code = t.src.charCodeAt(p)
  if (code === LESS_THAN) return commentAt(t, p)
  if (code === BACKTICK) return codeSpanAt(t, p)
  if (code === OPEN_BRACKET) return linkAt(t, p)
  if (code === STAR) return boldAt(t, p) ?? italicAt(t, p, STAR, t.star)
  if (code === UNDERSCORE) return italicAt(t, p, UNDERSCORE, t.underscore)
  return null
}

const textToken = (start: number, end: number): InlineToken => ({
  kind: 'text',
  start,
  end,
  innerStart: start,
  innerEnd: end,
})

function scanRange(t: Tables): InlineToken[] {
  const tokens: InlineToken[] = []
  let textStart = t.from
  let p = t.from
  while (p < t.to) {
    const token = spanAt(t, p)
    if (!token) {
      p++
      continue
    }
    if (textStart < p) tokens.push(textToken(textStart, p))
    tokens.push(token)
    p = textStart = token.end
  }
  if (textStart < t.to) tokens.push(textToken(textStart, t.to))
  return tokens
}

/**
 * Scans ranges of one source. Its closer tables are built once, in two passes over the whole
 * source, and serve every range, so scanning a span's inside again costs no second build.
 */
export type InlineScanner = (from: number, to: number) => InlineToken[]

export function inlineScanner(src: ProseSource): InlineScanner {
  const tables = { src, ...nextTables(src), ...pairTables(src) }
  return (from, to) => scanRange({ ...tables, from, to })
}

/**
 * The spans of `src` between `from` and `to`, left to right, with the text between them. The range
 * reads as a whole string: nothing outside it counts as a neighbour or a closer.
 */
export function scanInline(src: ProseSource, from = 0, to = src.length): InlineToken[] {
  return inlineScanner(src)(from, to)
}
