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

  describe('a lock that names token families', () => {
    const families = () =>
      registry((r) => {
        r.locks[1]!.touches!.tokens = [
          { name: '*-subtle', mode: 'light' },
          { name: 'tint-{hue}-solid / on-tint-{hue}', mode: 'dark' },
        ]
      })

    it('flags a question touching concrete members of the families as one re-ask', () => {
      const question = {
        id: 'family-again',
        touches: {
          tokens: [
            { name: 'primary-subtle', mode: 'light' as const },
            { name: 'tint-red-solid', mode: 'dark' as const },
            { name: 'tint-red-solid', mode: 'light' as const },
          ],
        },
      }

      expect(lockConflicts(families(), plan({ questions: [question] }))).toEqual([
        expect.objectContaining({
          kind: 're-ask',
          lock: 'L-0002',
          tokens: [
            { name: 'primary-subtle', mode: 'light' },
            { name: 'tint-red-solid', mode: 'dark' },
          ],
        }),
      ])
    })

    it('flags an unstacked item touching a family of a held lock', () => {
      const held = registry((r) => {
        r.locks[0]!.footprint!.tokens = [{ name: 'surface-*', mode: 'light' }]
      })
      const item: PlannedItem = {
        ...dependent(DEPENDENT_HEAD),
        touches: { tokens: [{ name: 'surface-sunken' }] },
      }

      expect(lockConflicts(held, plan({ items: [item] }))).toEqual([
        expect.objectContaining({
          kind: 'superseded-state',
          lock: 'L-0001',
          tokens: [{ name: 'surface-sunken' }],
        }),
      ])
    })
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

  it('flags a Ship off the prior Ship head for a PR the round does not plan', () => {
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
        ids: ['#101', HOLDER_HEAD, STACKED_HEAD, 'L-0001'],
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
        ids: ['#101', HOLDER_HEAD, STACKED_HEAD, 'L-0001'],
      }),
    ])
  })

  it('accepts a PR shipped, pushed and shipped again at the head the round plans', () => {
    const ships = [
      { pr: 101, head: HOLDER_HEAD },
      { pr: 101, head: STACKED_HEAD },
    ]
    const items = [holder(101, STACKED_HEAD)]

    expect(lockConflicts(registry(), plan({ items, ships }))).toEqual([])
  })

  it('flags a re-shipped PR behind its planned head once, against its last Ship', () => {
    const ships = [
      { pr: 101, head: HOLDER_HEAD },
      { pr: 101, head: STACKED_HEAD },
    ]
    const items = [holder(101, DEPENDENT_HEAD)]

    expect(lockConflicts(registry(), plan({ items, ships }))).toEqual([
      expect.objectContaining({
        kind: 'stale-ship',
        ids: ['#101', STACKED_HEAD, DEPENDENT_HEAD, 'L-0001'],
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

  describe('a PR holding several locks', () => {
    // #101 holds L-0001 and a third lock that comes after the open, unheld L-0002.
    const twoLocks = (firstStatus: 'open' | 'merged') =>
      registry((r) => {
        r.locks[0]!.status = firstStatus
        r.locks.push({
          id: 'L-0003',
          status: 'open',
          decision: { ledger: 'row-9', decisionsItem: '9', round: 'example', questionId: 'q' },
          holders: [{ pr: 101, headSha: HOLDER_HEAD }],
          after: ['L-0002'],
        })
      })

    it.each(['open', 'merged'] as const)(
      'checks the order of every lock it holds when the first is %s',
      (firstStatus) => {
        const conflicts = lockConflicts(
          twoLocks(firstStatus),
          plan({ items: [holder(101, HOLDER_HEAD)] })
        )

        expect(conflicts).toEqual([
          expect.objectContaining({
            kind: 'lock-order',
            lock: 'L-0003',
            ids: ['#101', 'L-0003', 'L-0002'],
          }),
        ])
      }
    )

    it('accepts a PR that holds both locks of an after chain', () => {
      const chain = registry((r) => {
        r.locks[1]!.holders = [{ pr: 101, headSha: HOLDER_HEAD }]
      })

      expect(lockConflicts(chain, plan({ items: [holder(101, HOLDER_HEAD)] }))).toEqual([])
    })

    it('names every lock the PR holds on a stale Ship', () => {
      const ships = [{ pr: 101, head: MAIN }]
      const items = [holder(101, HOLDER_HEAD), holder(104, STACKED_HEAD)]
      const registryWithL2Held = twoLocks('open')
      registryWithL2Held.locks[1]!.holders = [{ pr: 104, headSha: STACKED_HEAD }]

      const stale = lockConflicts(registryWithL2Held, plan({ items, ships })).filter(
        (c) => c.kind === 'stale-ship'
      )

      expect(stale).toEqual([
        expect.objectContaining({
          lock: 'L-0001',
          ids: ['#101', MAIN, HOLDER_HEAD, 'L-0001', 'L-0003'],
        }),
      ])
    })
  })
})
