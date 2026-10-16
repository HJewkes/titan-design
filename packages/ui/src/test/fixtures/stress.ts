/**
 * Shared stress fixtures for stories and tests (TD-317). Every value is synthetic and
 * domain-neutral: no real names, no product data. S-6 (pseudo-locale) and T-1 (200% text) are
 * deliberately absent.
 */

/** M-02: one caption line carries at most this many words before it warns. */
export const STRESS_COPY_WORD_BUDGET = 8

export const STRESS_STRINGS = {
  // S-1: shortest realistic label; stresses unused headroom and mis-centred marks.
  S1: 'Map',
  // S-2: typical label; the baseline every other string is compared against.
  S2: 'Weekly report',
  // S-3: long multi-word label of 40 to 50 characters; stresses wrap versus truncate.
  S3: 'Quarterly regional inventory reconciliation',
  // S-4: one unbroken 30+ character token (an id); stresses overflow where wrapping is impossible.
  S4: 'synthetic-fixture-id-0f3a9c7e2b5d4a18',
  // S-5: copy at the M-02 word budget plus one word; stresses the caption length warning.
  S5: 'This sample caption runs one word past its budget',
} as const satisfies Record<string, string>

/** N-5 marker for a value that has no history yet, as distinct from missing or not applicable. */
export const FIRST_USE = 'first-use' as const

export type StressMissingValue = null | undefined | typeof FIRST_USE

export interface StressGoalProgress {
  readonly current: number
  readonly target: number
}

export const STRESS_NUMBERS = {
  // N-1: zero, one and two; stresses singular and plural copy and zero deltas.
  N1: [0, 1, 2],
  // N-2: one to five digits; stresses digit-count width changes and thousands separators.
  N2: [9, 10, 99, 100, 999, 1000, 12345],
  // N-3: durations in seconds across the minute and hour boundaries; stresses timer fit.
  N3: [45, 59, 60, 90, 150, 600, 3600],
  // N-4: signed deltas; stresses sign, precision and width.
  N4: [-12.5, -0.6, 0, 0.05, 240],
  // N-5: missing, not applicable and first use; stresses N/A copy and omitted comparisons.
  N5: [null, undefined, FIRST_USE],
  // N-6: a met goal and an exceeded goal; stresses goal state copy.
  N6: [
    { current: 100, target: 100 },
    { current: 120, target: 100 },
  ],
} as const satisfies {
  readonly N1: readonly number[]
  readonly N2: readonly number[]
  readonly N3: readonly number[]
  readonly N4: readonly number[]
  readonly N5: readonly StressMissingValue[]
  readonly N6: readonly StressGoalProgress[]
}

// W-1: container widths in px, from the WCAG 1.4.10 floor of 320 to a wide desktop of 1280.
export const MATRIX_WIDTHS = [320, 360, 560, 720, 1280] as const satisfies readonly number[]
