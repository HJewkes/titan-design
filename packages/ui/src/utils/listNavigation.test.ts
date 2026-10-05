import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  TYPEAHEAD_RESET_MS,
  createTypeaheadBuffer,
  isTypeaheadKey,
  nextActiveIndex,
  typeaheadMatch,
} from './listNavigation'

const enabled = () => false
const disabledAt =
  (...indices: number[]) =>
  (index: number) =>
    indices.includes(index)

const move = (
  key: string,
  current: number,
  overrides: Partial<Parameters<typeof nextActiveIndex>[0]> = {}
) => nextActiveIndex({ key, current, count: 5, isDisabled: enabled, loop: true, ...overrides })

describe('nextActiveIndex', () => {
  it('steps down and up by one', () => {
    expect(move('ArrowDown', 1)).toBe(2)
    expect(move('ArrowUp', 1)).toBe(0)
  })

  it('jumps to the first and last items on Home and End', () => {
    expect(move('Home', 3)).toBe(0)
    expect(move('End', 1)).toBe(4)
  })

  it('skips disabled items when stepping', () => {
    expect(move('ArrowDown', 1, { isDisabled: disabledAt(2, 3) })).toBe(4)
    expect(move('ArrowUp', 4, { isDisabled: disabledAt(2, 3) })).toBe(1)
  })

  it('lands Home and End on the outermost enabled items', () => {
    expect(move('Home', 3, { isDisabled: disabledAt(0, 1) })).toBe(2)
    expect(move('End', 1, { isDisabled: disabledAt(4) })).toBe(3)
  })

  it('wraps past either end when loop is on', () => {
    expect(move('ArrowDown', 4)).toBe(0)
    expect(move('ArrowUp', 0)).toBe(4)
  })

  it('wraps past a disabled first item to the next enabled one', () => {
    expect(move('ArrowDown', 4, { isDisabled: disabledAt(0) })).toBe(1)
  })

  it('stops at either end when loop is off', () => {
    expect(move('ArrowDown', 4, { loop: false })).toBe(4)
    expect(move('ArrowUp', 0, { loop: false })).toBe(0)
  })

  it('enters the list from no active item at the first or last enabled item', () => {
    expect(move('ArrowDown', -1, { isDisabled: disabledAt(0) })).toBe(1)
    expect(move('ArrowUp', -1, { isDisabled: disabledAt(4) })).toBe(3)
  })

  it('returns null for a key the list does not handle', () => {
    expect(move('Enter', 2)).toBeNull()
    expect(move('ArrowRight', 2)).toBeNull()
    expect(move('a', 2)).toBeNull()
  })

  it('returns the current index when every item is disabled', () => {
    expect(move('ArrowDown', 2, { isDisabled: () => true })).toBe(2)
    expect(move('Home', 2, { isDisabled: () => true })).toBe(2)
  })
})

const labels = ['Copy', 'Delete', 'Duplicate', 'Archive', 'Download']

describe('typeaheadMatch', () => {
  it('matches the first enabled label with the typed prefix, ignoring case', () => {
    expect(typeaheadMatch({ buffer: 'D', labels, current: 0, isDisabled: enabled })).toBe(1)
  })

  it('cycles through matches when one character repeats', () => {
    expect(typeaheadMatch({ buffer: 'd', labels, current: 1, isDisabled: enabled })).toBe(2)
    expect(typeaheadMatch({ buffer: 'd', labels, current: 4, isDisabled: enabled })).toBe(1)
  })

  it('keeps the current item while a longer prefix still matches it', () => {
    expect(typeaheadMatch({ buffer: 'do', labels, current: 4, isDisabled: enabled })).toBe(4)
  })

  it('skips disabled labels', () => {
    expect(typeaheadMatch({ buffer: 'd', labels, current: 0, isDisabled: disabledAt(1) })).toBe(2)
  })

  it('returns null when nothing matches or the buffer is empty', () => {
    expect(typeaheadMatch({ buffer: 'z', labels, current: 0, isDisabled: enabled })).toBeNull()
    expect(typeaheadMatch({ buffer: '', labels, current: 0, isDisabled: enabled })).toBeNull()
  })
})

describe('isTypeaheadKey', () => {
  it('accepts printable characters and rejects named keys', () => {
    expect(isTypeaheadKey('d', '')).toBe(true)
    expect(isTypeaheadKey('Tab', '')).toBe(false)
    expect(isTypeaheadKey('Escape', '')).toBe(false)
  })

  it('accepts a space only inside a word', () => {
    expect(isTypeaheadKey(' ', '')).toBe(false)
    expect(isTypeaheadKey(' ', 'sav')).toBe(true)
  })
})

describe('createTypeaheadBuffer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  const matchFor = (buffer: string) =>
    typeaheadMatch({ buffer, labels, current: -1, isDisabled: enabled })

  it('selects Duplicate over Delete when d then u arrive within the reset window', () => {
    const buffer = createTypeaheadBuffer()
    expect(matchFor(buffer.push('d'))).toBe(1)
    vi.advanceTimersByTime(TYPEAHEAD_RESET_MS - 1)
    expect(matchFor(buffer.push('u'))).toBe(2)
  })

  it('restarts the buffer once the reset window passes', () => {
    const buffer = createTypeaheadBuffer()
    buffer.push('d')
    vi.advanceTimersByTime(TYPEAHEAD_RESET_MS)
    expect(buffer.current()).toBe('')
    expect(buffer.push('a')).toBe('a')
  })

  it('clears on demand', () => {
    const buffer = createTypeaheadBuffer()
    buffer.push('d')
    buffer.clear()
    expect(buffer.current()).toBe('')
  })
})
