import type {
  TreeFocusResult,
  TreeIndex,
  TreeIntent,
  TreeKey,
  TreeNode,
  TreeProblem,
  TreeRow,
} from './types'

type Chain = 'ok' | 'orphan' | 'cycle'

const dedupe = <T>(nodes: readonly TreeNode<T>[], problems: TreeProblem[]) => {
  const byId = new Map<string, TreeNode<T>>()
  for (const node of nodes) {
    if (byId.has(node.id)) problems.push({ kind: 'duplicate-id', ids: [node.id] })
    else byId.set(node.id, node)
  }
  return byId
}

/** Follows parents until a root, a missing parent or a repeat; returns the cycle's ids if any. */
const walkChain = <T>(
  start: TreeNode<T>,
  byId: ReadonlyMap<string, TreeNode<T>>,
  verdict: Map<string, Chain>
): { end: Chain; trail: string[]; cycle: string[] } => {
  const trail: string[] = []
  const seen = new Set<string>()
  let node: TreeNode<T> | undefined = start
  while (node) {
    const known = verdict.get(node.id)
    if (known) return { end: known, trail, cycle: [] }
    if (seen.has(node.id))
      return { end: 'cycle', trail, cycle: trail.slice(trail.indexOf(node.id)) }
    seen.add(node.id)
    trail.push(node.id)
    if (node.parentId === null) return { end: 'ok', trail, cycle: [] }
    node = byId.get(node.parentId)
  }
  return { end: 'orphan', trail, cycle: [] }
}

const classify = <T>(byId: ReadonlyMap<string, TreeNode<T>>, problems: TreeProblem[]) => {
  const verdict = new Map<string, Chain>()
  const reported = new Set<string>()
  for (const node of byId.values()) {
    const { end, trail, cycle } = walkChain(node, byId, verdict)
    for (const id of trail) verdict.set(id, end)
    if (end === 'cycle' && cycle.length > 0) {
      problems.push({ kind: 'cycle', ids: cycle })
      cycle.forEach((id) => reported.add(id))
    }
    if (end !== 'ok' && !reported.has(node.id)) {
      for (const id of trail.filter((t) => !reported.has(t))) {
        problems.push({ kind: 'orphan', ids: [id] })
        reported.add(id)
      }
    }
  }
  return verdict
}

/**
 * Validates the flat list: the first of a duplicated id wins, rows that reach no root (orphans, and
 * members or descendants of a cycle) are dropped, and every drop is reported. Never throws.
 */
export function indexNodes<T>(nodes: readonly TreeNode<T>[]): TreeIndex<T> {
  const problems: TreeProblem[] = []
  const unique = dedupe(nodes, problems)
  const verdict = classify(unique, problems)
  const byId = new Map<string, TreeNode<T>>()
  const childrenOf = new Map<string | null, TreeNode<T>[]>()
  for (const node of unique.values()) {
    if (verdict.get(node.id) !== 'ok') continue
    byId.set(node.id, node)
    const siblings = childrenOf.get(node.parentId) ?? []
    siblings.push(node)
    childrenOf.set(node.parentId, siblings)
  }
  return { byId, childrenOf, problems }
}

/** Ids from the top of the tree down to the parent of `id`; empty for a root or an unknown id. */
export function ancestorsOf<T>(index: TreeIndex<T>, id: string): string[] {
  const path: string[] = []
  let parentId = index.byId.get(id)?.parentId ?? null
  while (parentId !== null && path.length <= index.byId.size) {
    path.unshift(parentId)
    parentId = index.byId.get(parentId)?.parentId ?? null
  }
  return path
}

