import { useCallback, useEffect, useRef, useState } from 'react'
import { useControllableState } from '../../../../hooks/useControllableState'
import { nextFocus } from './network-graph-focus'
import { edgeId } from './network-graph-model'
import type {
  GraphEdge,
  GraphFocus,
  GraphFocusKey,
  GraphIndex,
  GraphItemRef,
  GraphModel,
} from './types'

/** How long an edge shows its pulse, in either form. */
export const PULSE_MS = 1000

const FOCUS_KEYS: ReadonlyMap<string, GraphFocusKey> = new Map([
  ['ArrowDown', 'Down'],
  ['ArrowUp', 'Up'],
  ['ArrowRight', 'Right'],
  ['ArrowLeft', 'Left'],
  ['Home', 'Home'],
  ['End', 'End'],
])

const isDrawn = (index: GraphIndex, item: GraphItemRef | null): item is GraphItemRef =>
  item !== null &&
  (item.type === 'node' ? index.order.includes(item.id) : index.edgesById.has(item.id))

const isSameItem = (a: GraphItemRef | null, b: GraphItemRef) =>
  a !== null && a.type === b.type && a.id === b.id

/** An edge reached without a traversal is anchored at its source. */
function toFocus(index: GraphIndex, item: GraphItemRef): GraphFocus {
  if (item.type === 'node') return { type: 'node', id: item.id }
  return { type: 'edge', id: item.id, from: index.edgesById.get(item.id)?.source ?? '' }
}

/**
 * Edges whose `activityAt` rose since the last render, mapped to that value. Nothing pulses on the
 * first render; an edge that arrives later with an `activityAt` does.
 */
export function useEdgePulses(edges: readonly GraphEdge[]): ReadonlyMap<string, number> {
  const seen = useRef<Map<string, number | undefined> | null>(null)
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>())
  const [pulsing, setPulsing] = useState<ReadonlyMap<string, number>>(new Map())

  useEffect(() => {
    const previous = seen.current
    seen.current = new Map(edges.map((edge) => [edgeId(edge), edge.activityAt]))
    if (previous === null) return
    const fresh = edges.filter(
      (edge) =>
        edge.activityAt !== undefined &&
        edge.activityAt > (previous.get(edgeId(edge)) ?? Number.NEGATIVE_INFINITY)
    )
    if (fresh.length === 0) return
    setPulsing((current) => new Map([...current, ...fresh.map(pulseEntry)]))
    for (const id of fresh.map(edgeId)) {
      clearTimeout(timers.current.get(id))
      timers.current.set(
        id,
        setTimeout(() => setPulsing((current) => withoutKey(current, id)), PULSE_MS)
      )
    }
  }, [edges])

  useEffect(() => {
    const pending = timers.current
    return () => pending.forEach((timer) => clearTimeout(timer))
  }, [])

  return pulsing
}

const pulseEntry = (edge: GraphEdge) => [edgeId(edge), edge.activityAt as number] as const

function withoutKey<V>(map: ReadonlyMap<string, V>, key: string): ReadonlyMap<string, V> {
  const next = new Map(map)
  next.delete(key)
  return next
}

export interface UseNetworkGraphOptions {
  model: GraphModel
  /** Controlled selection. `undefined` leaves the hook uncontrolled. */
  selection?: GraphItemRef | null
  defaultSelection?: GraphItemRef | null
  onSelectionChange?: (selection: GraphItemRef | null) => void
  isDisabled?: boolean
}

export interface NetworkGraphState {
  /** The selection, or null when it names an item that is not drawn. */
  selection: GraphItemRef | null
  /** The item under the pointer or the keyboard cursor. */
  active: GraphFocus | null
  isFocused: boolean
  /** True after Escape, until the active item changes. */
  isTooltipDismissed: boolean
  pulsing: ReadonlyMap<string, number>
  /** Makes an item active, for a pointer entering it. */
  activate: (item: GraphItemRef) => void
  /** Ends a hover. The keyboard cursor stays while the graph holds focus. */
  deactivate: () => void
  /** Selects an item, or clears the selection when the item is already selected. */
  toggle: (item: GraphItemRef) => void
  /** The graph took focus: the cursor enters at the selection, else the first node. */
  enter: () => void
  /** The graph lost focus. */
  leave: () => void
  /** Handles one key. Returns `true` when the caller must prevent the default action. */
  handleKey: (key: string) => boolean
}

/** Owns the selection triplet, the active item and the edge pulses of a NetworkGraph. */
export function useNetworkGraph(options: UseNetworkGraphOptions): NetworkGraphState {
  const { model, selection, defaultSelection, onSelectionChange, isDisabled = false } = options
  const { index } = model
  const [stored, setStored] = useControllableState<GraphItemRef | null>({
    value: selection,
    defaultValue: defaultSelection ?? null,
    onChange: onSelectionChange,
  })
  const selected = isDrawn(index, stored) ? stored : null
  const [cursor, setCursor] = useState<GraphFocus | null>(null)
  const [isFocused, setFocused] = useState(false)
  const [dismissedFor, setDismissedFor] = useState<string | null>(null)
  const active = isDrawn(index, cursor) ? cursor : null
  const pulsing = useEdgePulses(model.edges)

  const move = useCallback((next: GraphFocus | null) => {
    setCursor(next)
    setDismissedFor(null)
  }, [])

  const toggle = useCallback(
    (item: GraphItemRef) => {
      if (isDisabled) return
      setStored(isSameItem(selected, item) ? null : { type: item.type, id: item.id })
    },
    [isDisabled, selected, setStored]
  )

  const entry = useCallback((): GraphFocus | null => {
    if (selected) return toFocus(index, selected)
    const first = index.order[0]
    return first === undefined ? null : { type: 'node', id: first }
  }, [index, selected])

  const handleKey = useCallback(
    (key: string): boolean => {
      if (key === 'Escape') {
        if (!isDisabled && selected !== null) setStored(null)
        setDismissedFor(active?.id ?? null)
        return false
      }
      if (key === 'Enter' || key === ' ') {
        if (active) toggle(active)
        return true
      }
      const focusKey = FOCUS_KEYS.get(key)
      if (focusKey === undefined) return false
      const next = active ? nextFocus(index, active, focusKey) : entry()
      if (next) move(next)
      return true
    },
    [active, entry, index, isDisabled, move, selected, setStored, toggle]
  )

  return {
    selection: selected,
    active,
    isFocused,
    isTooltipDismissed: active !== null && dismissedFor === active.id,
    pulsing,
    activate: useCallback((item: GraphItemRef) => move(toFocus(index, item)), [index, move]),
    deactivate: useCallback(() => {
      if (!isFocused) move(null)
    }, [isFocused, move]),
    toggle,
    // Reads the cursor inside the update: a press sets it and focuses the graph in one handler.
    enter: useCallback(() => {
      setFocused(true)
      setCursor((current) => (isDrawn(index, current) ? current : entry()))
    }, [entry, index]),
    leave: useCallback(() => {
      setFocused(false)
      move(null)
    }, [move]),
    handleKey,
  }
}
