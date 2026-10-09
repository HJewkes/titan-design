// Compile-time contract checks for the CodeViewer line types; `pnpm type-check` is the test.
import { tooltipLongFunction } from './fixtures'
import type { CodeViewerProps, LineRange, UseLineRangeOptions } from './types'

const reportOnly: UseLineRangeOptions = { text: '', onSelectedRangeChange: () => {} }
const controlledEmpty: UseLineRangeOptions = { text: '', selectedRange: null }

const excerptHighlights: LineRange[] = tooltipLongFunction.highlights

// @ts-expect-error a range has no colour: highlights get one neutral treatment
const colouredRange: LineRange = { startLine: 1, endLine: 2, color: 'danger' }

// @ts-expect-error both ends are required; a range is never open-ended
const openRange: LineRange = { startLine: 1 }

const fromExcerpt: CodeViewerProps = {
  accessibilityLabel: tooltipLongFunction.path,
  text: tooltipLongFunction.text,
  startLine: tooltipLongFunction.startLine,
  highlights: tooltipLongFunction.highlights,
  isTruncated: tooltipLongFunction.truncated,
}

// @ts-expect-error the region needs a name
const unnamed: CodeViewerProps = { text: '' }

// @ts-expect-error there is one treatment: no variant, colour or press handler
const coloured: CodeViewerProps = { text: '', accessibilityLabel: 'Source', color: 'error' }

// @ts-expect-error the text wins: endLine is not a prop
const withEndLine: CodeViewerProps = { text: '', accessibilityLabel: 'Source', endLine: 3 }

export const typecheckSubjects = [
  fromExcerpt,
  unnamed,
  coloured,
  withEndLine,
  reportOnly,
  controlledEmpty,
  excerptHighlights,
  colouredRange,
  openRange,
]
