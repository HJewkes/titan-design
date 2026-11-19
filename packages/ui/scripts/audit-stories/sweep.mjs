/** Widths for `audit:stories --sweep`, and the range notation blockers use under it. */
export const SWEEP_MIN = 320
export const SWEEP_MAX = 1440
export const SWEEP_STEP = 40
/** One px either side of the sm, md and lg breakpoints in primitives.ts (600, 1000, 1200). */
export const SWEEP_BREAKPOINT_WIDTHS = [599, 600, 999, 1000, 1199, 1200]

/** 320..1440 in 40 px steps plus the breakpoint edges, sorted, no duplicates. */
export function sweepWidths() {
  const steps = []
  for (let w = SWEEP_MIN; w <= SWEEP_MAX; w += SWEEP_STEP) steps.push(w)
  return [...new Set([...steps, ...SWEEP_BREAKPOINT_WIDTHS])].sort((a, b) => a - b)
}

/**
 * Collapses `widths` into `320-400,1200`: widths that are neighbours in `audited` join one range.
 * A width absent from `audited` is treated as its own neighbour-less point.
 */
export function mergeWidthRanges(widths, audited) {
  const order = [...new Set(audited)].sort((a, b) => a - b)
  const hit = [...new Set(widths)].sort((a, b) => a - b)
  const ranges = []
  let run = []
  const flush = () => {
    if (run.length === 0) return
    ranges.push(run.length === 1 ? `${run[0]}` : `${run[0]}-${run.at(-1)}`)
    run = []
  }
  for (const w of hit) {
    const prev = run.at(-1)
    if (prev !== undefined && order.indexOf(w) === order.indexOf(prev) + 1 && order.includes(w)) {
      run.push(w)
    } else {
      flush()
      run.push(w)
    }
  }
  flush()
  return ranges.join(',')
}
