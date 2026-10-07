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
