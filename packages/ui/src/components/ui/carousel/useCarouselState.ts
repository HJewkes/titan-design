import { useCallback, useEffect, useRef, useState } from 'react'

import { clampIndex, resolveActiveKey, stepIndex } from './carouselMath'

export interface UseCarouselStateOptions {
  /** Every slide's key, in order. */
  keys: readonly string[]
  /** Controlled current slide. */
  value?: string
  /** Uncontrolled starting slide; the first slide when omitted. */
  defaultValue?: string
  /** Fires once per change of slide, never per scroll frame. */
  onValueChange?: (value: string, index: number) => void
}

export interface CarouselState {
  /** Key of the current slide; `undefined` only with no slides. */
  activeKey: string | undefined
  activeIndex: number
  count: number
  canPrevious: boolean
  canNext: boolean
  /** Make the slide at `index` current. */
  select: (index: number) => void
  /** Move one slide back (-1) or forward (+1), stopping at the ends. */
  step: (delta: number) => void
}

interface Handover {
  key: string
  index: number
  seq: number
}

interface Selection {
  /** The last key shown; the uncontrolled source of truth. */
  key: string | undefined
  /** Where that key sat, so a vanished key hands over to its neighbour. */
  index: number
  /** The latest time the current key vanished and another took over. */
  handover: Handover | null
}

/**
 * Which slide is current, tracked by key so a slide added or removed before it
 * does not silently swap the card in view. Controlled through `value`, or
 * uncontrolled from `defaultValue`, the same split `Tabs` makes by index.
 */
export function useCarouselState({
  keys,
  value,
  defaultValue,
  onValueChange,
}: UseCarouselStateOptions): CarouselState {
  const [selection, setSelection] = useState<Selection>({
    key: defaultValue,
    index: 0,
    handover: null,
  })
  const requestedKey = value ?? selection.key
  const activeKey = resolveActiveKey(keys, requestedKey, selection.index)
  const activeIndex = activeKey === undefined ? 0 : keys.indexOf(activeKey)
  const count = keys.length

  // Adjusting state while rendering (React's documented pattern) keeps the tracked position current.
  if (activeKey !== undefined && (activeKey !== selection.key || activeIndex !== selection.index)) {
    const vanished = requestedKey !== undefined && !keys.includes(requestedKey)
    const seq = (selection.handover?.seq ?? 0) + 1
    setSelection({
      key: activeKey,
      index: activeIndex,
      handover: vanished ? { key: activeKey, index: activeIndex, seq } : selection.handover,
    })
  }

  useHandoverAnnouncement(selection.handover, onValueChange)

  const select = useCallback(
    (index: number) => {
      if (count === 0) return
      const next = clampIndex(index, count)
      const key = keys[next]
      if (key === activeKey) return
      if (value === undefined) setSelection((prev) => ({ ...prev, key, index: next }))
      onValueChange?.(key, next)
    },
    [activeKey, count, keys, onValueChange, value]
  )

  const step = useCallback(
    (delta: number) => select(stepIndex(activeIndex, delta, count)),
    [activeIndex, count, select]
  )

  return {
    activeKey,
    activeIndex,
    count,
    canPrevious: activeIndex > 0,
    canNext: activeIndex < count - 1,
    select,
    step,
  }
}

/** Tell the owner, once, when the current slide vanished and a neighbour took over. */
function useHandoverAnnouncement(
  handover: Handover | null,
  onValueChange: UseCarouselStateOptions['onValueChange']
) {
  const announced = useRef(0)
  useEffect(() => {
    if (handover === null || handover.seq === announced.current) return
    announced.current = handover.seq
    onValueChange?.(handover.key, handover.index)
  }, [handover, onValueChange])
}
