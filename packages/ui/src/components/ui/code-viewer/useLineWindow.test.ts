import { act, renderHook } from '@testing-library/react'
import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { fcAssert } from '../../../test/property'
import { computeLineWindow, useLineWindow, windowRows, WINDOWING_THRESHOLD } from './useLineWindow'

const input = fc.record({
  count: fc.integer({ min: 0, max: 6000 }),
  rowHeight: fc.constantFrom(18, 21),
  viewport: fc.integer({ min: 0, max: 1200 }),
  offset: fc.integer({ min: -100, max: 120_000 }),
  isWindowed: fc.boolean(),
  pinnedIndex: fc.option(fc.integer({ min: -5, max: 6005 }), { nil: null }),
  overscan: fc.integer({ min: 0, max: 20 }),
})

describe('computeLineWindow', () => {
  it('mounts only rows in the window or the pinned row, each once and each a real row', () => {
    fcAssert(
      fc.property(input, (options) => {
        const window = computeLineWindow(options)
        const rows = windowRows(window)
        expect(new Set(rows).size).toBe(rows.length)
        for (const row of rows) {
          expect(row >= 0 && row < options.count).toBe(true)
          const isInWindow = row >= window.start && row < window.end
          expect(isInWindow || row === options.pinnedIndex).toBe(true)
        }
      })
    )
  })

  it('always mounts a pinned row that exists', () => {
    fcAssert(
      fc.property(input, (options) => {
        const { pinnedIndex, count } = options
        const isReal = pinnedIndex !== null && pinnedIndex >= 0 && pinnedIndex < count
        expect(windowRows(computeLineWindow(options)).includes(pinnedIndex ?? -1)).toBe(isReal)
      })
    )
  })

  it('bounds a windowed row count by the viewport and overscan', () => {
    fcAssert(
      fc.property(input, (options) => {
        const window = computeLineWindow({ ...options, isWindowed: true })
        const visible = Math.ceil(options.viewport / options.rowHeight) + 1
        expect(window.end - window.start).toBeLessThanOrEqual(visible + 2 * options.overscan)
      })
    )
  })

  it('mounts every row with no spacers when windowing is off', () => {
    const window = computeLineWindow({
      count: 700,
      rowHeight: 18,
      viewport: 0,
      offset: 0,
      isWindowed: false,
      pinnedIndex: 650,
    })
    expect(window).toEqual({ start: 0, end: 700, padBefore: 0, padAfter: 0, pinnedOutside: null })
  })

  it('reports the pinned row only when it is outside the window', () => {
    const base = { count: 5000, rowHeight: 18, viewport: 180, offset: 0, isWindowed: true }
    expect(computeLineWindow({ ...base, pinnedIndex: 3 }).pinnedOutside).toBeNull()
    expect(computeLineWindow({ ...base, pinnedIndex: 4000 }).pinnedOutside).toBe(4000)
  })
})

describe('useLineWindow', () => {
  const options = { count: 5000, rowHeight: 18, viewport: 180, isWindowed: true, pinnedIndex: 0 }

  it('starts at the initial offset and follows the reported one', () => {
    const { result } = renderHook(() => useLineWindow({ ...options, initialOffset: () => 18_000 }))
    expect(result.current.window.start).toBe(990)
    expect(result.current.window.pinnedOutside).toBe(0)
    act(() => result.current.setOffset(0))
    expect(result.current.window.start).toBe(0)
    expect(result.current.window.end).toBe(20)
    expect(result.current.window.pinnedOutside).toBeNull()
  })

  it('names 500 lines as the threshold the shell windows above', () => {
    expect(WINDOWING_THRESHOLD).toBe(500)
  })
})
