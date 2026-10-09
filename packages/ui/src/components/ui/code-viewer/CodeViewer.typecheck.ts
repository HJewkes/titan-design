// Compile-time contract checks for the CodeViewer line types; `pnpm type-check` is the test.
import { tooltipLongFunction } from './fixtures'
import type { LineRange, UseLineRangeOptions } from './types'

const reportOnly: UseLineRangeOptions = { text: '', onSelectedRangeChange: () => {} }
const controlledEmpty: UseLineRangeOptions = { text: '', selectedRange: null }

const excerptHighlights: LineRange[] = tooltipLongFunction.highlights

// @ts-expect-error a range has no colour: highlights get one neutral treatment
const colouredRange: LineRange = { startLine: 1, endLine: 2, color: 'danger' }

// @ts-expect-error both ends are required; a range is never open-ended
const openRange: LineRange = { startLine: 1 }

export const typecheckSubjects = [
  reportOnly,
  controlledEmpty,
  excerptHighlights,
  colouredRange,
  openRange,
]
