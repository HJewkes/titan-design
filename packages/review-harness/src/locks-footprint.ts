import { dirname, posix } from 'node:path'
import { utilitiesFor, type ThemeLeaf } from './tailwind-theme.ts'

export type TokenMode = 'light' | 'dark'

/** A custom property whose value differs between base and head in one theme block. */
export interface TokenChange {
  name: string
  mode: TokenMode
  from?: string
  to?: string
}

/** A token change with the property it came from, which readers are matched on. */
export interface PropertyChange extends TokenChange {
  property: string
}

/** The `footprint` of a lock, minus `derivedFrom`, which only the git side knows. */
export interface FootprintBody {
  tokens: TokenChange[]
  files: string[]
  components: { direct: string[]; readers: string[]; rendersCount: number }
}

export interface FootprintInput {
  /** `packages/ui/src/theme/global.css` at the base and at the head. */
  baseCss: string
  headCss: string
  /** The head's `tailwind.config.js` theme entries that read a custom property. */
  theme: ThemeLeaf[]
  /** Every path the head changes against the base, repo-relative. */
  changedFiles: string[]
  /** The head's component sources, repo-relative path to text; this is the reader universe. */
  sources: Map<string, string>
}

export const GLOBAL_CSS = 'packages/ui/src/theme/global.css'
export const TAILWIND_CONFIG = 'packages/ui/tailwind.config.js'
const SRC_ROOT = 'packages/ui/src'
const COLOUR_PREFIX = '--color-'

const stripComments = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '')

function modeOf(selector: string): TokenMode | null {
  const parts = selector.split(',').map((s) => s.trim())
  if (parts.some((p) => p === '.light' || p === ':root.light' || p === 'html.light')) return 'light'
  if (parts.some((p) => p === ':root' || p === 'html')) return 'dark'
  return null
}

/** The `--*` declarations of the `:root` (dark) and `.light` blocks, by property name. */
export function parseThemeTokens(css: string): Record<TokenMode, Map<string, string>> {
  const out = { light: new Map<string, string>(), dark: new Map<string, string>() }
  const stack: (TokenMode | null)[] = []
  let cursor = 0
  const text = stripComments(css)
  for (const m of text.matchAll(/[{};]/g)) {
    const chunk = text.slice(cursor, m.index).trim()
    cursor = m.index + 1
    if (m[0] === '{') stack.push(modeOf(chunk))
    else if (m[0] === '}') stack.pop()
    else recordDeclaration(out, stack.at(-1) ?? null, chunk)
  }
  return out
}

function recordDeclaration(
  out: Record<TokenMode, Map<string, string>>,
  mode: TokenMode | null,
  chunk: string
): void {
  const colon = chunk.indexOf(':')
  if (mode === null || !chunk.startsWith('--') || colon < 0) return
  out[mode].set(chunk.slice(0, colon).trim(), chunk.slice(colon + 1).trim())
}

/** `--color-surface-raised` is the token `surface-raised`; any other property keeps its stem. */
export const tokenName = (property: string) =>
  property.startsWith(COLOUR_PREFIX) ? property.slice(COLOUR_PREFIX.length) : property.slice(2)

function modeDiff(mode: TokenMode, base: Map<string, string>, head: Map<string, string>) {
  const names = [...new Set([...base.keys(), ...head.keys()])]
  return names.flatMap((property): PropertyChange[] => {
    const from = base.get(property)
    const to = head.get(property)
    if (from === to) return []
    return [{ name: tokenName(property), mode, ...(from && { from }), ...(to && { to }), property }]
  })
}

/** Every property whose value differs per mode, dark block first, in file order. */
export function tokenDiff(baseCss: string, headCss: string): PropertyChange[] {
  const base = parseThemeTokens(baseCss)
  const head = parseThemeTokens(headCss)
  return [...modeDiff('dark', base.dark, head.dark), ...modeDiff('light', base.light, head.light)]
}

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const NOT_IN_WORD = '(?![\\w-])'

/** A class under any variant prefix, negative form included: `web:hover:-mt-stack-md`. */
function classAlternative(leaf: ThemeLeaf): string {
  const utilities = `(?:${utilitiesFor(leaf.key)})`
  const stem = leaf.stem ? `-${escapeRegExp(leaf.stem)}` : ''
  return `(?<![\\w-])-?${utilities}${stem}${NOT_IN_WORD}`
}

