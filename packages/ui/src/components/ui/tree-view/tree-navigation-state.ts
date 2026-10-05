import { ancestorsOf } from './tree-model'
import type { TreeIndex, TreeIntent, TreeKey, TreeRow } from './types'

export interface TreeExpansionChange {
  id: string
  isExpanded: boolean
}

export interface TreeExpansionStep {
  ids: ReadonlySet<string>
  change: TreeExpansionChange
}

const KEYS: ReadonlyMap<string, TreeKey> = new Map<string, TreeKey>([
  ['ArrowDown', 'Down'],
  ['ArrowUp', 'Up'],
  ['ArrowLeft', 'Left'],
  ['ArrowRight', 'Right'],
  ['Home', 'Home'],
  ['End', 'End'],
  ['*', '*'],
])

/** The model key for a keyboard `key`, or `null` when the key is not a tree movement. */
export function toTreeKey(key: string): TreeKey | null {
  return KEYS.get(key) ?? null
}

/**
 * Applies the expand and collapse intents in order, never mutating `expanded`. Returns one step per
 * intent that changed the set, each with the set as it stands after that change.
 */
export function applyExpansion(
  expanded: ReadonlySet<string>,
  intents: readonly TreeIntent[]
): TreeExpansionStep[] {
  const steps: TreeExpansionStep[] = []
  let ids = expanded
  for (const { type, id } of intents) {
    if (type === 'load') continue
    const isExpanded = type === 'expand'
    if (ids.has(id) === isExpanded) continue
    const next = new Set(ids)
    if (isExpanded) next.add(id)
    else next.delete(id)
    ids = next
    steps.push({ ids, change: { id, isExpanded } })
  }
  return steps
}

/** Expand intents for every ancestor of `id`; the index holds only loaded rows. */
export function revealIntents<T>(index: TreeIndex<T>, id: string): TreeIntent[] {
  return ancestorsOf(index, id).map((ancestor) => ({ type: 'expand', id: ancestor }))
}

/**
 * The row that holds the tab stop: the focused row if visible, else its nearest visible ancestor,
 * else the selected row, else the first row. `null` only when there are no rows.
 */
export function resolveFocus<T>(
  rows: readonly TreeRow<T>[],
  index: TreeIndex<T>,
  focusedId: string | null,
  selectedId: string | null
): string | null {
  const visible = new Set(rows.map((row) => row.id))
  if (focusedId !== null && visible.has(focusedId)) return focusedId
  const shown = focusedId === null ? [] : ancestorsOf(index, focusedId).filter((id) => visible.has(id))
  if (shown.length > 0) return shown[shown.length - 1]
  if (selectedId !== null && visible.has(selectedId)) return selectedId
  return rows[0]?.id ?? null
}

/**
 * Where a typeahead search starts. A one-character query searches after the focused row; a longer
 * one includes it, so typing on into a matching label keeps focus there.
 */
export function typeaheadOrigin(
  rows: readonly TreeRow[],
  focusedId: string | null,
  query: string
): string | null {
  if (query.length < 2) return focusedId
  const at = rows.findIndex((row) => row.id === focusedId)
  return at > 0 ? rows[at - 1].id : null
}
