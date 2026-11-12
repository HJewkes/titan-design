import { codeOf, isSpace } from './proseSource'

const FIRST_COMBINING_MARK = codeOf('\u0300')
const LAST_COMBINING_MARK = codeOf('\u036f')
const LAST_CONTROL = codeOf('\u001f')
const ZERO = codeOf('0')
const NINE = codeOf('9')
const SPECIAL = new Set(
  Array.from('~`!@#$%^&*()-_+=[]{}|\\;:"\'\u201c\u201d\u2018\u2019<>,.?/', codeOf)
)
const ID_PUNCTUATION = new Set(Array.from('_-', codeOf))
const OPEN_BRACE = codeOf('{')
const HASH = codeOf('#')
const CLOSE_BRACE = codeOf('}')

/** Combining marks and control characters leave no trace in a slug. */
const isDropped = (code: number) =>
  code <= LAST_CONTROL || (code >= FIRST_COMBINING_MARK && code <= LAST_COMBINING_MARK)
const isDigit = (code: number) => code >= ZERO && code <= NINE
const isLetter = (code: number) => (code | 32) >= codeOf('a') && (code | 32) <= codeOf('z')
const isIdChar = (code: number) => isDigit(code) || isLetter(code) || ID_PUNCTUATION.has(code)

/**
 * A heading's anchor id, by the same rule as VitePress (`@mdit-vue/shared`), so a site moved
 * off VitePress keeps every `#fragment` it already links to: decomposed accents and control
 * characters dropped, each run of white space and punctuation one `-`, none at either end, a
 * leading digit prefixed with `_`, lower case.
 */
export function slugify(text: string): string {
  const normalized = text.normalize('NFKD')
  let slug = ''
  let dashPending = false
  for (let i = 0; i < normalized.length; i++) {
    const code = normalized.charCodeAt(i)
    if (isDropped(code)) continue
    if (isSpace(code) || SPECIAL.has(code)) {
      dashPending = slug.length > 0
      continue
    }
    if (dashPending) slug += '-'
    dashPending = false
    slug += normalized[i]
  }
  return (isDigit(slug.charCodeAt(0)) ? `_${slug}` : slug).toLowerCase()
}

/** Where a trailing `{#id}` starts in `text`, which ends at `end`; -1 when there is none. */
function customIdStart(text: string, end: number): number {
  if (end < 4 || text.charCodeAt(end - 1) !== CLOSE_BRACE) return -1
  let i = end - 1
  while (i > 0 && isIdChar(text.charCodeAt(i - 1))) i--
  if (i === end - 1 || i < 2) return -1
  return text.charCodeAt(i - 1) === HASH && text.charCodeAt(i - 2) === OPEN_BRACE ? i - 2 : -1
}

/** Splits `Title {#custom-id}` into its text and the id it pins. */
export function readCustomId(heading: string): { text: string; id?: string } {
  const trimmed = heading.trimEnd()
  const start = customIdStart(trimmed, trimmed.length)
  if (start === -1) return { text: heading }
  return { text: trimmed.slice(0, start).trimEnd(), id: trimmed.slice(start + 2, -1) }
}

/** Hands out ids in document order; a repeat gets `-1`, `-2`, … like markdown-it-anchor. */
export function createSlugger(): (base: string) => string {
  const seen = new Map<string, number>()
  return (base) => {
    let id = base
    let n = seen.get(base) ?? 0
    while (seen.has(id)) id = `${base}-${++n}`
    seen.set(base, n)
    seen.set(id, 0)
    return id
  }
}
