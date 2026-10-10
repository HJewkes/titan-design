import { useCallback, useEffect, useRef, useState } from 'react'
import {
  createTypeaheadBuffer,
  isTypeaheadKey,
  nextActiveIndex,
  typeaheadMatch,
} from '../utils/listNavigation'

/** The structural key event both a View `onKeyDown` and a TextInput `onKeyPress` satisfy. */
export interface ListNavigationKeyEvent {
  key: string
  preventDefault: () => void
}

export interface ListNavigationItemProps {
  tabIndex: 0 | -1
  ref: (node: unknown) => void
}

export interface ListNavigationOptions {
  count: number
  activeIndex: number
  onActiveIndexChange: (index: number) => void
  isDisabled?: (index: number) => boolean
  /** Wrap from the last item to the first and back. Defaults to true. */
  loop?: boolean
  /** `'roving'` moves DOM focus to the active item; `'virtual'` leaves focus where it is. */
  focusMode: 'roving' | 'virtual'
  /** Enables typeahead when present. */
  getLabel?: (index: number) => string
}

export interface ListNavigation {
  onKeyDown: (event: ListNavigationKeyEvent) => void
  getItemProps: (index: number) => ListNavigationItemProps
}

const neverDisabled = () => false

function focusNode(node: unknown) {
  ;(node as { focus?: () => void } | undefined)?.focus?.()
}

function useRovingFocus(isRoving: boolean, activeIndex: number, nodes: Map<number, unknown>) {
  const previous = useRef(activeIndex)
  useEffect(() => {
    if (previous.current === activeIndex) return
    previous.current = activeIndex
    if (isRoving) focusNode(nodes.get(activeIndex))
  }, [isRoving, activeIndex, nodes])
}

function useTypeahead(getLabel: ListNavigationOptions['getLabel']) {
  const [buffer] = useState(createTypeaheadBuffer)
  useEffect(() => buffer.clear, [buffer])
  return useCallback(
    (key: string): string | null => {
      if (!getLabel || !isTypeaheadKey(key, buffer.current())) return null
      return buffer.push(key)
    },
    [buffer, getLabel]
  )
}

function labelsOf(count: number, getLabel: (index: number) => string): string[] {
  return Array.from({ length: count }, (_, index) => getLabel(index))
}

/** Arrow, Home, End and typeahead navigation for a list; the key handler goes on the container. */
export function useListNavigation(options: ListNavigationOptions): ListNavigation {
  const { count, activeIndex, onActiveIndexChange, getLabel, focusMode } = options
  const isDisabled = options.isDisabled ?? neverDisabled
  const loop = options.loop ?? true
  const [nodes] = useState(() => new Map<number, unknown>())
  const pushTypeahead = useTypeahead(getLabel)
  useRovingFocus(focusMode === 'roving', activeIndex, nodes)

  const onKeyDown = useCallback(
    (event: ListNavigationKeyEvent) => {
      const step = nextActiveIndex({
        key: event.key,
        current: activeIndex,
        count,
        isDisabled,
        loop,
      })
      const buffer = step === null ? pushTypeahead(event.key) : null
      if (step === null && buffer === null) return
      event.preventDefault()
      const target =
        buffer !== null && getLabel
          ? typeaheadMatch({
              buffer,
              labels: labelsOf(count, getLabel),
              current: activeIndex,
              isDisabled,
            })
          : step
      if (target !== null && target !== activeIndex) onActiveIndexChange(target)
    },
    [activeIndex, count, isDisabled, loop, getLabel, pushTypeahead, onActiveIndexChange]
  )

  const tabStop =
    activeIndex >= 0 && activeIndex < count ? activeIndex : firstEnabled(count, isDisabled)
  const getItemProps = useCallback(
    (index: number): ListNavigationItemProps => ({
      tabIndex: focusMode === 'roving' && index === tabStop ? 0 : -1,
      ref: (node: unknown) => {
        if (node == null) nodes.delete(index)
        else nodes.set(index, node)
      },
    }),
    [focusMode, tabStop, nodes]
  )

  return { onKeyDown, getItemProps }
}

function firstEnabled(count: number, isDisabled: (index: number) => boolean): number {
  return nextActiveIndex({ key: 'Home', current: -1, count, isDisabled, loop: false }) ?? -1
}
