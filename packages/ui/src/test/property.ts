import fc from 'fast-check'

export const DEFAULT_NUM_RUNS = 100

const CANONICAL_INT = /^-?(0|[1-9]\d*)$/

// Unset means the default; anything else must parse, so the environment can only tighten a check.
function readInt(name: string, min: number, max: number): number | undefined {
  const raw = process.env[name]
  if (raw === undefined) return undefined
  const value = CANONICAL_INT.test(raw) ? Number(raw) : Number.NaN
  if (!(value >= min && value <= max)) {
    throw new Error(`${name} must be an integer from ${min} to ${max}, got ${JSON.stringify(raw)}`)
  }
  return value
}

function runConfig<T>(overrides: fc.Parameters<T>): fc.Parameters<T> {
  return {
    numRuns: readInt('FC_NUM_RUNS', 1, Number.MAX_SAFE_INTEGER) ?? DEFAULT_NUM_RUNS,
    seed: readInt('FC_SEED', -(2 ** 31), 2 ** 31 - 1),
    ...overrides,
  }
}

function replayError<T>(details: fc.RunDetails<T>): Error {
  const replay = `Replay with FC_SEED=${details.seed}`
  return new Error(`${fc.defaultReportMessage(details)}\n${replay}`)
}

/** Runs a fast-check property with the shared run config; a failure names the seed to replay. */
export function fcAssert<T>(property: fc.IProperty<T>, overrides?: fc.Parameters<T>): void
export function fcAssert<T>(
  property: fc.IAsyncProperty<T>,
  overrides?: fc.Parameters<T>
): Promise<void>
export function fcAssert<T>(
  property: fc.IProperty<T> | fc.IAsyncProperty<T>,
  overrides: fc.Parameters<T> = {}
): void | Promise<void> {
  const settle = (details: fc.RunDetails<T>) => {
    if (details.failed) throw replayError(details)
  }
  const outcome = fc.check(property as fc.IProperty<T>, runConfig(overrides))
  if (outcome instanceof Promise) return outcome.then(settle)
  settle(outcome)
}
