import type { ProseSource } from '../proseSource'

/**
 * Synthetic bodies built to make a backtracking or rescanning parser go quadratic. Each family
 * takes a size and returns a body of about that many characters.
 */
export type AdversarialFamily = (n: number) => string

const repeatTo = (unit: string, n: number) => unit.repeat(Math.max(1, Math.ceil(n / unit.length)))
const pad = (n: number) => ' \t'.repeat(Math.ceil(n / 2))

/** Ten lines, each indented two more than the last: deeper than the nesting cap. */
const STAIRCASE = Array.from({ length: 10 }, (_, i) => `${'  '.repeat(i)}- a\n`).join('')

export const BLOCK_FAMILIES: Record<string, AdversarialFamily> = {
  'bullet item padded before a CR': (n) => `- ${' '.repeat(n)}x\ry`,
  'ordered item padded before a line separator': (n) => `1. ${pad(n)}x\u2028y`,
  'container opener padded before its title': (n) => `::: tip a${pad(n)}a`,
  'fence opener padded before two words': (n) => `\`\`\`${pad(n)}a b`,
  'heading padded before a custom id and a word': (n) => `# Title${pad(n)}{#x} y`,
  'an unclosed comment on every line': (n) => repeatTo('<!-- a\n', n),
  'an unclosed container on every line': (n) => repeatTo('::: tip\n', n),
  'staircase lists past the nesting cap': (n) => repeatTo(STAIRCASE, n),
  'one item with a continuation on every line': (n) => repeatTo('- a\n  ', n),
  'paragraph lines padded at both ends': (n) => `a${pad(n / 2)}\n${pad(n / 2)}b`,
  'CR-only line endings': (n) => repeatTo('- a\r  b\r\r', n),
  'pipe lines with no delimiter row': (n) => repeatTo('| a | b |\n', n),
}

export const INLINE_FAMILIES: Record<string, AdversarialFamily> = {
  'unclosed link openers': (n) => repeatTo('[a(', n),
  'unclosed bold openers': (n) => repeatTo('**a', n),
  'unclosed code openers': (n) => repeatTo('`a', n),
  'unclosed star italics': (n) => repeatTo(' *a', n),
  'unclosed underscore italics': (n) => repeatTo(' _a', n),
  'unbalanced link brackets': (n) => repeatTo('[[a]', n),
  'unclosed link titles': (n) => repeatTo('[a](x "', n),
  'unclosed comment openers': (n) => repeatTo('<!--', n),
  'every opener mixed': (n) => repeatTo('[a( **a `a *a _a [[a] [a](x " <!-- ', n),
}

export interface CountingSource {
  src: ProseSource
  /** Characters read so far: one per `charCodeAt` call, one per character `slice` returns. */
  reads: () => number
}

/** Wraps a string so every read through {@link ProseSource} is counted. */
export function countingSource(text: string): CountingSource {
  let reads = 0
  const src: ProseSource = {
    length: text.length,
    charCodeAt(index) {
      reads++
      return text.charCodeAt(index)
    },
    slice(start, end) {
      const out = text.slice(start, end)
      reads += out.length
      return out
    },
  }
  return { src, reads: () => reads }
}
