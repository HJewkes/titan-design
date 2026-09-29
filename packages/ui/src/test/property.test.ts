import fc from 'fast-check'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { DEFAULT_NUM_RUNS, fcAssert } from './property'

afterEach(() => {
  vi.unstubAllEnvs()
})

function countRuns(): number {
  let runs = 0
  fcAssert(
    fc.property(fc.nat(), () => {
      runs += 1
    })
  )
  return runs
}

function failureMessage(property: fc.IProperty<[number]>): string {
  try {
    fcAssert(property)
  } catch (error) {
    return (error as Error).message
  }
  throw new Error('expected the property to fail')
}

function counterexample(message: string): string {
  return /Counterexample: .*/.exec(message)?.[0] ?? ''
}

const alwaysFails = fc.property(fc.nat(), () => {
  throw new Error('boom')
})

describe('fcAssert', () => {
  it('runs the fixed default number of runs when FC_NUM_RUNS is unset', () => {
    vi.stubEnv('FC_NUM_RUNS', '')

    expect(countRuns()).toBe(DEFAULT_NUM_RUNS)
  })

  it('honours FC_NUM_RUNS', () => {
    vi.stubEnv('FC_NUM_RUNS', '7')

    expect(countRuns()).toBe(7)
  })

  it('prints the seed of a failure so it can be replayed', () => {
    vi.stubEnv('FC_SEED', '')

    expect(failureMessage(alwaysFails)).toMatch(/Replay with FC_SEED=-?\d+/)
  })

  it('reproduces the same failing input when FC_SEED is set to a reported seed', () => {
    vi.stubEnv('FC_SEED', '')
    const flaky = () =>
      fc.property(fc.integer({ min: 0, max: 1000 }), (n) => {
        if (n >= 400) throw new Error(`fails at ${n}`)
      })
    const first = failureMessage(flaky())
    const seed = /FC_SEED=(-?\d+)/.exec(first)?.[1] as string

    vi.stubEnv('FC_SEED', seed)

    expect(counterexample(failureMessage(flaky()))).toBe(counterexample(first))
  })

  it('reports the seed from FC_SEED when one is pinned', () => {
    vi.stubEnv('FC_SEED', '12345')

    expect(failureMessage(alwaysFails)).toContain('FC_SEED=12345')
  })

  it('rejects a non-integer FC_SEED instead of silently ignoring it', () => {
    vi.stubEnv('FC_SEED', 'abc')

    expect(() => fcAssert(fc.property(fc.nat(), () => true))).toThrow(/FC_SEED must be an integer/)
  })

  it('lets a call override the run count', () => {
    let runs = 0
    fcAssert(
      fc.property(fc.nat(), () => void (runs += 1)),
      { numRuns: 3 }
    )

    expect(runs).toBe(3)
  })

  it('awaits an async property and reports its failure with the seed', async () => {
    vi.stubEnv('FC_SEED', '99')

    await expect(
      fcAssert(fc.asyncProperty(fc.nat(), async () => Promise.reject(new Error('late'))))
    ).rejects.toThrow(/FC_SEED=99/)
  })
})
