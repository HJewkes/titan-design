import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { Platform, type LayoutChangeEvent } from 'react-native'
import { useHitTarget } from './useHitTarget'

function layoutEvent(width: number, height: number): LayoutChangeEvent {
  return { nativeEvent: { layout: { x: 0, y: 0, width, height } } } as LayoutChangeEvent
}

describe('useHitTarget', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('gives web a layer and no hitSlop', () => {
    const { result } = renderHook(() => useHitTarget())

    expect(result.current.layerProps?.className).toContain('min-w-11')
    expect(result.current.hitSlop).toBeUndefined()
    expect(result.current.onLayout).toBeUndefined()
  })

  it('gives native a hitSlop measured from the face, and no layer', () => {
    vi.spyOn(Platform, 'OS', 'get').mockReturnValue('ios')
    const { result } = renderHook(() => useHitTarget())

    act(() => result.current.onLayout?.(layoutEvent(32, 32)))

    expect(result.current.layerProps).toBeNull()
    expect(result.current.hitSlop).toEqual({ top: 6, bottom: 6, left: 6, right: 6 })
  })

  it('still calls the consumer onLayout on native', () => {
    vi.spyOn(Platform, 'OS', 'get').mockReturnValue('ios')
    const onLayout = vi.fn()
    const { result } = renderHook(() => useHitTarget({ onLayout }))
    const event = layoutEvent(32, 32)

    act(() => result.current.onLayout?.(event))

    expect(onLayout).toHaveBeenCalledWith(event)
  })

  it('does nothing when disabled', () => {
    const onLayout = vi.fn()
    const { result } = renderHook(() => useHitTarget({ enabled: false, onLayout }))

    expect(result.current).toEqual({ hitSlop: undefined, onLayout, layerProps: null })
  })
})
