// Round 0 fixtures for TreeView (TD-95, TD-32 S1). Rows are shaped by hand to the `hierarchy.get`
// result: no producer output was captured. The real rows come from titan-platform's public source at
// commit 7dc61b4a588aec15b97cff437f0de0ed08b94a25 (18 packages, 2 products), indexed as directories
// and `.ts`/`.tsx` files. `loc` is a file's non-blank line count and a directory's sum of them. A
// file's `childCount` is its count of top-level `export` declarations, standing in for the symbol
// rows the index would hold. Every synthetic row has `synthetic: true` in `data`, and every fixture
// says in `source` and `label` whether it is real. Not exported from any barrel.

import type { TreeNode } from './types'

export type MissingReason = 'no-rollup' | 'not-measured' | 'not-applicable' | 'not-in-snapshot'

/** The consumer's payload per row, as `hierarchy.get` returns it. The tree never reads it. */
export interface HierarchyData {
  path: string
  /** Depth below the requested root; the root's own children are 1. */
  depth: number
  values: Record<string, number | null>
  missing?: Record<string, MissingReason>
  deltas?: Record<string, number | null>
  comparable?: boolean
  synthetic?: true
}

/** Every fixture row carries its payload. */
export type HierarchyNode = TreeNode<HierarchyData> & { data: HierarchyData }

export interface TreeFixture {
  name: string
  label: string
  source: 'real' | 'synthetic' | 'mixed'
  hostile: boolean
  nodes: HierarchyNode[]
  rootId?: string | null
  revealId?: string
  isTruncated?: boolean
  density?: 'comfortable' | 'dense'
  width?: number
}

export const FIXTURE_SHA = '7dc61b4a588aec15b97cff437f0de0ed08b94a25'
export const VERY_LARGE_ROWS = 5000

type FileTuple = readonly [path: string, loc: number, exports: number]
type DirTuple = readonly [path: string, childCount: number, loc: number]

/** `packages`, `products` and their children at depth 2 from the repo root. */
const TOP_DIRS: readonly DirTuple[] = [
  ['packages', 18, 33885],
  ['products', 2, 3492],
  ['packages/agent', 2, 4165],
  ['packages/agent-lifecycle', 2, 358],
  ['packages/agent-protocol', 2, 819],
  ['packages/chat-protocol', 2, 939],
  ['packages/cluster', 2, 830],
  ['packages/code-graph', 2, 7211],
  ['packages/daemon', 2, 1422],
  ['packages/embed', 2, 372],
  ['packages/hitl', 2, 849],
  ['packages/locator', 2, 469],
  ['packages/memory', 2, 1452],
  ['packages/messaging', 2, 2699],
  ['packages/registry', 2, 706],
  ['packages/retrieval', 2, 654],
  ['packages/session-graph', 2, 1303],
  ['packages/session-read', 2, 6153],
  ['packages/store-sqlite', 2, 1255],
  ['packages/workflow', 2, 2229],
  ['products/retrieval-eval', 2, 2188],
  ['products/session-miner', 2, 1304],
]

