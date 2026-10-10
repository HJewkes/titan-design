import type { LocksIo } from '../../../src/locks.ts'
import type { CliIo } from '../../../src/run.ts'

/** A CLI io for the `locks` verbs: output into `out`, everything else inert. */
export const locksCliIo = (out: string[], locks?: LocksIo): CliIo => ({
  stdout: (t) => out.push(t),
  stderr: (t) => out.push(`! ${t}`),
  openBrowser: () => {},
  capture: async () => [],
  measure: async () => [],
  git: { revParse: async () => '', isAncestor: async () => true },
  createPage: () => ({ handler: () => {}, close: async () => {} }) as never,
  harnessFreshness: async () => ({ state: 'current' }),
  ...(locks && { locks }),
  signal: new AbortController().signal,
})
