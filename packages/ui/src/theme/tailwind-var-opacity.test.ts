import { describe, it, expect, beforeAll } from 'vitest'
import { createRequire } from 'node:module'
import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Tailwind opacity modifiers on var()-backed colours (VW-308).
 *
 * Tailwind v3 cannot apply `/<n>` to a colour whose value is a `var(--…)`
 * reference. It does not warn and does not fall back: it emits NO RULE, and the
 * class is dead CSS on web. Every colour in `tailwind.config.js` is var()-backed
 * (that is what makes light/dark switching work), so `bg-brand-primary/10` never
 * painted anything — while the literal-valued `text-white/70` compiles fine.
 * That asymmetry is why it sat unnoticed in four components.
 *
 * This test compiles the REAL `tailwind.config.js` against a fixture, which is
 * how the finding was reproduced. It pins three things:
 *   1. the defect itself, so nobody "fixes" a call site back to a modifier;
 *   2. a POSITIVE CONTROL — `text-white/70` and `bg-black/50` still compile, so
 *      an empty stylesheet from a broken harness can't pass as proof;
 *   3. that no var()-backed opacity modifier survives anywhere in `src/`.
 *
 * The chosen fix is (3), not making the modifier work: the `<alpha-value>`
 * pattern needs channel-triplet CSS vars, a hand-aligned rewrite of the whole
 * token layer, and `color-mix()` — the config-only alternative — is not a value
 * React Native understands. The wash ladder (`-subtle`/`-muted`/`-strong`)
 * already expresses translucency on both platforms.
 */

const require = createRequire(import.meta.url)
const uiRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')

// postcss is a declared dependency of tailwindcss, not of this package; resolve
// it from there rather than relying on hoisting.
const tailwindEntry = require.resolve('tailwindcss', { paths: [uiRoot] })
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const tailwind = require(tailwindEntry) as any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const postcss = createRequire(tailwindEntry)('postcss') as any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const tailwindConfig = require(path.join(uiRoot, 'tailwind.config.js')) as any

/** `brand.primary.DEFAULT` -> the `brand-primary` class suffix. */
function flattenColors(
  node: Record<string, unknown>,
  prefix: string[] = []
): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [key, value] of Object.entries(node)) {
    const nextPrefix = key === 'DEFAULT' ? prefix : [...prefix, key]
    if (value && typeof value === 'object') {
      Object.assign(out, flattenColors(value as Record<string, unknown>, nextPrefix))
    } else if (typeof value === 'string') {
      out[nextPrefix.join('-')] = value
    }
  }
  return out
}

const varBackedTokens = new Set(
  Object.entries(flattenColors(tailwindConfig.theme?.extend?.colors ?? {}))
    .filter(([, value]) => /^var\(--color-/.test(value))
    .map(([name]) => name)
)

const PROBE_CLASSES = [
  // The finding, verbatim.
  'bg-brand-primary/10',
  'text-on-status-success/70',
  // The four call sites' original classes.
  'bg-status-success/10',
  'bg-brand-primary/20',
  'text-text-tertiary/40',
  // Positive control: literal-valued colours, which DO support the modifier.
  'text-white/70',
  'bg-black/50',
  // The replacements the call sites now use.
  'bg-brand-primary-subtle',
  'bg-status-success-subtle',
  'bg-brand-primary-muted',
  'bg-status-info-muted',
  'text-text-disabled',
]

let emitted: Set<string>

beforeAll(async () => {
  const raw = `<div class="${PROBE_CLASSES.join(' ')}"></div>`
  const result = await postcss([
    tailwind({ ...tailwindConfig, content: { files: [{ raw, extension: 'html' }] } }),
  ]).process('@tailwind utilities;', { from: undefined })

  emitted = new Set(
    [...(result.css as string).matchAll(/^\.([^\s{]+)\s*\{/gm)].map((m) => m[1].replace(/\\/g, ''))
  )
}, 30_000)

describe('tailwind opacity modifiers on var()-backed colours (VW-308)', () => {
  it('compiles the real config against the fixture at all', () => {
    // Guards the harness: without this, every "emits no rule" assertion below
    // would also pass against a stylesheet that failed to build.
    expect(emitted.size).toBeGreaterThan(0)
  })

  // POSITIVE CONTROL. These are literal colours in tailwind's own palette, so
  // the modifier works. If one of these ever stops compiling, the harness is
  // broken, not the design system.
  it.each(['text-white/70', 'bg-black/50'])('%s compiles (positive control)', (className) => {
    expect(emitted).toContain(className)
  })

  it.each([
    'bg-brand-primary/10',
    'text-on-status-success/70',
    'bg-status-success/10',
    'bg-brand-primary/20',
    'text-text-tertiary/40',
  ])('%s emits NO rule — this is the defect, do not use it', (className) => {
    expect(emitted).not.toContain(className)
  })

  it.each([
    'bg-brand-primary-subtle',
    'bg-status-success-subtle',
    'bg-brand-primary-muted',
    'bg-status-info-muted',
    'text-text-disabled',
  ])('%s compiles — the replacement the call sites use', (className) => {
    expect(emitted).toContain(className)
  })
})

const OPACITY_UTILITY =
  /\b(?:[a-z][a-z0-9-]*:)*(?:bg|text|border|ring|fill|stroke|from|to|via|shadow|outline|decoration|divide|accent|caret|placeholder)-([a-z][a-zA-Z0-9-]*)\/(?:\[[^\]]+\]|\d+)/g

function sourceFiles(dir: string, found: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) sourceFiles(full, found)
    else if (/\.(ts|tsx)$/.test(entry.name)) found.push(full)
  }
  return found
}

describe('no var()-backed opacity modifier survives in src/', () => {
  it('finds no dead colour class', () => {
    const srcRoot = path.join(uiRoot, 'src')
    const violations: string[] = []

    for (const file of sourceFiles(srcRoot)) {
      // This file quotes the dead classes on purpose, as the probe list above.
      if (file === fileURLToPath(import.meta.url)) continue
      for (const match of readFileSync(file, 'utf8').matchAll(OPACITY_UTILITY)) {
        if (varBackedTokens.has(match[1])) {
          violations.push(`${path.relative(uiRoot, file)}: ${match[0]}`)
        }
      }
    }

    expect(violations, `dead colour classes (VW-308):\n${violations.join('\n')}`).toEqual([])
  })
})