/* prettier-ignore */
const CODE_GRAPH_FILES: readonly FileTuple[] = [
  ['src/aliases.ts', 69, 6], ['src/barrel-resolve.test.ts', 105, 0], ['src/barrel-resolve.ts', 107, 3],
  ['src/check/check.test.ts', 1038, 0], ['src/check/check.ts', 68, 3], ['src/check/context.ts', 29, 2],
  ['src/check/import-rules.ts', 102, 3], ['src/check/metric-rules.ts', 112, 3],
  ['src/check/patterns.ts', 32, 3], ['src/check/rule-helpers.ts', 22, 4], ['src/check/rules.ts', 20, 1],
  ['src/check/run.test.ts', 64, 0], ['src/check/run.ts', 61, 6], ['src/check/types.ts', 87, 11],
  ['src/check/validate.test.ts', 207, 0], ['src/check/validate.ts', 222, 2],
  ['src/cognitive-complexity.ts', 144, 1], ['src/declared-names.test.ts', 32, 1],
  ['src/declared-names.ts', 69, 3], ['src/diff/check-diff.test.ts', 194, 0],
  ['src/diff/check-diff.ts', 66, 4], ['src/diff/diff.test.ts', 156, 0], ['src/diff/diff.ts', 151, 2],
  ['src/diff/types.ts', 34, 4], ['src/extractors/deep-ast.ts', 200, 5],
  ['src/extractors/dispatch.ts', 26, 2], ['src/extractors/dynamic-imports.ts', 126, 2],
  ['src/extractors/file-nodes.ts', 21, 1], ['src/extractors/ids.test.ts', 34, 0],
  ['src/extractors/ids.ts', 59, 8], ['src/extractors/module-resolution.ts', 63, 4],
  ['src/extractors/python-extractor.ts', 91, 1], ['src/extractors/reexport-resolve.ts', 90, 2],
  ['src/extractors/reference-weight.ts', 140, 7], ['src/extractors/symbol-nodes.ts', 78, 1],
  ['src/extractors/symbol-signature.ts', 124, 3], ['src/extractors/ts-morph-extractor.ts', 275, 2],
  ['src/file-walk.test.ts', 43, 0], ['src/file-walk.ts', 53, 1], ['src/generated.ts', 100, 5],
  ['src/git-renames.ts', 122, 12], ['src/incremental.test.ts', 59, 0], ['src/incremental.ts', 262, 12],
  ['src/index-metrics.ts', 53, 2], ['src/index.ts', 74, 14], ['src/indexer.test.ts', 114, 1],
  ['src/indexer.ts', 199, 4], ['src/lcom.ts', 180, 1], ['src/merge.ts', 25, 2], ['src/metrics.ts', 89, 1],
  ['src/parser/file-filter.ts', 63, 3], ['src/parser/index.ts', 3, 1], ['src/parser/parser.ts', 59, 2],
  ['src/parser/types.ts', 11, 2], ['src/read.ts', 24, 3], ['src/reconstruct.ts', 75, 2],
  ['src/reuse-delta.ts', 115, 2], ['src/roles.test.ts', 41, 0], ['src/roles.ts', 95, 6],
  ['src/rows.ts', 101, 12], ['src/schema.ts', 67, 3], ['src/source-metrics.ts', 262, 2],
  ['src/store.test.ts', 62, 0], ['src/store.ts', 205, 3], ['src/types.ts', 72, 11],
  ['src/workspace.test.ts', 57, 0], ['tsup.config.ts', 8, 0],
]

/* prettier-ignore */
const SESSION_READ_FILES: readonly FileTuple[] = [
  ['src/assistant-line.ts', 79, 1], ['src/bash-parse.test.ts', 79, 0], ['src/bash-parse.ts', 218, 11],
  ['src/claude-decoder.ts', 310, 3], ['src/claude-read.test.ts', 330, 0], ['src/claude-read.ts', 184, 2],
  ['src/claude-source.test.ts', 131, 0], ['src/claude-source.ts', 193, 9], ['src/claude-values.ts', 72, 8],
  ['src/codex-decoder.ts', 333, 3], ['src/codex-discover.test.ts', 63, 0], ['src/codex-discover.ts', 92, 7],
  ['src/codex-fixture.ts', 103, 7], ['src/codex-projections.ts', 26, 2], ['src/codex-read.test.ts', 274, 0],
  ['src/codex-read.ts', 179, 4], ['src/codex-usage-state.ts', 32, 1], ['src/codex-usage.ts', 74, 2],
  ['src/codex-values.ts', 74, 13], ['src/discover.ts', 116, 4], ['src/events.ts', 49, 7],
  ['src/fixture.ts', 85, 5], ['src/fold.ts', 240, 6], ['src/index.ts', 73, 18], ['src/line-reader.ts', 178, 3],
  ['src/normalized.test.ts', 259, 0], ['src/normalized.ts', 248, 34], ['src/read.test.ts', 134, 0],
  ['src/read.ts', 86, 6], ['src/recent-claude.ts', 123, 1], ['src/recent-codex.ts', 174, 1],
  ['src/recent-session-turns.test.ts', 369, 0], ['src/recent-session-turns.ts', 154, 3],
  ['src/recent-tail.ts', 151, 4], ['src/recent-types.ts', 66, 12], ['src/recent-values.ts', 53, 8],
  ['src/refs.ts', 54, 12], ['src/repo-root.ts', 127, 5], ['src/session-observations.ts', 48, 4],
  ['src/session-summary.test.ts', 122, 0], ['src/session-summary.ts', 137, 4], ['src/session-usage.ts', 47, 2],
  ['src/source-text.test.ts', 24, 0], ['src/source-text.ts', 21, 2], ['src/text.ts', 110, 11],
  ['src/user-line.ts', 51, 1], ['tsup.config.ts', 8, 0],
]

