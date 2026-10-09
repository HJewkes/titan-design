import type { CodeViewerSize } from './types'

export interface CodeViewerMetrics {
  /** The fixed row height in px: the size's mono line box, which windowing multiplies by. */
  rowHeight: number
  /** The mono advance in px (0.6em), for the content and gutter widths. */
  advance: number
  /** Classes that move Typography `mono` to this size. */
  textClassName: string
}

export const SIZE_METRICS: Record<CodeViewerSize, CodeViewerMetrics> = {
  sm: { rowHeight: 18, advance: 7.2, textClassName: '' },
  md: { rowHeight: 21, advance: 8.4, textClassName: 'text-sm leading-normal' },
}

/** The viewport cap a windowed viewer takes when `maxHeight` is not set; windowing needs a bound. */
export const WINDOWED_MAX_HEIGHT = 480

/** Horizontal padding of a code row (`px-inset-md`), added to the content width. */
export const CODE_ROW_PADDING = 12
