import { useEffect, useMemo, useRef, useState } from 'react'
import { useControllableState } from '../../../hooks/useControllableState'
import { createTypeaheadBuffer, isTypeaheadKey } from '../../../utils/listNavigation'
import { indexNodes, nextFocus, typeaheadMatch, visibleRows } from './tree-model'
import {
  applyExpansion,
  collapsedAncestor,
  resolveFocus,
  revealIntents,
  toTreeKey,
  typeaheadOrigin,
  type TreeExpansionChange,
} from './tree-navigation-state'
import type { TreeIndex, TreeIntent, TreeKey, TreeNode, TreeProblem, TreeRow } from './types'

/** The structural key event both a View `onKeyDown` and a web `KeyboardEvent` satisfy. */
export interface TreeKeyEvent {
  key: string
  preventDefault: () => void
}

export interface TreeNavigationOptions<T> {
  nodes: readonly TreeNode<T>[]
  rootId?: string | null
  expandedIds?: ReadonlySet<string>
  defaultExpandedIds?: ReadonlySet<string>
  onExpandedChange?: (ids: ReadonlySet<string>, change: TreeExpansionChange) => void
  selectedId?: string | null
  defaultSelectedId?: string | null
  onSelect?: (id: string) => void
  /** Expands the loaded ancestors of this id and focuses it, once per new value. */
  revealId?: string
  onLoadChildren?: (id: string) => void
  loadingIds?: ReadonlySet<string>
  /** Keys still move focus; selection, expansion and loads stop. */
  isDisabled?: boolean
}

/** Values a shell maps onto the `tree` container. */
export interface TreeContainerProps {
  isDisabled: boolean
  focusedId: string | null
}

/** Values a shell maps onto one `treeitem`; platform-neutral, not DOM attributes. */
export interface TreeRowProps<T> {
  id: string
  node: TreeNode<T>
  level: number
  setsize: number
  posinset: number
  /** `undefined` on a leaf, so the shell omits `aria-expanded`. */
  isExpanded: boolean | undefined
  isSelected: boolean
  isFocused: boolean
  isLoading: boolean
  /** Roving: exactly one visible row holds 0. */
  tabIndex: 0 | -1
  onKeyDown: (event: TreeKeyEvent) => void
  onFocus: () => void
  /** Focuses and selects the row. */
  onPress: () => void
  /** Opens or closes the row, for its expander. */
  onToggle: () => void
}

export interface TreeNavigation<T> {
  rows: TreeRow<T>[]
  focusedId: string | null
  selectedId: string | null
  expandedIds: ReadonlySet<string>
  problems: readonly TreeProblem[]
  getTreeProps: () => TreeContainerProps
  getRowProps: (row: TreeRow<T>) => TreeRowProps<T>
}

const NO_IDS: ReadonlySet<string> = new Set()

type ApplyIntents = (intents: readonly TreeIntent[]) => void

function useExpansion<T>(options: TreeNavigationOptions<T>): [ReadonlySet<string>, ApplyIntents] {
  const { expandedIds, defaultExpandedIds = NO_IDS, onExpandedChange } = options
  const [current, setCurrent] = useControllableState({
    value: expandedIds,
    defaultValue: defaultExpandedIds,
  })
  const apply: ApplyIntents = (intents) => {
    const steps = applyExpansion(current, intents)
    if (steps.length === 0) return
    setCurrent(steps[steps.length - 1].ids)
    steps.forEach(({ ids, change }) => onExpandedChange?.(ids, change))
  }
  return [current, apply]
}

function useReveal<T>(
  revealId: string | undefined,
  index: TreeIndex<T>,
  reveal: (id: string) => void
) {
  const revealed = useRef<string | undefined>(undefined)
  useEffect(() => {
    if (revealId === undefined || revealId === revealed.current) return
    if (!index.byId.has(revealId)) return
    revealed.current = revealId
    reveal(revealId)
  }, [revealId, index, reveal])
}

interface TreeState<T> {
  options: TreeNavigationOptions<T>
  index: TreeIndex<T>
  rows: TreeRow<T>[]
  expandedIds: ReadonlySet<string>
  applyIntents: ApplyIntents
  selectedId: string | null
  setSelectedId: (id: string) => void
  focusedId: string | null
  setFocusedId: (id: string) => void
}

function useTreeState<T>(options: TreeNavigationOptions<T>): TreeState<T> {
  const { nodes, rootId = null, selectedId: selectedProp, defaultSelectedId = null } = options
  const index = useMemo(() => indexNodes(nodes), [nodes])
  const [expandedIds, applyIntents] = useExpansion(options)
  const rows = useMemo(() => visibleRows(index, expandedIds, rootId), [index, expandedIds, rootId])
  const [selectedId, setSelectedId] = useControllableState({
    value: selectedProp,
    defaultValue: defaultSelectedId,
  })
  const [focusState, setFocusedId] = useState<string | null>(null)
  const focusedId = resolveFocus(rows, index, focusState, selectedId)
  return {
    options,
    index,
    rows,
    expandedIds,
    applyIntents,
    selectedId,
    setSelectedId,
    focusedId,
    setFocusedId,
  }
}