/* prettier-ignore */
const AGENT_LIFECYCLE_FILES: readonly FileTuple[] = [
  ['src/canonical-json.ts', 14, 1], ['src/execution-ledger.ts', 17, 3], ['src/index.ts', 3, 1],
  ['src/migration.test.ts', 18, 0], ['src/migration.ts', 33, 3], ['src/sqlite-execution-ledger.test.ts', 148, 0],
  ['src/sqlite-execution-ledger.ts', 117, 1], ['tsup.config.ts', 8, 0],
]

/** The top-level exports of `packages/code-graph/src/extractors/ids.ts`, in source order. */
const IDS_SYMBOLS = [
  'fileId',
  'moduleId',
  'parentModuleId',
  'packageId',
  'SYMBOL_ID_SEP',
  'symbolId',
  'parseSymbolId',
  'externalId',
] as const

const EMBEDDED_PACKAGES: ReadonlyArray<readonly [name: string, files: readonly FileTuple[]]> = [
  ['code-graph', CODE_GRAPH_FILES],
  ['session-read', SESSION_READ_FILES],
  ['agent-lifecycle', AGENT_LIFECYCLE_FILES],
]

const parentOf = (path: string): string | null =>
  path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : null
const basename = (path: string): string => path.slice(path.lastIndexOf('/') + 1)
const segments = (path: string): number => (path === '' ? 0 : path.split('/').length)

interface RowInput {
  path: string
  kind: string
  childCount: number
  values: HierarchyData['values']
  root?: string
  parentId?: string | null
  synthetic?: boolean
}

function row(input: RowInput): HierarchyNode {
  const { path, kind, childCount, values, root = '', parentId, synthetic } = input
  const data: HierarchyData = { path, depth: segments(path) - segments(root), values }
  if (synthetic) data.synthetic = true
  const resolvedParent = parentId === undefined ? (path === root ? null : parentOf(path)) : parentId
  return { id: path, parentId: resolvedParent, label: basename(path), kind, childCount, data }
}

const byDepth = (a: HierarchyNode, b: HierarchyNode): number => a.data.depth - b.data.depth

interface DirStat {
  kids: Set<string>
  loc: number
}

function dirStats(prefix: string, files: readonly FileTuple[]): Map<string, DirStat> {
  const dirs = new Map<string, DirStat>()
  for (const [file, loc] of files) {
    const parts = `${prefix}/${file}`.split('/')
    for (let i = segments(prefix); i < parts.length; i++) {
      const dir = parts.slice(0, i).join('/')
      const stat = dirs.get(dir) ?? { kids: new Set<string>(), loc: 0 }
      stat.kids.add(parts.slice(0, i + 1).join('/'))
      stat.loc += loc
      dirs.set(dir, stat)
    }
  }
  return dirs
}

/** Every directory and file row of one package, the package row first, shallowest first. */
function packageRows(
  prefix: string,
  files: readonly FileTuple[],
  synthetic = false
): HierarchyNode[] {
  const dirs = [...dirStats(prefix, files)].map(([path, stat]) =>
    row({
      path,
      kind: path === prefix ? 'package' : 'directory',
      childCount: stat.kids.size,
      values: { loc: stat.loc },
      synthetic,
    })
  )
  const leaves = files.map(([file, loc, exports]) =>
    row({
      path: `${prefix}/${file}`,
      kind: 'file',
      childCount: exports,
      values: { loc },
      synthetic,
    })
  )
  return [...dirs, ...leaves].sort(byDepth)
}

const embeddedRows = (name: string): HierarchyNode[] => {
  const files = EMBEDDED_PACKAGES.find(([pkg]) => pkg === name)![1]
  return packageRows(`packages/${name}`, files)
}

