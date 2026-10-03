import React, { useLayoutEffect } from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, renderHook, act } from '@testing-library/react'
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

  it('reports a close requested from a layout effect right after the value changes', () => {
    const onChange = vi.fn()
    function Child({ open, setOpen }: { open: boolean; setOpen: (next: boolean) => void }) {
      useLayoutEffect(() => {
        if (open) setOpen(false)
      }, [open, setOpen])
      return null
    }
    function Parent({ value }: { value: boolean }) {
      const [open, setOpen] = useControllableState({ value, defaultValue: false, onChange })
      return React.createElement(Child, { open, setOpen })
    }
    const { rerender } = render(React.createElement(Parent, { value: false }))
    rerender(React.createElement(Parent, { value: true }))
    expect(onChange.mock.calls).toEqual([[false]])
  })

  it('calls the latest onChange from a setter captured earlier', () => {
    const first = vi.fn()
    const second = vi.fn()
    const { result, rerender } = renderHook(
      ({ onChange }: { onChange: (next: boolean) => void }) =>
        useControllableState({ value: undefined, defaultValue: false, onChange }),
      { initialProps: { onChange: first } }
    )
    const captured = result.current[1]
    rerender({ onChange: second })
    act(() => captured(true))
    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledWith(true)
  })
})
