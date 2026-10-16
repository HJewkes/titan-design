// Fixtures for the Code family. Every path, symbol, package and ref here is invented. Stories and
// tests import this file; no barrel exports it. Each component's block sits under a banner, in
// alphabetical order of component name; insert a block in place, do not append at the end.
import { seededRandom } from '../../ui/charts/kit/seededRandom'
import { CODE_CHANGE_ORDER } from './code-status'
import type { CodeBaselineRef, CodeChangeKind, CodeNodeKind, CodeNodeRef } from './types'

export const SYNTHETIC_PACKAGES = ['atlas', 'beacon', 'cinder', 'dune', 'ember', 'fjord'] as const
const DIRECTORIES = ['core', 'io', 'model', 'view'] as const
const STEMS = ['parser', 'ledger', 'router', 'planner', 'cache', 'codec', 'index'] as const

const pad = (n: number) => String(n).padStart(2, '0')

/** A package name from the pool; past the pool it appends `-<n>`. */
export function syntheticPackage(i: number): string {
  const cycle = Math.floor(i / SYNTHETIC_PACKAGES.length)
  const name = SYNTHETIC_PACKAGES[i % SYNTHETIC_PACKAGES.length]
  return cycle === 0 ? name : `${name}-${cycle}`
}

/** A deterministic invented path. Unique for `i` below 1,000. */
export function syntheticPath(i: number): string {
  const pkg = SYNTHETIC_PACKAGES[i % SYNTHETIC_PACKAGES.length]
  const dir = DIRECTORIES[Math.floor(i / SYNTHETIC_PACKAGES.length) % DIRECTORIES.length]
  const stem =
    STEMS[Math.floor(i / (SYNTHETIC_PACKAGES.length * DIRECTORIES.length)) % STEMS.length]
  return `packages/${pkg}/src/${dir}/${stem}-${pad(i % 100)}.ts`
}

/** A symbol name derived from the same stem pool: `<stem><Nn>`. */
export function syntheticSymbol(i: number): string {
  const stem =
    STEMS[Math.floor(i / (SYNTHETIC_PACKAGES.length * DIRECTORIES.length)) % STEMS.length]
  return `${stem}${pad(i % 100)}`
}

export function syntheticNode(i: number, kind: CodeNodeKind = 'file'): CodeNodeRef {
  const node: CodeNodeRef = { id: `n-${i}`, path: syntheticPath(i), kind }
  return kind === 'symbol' ? { ...node, name: syntheticSymbol(i) } : node
}

export const syntheticBaseline: CodeBaselineRef = { ref: 'snap-12', snapshotId: 12 }

export interface SyntheticHotspotRow {
  node: CodeNodeRef
  churn: number
  complexity: number
  score: number
  utilization?: number
  change?: CodeChangeKind
}

export interface HotspotRowOptions {
  grain?: 'file' | 'symbol'
  /** Every nth row gets a change kind, in `CODE_CHANGE_ORDER` rotation. */
  changeEvery?: number
}

const skewedLow = (random: () => number, max: number) =>
  1 + Math.floor(random() * random() * (max - 1))

/** Seeded rows with a heavy tail: churn 1 to 60, complexity 1 to 80, both skewed low. */
export function makeHotspotRows(
  seed: number,
  count: number,
  options: HotspotRowOptions = {}
): SyntheticHotspotRow[] {
  const random = seededRandom(seed)
  const symbolGrain = options.grain === 'symbol'
  const every = options.changeEvery
  return Array.from({ length: count }, (_, i) => {
    const churn = skewedLow(random, 60)
    const complexity = skewedLow(random, 80)
    const recency = random() < 1 / 8 ? 0.4 + random() * 0.5 : 1
    const row: SyntheticHotspotRow = {
      node: syntheticNode(i, symbolGrain ? 'symbol' : 'file'),
      churn,
      complexity,
      score: Math.round(churn * complexity * recency),
    }
    if (symbolGrain) row.utilization = Math.floor(random() * 41)
    if (every && every > 0 && i % every === 0) {
      row.change = CODE_CHANGE_ORDER[Math.floor(i / every) % CODE_CHANGE_ORDER.length]
    }
    return row
  })
}

// ---- StatusMark ----

export interface StatusMarkFixture {
  name: string
  kind: CodeChangeKind
  delta?: number
  isOverCutoff?: boolean
}

export const statusMarkFixtures: StatusMarkFixture[] = [
  { name: 'Default', kind: 'new-file' },
  { name: 'Worsened with delta', kind: 'worsened', delta: 340 },
  { name: 'Worsened over cutoff', kind: 'worsened', delta: 340, isOverCutoff: true },
  { name: 'Improved with delta', kind: 'improved', delta: 120 },
  { name: 'Missing values', kind: 'worsened' },
  { name: 'Very large', kind: 'worsened', delta: 1_200_000 },
  { name: 'Hostile', kind: 'improved', delta: Number.NaN },
]
