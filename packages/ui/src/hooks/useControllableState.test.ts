import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useControllableState } from './useControllableState'

describe('useControllableState', () => {
  it('starts at the default and updates when uncontrolled', () => {
    const onChange = vi.fn()
    const { result } = renderHook(() =>
      useControllableState({ value: undefined, defaultValue: 'a', onChange })
    )
    expect(result.current[0]).toBe('a')
    act(() => result.current[1]('b'))
    expect(result.current[0]).toBe('b')
    expect(onChange).toHaveBeenCalledWith('b')
  })

  it('ignores internal state and reports the request when controlled', () => {
    const onChange = vi.fn()
    const { result } = renderHook(() =>
      useControllableState({ value: 'a', defaultValue: 'z', onChange })
    )
    act(() => result.current[1]('b'))
    expect(result.current[0]).toBe('a')
    expect(onChange).toHaveBeenCalledWith('b')
  })

  it('does not call onChange when the value is unchanged', () => {
    const onChange = vi.fn()
    const { result } = renderHook(() =>
      useControllableState({ value: undefined, defaultValue: false, onChange })
    )
    act(() => result.current[1](false))
    expect(onChange).not.toHaveBeenCalled()
  })

  it('follows a controlled value as it changes', () => {
    const { result, rerender } = renderHook(
      ({ value }: { value: boolean | undefined }) =>
        useControllableState({ value, defaultValue: false }),
      { initialProps: { value: true as boolean | undefined } }
    )
    expect(result.current[0]).toBe(true)
    rerender({ value: false })
    expect(result.current[0]).toBe(false)
  })
})
