import type { CommandItem, FuzzyMatch, MatchRange } from './types'

const BASE_SCORE = 1
const PREFIX_BONUS = 8
const WORD_START_BONUS = 6
const CONSECUTIVE_BONUS = 4
const SECONDARY_WEIGHT = 0.5
const MAX_START_CANDIDATES = 16
const WORD_SEPARATORS = new Set([' ', '\t', '\n', '-', '_', '/', '.', ':', '(', '['])

const isUpper = (char: string): boolean => char !== char.toLowerCase()
const isLower = (char: string): boolean => char !== char.toUpperCase()

function isWordStart(text: string, index: number): boolean {
  if (index === 0) return true
  const previous = text[index - 1]
  return WORD_SEPARATORS.has(previous) || (isLower(previous) && isUpper(text[index]))
}

function charBonus(text: string, index: number, previousIndex: number): number {
  if (index === 0) return PREFIX_BONUS
  if (index === previousIndex + 1) return CONSECUTIVE_BONUS
  return isWordStart(text, index) ? WORD_START_BONUS : 0
}

/** Matches the folded query greedily from `start`; returns the matched indices or null. */
function matchFrom(folded: string[], needle: string[], start: number): number[] | null {
  const indices = [start]
  let cursor = start + 1
  for (let q = 1; q < needle.length; q += 1) {
    while (cursor < folded.length && folded[cursor] !== needle[q]) cursor += 1
    if (cursor >= folded.length) return null
    indices.push(cursor)
    cursor += 1
  }
  return indices
}

function scoreIndices(text: string, indices: number[]): number {
  return indices.reduce(
    (sum, index, i) => sum + BASE_SCORE + charBonus(text, index, i === 0 ? -2 : indices[i - 1]),
    0
  )
}

function toRanges(indices: number[]): MatchRange[] {
  const ranges: MatchRange[] = []
  for (const index of indices) {
    const last = ranges[ranges.length - 1]
    if (last && last.end === index) last.end = index + 1
    else ranges.push({ start: index, end: index + 1 })
  }
  return ranges
}

function startCandidates(text: string, folded: string[], first: string): number[] {
  const starts: number[] = []
  for (let i = 0; i < folded.length && starts.length < MAX_START_CANDIDATES; i += 1) {
    if (folded[i] === first && (starts.length === 0 || isWordStart(text, i))) starts.push(i)
  }
  return starts
}

const fold = (text: string): string[] =>
  Array.from({ length: text.length }, (_, i) => text[i].toLowerCase())

/**
 * Case-insensitive subsequence match by UTF-16 code unit. Scores a prefix above a word start above a
 * mid-word hit, rewards consecutive characters, and returns the matched ranges of `text`.
 */
export function fuzzyMatch(query: string, text: string): FuzzyMatch | null {
  if (query.length === 0) return { score: 0, ranges: [] }
  const needle = fold(query)
  const folded = fold(text)
  let best: { score: number; indices: number[] } | null = null
  for (const start of startCandidates(text, folded, needle[0])) {
    const indices = matchFrom(folded, needle, start)
    if (!indices) continue
    const score = scoreIndices(text, indices)
    if (!best || score > best.score) best = { score, indices }
  }
  return best ? { score: best.score, ranges: toRanges(best.indices) } : null
}

export interface RankedItem<T = unknown> {
  item: CommandItem<T>
  score: number
  /** Matched ranges in the label; empty when only the description or keywords matched. */
  ranges: MatchRange[]
}

function secondaryScore<T>(item: CommandItem<T>, query: string): number | null {
  const texts = [item.description ?? '', ...(item.keywords ?? [])]
  const scores = texts.map((text) => fuzzyMatch(query, text)?.score ?? null)
  const matched = scores.filter((score): score is number => score !== null)
  return matched.length > 0 ? Math.max(...matched) * SECONDARY_WEIGHT : null
}

function rankOne<T>(item: CommandItem<T>, query: string): RankedItem<T> | null {
  const label = fuzzyMatch(query, item.label)
  if (label) return { item, score: label.score, ranges: label.ranges }
  const score = secondaryScore(item, query)
  return score === null ? null : { item, score, ranges: [] }
}

/** Matched items, best first; equal scores keep their given order. */
export function rankItems<T>(items: CommandItem<T>[], query: string): RankedItem<T>[] {
  return items
    .map((item) => rankOne(item, query))
    .filter((ranked): ranked is RankedItem<T> => ranked !== null)
    .sort((a, b) => b.score - a.score)
}
