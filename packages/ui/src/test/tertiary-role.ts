import fs from 'node:fs'
import path from 'node:path'

/**
 * Text roles that carry content. Captions and labels default to `text-secondary`;
 * `text-tertiary` is kept for redundant text (a unit after a figure, separators,
 * placeholders, glyphs), so every tertiary site in these roles is named in the allowlist.
 */
const CONTENT_VARIANTS = ['caption', 'body2', 'overline', 'microLabel', 'monoLabel']
const SMALL_TEXT = ['text-xs', 'text-sm']
const TERTIARY_CLASS = 'text-text-tertiary'

const OPENING_TAG = /<(?:Typography|DateTime)\b/g
const CLASS_NAME_ATTR = /\bclassName=/g
const VARIANT_ATTR = new RegExp(`\\bvariant=["'{]+(?:${CONTENT_VARIANTS.join('|')})["'}]`)
const TERTIARY_COLOR_ATTR = /\bcolor=(?:"tertiary"|\{[^}]*'tertiary'[^}]*\})/

/** End index (exclusive) of the JSX opening tag or `{…}` expression starting at `start`. */
function scanBalanced(source: string, start: number, closer: '>' | '}'): number {
  let depth = 0
  let quote: string | null = null
  for (let i = start; i < source.length; i++) {
    const ch = source[i]
    if (quote) {
      if (ch === quote && source[i - 1] !== '\\') quote = null
    } else if (ch === '"' || ch === "'" || ch === '`') quote = ch
    else if (ch === '{') depth++
    else if (ch === '}') {
      depth--
      if (closer === '}' && depth === 0) return i + 1
    } else if (closer === '>' && ch === '>' && depth === 0) return i + 1
  }
  return source.length
}

/** Class tokens in every string literal of a `className` value. */
function classTokens(value: string): string[] {
  const literals = value.match(/"[^"]*"|'[^']*'|`[^`]*`/g) ?? []
  return literals.flatMap((literal) => literal.slice(1, -1).split(/\s+/))
}

/** Offsets of `className` values that pair `text-text-tertiary` with `text-xs` or `text-sm`. */
function smallTertiaryClassNames(source: string): number[] {
  const hits: number[] = []
  for (const match of source.matchAll(CLASS_NAME_ATTR)) {
    const start = match.index + match[0].length
    const end =
      source[start] === '{'
        ? scanBalanced(source, start, '}')
        : source.indexOf(source[start], start + 1) + 1
    const tokens = classTokens(source.slice(start, end))
    if (tokens.includes(TERTIARY_CLASS) && SMALL_TEXT.some((size) => tokens.includes(size))) {
      hits.push(start)
    }
  }
  return hits
}

/** Opening tags of a content variant painted tertiary by `color` or by class, as [start, end). */
function tertiaryContentTags(source: string): Array<[number, number]> {
  const hits: Array<[number, number]> = []
  for (const match of source.matchAll(OPENING_TAG)) {
    const end = scanBalanced(source, match.index, '>')
    const tag = source.slice(match.index, end)
    if (!VARIANT_ATTR.test(tag)) continue
    if (TERTIARY_COLOR_ATTR.test(tag) || classTokens(tag).includes(TERTIARY_CLASS)) {
      hits.push([match.index, end])
    }
  }
  return hits
}

/** Tertiary content-role sites in one source file; a tag that matches both checks counts once. */
export function countTertiaryRoleSites(source: string): number {
  const tags = tertiaryContentTags(source)
  const loose = smallTertiaryClassNames(source).filter(
    (offset) => !tags.some(([start, end]) => offset >= start && offset < end)
  )
  return tags.length + loose.length
}

const isScanned = (file: string) =>
  /\.tsx?$/.test(file) && !/\.(test|stories)\.tsx?$/.test(file) && !file.endsWith('.d.ts')

/** Site counts per `src/`-relative POSIX path under `src/components`, omitting files with none. */
export function scanTertiaryRoleSites(srcRoot: string): Record<string, number> {
  const counts: Record<string, number> = {}
  const componentsRoot = path.join(srcRoot, 'components')
  for (const entry of fs.readdirSync(componentsRoot, { recursive: true, encoding: 'utf8' })) {
    if (!isScanned(entry)) continue
    const count = countTertiaryRoleSites(fs.readFileSync(path.join(componentsRoot, entry), 'utf8'))
    if (count > 0) counts[path.posix.join('components', entry.split(path.sep).join('/'))] = count
  }
  return counts
}