/** The rows a user can see, in order: depth first, nothing under a collapsed row. */
export function visibleRows<T>(
  index: TreeIndex<T>,
  expandedIds: ReadonlySet<string>,
  rootId: string | null = null
): TreeRow<T>[] {
  const rows: TreeRow<T>[] = []
  const walk = (parent: string | null, level: number, parentRow: string | null) => {
    const siblings = index.childrenOf.get(parent) ?? []
    siblings.forEach((node, i) => {
      const isLoaded = (index.childrenOf.get(node.id)?.length ?? 0) > 0
      const hasChildren = (node.childCount ?? 0) > 0 || isLoaded
      const isExpanded = hasChildren && expandedIds.has(node.id)
      rows.push({
        id: node.id,
        node,
        level,
        setsize: siblings.length,
        posinset: i + 1,
        hasChildren,
        isLoaded,
        isExpanded,
        parentId: parentRow,
      })
      if (isExpanded) walk(node.id, level + 1, node.id)
    })
  }
  walk(rootId, 1, null)
  return rows
}

const NO_RESULT = (focusId: string | null): TreeFocusResult => ({ focusId, intents: [] })

const openIntents = (row: TreeRow, loadingIds: ReadonlySet<string>): TreeIntent[] => {
  const intents: TreeIntent[] = []
  if (!row.hasChildren) return intents
  if (!row.isExpanded) intents.push({ type: 'expand', id: row.id })
  if (!row.isLoaded && !loadingIds.has(row.id)) intents.push({ type: 'load', id: row.id })
  return intents
}

const onRight = (rows: readonly TreeRow[], at: number, loading: ReadonlySet<string>) => {
  const row = rows[at]
  if (!row.hasChildren) return NO_RESULT(row.id)
  if (!row.isExpanded) return { focusId: row.id, intents: openIntents(row, loading) }
  const first = rows[at + 1]
  return NO_RESULT(first?.parentId === row.id ? first.id : row.id)
}

const onLeft = (row: TreeRow): TreeFocusResult => {
  if (row.hasChildren && row.isExpanded) {
    return { focusId: row.id, intents: [{ type: 'collapse', id: row.id }] }
  }
  return NO_RESULT(row.parentId ?? row.id)
}

const onStar = (rows: readonly TreeRow[], row: TreeRow, loading: ReadonlySet<string>) => ({
  focusId: row.id,
  intents: rows.filter((r) => r.parentId === row.parentId).flatMap((r) => openIntents(r, loading)),
})

/**
 * Where focus goes for an APG Tree key, and what to expand, collapse or load. `rows` are the visible
 * rows, so the returned id is always one of them. An unknown `focusedId` lands on the first row.
 */
export function nextFocus(
  rows: readonly TreeRow[],
  focusedId: string | null,
  key: TreeKey,
  loadingIds: ReadonlySet<string> = new Set()
): TreeFocusResult {
  if (rows.length === 0) return NO_RESULT(null)
  const at = rows.findIndex((r) => r.id === focusedId)
  if (at < 0) return NO_RESULT(rows[0].id)
  const last = rows.length - 1
  switch (key) {
    case 'Down':
      return NO_RESULT(rows[Math.min(at + 1, last)].id)
    case 'Up':
      return NO_RESULT(rows[Math.max(at - 1, 0)].id)
    case 'Home':
      return NO_RESULT(rows[0].id)
    case 'End':
      return NO_RESULT(rows[last].id)
    case 'Right':
      return onRight(rows, at, loadingIds)
    case 'Left':
      return onLeft(rows[at])
    case '*':
      return onStar(rows, rows[at], loadingIds)
  }
}

/** The next visible row after focus whose label starts with `query`, wrapping; `null` if none. */
export function typeaheadMatch(
  rows: readonly TreeRow[],
  focusedId: string | null,
  query: string
): string | null {
  const needle = query.toLowerCase()
  if (needle === '' || rows.length === 0) return null
  const from = rows.findIndex((r) => r.id === focusedId)
  for (let step = 1; step <= rows.length; step++) {
    const row = rows[(from + step + rows.length) % rows.length]
    if (row.node.label.toLowerCase().startsWith(needle)) return row.id
  }
  return null
}
