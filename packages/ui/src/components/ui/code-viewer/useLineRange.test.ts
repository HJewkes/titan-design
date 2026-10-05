import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { UseLineRangeOptions } from './types'
import { useLineRange } from './useLineRange'

const text = Array.from({ length: 5 }, (_, i) => `line ${i + 1}`).join('\n')
const base: UseLineRangeOptions = { text, startLine: 120 }

describe('useLineRange', () => {
  it('reports a requested selection but keeps the controlled one', () => {
    const onSelectedRangeChange = vi.fn()
    const { result } = renderHook(() =>
      useLineRange({ ...base, selectedRange: null, onSelectedRangeChange })
    )
    act(() => result.current.toggleActive())
    expect(result.current.selectedRange).toBeNull()
    expect(onSelectedRangeChange).toHaveBeenCalledWith({ startLine: 120, endLine: 120 })
  })

  it('extends an uncontrolled selection from its anchor and stops at the last line', () => {
    const { result } = renderHook(() =>
      useLineRange({ ...base, defaultSelectedRange: { startLine: 122, endLine: 122 } })
    )
    expect(result.current.activeLine).toBe(122)
    act(() => result.current.toggleActive())
    expect(result.current.selectedRange).toBeNull()
    act(() => result.current.toggleActive())
    act(() => result.current.extendSelection(1))
    act(() => result.current.extendSelection(5))
    expect(result.current.activeLine).toBe(124)
    expect(result.current.selectedRange).toEqual({ startLine: 122, endLine: 124 })
    act(() => result.current.extendSelection(-4))
    expect(result.current.selectedRange).toEqual({ startLine: 120, endLine: 122 })
  })

  it('moves the active line within the window and clears on request', () => {
    const { result } = renderHook(() => useLineRange(base))
    act(() => result.current.moveActive(-1))
    expect(result.current.activeLine).toBe(120)
    act(() => result.current.moveActiveTo(Number.MAX_SAFE_INTEGER))
    expect(result.current.activeLine).toBe(124)
    act(() => result.current.toggleActive())
    act(() => result.current.clearSelection())
    expect(result.current.selectedRange).toBeNull()
  })

  it('ignores every selection action while disabled but keeps the selection', () => {
    const selected = { startLine: 121, endLine: 121 }
    const onSelectedRangeChange = vi.fn()
    const { result } = renderHook(() =>
      useLineRange({
        ...base,
        defaultSelectedRange: selected,
        onSelectedRangeChange,
        isDisabled: true,
      })
    )
    act(() => {
      result.current.moveActive(1)
      result.current.extendSelection(1)
      result.current.toggleActive()
      result.current.clearSelection()
    })
    expect(result.current.selectedRange).toEqual(selected)
    expect(result.current.activeLine).toBe(121)
    expect(onSelectedRangeChange).not.toHaveBeenCalled()
  })

  it('selects nothing when the text has no lines', () => {
    const onSelectedRangeChange = vi.fn()
    const { result } = renderHook(() => useLineRange({ text: '', onSelectedRangeChange }))
    act(() => result.current.toggleActive())
    act(() => result.current.extendSelection(1))
    expect(result.current.selectedRange).toBeNull()
    expect(onSelectedRangeChange).not.toHaveBeenCalled()
  })

  it('extends from the new selection after a parent replaces it', () => {
    const onSelectedRangeChange = vi.fn()
    const { result, rerender } = renderHook(
      (selectedRange: UseLineRangeOptions['selectedRange']) =>
        useLineRange({ ...base, selectedRange, onSelectedRangeChange }),
      { initialProps: null as UseLineRangeOptions['selectedRange'] }
    )
    act(() => result.current.toggleActive())
    rerender({ startLine: 122, endLine: 123 })
    act(() => result.current.moveActiveTo(123))
    act(() => result.current.extendSelection(1))
    expect(onSelectedRangeChange).toHaveBeenLastCalledWith({ startLine: 122, endLine: 124 })
  })

  it('keeps the model referentially stable across renders with equal inputs', () => {
    const { result, rerender } = renderHook(
      (options: UseLineRangeOptions) => useLineRange(options),
      {
        initialProps: { ...base, highlights: [{ startLine: 121, endLine: 122 }] },
      }
    )
    const first = result.current.model
    rerender({ ...base, highlights: [{ startLine: 121, endLine: 122 }] })
    expect(result.current.model).toBe(first)
    rerender({ ...base, highlights: [{ startLine: 121, endLine: 123 }] })
    expect(result.current.model).not.toBe(first)
  })
})
