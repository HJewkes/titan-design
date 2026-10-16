// Hover and keyboard stepping for LineChart (TD-34 S3), re-exported by line-chart-model.ts.
import type { ProjectedPoint, ProjectedSeries } from './types'

const proximity = (point: ProjectedPoint, at: { x: number; y: number }): [number, number] => [
  Math.abs(point.x - at.x),
  point.y === null ? Infinity : Math.abs(point.y - at.y),
]

/** The point nearest in x to a plot-px position, then nearest in y; a gap can be the answer. */
export function nearestPoint(
  series: readonly ProjectedSeries[],
  at: { x: number; y: number }
): ProjectedPoint | null {
  let best: ProjectedPoint | null = null
  let bestDistance: [number, number] = [Infinity, Infinity]
  for (const point of series.flatMap((s) => s.points)) {
    const [dx, dy] = proximity(point, at)
    if (dx < bestDistance[0] || (dx === bestDistance[0] && dy < bestDistance[1])) {
      best = point
      bestDistance = [dx, dy]
    }
  }
  return best
}

export const LINE_NAVIGATION_KEYS: readonly string[] = [
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'ArrowDown',
  'Home',
  'End',
  'Escape',
]

/** Anything with points in x order, cleaned or projected. */
export interface NavigableSeries {
  points: readonly { id: string; x: number }[]
}

interface Position {
  series: number
  point: number
}

function locate(series: readonly NavigableSeries[], id: string): Position | undefined {
  for (let s = 0; s < series.length; s++) {
    const point = series[s]?.points.findIndex((p) => p.id === id) ?? -1
    if (point >= 0) return { series: s, point }
  }
  return undefined
}

function closestByX(points: NavigableSeries['points'], x: number): number {
  let best = 0
  points.forEach((point, index) => {
    if (Math.abs(point.x - x) < Math.abs((points[best]?.x ?? Infinity) - x)) best = index
  })
  return best
}

function crossSeries(series: readonly NavigableSeries[], at: Position, step: 1 | -1): Position {
  const x = series[at.series]?.points[at.point]?.x ?? 0
  for (let s = at.series + step; s >= 0 && s < series.length; s += step) {
    const points = series[s]?.points ?? []
    if (points.length > 0) return { series: s, point: closestByX(points, x) }
  }
  return at
}

function move(series: readonly NavigableSeries[], at: Position, key: string): Position {
  const last = (series[at.series]?.points.length ?? 1) - 1
  switch (key) {
    case 'ArrowLeft':
      return { ...at, point: Math.max(at.point - 1, 0) }
    case 'ArrowRight':
      return { ...at, point: Math.min(at.point + 1, last) }
    case 'Home':
      return { ...at, point: 0 }
    case 'End':
      return { ...at, point: last }
    case 'ArrowUp':
      return crossSeries(series, at, -1)
    case 'ArrowDown':
      return crossSeries(series, at, 1)
    default:
      return at
  }
}

/** With nothing active, any navigation key enters at the first series' first point; End at its last. */
function enter(series: readonly NavigableSeries[], key: string): Position | undefined {
  const s = series.findIndex((candidate) => candidate.points.length > 0)
  if (s < 0 || !LINE_NAVIGATION_KEYS.includes(key)) return undefined
  return { series: s, point: key === 'End' ? (series[s]?.points.length ?? 1) - 1 : 0 }
}

/**
 * The active point after a key. Left and Right step within a series, Up and Down change series
 * at the nearest x, Home and End jump to its ends, Escape clears. Never wraps; gaps are stops.
 */
export function nextPoint(
  series: readonly NavigableSeries[],
  activeId: string | null,
  key: string
): string | null {
  if (key === 'Escape') return null
  const at = activeId === null ? undefined : locate(series, activeId)
  const position = at ? move(series, at, key) : enter(series, key)
  return position ? (series[position.series]?.points[position.point]?.id ?? activeId) : activeId
}
