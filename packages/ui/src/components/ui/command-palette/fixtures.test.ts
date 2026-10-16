import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  createDelayedSource,
  DEFAULT_ASYNC_DELAY_MS,
  PALETTE_DEFAULT,
  PALETTE_FIXTURES,
  PALETTE_HOSTILE,
  PALETTE_LONG_LABEL,
  PALETTE_VERY_LARGE,
  SOURCE_ERROR_MESSAGE,
  UNKNOWN_GROUP_ID,
  VERY_LARGE_COUNT,
} from './fixtures'
import type { PaletteFixture } from './fixtures'
import type { CommandItem } from './types'

const signal = () => new AbortController().signal

const asyncItemsOf = async (fixture: PaletteFixture): Promise<CommandItem[]> => {
  const source = fixture.createSource?.({ delayMs: Infinity })
  if (!source) return []
  const pending = source.loadResults('a', { signal: signal() })
  source.release()
  return pending.catch(() => [])
}

const ids = (items: CommandItem[]) => items.map((entry) => entry.id)

const nonHostile = Object.values(PALETTE_FIXTURES)
  .filter((fixture) => fixture !== PALETTE_HOSTILE)
  .map((fixture) => [fixture.name, fixture] as const)

describe('CommandPalette fixtures', () => {
  it.each(nonHostile)(
    '%s has unique ids within each source and none shared by static and async',
    async (_name, fixture) => {
      const asyncItems = await asyncItemsOf(fixture)

      expect(new Set(ids(fixture.items)).size).toBe(fixture.items.length)
      expect(new Set(ids(fixture.recentItems)).size).toBe(fixture.recentItems.length)
      expect(new Set(ids([...fixture.items, ...asyncItems])).size).toBe(
        fixture.items.length + asyncItems.length
      )
    }
  )

  it.each(nonHostile)(
    '%s uses only known group ids, apart from the declared unknown one',
    async (_name, fixture) => {
      const known = new Set([...fixture.groups.map((group) => group.id), UNKNOWN_GROUP_ID])
      const all = [...fixture.items, ...fixture.recentItems, ...(await asyncItemsOf(fixture))]

      for (const entry of all) {
        if (entry.groupId !== undefined) expect(known.has(entry.groupId), entry.id).toBe(true)
      }
    }
  )

  it('Very large has 10,000 items', () => {
    expect(PALETTE_VERY_LARGE.items).toHaveLength(VERY_LARGE_COUNT)
  })

  it('Default has 12 static items in 3 groups, 3 recents and 8 async items in 2 more groups', async () => {
    const asyncItems = await asyncItemsOf(PALETTE_DEFAULT)

    expect(PALETTE_DEFAULT.items).toHaveLength(12)
    expect(new Set(PALETTE_DEFAULT.items.map((entry) => entry.groupId)).size).toBe(3)
    expect(PALETTE_DEFAULT.recentItems).toHaveLength(3)
    expect(asyncItems).toHaveLength(8)
    expect(new Set(asyncItems.map((entry) => entry.groupId)).size).toBe(2)
  })

  it('Default async titles reach 120 characters with an ellipsis, and excerpts 160', async () => {
    const asyncItems = await asyncItemsOf(PALETTE_DEFAULT)
    const longest = asyncItems.reduce((a, b) => (b.label.length > a.label.length ? b : a))

    expect(longest.label).toHaveLength(120)
    expect(longest.label.endsWith('…')).toBe(true)
    expect(Math.max(...asyncItems.map((entry) => entry.description?.length ?? 0))).toBe(160)
  })

  it('Long label has a 254-character label with no spaces and a 160-character description', () => {
    const [long] = PALETTE_LONG_LABEL.items

    expect(long.label).toHaveLength(254)
    expect(long.label).not.toContain(' ')
    expect(long.description).toHaveLength(160)
  })
})

describe('createDelayedSource', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('resolves only once the delay has passed', async () => {
    const results = [{ id: 'one', label: 'One' }]
    const onResolved = vi.fn()
    void createDelayedSource(results, { delayMs: DEFAULT_ASYNC_DELAY_MS })
      .loadResults('o', { signal: signal() })
      .then(onResolved)

    await vi.advanceTimersByTimeAsync(DEFAULT_ASYNC_DELAY_MS - 1)
    expect(onResolved).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(1)
    expect(onResolved).toHaveBeenCalledWith(results)
  })

  it('rejects with the synthetic error when the source fails', async () => {
    const pending = createDelayedSource([], { delayMs: 10, fails: true }).loadResults('o', {
      signal: signal(),
    })
    const settled = expect(pending).rejects.toThrow(SOURCE_ERROR_MESSAGE)

    await vi.advanceTimersByTimeAsync(10)
    await settled
  })

  it('rejects with an AbortError when the request is aborted', async () => {
    const controller = new AbortController()
    const pending = createDelayedSource([], { delayMs: Infinity }).loadResults('o', {
      signal: controller.signal,
    })

    controller.abort()

    await expect(pending).rejects.toMatchObject({ name: 'AbortError' })
  })
})
