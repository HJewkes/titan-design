import fs from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'

/**
 * Every top-level colour root in `tailwind.config.js` (`brand`, `status`, `surface`, …) is named
 * in `TOKENS.md` inside backticks, or sits in the allowlist below with a reason (TD-233, TD-30 S5).
 * A new colour category therefore cannot ship without the doc that tells a component author when
 * to use it.
 *
 * A mention is a word inside an inline code span that, after any `hover:`-style variant and any
 * colour utility prefix (`bg-`, `text-`, …) is dropped, starts with `<root>-`: `surface-*`,
 * `bg-surface-raised`, `data-1..10`. A root whose value is a single colour (`divider`) may also
 * appear bare. A bare object root does not count, so prose such as "the `dataviz` skill" is not
 * mistaken for the token family. A root that shares its name with a colour utility (`text`,
 * `border`) must be followed by one of its own keys or `*` (`text-primary`, `text-text-tertiary`,
 * `border-*`), so a utility class such as `text-sm` does not count.
 */

const require = createRequire(import.meta.url)
const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const colors: Record<string, unknown> = require(path.join(packageRoot, 'tailwind.config.js')).theme
  .extend.colors
const tokensDoc = fs.readFileSync(path.join(packageRoot, 'TOKENS.md'), 'utf8')

/** Roots that are deliberately undocumented in TOKENS.md, each with the reason. */
const UNDOCUMENTED_ROOTS: Record<string, string> = {
  avatar: 'No component uses it, only ListItem stories do (Avatar uses `dataviz-categorical-*`).',
  'on-result':
    'Label on a `result-*` fill; no component sets one (SparkBars fills carry no label). §1 `on-*` covers it.',
  dataviz:
    'Known gap: the VW-371 chart palettes are consumed but §2 omits them; drop this when it lands.',
}

const COLOUR_UTILITIES = [
  'bg',
  'text',
  'border',
  'divide',
  'ring',
  'outline',
  'fill',
  'stroke',
  'from',
  'via',
  'to',
  'shadow',
  'placeholder',
  'decoration',
  'accent',
  'caret',
]

function codeWords(markdown: string): string[] {
  const spans = [...markdown.matchAll(/`([^`\n]+)`/g)].map((match) => match[1])
  return spans.flatMap((span) => span.split(/[\s"'(),=<>{}[\]]+/)).filter(Boolean)
}

function candidates(word: string): string[] {
  const bare = word.split(':').pop() ?? word
  const stripped = COLOUR_UTILITIES.filter((utility) => bare.startsWith(`${utility}-`)).map(
    (utility) => bare.slice(utility.length + 1)
  )
  return [bare, ...stripped]
}

/** A root named like a utility (`text`, `border`) needs one of its own keys, so `text-sm` is no mention. */
function namesRootToken(name: string, root: string): boolean {
  const value = colors[root]
  if (typeof value === 'string') return name === root || name.startsWith(`${root}-`)
  if (!name.startsWith(`${root}-`)) return false
  if (!COLOUR_UTILITIES.includes(root)) return true
  const rest = name.slice(root.length + 1)
  const keys = Object.keys(value as object).filter((key) => key !== 'DEFAULT')
  return rest === '*' || keys.some((key) => rest === key || rest.startsWith(`${key}-`))
}

function mentions(words: string[], root: string): boolean {
  return words.some((word) => candidates(word).some((name) => namesRootToken(name, root)))
}

const words = codeWords(tokensDoc)
const roots = Object.keys(colors)

describe('TOKENS.md covers every colour root in tailwind.config.js', () => {
  it('finds the colour roots', () => {
    expect(roots).toEqual(expect.arrayContaining(['brand', 'status', 'surface', 'text']))
  })

  it.each(roots.filter((root) => !(root in UNDOCUMENTED_ROOTS)))(
    'colour root `%s` has a backticked mention in TOKENS.md',
    (root) => {
      expect(
        mentions(words, root),
        `colour root "${root}" has no backticked mention in TOKENS.md; document it ` +
          `(for example \`${root}-*\`) or add it to UNDOCUMENTED_ROOTS with a reason`
      ).toBe(true)
    }
  )
})

describe('UNDOCUMENTED_ROOTS', () => {
  it.each(Object.entries(UNDOCUMENTED_ROOTS))('`%s` has a reason', (root, reason) => {
    expect(reason.trim(), `UNDOCUMENTED_ROOTS["${root}"] needs a one-line reason`).not.toBe('')
  })

  it.each(Object.keys(UNDOCUMENTED_ROOTS))(
    '`%s` is a colour root in tailwind.config.js',
    (root) => {
      expect(roots, `UNDOCUMENTED_ROOTS["${root}"] names no colour root; remove it`).toContain(root)
    }
  )

  it.each(Object.keys(UNDOCUMENTED_ROOTS))('`%s` is still undocumented', (root) => {
    expect(
      mentions(words, root),
      `TOKENS.md now mentions "${root}"; remove it from UNDOCUMENTED_ROOTS`
    ).toBe(false)
  })
})

describe('the mention rule', () => {
  it('does not count a utility class as a mention of the root it shares a name with', () => {
    expect(mentions(['text-sm', 'text-white'], 'text')).toBe(false)
    expect(mentions(['border-2', 'border-default'], 'border')).toBe(false)
  })

  it('counts a token of a utility-named root, bare or behind its utility', () => {
    expect(mentions(['text-primary'], 'text')).toBe(true)
    expect(mentions(['hover:text-text-tertiary'], 'text')).toBe(true)
    expect(mentions(['border-border-input'], 'border')).toBe(true)
    expect(mentions(['border-*'], 'border')).toBe(true)
  })
})