function topRows(): HierarchyNode[] {
  return TOP_DIRS.map(([path, childCount, loc]) =>
    row({ path, kind: segments(path) === 1 ? 'directory' : 'package', childCount, values: { loc } })
  )
}

/** Rows under `rootPath` down to its direct children, `rootPath` itself as the root. */
function rootedAt(rows: HierarchyNode[], rootPath: string): HierarchyNode[] {
  return rows
    .filter((r) => r.id === rootPath || r.parentId === rootPath)
    .map((r) => ({
      ...r,
      parentId: r.id === rootPath ? null : r.parentId,
      data: { ...r.data, depth: segments(r.id) - segments(rootPath) },
    }))
}

const DEEP_TARGET = 'packages/code-graph/src/extractors/ids.ts'

function deepNodes(): HierarchyNode[] {
  const openPath = new Set([
    'packages/code-graph',
    'packages/code-graph/src',
    parentOf(DEEP_TARGET)!,
  ])
  const below = embeddedRows('code-graph').filter((r) => r.parentId && openPath.has(r.parentId))
  return [...topRows(), ...below]
}

function longLabelNodes(): HierarchyNode[] {
  const lifecycle = embeddedRows('agent-lifecycle')
  const top = topRows().filter((r) => r.id === 'packages' || r.id === 'packages/agent-lifecycle')
  return [...top, ...lifecycle.filter((r) => r.id !== 'packages/agent-lifecycle')]
}

function nullWithReasonNodes(): HierarchyNode[] {
  const dirPath = parentOf(DEEP_TARGET)!
  const withNoRollup = (r: HierarchyNode): HierarchyNode =>
    r.id !== dirPath
      ? r
      : {
          ...r,
          data: {
            ...r.data,
            values: { ...r.data.values, fan_in: null },
            missing: { fan_in: 'no-rollup' },
          },
        }
  const rows = rootedAt(embeddedRows('code-graph'), dirPath).map(withNoRollup)
  const symbols = IDS_SYMBOLS.map((name): HierarchyNode => {
    const path = `${DEEP_TARGET}#${name}`
    const data: HierarchyData = {
      path,
      depth: 2,
      values: { loc: null },
      missing: { loc: 'not-applicable' },
    }
    return { id: path, parentId: DEEP_TARGET, label: name, kind: 'symbol', childCount: 0, data }
  })
  return [...rows, ...symbols]
}

function incomparableNodes(): HierarchyNode[] {
  return topRows().map((r, i) => {
    const loc = r.data.values.loc ?? 0
    const delta = Math.round(loc * 0.04) * (i % 2 === 0 ? 1 : -1)
    return { ...r, data: { ...r.data, deltas: { loc: delta }, comparable: false, synthetic: true } }
  })
}

/**
 * Repeats the embedded real packages under new ids (`packages/<name>-<copy>`), shallowest first,
 * and cuts at exactly VERY_LARGE_ROWS. The cut drops the deepest rows, as the producer's row cap
 * does, so some loaded parents keep a `childCount` above their loaded children.
 */
function veryLargeNodes(): HierarchyNode[] {
  const copies: HierarchyNode[] = []
  let copy = 0
  while (copies.length <= VERY_LARGE_ROWS) {
    copy++
    for (const [name, files] of EMBEDDED_PACKAGES) {
      copies.push(...packageRows(`packages/${name}-${copy}`, files, true))
    }
  }
  const pkgRows = copies.filter((r) => r.kind === 'package')
  const loc = pkgRows.reduce((sum, r) => sum + (r.data.values.loc ?? 0), 0)
  const packages = row({
    path: 'packages',
    kind: 'directory',
    childCount: pkgRows.length,
    values: { loc },
    synthetic: true,
  })
  return [packages, ...copies.sort(byDepth)].slice(0, VERY_LARGE_ROWS)
}

/** Each hostile case and the ids that carry it. */
export const HOSTILE_CASES = {
  rootNotFirst: ['hostile/a'],
  orphan: ['hostile/orphan'],
  duplicateId: ['hostile/dup'],
  cycle: ['hostile/cycle-a', 'hostile/cycle-b'],
  unknownKind: ['hostile/a/odd'],
  childCountZeroWithChildren: ['hostile/a'],
} as const

