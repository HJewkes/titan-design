import { renderHook } from '@testing-library/react'
import fc from 'fast-check'
import { describe, expect, it, vi } from 'vitest'
import { fcAssert } from '../../../test/property'
import { focusOffset, useFocusLine } from './useFocusLine'

const position = fc.record({
  startLine: fc.integer({ min: 1, max: 10_000 }),
  count: fc.integer({ min: 1, max: 6000 }),
  rowHeight: fc.constantFrom(18, 21),
  viewport: fc.integer({ min: 21, max: 1200 }),
  offset: fc.integer({ min: 0, max: 120_000 }),
  delta: fc.integer({ min: -50, max: 6050 }),
})

describe('focusOffset', () => {
  it('puts the line fully inside the viewport, within the scroll range', () => {
    fcAssert(
      fc.property(position, ({ delta, ...at }) => {
        const offset = Math.min(at.offset, Math.max(0, at.count * at.rowHeight - at.viewport))
        const next = focusOffset({ ...at, offset, line: at.startLine + delta })
        const top = Math.min(Math.max(delta, 0), at.count - 1) * at.rowHeight
        expect(next).toBeGreaterThanOrEqual(0)
        expect(next).toBeLessThanOrEqual(Math.max(0, at.count * at.rowHeight - at.viewport))
        expect(top).toBeGreaterThanOrEqual(next)
        expect(top + at.rowHeight).toBeLessThanOrEqual(next + at.viewport)
      })
    )
  })

  it('does not move when the line is already fully visible', () => {
    const at = { startLine: 100, count: 5000, rowHeight: 18, viewport: 180, offset: 900 }
    expect(focusOffset({ ...at, line: 150 })).toBe(900)
    expect(focusOffset({ ...at, line: 159 })).toBe(900)
    expect(focusOffset({ ...at, line: 160 })).not.toBe(900)
    expect(focusOffset({ ...at, line: 149 })).not.toBe(900)
  })

  it('centres a line that is out of view and offsets by the start line', () => {
    const at = { startLine: 101, count: 5000, rowHeight: 18, viewport: 180 }
    expect(focusOffset({ ...at, line: 5000 })).toBe(4899 * 18 - 81)
    expect(focusOffset({ ...at, line: 5100 })).toBe(5000 * 18 - 180)
  })

  it('stays put when nothing scrolls', () => {
    const at = { startLine: 1, rowHeight: 18, offset: 36 }
    expect(focusOffset({ ...at, count: 5000, viewport: undefined, line: 4000 })).toBe(36)
    expect(focusOffset({ ...at, count: 0, viewport: 180, line: 4000 })).toBe(36)
  })
})

describe('useFocusLine', () => {
  const at = { startLine: 1, count: 5000, rowHeight: 18, viewport: 180 }
  const mount = (focusLine?: number) => {
    const scrollTo = vi.fn()
    const hook = renderHook(
      (line: number | undefined) => useFocusLine({ ...at, focusLine: line, scrollTo }),
      { initialProps: focusLine }
    )
    return { scrollTo, ...hook }
  }

  it('scrolls to the focus line on mount and when it changes, but not on a plain re-render', () => {
    const { scrollTo, rerender } = mount(4900)
    expect(scrollTo).toHaveBeenCalledTimes(1)
    expect(scrollTo).toHaveBeenLastCalledWith(4899 * 18 - 81)
    rerender(4900)
    expect(scrollTo).toHaveBeenCalledTimes(1)
    rerender(10)
    expect(scrollTo).toHaveBeenLastCalledWith(9 * 18 - 81)
  })

  it('does not scroll without a focus line', () => {
    expect(mount().scrollTo).not.toHaveBeenCalled()
  })

  it('reveals from the tracked offset, so a visible line does not scroll', () => {
    const { scrollTo, result } = mount()
    result.current.trackOffset(1800)
    result.current.revealLine(105)
    expect(scrollTo).not.toHaveBeenCalled()
    result.current.revealLine(111)
    expect(scrollTo).toHaveBeenCalledWith(110 * 18 - 81)
  })
})
