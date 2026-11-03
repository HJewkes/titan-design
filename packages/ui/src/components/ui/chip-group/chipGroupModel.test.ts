import { describe, expect, it } from 'vitest'
import { indexForKey, nextEnabledIndex, revealOffset, tabStopIndex } from './chipGroupModel'

describe('nextEnabledIndex', () => {
  it('wraps past the last item to the first', () => {
    expect(nextEnabledIndex([true, true, true], 2, 1)).toBe(0)
  })

  it('wraps back past the first item to the last', () => {
    expect(nextEnabledIndex([true, true, true], 0, -1)).toBe(2)
  })

  it('skips disabled items', () => {
    expect(nextEnabledIndex([true, false, true], 0, 1)).toBe(2)
  })

  it('returns -1 when nothing is enabled', () => {
    expect(nextEnabledIndex([false, false], 0, 1)).toBe(-1)
  })
})

describe('indexForKey', () => {
  it('ignores keys the group does not handle', () => {
    expect(indexForKey('a', [true, true], 0)).toBeUndefined()
  })

  it('Home and End land on the first and last enabled items', () => {
    const enabled = [false, true, true, false]

    expect(indexForKey('Home', enabled, 2)).toBe(1)
    expect(indexForKey('End', enabled, 1)).toBe(2)
  })

  it('ArrowDown steps forward like ArrowRight', () => {
    expect(indexForKey('ArrowDown', [true, true], 0)).toBe(1)
  })
})

describe('tabStopIndex', () => {
  it('is the selected item when it is enabled', () => {
    expect(tabStopIndex([true, true, true], 2)).toBe(2)
  })

  it('falls back to the first enabled item when the selected one is disabled or missing', () => {
    expect(tabStopIndex([false, true, false], 2)).toBe(1)
    expect(tabStopIndex([false, true], -1)).toBe(1)
  })
})

describe('revealOffset', () => {
  const base = { itemWidth: 60, scrollX: 0, viewportWidth: 200, margin: 32 }

  it('leaves an item already in view alone', () => {
    expect(revealOffset({ ...base, itemX: 40 })).toBeNull()
  })

  it('scrolls forward so the item and a peek past it fit', () => {
    expect(revealOffset({ ...base, itemX: 300 })).toBe(300 + 60 + 32 - 200)
  })

  it('scrolls back to the item less the margin, never below zero', () => {
    expect(revealOffset({ ...base, scrollX: 400, itemX: 100 })).toBe(68)
    expect(revealOffset({ ...base, scrollX: 400, itemX: 10 })).toBe(0)
  })

  it('waits for the viewport to be measured', () => {
    expect(revealOffset({ ...base, viewportWidth: 0, itemX: 300 })).toBeNull()
  })
})
