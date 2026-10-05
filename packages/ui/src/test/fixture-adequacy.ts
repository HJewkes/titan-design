import type { ReactElement } from 'react'
import { STRESS_NUMBERS, STRESS_STRINGS, type StressMissingValue } from './fixtures/stress'

/**
 * Garbage-token adequacy (TD-317 S7). Each manifest component renders once per stress string in
 * its name slot and once per N-5 value its public props admit in each numeric slot; the rendered
 * text may not carry a garbage token. jsdom has no layout, so this proves content, not wrap.
 *
 * `fixture-adequacy-baseline.json` maps a case id to the tokens it renders today. It may only
 * shrink: an unlisted token fails, and a listed token that no longer renders fails as stale.
 */

export const BASELINE_FILE = 'packages/ui/src/test/fixture-adequacy-baseline.json'

export type AdequacyBaseline = Record<string, string[]>

/** The titan-evals c04 check: what a value slot prints when it formats a missing value. */
// The words match as case-sensitive substrings, not on word boundaries: a value glued to its
// unit ("undefinedlb", "1undefined") is the usual shape of the bug.
export const GARBAGE_TOKENS = {
  NaN: /NaN/,
  undefined: /undefined/,
  null: /null/,
  Infinity: /Infinity/,
  '[object Object]': /\[object Object\]/,
  '0x0': /(?<![\d.])0\s?[x×]\s?0(?![\d.])/,
} as const satisfies Record<string, RegExp>

export type GarbageToken = keyof typeof GARBAGE_TOKENS

export function garbageTokens(text: string): GarbageToken[] {
  return (Object.keys(GARBAGE_TOKENS) as GarbageToken[]).filter((token) =>
    GARBAGE_TOKENS[token].test(text)
  )
}

/**
 * Every text node on its own line, plus the names assistive tech reads. `textContent` would glue
 * adjacent cells together ("1" and "0" in two cells reading as one "10").
 */
export function renderedText(root: Element): string {
  const walker = root.ownerDocument.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  const lines: string[] = []
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    lines.push(node.textContent ?? '')
  }
  for (const element of root.querySelectorAll('[aria-label], [title]')) {
    lines.push(element.getAttribute('aria-label') ?? '', element.getAttribute('title') ?? '')
  }
  return lines.join('\n')
}

export interface AdequacyCase {
  /** `<component> <slot>=<fixture>`, the baseline key. */
  id: string
  element: () => ReactElement
  /** The stress string a label case must show, so a case that drops it cannot pass vacuously. */
  shows?: string
}

type StressStringId = keyof typeof STRESS_STRINGS

export function labelCases(
  component: string,
  slot: string,
  render: (label: string) => ReactElement
): AdequacyCase[] {
  return (Object.keys(STRESS_STRINGS) as StressStringId[]).map((fixture) => ({
    id: `${component} ${slot}=${fixture}`,
    element: () => render(STRESS_STRINGS[fixture]),
    shows: STRESS_STRINGS[fixture],
  }))
}

/**
 * One case per N-5 value the slot's public type admits. A value it does not admit stays out:
 * forcing it through a cast would test a prop the component never promised to take.
 */
export function missingValueCases<V extends StressMissingValue>(
  component: string,
  slot: string,
  admits: (value: StressMissingValue) => value is V,
  render: (value: V) => ReactElement
): AdequacyCase[] {
  return STRESS_NUMBERS.N5.filter(admits).map((value) => ({
    id: `${component} ${slot}=N5:${String(value)}`,
    element: () => render(value),
  }))
}

export const admitsNull = (value: StressMissingValue): value is null => value === null
export const admitsUndefined = (value: StressMissingValue): value is undefined =>
  value === undefined

export interface ManifestEntry {
  component: string
  /** Source path under `src/components/`. */
  path: string
  cases: AdequacyCase[]
  /** What the public props keep out of the run, and why. */
  notes: string[]
}

export function adequacyProblems(
  id: string,
  found: GarbageToken[],
  baselined?: string[]
): string[] {
  const listed = baselined ?? []
  const added = found.filter((token) => !listed.includes(token))
  const stale = listed.filter((token) => !(found as string[]).includes(token))
  const problems: string[] = []
  if (baselined?.length === 0) {
    problems.push(`${id} has an empty entry in ${BASELINE_FILE}. Delete the entry.`)
  }
  if (added.length > 0) {
    problems.push(
      `${id} renders ${added.map((token) => `"${token}"`).join(', ')}, which ${BASELINE_FILE} ` +
        'does not list. Render a missing-value token instead; the baseline may only shrink.'
    )
  }
  if (stale.length > 0) {
    problems.push(
      `${id} no longer renders ${stale.map((token) => `"${token}"`).join(', ')}. Remove it from ` +
        `${BASELINE_FILE}, and delete the entry once its list is empty.`
    )
  }
  return problems
}

/** Baseline keys that name no case: a renamed or dropped case must take its entry with it. */
export function orphanBaselineKeys(baseline: AdequacyBaseline, caseIds: string[]): string[] {
  return Object.keys(baseline).filter((id) => !caseIds.includes(id))
}
