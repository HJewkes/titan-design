// Types for the pure exports of check-examples-types.mjs, so its test type-checks under the
// examples project it gates.
export interface ExampleDiagnostic {
  file: string
  syntactic: boolean
}

export interface CountDelta {
  file: string
  count: number
  baseline: number
}

export interface BaselineComparison {
  ok: boolean
  unbaselined: { file: string; count: number }[]
  increased: CountDelta[]
  decreased: CountDelta[]
  missing: string[]
}

export type Counts = Record<string, number>

export function groupDiagnostics(diagnostics: ExampleDiagnostic[]): {
  counts: Counts
  syntaxFiles: string[]
}

export function compareToBaseline(
  counts: Counts,
  baseline: Counts,
  options: { syntaxFiles?: string[]; exists: (file: string) => boolean }
): BaselineComparison

export function updatedBaseline(
  counts: Counts,
  baseline: Counts,
  options: { allowIncrease: boolean; syntaxFiles?: string[]; exists: (file: string) => boolean }
): Counts
