// Thinning for dense axes and series: fewer labels and fewer points, never the ones a reader needs.

/**
 * Drops labels until no two kept ones sit closer than `minGap` px, keeping the first and
 * the last. `position` is the label's px coordinate; labels arrive in ascending position.
 * When the first and last are themselves closer than `minGap`, only the first is kept.
 */
export function thinLabels<T>(
  labels: readonly T[],
  position: (label: T) => number,
  minGap: number
): T[] {
  if (labels.length <= 1) return [...labels]
  const first = labels[0] as T
  const last = labels[labels.length - 1] as T
  if (position(last) - position(first) < minGap) return [first]
  const kept = [first]
  for (const label of labels.slice(1, -1)) {
    if (position(label) - position(kept[kept.length - 1] as T) >= minGap) kept.push(label)
  }
  while (kept.length > 1 && position(last) - position(kept[kept.length - 1] as T) < minGap) {
    kept.pop()
  }
  return [...kept, last]
}

export interface DecimateOptions<T> {
  x: (point: T) => number
  /** Must be finite; decimate each unbroken segment of a series on its own. */
  y: (point: T) => number
  /** Pixel columns across the points' x range, usually the plot width in px. */
  columns: number
}

/** Indices of a column's lowest and highest point. */
interface ColumnExtremes {
  min: number
  max: number
}

/** Index of the column each point falls in, over the points' own x range. */
function columnOf<T>(points: readonly T[], { x, columns }: DecimateOptions<T>) {
  const xs = points.map(x)
  const lo = xs.reduce((a, b) => Math.min(a, b))
  const span = xs.reduce((a, b) => Math.max(a, b)) - lo
  const count = Math.max(Math.floor(columns), 1)
  return xs.map((value) =>
    span > 0 ? Math.min(Math.floor(((value - lo) / span) * count), count - 1) : 0
  )
}

function columnExtremes<T>(points: readonly T[], options: DecimateOptions<T>) {
  const extremes = new Map<number, ColumnExtremes>()
  const columns = columnOf(points, options)
  points.forEach((point, index) => {
    const column = columns[index] as number
    const seen = extremes.get(column)
    if (!seen) {
      extremes.set(column, { min: index, max: index })
      return
    }
    if (options.y(point) < options.y(points[seen.min] as T)) seen.min = index
    if (options.y(point) > options.y(points[seen.max] as T)) seen.max = index
  })
  return extremes
}

/**
 * Min/max decimation: per pixel column, keeps the lowest and the highest point, plus the
 * first and the last point, in their original order. A spike survives, unlike averaging.
 * Returns at most `2 * columns + 2` points; a series already that small comes back whole.
 */
export function decimateMinMax<T>(points: readonly T[], options: DecimateOptions<T>): T[] {
  if (points.length <= 2 * Math.max(Math.floor(options.columns), 1) + 2) return [...points]
  const keep = new Set<number>([0, points.length - 1])
  for (const { min, max } of columnExtremes(points, options).values()) {
    keep.add(min)
    keep.add(max)
  }
  return [...keep].sort((a, b) => a - b).map((index) => points[index] as T)
}
