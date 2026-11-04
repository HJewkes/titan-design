/** The inline spans the prose understands, in the order a tie at one position is broken. */
export type InlineKind = 'comment' | 'code' | 'link' | 'bold' | 'italic'

// No capture groups: every source is joined into one split pattern whose single group keeps the spans.
const SPANS: Record<InlineKind, RegExp> = {
  // Every scan stops at the next opener, so unclosed markup costs linear time, not quadratic.
  comment: /<!--[^<>]*-->/,
  code: /`[^`]+`/,
  // One level of brackets in the text and of parentheses in the target, so `javascript:alert(1)` is caught whole.
  link: /\[(?:[^[\]\n]|\[[^[\]\n]*\])+\]\((?:[^()\s]|\([^()\s]*\))*(?:\s+"[^"\n]*")?\)/,
  bold: /\*\*(?=\S)(?:[^*\n]|\*(?!\*))+?\*\*/,
  // Never intraword, for `*` too: `2*3*4` and `top_set_velocity` stay literal.
  italic:
    /(?<![A-Za-z0-9*])\*(?![\s*])(?:[^*\n]*?[^\s*])?\*(?![A-Za-z0-9*])|(?<![A-Za-z0-9_])_(?![\s_])(?:[^_\n]*?[^\s_])?_(?![A-Za-z0-9_])/,
}

export const INLINE_KINDS = Object.keys(SPANS) as InlineKind[]

export const INLINE_SOURCES = INLINE_KINDS.map((kind) => SPANS[kind].source)

const WHOLE = INLINE_KINDS.map((kind) => [kind, new RegExp(`^(?:${SPANS[kind].source})$`)] as const)

const MARKDOWN_ONLY = new RegExp(`(${INLINE_SOURCES.join('|')})`, 'g')

/** Which span a piece of a split is, or `null` for plain text. */
export function inlineKindOf(piece: string): InlineKind | null {
  return WHOLE.find(([, pattern]) => pattern.test(piece))?.[0] ?? null
}

export interface LinkParts {
  label: string
  target: string
}

export function linkParts(piece: string): LinkParts {
  const split = piece.lastIndexOf('](')
  const target = piece.slice(split + 2, -1).replace(/\s+"[^"]*"$/, '')
  return { label: piece.slice(1, split), target }
}

/** The text inside a span's markers: a link's label, a code span's code. */
export function innerText(piece: string, kind: InlineKind): string {
  if (kind === 'comment') return ''
  if (kind === 'link') return linkParts(piece).label
  if (kind === 'bold') return piece.slice(2, -2)
  return piece.slice(1, -1)
}

/** The words a reader sees, markup dropped: what a heading's slug and a screen reader's line are built from. */
export function plainInline(text: string): string {
  return text
    .split(MARKDOWN_ONLY)
    .map((piece) => {
      const kind = inlineKindOf(piece)
      if (!kind) return piece
      const inner = innerText(piece, kind)
      return kind === 'code' ? inner : plainInline(inner)
    })
    .join('')
}
