import { describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'

import { useCarouselState, type UseCarouselStateOptions } from './useCarouselState'

function setup(initial: UseCarouselStateOptions) {
  return renderHook((options: UseCarouselStateOptions) => useCarouselState(options), {
    initialProps: initial,
  })
}

describe('useCarouselState', () => {
  it('starts on the first slide with nothing to go back to', () => {
    const { result } = setup({ keys: ['a', 'b', 'c'] })

    expect(result.current.activeKey).toBe('a')
    expect(result.current.canPrevious).toBe(false)
    expect(result.current.canNext).toBe(true)
  })

  it('starts on the default slide when one is given', () => {
    const { result } = setup({ keys: ['a', 'b', 'c'], defaultValue: 'c' })

    expect(result.current.activeIndex).toBe(2)
    expect(result.current.canNext).toBe(false)
  })

  it('steps forward and reports the change once', () => {
    const onValueChange = vi.fn()
    const { result } = setup({ keys: ['a', 'b', 'c'], onValueChange })

    act(() => result.current.step(1))

    expect(result.current.activeKey).toBe('b')
    expect(onValueChange).toHaveBeenCalledTimes(1)
    expect(onValueChange).toHaveBeenCalledWith('b', 1)
  })

  it('stops at the last slide instead of wrapping to the first', () => {
    const onValueChange = vi.fn()
    const { result } = setup({ keys: ['a', 'b'], defaultValue: 'b', onValueChange })

    act(() => result.current.step(1))

    expect(result.current.activeKey).toBe('b')
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it('stays on the same card when a card before it is removed', () => {
    const keys = ['a', 'b', 'c', 'd', 'e']
    const { result, rerender } = setup({ keys, defaultValue: 'e' })

    rerender({ keys: ['a', 'c', 'd', 'e'], defaultValue: 'e' })

    expect(result.current.activeKey).toBe('e')
    expect(result.current.activeIndex).toBe(3)
  })

  it('moves to the nearest card, and says so, when the current card is removed', () => {
    const onValueChange = vi.fn()
    const { result, rerender } = setup({ keys: ['a', 'b', 'c'], defaultValue: 'c', onValueChange })

    rerender({ keys: ['a', 'b'], defaultValue: 'c', onValueChange })

    expect(result.current.activeKey).toBe('b')
    expect(onValueChange).toHaveBeenCalledWith('b', 1)
  })

  it('tracks the first card by key once shown, even without a default', () => {
    const { result, rerender } = setup({ keys: ['a', 'b', 'c'] })

    rerender({ keys: ['z', 'a', 'b', 'c'] })

    expect(result.current.activeKey).toBe('a')
  })

  it('follows the value it is given and leaves changing it to the owner', () => {
    const onValueChange = vi.fn()
    const { result, rerender } = setup({ keys: ['a', 'b', 'c'], value: 'b', onValueChange })

    act(() => result.current.step(1))

    expect(onValueChange).toHaveBeenCalledWith('c', 2)
    expect(result.current.activeKey).toBe('b')

    rerender({ keys: ['a', 'b', 'c'], value: 'c', onValueChange })
    expect(result.current.activeKey).toBe('c')
  })

  it('has no current slide and ignores selection with no slides', () => {
    const onValueChange = vi.fn()
    const { result } = setup({ keys: [], onValueChange })

    act(() => result.current.select(3))

    expect(result.current.activeKey).toBeUndefined()
    expect(result.current.count).toBe(0)
    expect(onValueChange).not.toHaveBeenCalled()
  })
})
