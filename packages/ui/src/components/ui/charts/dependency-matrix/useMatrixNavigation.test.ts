import { describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import fc from 'fast-check'

import { fcAssert } from '../../../../test/property'

import type { MatrixItem } from './types'
import { useMatrixNavigation, type UseMatrixNavigationOptions } from './useMatrixNavigation'

const items: MatrixItem[] = ['a', 'b', 'c'].map((id) => ({ id, label: id }))

function setup(overrides: Partial<UseMatrixNavigationOptions> = {}) {
  const initialProps: UseMatrixNavigationOptions = {
    items,
    direction: 'row-depends-on-column',
    pageRows: 2,
    ...overrides,
  }
  return renderHook((options: UseMatrixNavigationOptions) => useMatrixNavigation(options), {
    initialProps,
  })
}

describe('useMatrixNavigation', () => {
  it('starts on the first cell when nothing is requested', () => {
    const { result } = setup()

    expect(result.current.activeCell).toEqual({ from: 'a', to: 'a' })
    expect(result.current.position).toEqual({ row: 0, col: 0 })
  })

  it('starts on the default cell when uncontrolled', () => {
    const { result } = setup({ defaultActiveCell: { from: 'b', to: 'c' } })

    expect(result.current.position).toEqual({ row: 1, col: 2 })
  })

  it('moves itself and reports each move when uncontrolled', () => {
    const onActiveCellChange = vi.fn()
    const { result } = setup({ onActiveCellChange })

    let handled = false
    act(() => {
      handled = result.current.handleKey('ArrowRight')
    })

    expect(handled).toBe(true)
    expect(result.current.activeCell).toEqual({ from: 'a', to: 'b' })
    expect(onActiveCellChange).toHaveBeenCalledOnce()
    expect(onActiveCellChange).toHaveBeenCalledWith({ from: 'a', to: 'b' })
  })

  it('reports a move but does not make it when controlled', () => {
    const onActiveCellChange = vi.fn()
    const activeCell = { from: 'b', to: 'b' }
    const { result } = setup({ activeCell, onActiveCellChange })

    act(() => {
      result.current.handleKey('ArrowDown')
    })

    expect(onActiveCellChange).toHaveBeenCalledWith({ from: 'c', to: 'b' })
    expect(result.current.activeCell).toEqual(activeCell)
  })

  it('keeps no state of its own while controlled, so releasing control returns to the start', () => {
    const { result, rerender } = setup({ activeCell: { from: 'b', to: 'b' } })

    act(() => {
      result.current.handleKey('ArrowDown')
    })
    rerender({ items, direction: 'row-depends-on-column', pageRows: 2, activeCell: undefined })

    expect(result.current.activeCell).toEqual({ from: 'a', to: 'a' })
  })

  it('keeps the same key handler across renders that do not move', () => {
    const { result, rerender } = setup()
    const first = result.current.handleKey

    rerender({ items, direction: 'row-depends-on-column', pageRows: 2 })

    expect(result.current.handleKey).toBe(first)
  })

  it('follows the controlled value when the parent changes it', () => {
    const { result, rerender } = setup({ activeCell: { from: 'a', to: 'a' } })

    rerender({
      items,
      direction: 'row-depends-on-column',
      pageRows: 2,
      activeCell: { from: 'c', to: 'a' },
    })

    expect(result.current.position).toEqual({ row: 2, col: 0 })
  })

  it('maps rows to the dependency under column-depends-on-row', () => {
    const onActiveCellChange = vi.fn()
    const { result } = setup({ direction: 'column-depends-on-row', onActiveCellChange })

    act(() => {
      result.current.handleKey('ArrowRight')
    })

    expect(onActiveCellChange).toHaveBeenCalledWith({ from: 'b', to: 'a' })
  })

  it('does not report a key that hits an edge', () => {
    const onActiveCellChange = vi.fn()
    const { result } = setup({ onActiveCellChange })

    let handled = false
    act(() => {
      handled = result.current.handleKey('ArrowUp')
    })

    expect(handled).toBe(true)
    expect(onActiveCellChange).not.toHaveBeenCalled()
  })

  it('leaves a key the grid does not handle to the caller', () => {
    const { result } = setup()

    expect(result.current.handleKey('Tab')).toBe(false)
  })

  it('has no active cell and handles no key over empty items', () => {
    const { result } = setup({ items: [] })

    expect(result.current.activeCell).toBeNull()
    expect(result.current.handleKey('ArrowDown')).toBe(false)
  })

  it('falls back to the first cell when the requested cell is not displayed', () => {
    const { result } = setup({ activeCell: { from: 'gone', to: 'a' } })

    expect(result.current.position).toEqual({ row: 0, col: 0 })
  })

  it('never reports a cell outside the items for any key sequence', () => {
    const key = fc.constantFrom(
      'ArrowUp',
      'ArrowDown',
      'ArrowLeft',
      'ArrowRight',
      'Home',
      'End',
      'PageUp',
      'PageDown'
    )
    const ids = new Set(items.map((item) => item.id))
    fcAssert(
      fc.property(fc.array(fc.tuple(key, fc.boolean()), { maxLength: 20 }), (keys) => {
        const { result, unmount } = setup()
        for (const [k, ctrlKey] of keys) {
          act(() => {
            result.current.handleKey(k, ctrlKey)
          })
          const active = result.current.activeCell
          expect(active && ids.has(active.from) && ids.has(active.to)).toBe(true)
        }
        unmount()
      }),
      { numRuns: 30 }
    )
  })
})
