/**
 * The flat-bar geometry `SegmentedBar` (set-level: one row per SET, e.g. SetStrip/SessionRail)
 * and `SetBarChart` (rep-level: one bar per REP within a set) each declare as their own component
 * defaults. VW-86 named the fact that these lived in two files with no shared source as the drift
 * risk: a future edit to one could silently diverge from the other without anyone noticing they
 * were ever meant to be compared.
 *
 * They are NOT unified into one set of numbers — a strip of SETS across a session and a chart of
 * REPS within one set are genuinely different sizes by design. This module exists so that
 * difference is a documented, single-sourced choice instead of two numbers that happen to match
 * or drift by accident.
 */

/** `SegmentedBar`'s own default geometry (set-level: one row per SET). */
export const SET_LEVEL_FLAT_BAR = {
  /** Track height (px). */
  height: 8,
  /** Gap between segment slots (px) — also SetStrip's between-set gap, see `SEGMENTED_BAR_GAP`. */
  gap: 5,
  /** Corner radius (px). */
  radius: 2,
} as const

/** `SetBarChart`'s own default geometry (rep-level: one bar per REP within a set). */
export const REP_LEVEL_FLAT_BAR = {
  /** No fixed height default — SetBarChart's `height` is a required prop set by the caller. */
  height: null,
  /** Inter-bar gap is proportional (`gapRatio · barWidth`), floored at this many px. */
  gapFloor: 2,
  /** Corner radius (px) default. */
  radius: 5,
} as const