function hostileNodes(): HierarchyNode[] {
  const h = (
    id: string,
    parentId: string | null,
    kind: string,
    childCount: number,
    label = basename(id)
  ) => ({
    id,
    parentId,
    label,
    kind,
    childCount,
    data: { path: id, depth: segments(id), values: { loc: 1 }, synthetic: true as const },
  })
  return [
    h('hostile/a/leaf', 'hostile/a', 'file', 0),
    h('hostile/a', null, 'directory', 0),
    h('hostile/a/odd', 'hostile/a', 'notebook', 0),
    h('hostile/orphan', 'hostile/missing-parent', 'file', 0),
    h('hostile/dup', null, 'file', 0, 'dup (first)'),
    h('hostile/dup', null, 'file', 0, 'dup (second)'),
    h('hostile/cycle-a', 'hostile/cycle-b', 'directory', 1),
    h('hostile/cycle-b', 'hostile/cycle-a', 'directory', 1),
  ]
}

const REAL = `Real rows from titan-platform at ${FIXTURE_SHA.slice(0, 8)}`

export const fixtures = {
  default: {
    name: 'Default',
    label: `${REAL}: packages and products at depth 2; every package has unloaded children.`,
    source: 'real',
    hostile: false,
    nodes: topRows(),
    rootId: null,
  },
  deep: {
    name: 'Deep',
    label: `${REAL}: ids.ts revealed from the root, five levels of indent.`,
    source: 'real',
    hostile: false,
    nodes: deepNodes(),
    rootId: null,
    revealId: DEEP_TARGET,
  },
  wide: {
    name: 'Wide',
    label: `${REAL}: session-read/src with its 46 files.`,
    source: 'real',
    hostile: false,
    nodes: rootedAt(embeddedRows('session-read'), 'packages/session-read/src'),
    rootId: 'packages/session-read/src',
  },
  oneItem: {
    name: 'One item',
    label: `${REAL}: a root that is a leaf.`,
    source: 'real',
    hostile: false,
    nodes: [
      row({
        path: 'products/retrieval-eval/src/bin.ts',
        kind: 'file',
        childCount: 0,
        values: { loc: 3 },
        root: 'products/retrieval-eval/src/bin.ts',
      }),
    ],
    rootId: 'products/retrieval-eval/src/bin.ts',
  },
  empty: { name: 'Empty', label: 'No rows.', source: 'real', hostile: false, nodes: [] },
  nullWithReason: {
    name: 'Null with reason',
    label: `${REAL}: fan_in on a directory (no-rollup) and loc on symbols (not-applicable).`,
    source: 'real',
    hostile: false,
    nodes: nullWithReasonNodes(),
    rootId: parentOf(DEEP_TARGET),
  },
  missingBaseline: {
    name: 'Missing baseline',
    label: `${REAL}: the Default rows with no deltas.`,
    source: 'real',
    hostile: false,
    nodes: topRows(),
    rootId: null,
  },
  incomparableBaseline: {
    name: 'Incomparable baseline',
    label: `${REAL}, with synthetic deltas marked comparable: false.`,
    source: 'mixed',
    hostile: false,
    nodes: incomparableNodes(),
    rootId: null,
  },
  veryLarge: {
    name: 'Very large',
    label: `Synthetic: ${VERY_LARGE_ROWS} rows repeating the real code-graph, session-read and agent-lifecycle packages under new ids, truncated.`,
    source: 'synthetic',
    hostile: false,
    nodes: veryLargeNodes(),
    rootId: null,
    isTruncated: true,
  },
  longLabel: {
    name: 'Long label',
    label: `${REAL}: sqlite-execution-ledger.test.ts at dense density in a narrow tree.`,
    source: 'real',
    hostile: false,
    nodes: longLabelNodes(),
    rootId: null,
    revealId: 'packages/agent-lifecycle/src/sqlite-execution-ledger.test.ts',
    density: 'dense',
    width: 240,
  },
  hostile: {
    name: 'Hostile',
    label:
      'Synthetic: an orphan, a duplicate id, a parentId cycle, a root not first, an unknown kind, and childCount 0 with children.',
    source: 'synthetic',
    hostile: true,
    nodes: hostileNodes(),
    rootId: null,
  },
} satisfies Record<string, TreeFixture>

export type TreeFixtureName = keyof typeof fixtures