interface Typeahead {
  isTyping: () => boolean
  /** Feeds a printable key to the buffer and focuses the match; false for any other key. */
  type: (fromId: string, key: string) => boolean
}

function useTypeahead(rows: readonly TreeRow[], setFocusedId: (id: string) => void): Typeahead {
  const [buffer] = useState(createTypeaheadBuffer)
  useEffect(() => buffer.clear, [buffer])
  return {
    isTyping: () => buffer.current() !== '',
    type: (fromId, key) => {
      if (!isTypeaheadKey(key, buffer.current())) return false
      const query = buffer.push(key)
      const match = typeaheadMatch(rows, typeaheadOrigin(rows, fromId, query), query)
      if (match !== null) setFocusedId(match)
      return true
    },
  }
}

interface TreeActions {
  onKey: (rowId: string, event: TreeKeyEvent) => void
  select: (id: string) => void
  toggle: (row: TreeRow) => void
}

/** Applies intents unless disabled; a collapse over the focused row takes focus onto itself. */
function intentRunner<T>(state: TreeState<T>) {
  const { options, index, focusedId, applyIntents, setFocusedId } = state
  return (intents: readonly TreeIntent[]) => {
    if (options.isDisabled) return
    const heir = collapsedAncestor(index, focusedId, intents)
    if (heir !== null) setFocusedId(heir)
    applyIntents(intents)
    intents.filter((i) => i.type === 'load').forEach((i) => options.onLoadChildren?.(i.id))
  }
}

function useTreeActions<T>(state: TreeState<T>): TreeActions {
  const { options, rows, setFocusedId } = state
  const { isDisabled = false, loadingIds = NO_IDS, onSelect } = options
  const typeahead = useTypeahead(rows, setFocusedId)
  const run = intentRunner(state)
  const move = (fromId: string, key: TreeKey) => {
    const { focusId, intents } = nextFocus(rows, fromId, key, loadingIds)
    if (focusId !== null) setFocusedId(focusId)
    run(intents)
  }
  const select = (id: string) => {
    if (isDisabled) return
    state.setSelectedId(id)
    onSelect?.(id)
  }
  const onKey = (rowId: string, event: TreeKeyEvent) => {
    const key = toTreeKey(event.key)
    if (key !== null) move(rowId, key)
    else if (event.key === 'Enter' || (event.key === ' ' && !typeahead.isTyping())) select(rowId)
    else if (!typeahead.type(rowId, event.key)) return
    event.preventDefault()
  }
  const toggle = (row: TreeRow) =>
    run(nextFocus(rows, row.id, row.isExpanded ? 'Left' : 'Right', loadingIds).intents)
  return { onKey, select, toggle }
}

function rowProps<T>(row: TreeRow<T>, state: TreeState<T>, actions: TreeActions): TreeRowProps<T> {
  const { focusedId, setFocusedId } = state
  return {
    id: row.id,
    node: row.node,
    level: row.level,
    setsize: row.setsize,
    posinset: row.posinset,
    isExpanded: row.hasChildren ? row.isExpanded : undefined,
    isSelected: row.id === state.selectedId,
    isFocused: row.id === focusedId,
    isLoading: (state.options.loadingIds ?? NO_IDS).has(row.id),
    tabIndex: row.id === focusedId ? 0 : -1,
    onKeyDown: (event) => actions.onKey(row.id, event),
    onFocus: () => setFocusedId(row.id),
    onPress: () => {
      setFocusedId(row.id)
      actions.select(row.id)
    },
    onToggle: () => actions.toggle(row),
  }
}

/**
 * Headless APG Tree navigation over a flat `parentId` list: expansion and selection (each controlled
 * or not), the focused row, `revealId`, lazy loads and typeahead. Selection never follows focus.
 */
export function useTreeNavigation<T>(options: TreeNavigationOptions<T>): TreeNavigation<T> {
  const state = useTreeState(options)
  const actions = useTreeActions(state)
  const { rows, index, focusedId, selectedId, expandedIds, setFocusedId, applyIntents } = state
  const reveal = (id: string) => {
    applyIntents(revealIntents(index, id))
    setFocusedId(id)
  }
  useReveal(options.revealId, index, reveal)
  return {
    rows,
    focusedId,
    selectedId,
    expandedIds,
    problems: index.problems,
    getTreeProps: () => ({ isDisabled: options.isDisabled ?? false, focusedId }),
    getRowProps: (row) => rowProps(row, state, actions),
  }
}