/**
 * Matches a read of any of `properties`: a class the theme maps to it (`border-hairline` for
 * `--color-hairline-default`, `gap-inset-md` for `--space-inset-md`), a raw `var(--…)`, or, for
 * a colour, its token name as a string literal (`resolveColor('surface-raised')`). A stem never
 * matches a longer one (`text-secondary` and `text-text-secondary-foo`).
 */
export function tokenReadPattern(properties: string[], theme: ThemeLeaf[]): RegExp | null {
  const wanted = new Set(properties)
  if (wanted.size === 0) return null
  const sorted = [...wanted].sort((a, b) => b.length - a.length)
  const vars = `var\\(\\s*(?:${sorted.map(escapeRegExp).join('|')})${NOT_IN_WORD}`
  const classes = theme.filter((l) => wanted.has(l.property)).map(classAlternative)
  const colours = sorted.filter((p) => p.startsWith(COLOUR_PREFIX)).map(tokenName)
  const literals = colours.length ? [`['"\`](?:${colours.map(escapeRegExp).join('|')})['"\`]`] : []
  return new RegExp([vars, ...new Set(classes), ...literals].join('|'))
}

/** The source files whose text reads a changed property. */
export function tokenReaders(
  changes: PropertyChange[],
  theme: ThemeLeaf[],
  sources: Map<string, string>
): string[] {
  const pattern = tokenReadPattern(
    changes.map((c) => c.property),
    theme
  )
  if (!pattern) return []
  return [...sources].filter(([, text]) => pattern.test(text)).map(([path]) => path)
}

/**
 * An import or re-export clause up to its specifier. The clause may wrap across lines, but
 * holds only names, braces, commas and `*`, so an `export const` never runs on to a later
 * `from`.
 */
const IMPORT_RE = /\b(?:import|export)\s[\w\s{},*$]*?\bfrom\s*['"]([^'"]+)['"]/g
const CANDIDATES = ['', '.ts', '.tsx', '/index.ts', '/index.tsx']

function resolveImport(from: string, specifier: string, known: Set<string>): string | null {
  const stem = specifier.startsWith('@/')
    ? posix.join(SRC_ROOT, specifier.slice(2))
    : specifier.startsWith('.')
      ? posix.join(dirname(from), specifier)
      : null
  if (stem === null) return null
  return CANDIDATES.map((ext) => `${stem}${ext}`).find((p) => known.has(p)) ?? null
}

/** For each source, the sources that import it (one hop). Only files in `sources` are nodes. */
export function importedBy(sources: Map<string, string>): Map<string, Set<string>> {
  const known = new Set(sources.keys())
  const edges = new Map<string, Set<string>>()
  for (const [path, text] of sources)
    for (const m of text.matchAll(IMPORT_RE)) {
      const target = resolveImport(path, m[1]!, known)
      if (target && target !== path)
        (edges.get(target) ?? edges.set(target, new Set()).get(target))!.add(path)
    }
  return edges
}

/** `roots` plus everything that imports them, transitively; file-keyed, so like names never merge. */
export function reverseClosure(
  roots: Iterable<string>,
  edges: Map<string, Set<string>>
): Set<string> {
  const seen = new Set<string>()
  const queue = [...roots]
  while (queue.length) {
    const file = queue.pop()!
    if (seen.has(file)) continue
    seen.add(file)
    queue.push(...(edges.get(file) ?? []))
  }
  return seen
}

const sorted = (items: Iterable<string>) => [...items].sort()

/**
 * `direct` is the changed files that are component sources; `readers` is every other source
 * that reads a changed property or that imports a direct file, transitively; `rendersCount`
 * counts the reverse closure over direct and readers together, which is where frames render.
 */
export function deriveFootprint(input: FootprintInput): FootprintBody {
  const changes = tokenDiff(input.baseCss, input.headCss)
  const direct = sorted(input.changedFiles.filter((f) => input.sources.has(f)))
  const edges = importedBy(input.sources)
  const importers = reverseClosure(direct, edges)
  const readers = new Set([...tokenReaders(changes, input.theme, input.sources), ...importers])
  for (const file of direct) readers.delete(file)
  const renders = reverseClosure([...direct, ...readers], edges)
  return {
    tokens: changes.map(({ property: _property, ...token }) => token),
    files: sorted(input.changedFiles),
    components: { direct, readers: sorted(readers), rendersCount: renders.size },
  }
}
