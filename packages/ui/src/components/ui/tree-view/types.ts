/** One row of the flat `parentId` list a consumer hands to the tree. */
export interface TreeNode<T = unknown> {
  id: string
  parentId: string | null
  label: string
  kind?: string
  /** Children in the full tree, loaded or not. */
  childCount?: number
  data?: T
}

export type TreeProblemKind = 'duplicate-id' | 'orphan' | 'cycle'

/** A row `indexNodes` dropped, with every id involved. */
export interface TreeProblem {
  kind: TreeProblemKind
  ids: string[]
}

export interface TreeIndex<T = unknown> {
  byId: ReadonlyMap<string, TreeNode<T>>
  /** Loaded children per parent id, in list order; the key `null` holds the roots. */
  childrenOf: ReadonlyMap<string | null, readonly TreeNode<T>[]>
  problems: readonly TreeProblem[]
}

export interface TreeRow<T = unknown> {
  id: string
  node: TreeNode<T>
  /** 1-based, as `aria-level`. */
  level: number
  /** Siblings under the same parent, as `aria-setsize`. */
  setsize: number
  /** 1-based position among siblings, as `aria-posinset`. */
  posinset: number
  /** `childCount > 0` or children loaded. */
  hasChildren: boolean
  /** Children are present in the list. */
  isLoaded: boolean
  isExpanded: boolean
  /** The visible parent row, or `null` for a top-level row. */
  parentId: string | null
}

export type TreeKey = 'Down' | 'Up' | 'Left' | 'Right' | 'Home' | 'End' | '*'

export interface TreeIntent {
  type: 'expand' | 'collapse' | 'load'
  id: string
}

export interface TreeFocusResult {
  /** The row to focus; `null` only when there are no rows. */
  focusId: string | null
  intents: TreeIntent[]
}
