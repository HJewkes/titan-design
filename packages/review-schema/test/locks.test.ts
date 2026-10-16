import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  LOCKS_SCHEMA_ID,
  LocksSchema,
  afterCycles,
  parseLocks,
  type LocksInput,
} from '../src/index.ts'

const fixture = (): LocksInput =>
  JSON.parse(readFileSync(new URL('./fixtures/locks-l0001.json', import.meta.url), 'utf8'))

const messages = (input: unknown): string[] =>
  LocksSchema.safeParse(input).error?.issues.map((i) => i.message) ?? []

describe('titan-locks/1', () => {
  it('parses a registry keyed on decisions, with holders, touches and dependents', () => {
    const registry = parseLocks(fixture())

    expect(registry.schema).toBe(LOCKS_SCHEMA_ID)
    expect(registry.locks.map((l) => [l.id, l.holders.length])).toEqual([
      ['L-0001', 1],
      ['L-0002', 0],
    ])
    expect(registry.dependents.map((d) => d.mode)).toEqual(['stack-on', 'defer'])
  })

  it('refuses an after edge to an unknown lock, naming both ids', () => {
    const input = fixture()
    input.locks[1]!.after = ['L-0001', 'L-0009']

    expect(messages(input)).toEqual(['lock L-0002: after names unknown lock L-0009'])
  })

  it('refuses a dependent that names an unknown lock', () => {
    const input = fixture()
    input.dependents![0]!.lock = 'L-0007'

    expect(messages(input)).toEqual(['dependent PR #102 names unknown lock L-0007'])
    expect(() => parseLocks(input)).toThrow(/L-0007/)
  })

  it('refuses an after cycle, naming each lock in it', () => {
    const input = fixture()
    input.locks[0]!.after = ['L-0002']

    expect(messages(input)).toEqual(['after cycle: L-0001 -> L-0002 -> L-0001'])
  })

  it('reports a three-lock cycle once and ignores acyclic chains', () => {
    const locks = [
      { id: 'L-0003', after: ['L-0001'] },
      { id: 'L-0001', after: ['L-0002'] },
      { id: 'L-0002', after: ['L-0003'] },
      { id: 'L-0004', after: ['L-0001'] },
    ]

    expect(afterCycles(locks)).toEqual([['L-0001', 'L-0002', 'L-0003']])
    expect(
      afterCycles([
        { id: 'L-0001', after: [] },
        { id: 'L-0002', after: ['L-0001'] },
      ])
    ).toEqual([])
  })

  it('refuses a lock with no holder and no declared touches', () => {
    const input = fixture()
    delete input.locks[1]!.touches

    expect(messages(input)).toEqual(['lock L-0002 has no holder, so it declares touches'])
  })

  it('refuses a decision row keyed by two locks, and a repeated lock id', () => {
    const rowTwice = fixture()
    rowTwice.locks[1]!.decision.ledger = ['row-2', 'row-1']
    const idTwice = fixture()
    idTwice.locks[1]!.id = 'L-0001'
    idTwice.locks[1]!.after = []

    expect(messages(rowTwice)).toEqual(['decision row row-1 is keyed by both L-0001 and L-0002'])
    expect(messages(idTwice)).toContain('lock id L-0001 is used twice')
  })

  it('refuses a lock id that is not L- and four digits, and an unknown dependent mode', () => {
    const input = fixture() as unknown as {
      locks: { id: string }[]
      dependents: { mode: string }[]
    }
    input.locks[0]!.id = 'L-1'
    input.dependents[0]!.mode = 'stack'

    expect(LocksSchema.safeParse(input).error?.issues.map((i) => i.path.join('.'))).toEqual([
      'locks.0.id',
      'dependents.0.mode',
    ])
  })
})

// A live registry stays outside the repo; point TITAN_LOCKS_REGISTRY at it to check it parses.
const registryPath = process.env.TITAN_LOCKS_REGISTRY
describe.skipIf(!registryPath || !existsSync(registryPath))('a live lock registry', () => {
  it('parses', () => {
    const result = LocksSchema.safeParse(JSON.parse(readFileSync(registryPath!, 'utf8')))

    expect(result.error?.issues.map((i) => `${i.path.join('.')}: ${i.message}`) ?? []).toEqual([])
  })
})
