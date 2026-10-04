// Types for the exports of api-undocumented.mjs, so its test type-checks under the examples
// project (check-examples-types.mjs).

/** Report name (api/<name>.api.md) to its sorted `(undocumented)` names. */
export type UndocumentedBaseline = Record<string, string[]>

/** Report name to the report's text. */
export type Reports = Record<string, string>

export const BASELINE_PATH: string

export function parseUndocumented(text: string): string[]

export function collectUndocumented(reports: Reports): UndocumentedBaseline

export function diffBaseline(
  current: UndocumentedBaseline,
  baseline: UndocumentedBaseline
): { added: string[]; stale: string[] }

export function nextBaseline(
  reports: Reports,
  baseline: UndocumentedBaseline,
  allowIncrease: boolean
): UndocumentedBaseline

export function readReports(): Reports

export function readBaseline(): UndocumentedBaseline

export function updateBaseline(options: { allowIncrease: boolean }): void
