import fc from 'fast-check'

export const DEFAULT_NUM_RUNS = 100

function readInt(name: string): number | undefined {
  const raw = process.env[name]
  if (raw === undefined || raw === '') return undefined
  const value = Number(raw)
  if (!Number.isInteger(value)) throw new Error(`${name} must be an integer, got "${raw}"`)
  return value
}

function runConfig(overrides: fc.Parameters<unknown>): fc.Parameters<unknown> {
  return {
    numRuns: readInt('FC_NUM_RUNS') ?? DEFAULT_NUM_RUNS,
    seed: readInt('FC_SEED'),
    ...overrides,
  }
}

function replayError<T>(details: fc.RunDetails<T>): Error {
  const replay = `Replay with FC_SEED=${details.seed}`
  return new Error(`${fc.defaultReportMessage(details)}\n${replay}`)
}

/** Runs a fast-check property with the shared run config; a failure names the seed to replay. */
export function fcAssert<T>(property: fc.IProperty<T>, overrides: fc.Parameters<T> = {}): void
export function fcAssert<T>(
  property: fc.IAsyncProperty<T>,
  overrides?: fc.Parameters<T>
): Promise<void>
export function fcAssert<T>(
  property: fc.IProperty<T> | fc.IAsyncProperty<T>,
  overrides: fc.Parameters<T> = {}
): void | Promise<void> {
  const params = runConfig(overrides) as fc.Parameters<T>
  const settle = (details: fc.RunDetails<T>) => {
    if (details.failed) throw replayError(details)
  }
  const outcome = fc.check(property as fc.IProperty<T>, params)
  if (outcome instanceof Promise) return outcome.then(settle)
  settle(outcome)
}
