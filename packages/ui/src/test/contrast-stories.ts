/**
 * Shrink-only baseline for axe `color-contrast` over every Storybook story in Chromium
 * (`tests/visual/contrast.spec.ts`, the CI `contrast` job; TD-738).
 *
 * `contrast-stories-baseline.json` maps a story-theme key to the foreground|background pairs axe
 * reports as violations and how many nodes carry each. It may only shrink: a pair or count above the
 * baseline fails the story's test, and a listed pair or count that no longer occurs fails as stale
 * until `pnpm contrast:baseline` regenerates the file. Pairs, not axe's `nth-child` selectors, so an
 * unrelated markup change never churns the file.
 */

export type ContrastTheme = 'dark' | 'light'

/** `"fg|bg"` as axe reports the colours, to the number of violating nodes with that pair. */
export type PairCounts = Record<string, number>

export type ContrastBaseline = Record<string, PairCounts>

export const BASELINE_FILE = 'packages/ui/tests/visual/contrast-stories-baseline.json'

export const CONTRAST_THEMES: readonly ContrastTheme[] = ['dark', 'light']

export interface ContrastNode {
  fgColor?: string
  bgColor?: string
}

export function baselineKey(storyId: string, theme: ContrastTheme): string {
  return `${storyId} ${theme}`
}

// FNV-1a (offset and prime in decimal: the lint forbids hex literals) with murmur3's finaliser:
// ids share long prefixes, and without the avalanche step the order would still group by prefix.
const FNV_OFFSET = 2166136261
const FNV_PRIME = 16777619
const MIX_1 = 2246822507
const MIX_2 = 3266489909

function stableHash(text: string): number {
  let hash = FNV_OFFSET
  for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), FNV_PRIME)
  hash ^= hash >>> 16
  hash = Math.imul(hash, MIX_1)
  hash ^= hash >>> 13
  hash = Math.imul(hash, MIX_2)
  return (hash ^ (hash >>> 16)) >>> 0
}

/**
 * The story ids in a fixed order that spreads every title prefix across the file, so Playwright's
 * `--shard` (which splits the declared order into runs) gives each shard a like mix. The index is
 * alphabetical, and its last third is every Lab story: the heaviest renders and every blank wait.
 */
export function interleaveForShards(storyIds: string[]): string[] {
  return [...storyIds].sort((a, b) => stableHash(a) - stableHash(b) || a.localeCompare(b))
}

export function pairCounts(nodes: ContrastNode[]): PairCounts {
  const counts: PairCounts = {}
  for (const node of nodes) {
    const pair = `${node.fgColor ?? 'unknown'}|${node.bgColor ?? 'unknown'}`
    counts[pair] = (counts[pair] ?? 0) + 1
  }
  return sortedPairs(counts)
}

export function sortedPairs(counts: PairCounts): PairCounts {
  return Object.fromEntries(Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)))
}

function describePairs(observed: PairCounts, baselined: PairCounts, pairs: string[]): string {
  return pairs
    .map((pair) => `${pair} x${observed[pair] ?? 0} (baseline x${baselined[pair] ?? 0})`)
    .join(', ')
}

export const WIDTH_MATRIX_TAG = 'width-matrix'

/**
 * A `width-matrix` story renders its component in every width frame, so each miss its sibling
 * Default already baselines would count once per frame against a baseline of 0. The pairs the
 * sibling's baseline entry carries (any count) are dropped from the Widths story's counts; a pair
 * the sibling lacks stays. Without a sibling Default or a baseline entry for it, nothing is dropped.
 */
export function withoutSiblingPairs(
  storyId: string,
  tags: readonly string[] | undefined,
  theme: ContrastTheme,
  observed: PairCounts,
  baseline: ContrastBaseline
): PairCounts {
  const separator = storyId.indexOf('--')
  if (!tags?.includes(WIDTH_MATRIX_TAG) || separator < 0) return observed
  const sibling = baseline[baselineKey(`${storyId.slice(0, separator)}--default`, theme)]
  if (!sibling) return observed
  return Object.fromEntries(Object.entries(observed).filter(([pair]) => !(pair in sibling)))
}

/** Why `observed` does not match the baseline entry, one problem per direction; empty when it does. */
export function contrastProblems(
  key: string,
  observed: PairCounts,
  baselined: PairCounts = {}
): string[] {
  const added = Object.keys(observed).filter((pair) => observed[pair] > (baselined[pair] ?? 0))
  const stale = Object.keys(baselined).filter((pair) => (observed[pair] ?? 0) < baselined[pair])
  const problems: string[] = []
  if (added.length > 0) {
    problems.push(
      `${key} has axe color-contrast nodes above ${BASELINE_FILE}: ` +
        `${describePairs(observed, baselined, added)}. ` +
        'Fix the story, component or token; the baseline may only shrink, so do not add them.'
    )
  }
  if (stale.length > 0) {
    problems.push(
      `${key} now has fewer axe color-contrast nodes than ${BASELINE_FILE} lists: ` +
        `${describePairs(observed, baselined, stale)}. ` +
        'Run pnpm contrast:baseline to lock the progress in.'
    )
  }
  return problems
}

export const BLANK_LIST_FILE = 'packages/ui/tests/visual/contrast-blank-stories.json'

/**
 * Why a story's blank or rendered state disagrees with `contrast-blank-stories.json`, the
 * shrink-only list of stories that render blank by Layer 2's guard and are skipped rather than
 * measured. An unlisted blank story fails, so a new blank story cannot skip the gate silently; a
 * listed story that now renders fails until it is removed, so the list can only shrink.
 */
export function blankProblems(storyId: string, blank: string | null, listed: boolean): string[] {
  if (blank && !listed) {
    return [
      `${storyId} renders blank (${blank}) and ${BLANK_LIST_FILE} does not list it. ` +
        'Fix the story; the list may only shrink, so do not add it.',
    ]
  }
  if (!blank && listed) {
    return [`${storyId} now renders. Remove it from ${BLANK_LIST_FILE} so the gate measures it.`]
  }
  return []
}
