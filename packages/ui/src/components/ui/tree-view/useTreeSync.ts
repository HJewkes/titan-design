import { useEffect, useRef, useState } from 'react'
import type { TreeIndex, TreeIntent } from './types'

/** Expands to and focuses `revealId` once per new value, as soon as the row is in the index. */
export function useReveal<T>(
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

const childless = <T>(index: TreeIndex<T>, id: string) =>
  (index.childrenOf.get(id) ?? []).length === 0

/**
 * A row that leaves `loadingIds` with no children collapses one commit later, so its expander can
 * retry the load. Waiting a commit lets nodes that arrive just after the clear keep the row open; a
 * timer makes sure that commit happens.
 */
export function useSettledLoads<T>(
  index: TreeIndex<T>,
  expandedIds: ReadonlySet<string>,
  loadingIds: ReadonlySet<string>,
  applyIntents: (intents: readonly TreeIntent[]) => void
) {
  const previous = useRef(loadingIds)
  const settling = useRef<string[]>([])
  const [, tick] = useState(0)
  useEffect(() => {
    const failed = settling.current.filter(
      (id) => expandedIds.has(id) && !loadingIds.has(id) && childless(index, id)
    )
    if (failed.length > 0) applyIntents(failed.map((id) => ({ type: 'collapse', id })))
    settling.current = [...previous.current].filter((id) => !loadingIds.has(id))
    previous.current = loadingIds
    if (settling.current.length === 0) return
    const timer = setTimeout(() => tick((n) => n + 1), 0)
    return () => clearTimeout(timer)
  })
}
