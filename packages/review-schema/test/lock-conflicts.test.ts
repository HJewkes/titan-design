import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  lockConflicts,
  parseLocks,
  type LockPlan,
  type Locks,
  type LocksInput,
  type PlannedItem,
} from '../src/index.ts'

const HOLDER_HEAD = '1111111111111111111111111111111111111111'
const MAIN = '0000000000000000000000000000000000000000'
const DEPENDENT_HEAD = '2222222222222222222222222222222222222222'
const STACKED_HEAD = '3333333333333333333333333333333333333333'

const fixture = (): LocksInput =>
  JSON.parse(readFileSync(new URL('./fixtures/locks-l0001.json', import.meta.url), 'utf8'))

const registry = (edit: (input: LocksInput) => void = () => {}): Locks => {
  const input = fixture()
  edit(input)
  return parseLocks(input)
}

// Only the stacked head has the holder's head in its history.
const history: Record<string, string[]> = { [STACKED_HEAD]: [HOLDER_HEAD, MAIN] }
const contains = (commit: string, ancestor: string) =>
  commit === ancestor || (history[commit] ?? []).includes(ancestor)

const plan = (overrides: Partial<LockPlan>): LockPlan => ({
  items: [],
  questions: [],
  ships: [],
  contains,
  ...overrides,
})

// A dependent that edits three of L-0001's light tokens and one token no lock decides.
const dependent = (head: string): PlannedItem => ({
  pr: 102,
  head,
  base: head,
  touches: {
    tokens: [
      { name: 'surface-base', mode: 'light' },
      { name: 'text-secondary', mode: 'light' },
      { name: 'border-input', mode: 'dark' },
      { name: 'surface-raised', mode: 'light' },
    ],
  },
})

const holder = (pr: number, headSha: string): PlannedItem => ({
  pr,
  head: headSha,
  base: headSha,
  touches: { tokens: [] },
})

describe('lockConflicts', () => {
  it('flags a dependent rendered on main once, naming the three locked tokens it overlaps', () => {
    const conflicts = lockConflicts(registry(), plan({ items: [dependent(DEPENDENT_HEAD)] }))

    expect(conflicts).toHaveLength(1)
    expect(conflicts[0]).toMatchObject({
      kind: 'superseded-state',
      lock: 'L-0001',
      ids: ['#102', '#101'],
      tokens: [
        { name: 'surface-base', mode: 'light' },
        { name: 'text-secondary', mode: 'light' },
        { name: 'surface-raised', mode: 'light' },
      ],
    })
    expect(conflicts[0]!.message).toContain('#101 at 1111111')
  })

  it('finds nothing when the same dependent is stacked on the holder head', () => {
    const items = [holder(101, HOLDER_HEAD), dependent(STACKED_HEAD)]

    expect(lockConflicts(registry(), plan({ items }))).toEqual([])
  })

  it('ignores a token overlap in the other mode, and the holder overlapping its own lock', () => {
    const otherMode: PlannedItem = {
      ...dependent(DEPENDENT_HEAD),
      touches: { tokens: [{ name: 'surface-base', mode: 'dark' }] },
    }
    const self: PlannedItem = { ...dependent(MAIN), pr: 101 }

    expect(lockConflicts(registry(), plan({ items: [otherMode, self] }))).toEqual([])
  })

  it('flags a question whose touches hit a decided row once, as a re-ask', () => {
    const question = {
      id: 'tone-again',
      touches: {
        tokens: [
          { name: 'brand-primary-solid', mode: 'light' as const },
          { name: 'status-info-solid', mode: 'light' as const },
        ],
      },
    }

    const conflicts = lockConflicts(registry(), plan({ questions: [question] }))

    expect(conflicts).toEqual([
      expect.objectContaining({
        kind: 're-ask',
        lock: 'L-0002',
        ids: ['tone-again'],
        tokens: [{ name: 'brand-primary-solid', mode: 'light' }],
      }),
    ])
  })

  it('does not treat a released decision as decided', () => {
    const released = registry((r) => {
      r.locks[1]!.status = 'released'
    })
    const question = {
      id: 'tone-again',
      touches: { tokens: [{ name: 'brand-primary-solid', mode: 'light' as const }] },
    }

    expect(lockConflicts(released, plan({ questions: [question] }))).toEqual([])
  })

  it('flags a Ship at a head that differs from the prior Ship head for that PR', () => {
    const ships = [
      { pr: 101, head: HOLDER_HEAD },
      { pr: 102, head: DEPENDENT_HEAD },
      { pr: 101, head: HOLDER_HEAD },
      { pr: 101, head: STACKED_HEAD },
    ]

    expect(lockConflicts(registry(), plan({ ships }))).toEqual([
      expect.objectContaining({
        kind: 'stale-ship',
        lock: 'L-0001',
        ids: ['#101', HOLDER_HEAD, STACKED_HEAD],
      }),
    ])
  })

  it('flags a single Ship at a head the round no longer plans for that PR', () => {
    const ships = [{ pr: 101, head: HOLDER_HEAD }]
    const items = [holder(101, STACKED_HEAD)]

    expect(lockConflicts(registry(), plan({ items, ships }))).toEqual([
      expect.objectContaining({
        kind: 'stale-ship',
        lock: 'L-0001',
        ids: ['#101', HOLDER_HEAD, STACKED_HEAD],
      }),
    ])
  })

  it('accepts a Ship at the head the round plans', () => {
    const ships = [{ pr: 101, head: HOLDER_HEAD }]
    const items = [holder(101, HOLDER_HEAD)]

    expect(lockConflicts(registry(), plan({ items, ships }))).toEqual([])
  })

  describe('lock order', () => {
    const withSecondHolder = () =>
      registry((r) => {
        r.locks[1]!.holders = [{ pr: 104, headSha: STACKED_HEAD }]
      })

    it('flags a holder ordered ahead of the lock it comes after', () => {
      const items = [holder(104, STACKED_HEAD), holder(101, HOLDER_HEAD)]

      expect(lockConflicts(withSecondHolder(), plan({ items }))).toEqual([
        expect.objectContaining({
          kind: 'lock-order',
          lock: 'L-0002',
          ids: ['#104', 'L-0002', 'L-0001'],
        }),
      ])
    })

    it('flags a holder whose earlier lock is still open and absent from the round', () => {
      const conflicts = lockConflicts(
        withSecondHolder(),
        plan({ items: [holder(104, STACKED_HEAD)] })
      )

      expect(conflicts.map((c) => [c.kind, c.lock])).toEqual([['lock-order', 'L-0002']])
    })

    it('accepts the earlier lock first, or already merged', () => {
      const ordered = [holder(101, HOLDER_HEAD), holder(104, STACKED_HEAD)]
      const merged = withSecondHolder()
      merged.locks[0]!.status = 'merged'

      expect(lockConflicts(withSecondHolder(), plan({ items: ordered }))).toEqual([])
      expect(lockConflicts(merged, plan({ items: [holder(104, STACKED_HEAD)] }))).toEqual([])
    })
  })
})
