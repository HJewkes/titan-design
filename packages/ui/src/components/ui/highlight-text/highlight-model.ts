/** A matched span of a string; structurally identical to the command palette's `MatchRange`. */
export interface HighlightRange {
  /** Index of the first matched character. */
  start: number
  /** Index after the last matched character (exclusive). */
  end: number
}

export interface HighlightSegment {
  text: string
  isMatch: boolean
}

function clampRanges(length: number, ranges: readonly HighlightRange[]): HighlightRange[] {
  return ranges
    .map(({ start, end }) => ({
      start: Math.min(Math.max(start, 0), length),
      end: Math.min(Math.max(end, 0), length),
    }))
    .filter(({ start, end }) => start < end)
    .sort((a, b) => a.start - b.start || a.end - b.end)
}

function mergeRanges(sorted: HighlightRange[]): HighlightRange[] {
  const merged: HighlightRange[] = []
  for (const range of sorted) {
    const last = merged[merged.length - 1]
    if (last && range.start <= last.end) {
      last.end = Math.max(last.end, range.end)
    } else {
      merged.push({ ...range })
    }
  }
  return merged
}

/** Splits `text` into alternating plain and matched segments; `end` is exclusive. */
export function toSegments(text: string, ranges: readonly HighlightRange[]): HighlightSegment[] {
  const merged = mergeRanges(clampRanges(text.length, ranges))
  const segments: HighlightSegment[] = []
  let cursor = 0
  for (const { start, end } of merged) {
    if (start > cursor) segments.push({ text: text.slice(cursor, start), isMatch: false })
    segments.push({ text: text.slice(start, end), isMatch: true })
    cursor = end
  }
  if (cursor < text.length || segments.length === 0) {
    segments.push({ text: text.slice(cursor), isMatch: false })
  }
  return segments
}
