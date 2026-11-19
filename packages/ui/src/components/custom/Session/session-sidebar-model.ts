import type { BarListRow } from '../../ui/charts/bar-list/bar-list-model'
import type { LineSeries } from '../../ui/charts/line-chart/types'
import { countAtOrBefore } from '../../../utils/count-at-or-before'
import { toolFamilyMeta } from './session-vocabulary'
import type {
  TimelineErrorBreakdown,
  TimelineFileBreakdown,
  TimelineFileTouch,
  TimelineToolBreakdown,
  TimelineTokenPoint,
  TokenTimeline,
} from './session-types'

export const CONTEXT_SERIES_ID = 'context'
export const COUNT_NOT_REPORTED = 'count not reported'
export const COMPACTION_LABEL = 'Compaction'

const pointId = (index: number) => `${CONTEXT_SERIES_ID}@${index}`

/** `NaN` is no position, so it reads as whole-session totals like `null`. */
function usableCursor(cursor: number | null): number | null {
  return cursor === null || Number.isNaN(cursor) ? null : cursor
}

/**
 * The context window as one line. `segmentKey` is never set: a compaction drops the curve but does
 * not make the values on either side incomparable.
 */
export function contextSeries(tokens: TokenTimeline): {
  series: LineSeries[]
  boundaries: { x: number; label: string }[]
} {
  const points = tokens.points.map((p, index) => {
    const reported = p.contextTokens !== null && Number.isFinite(p.contextTokens)
    return {
      id: pointId(index),
      x: p.atMs,
      y: reported ? p.contextTokens : null,
      ...(reported ? {} : { missing: COUNT_NOT_REPORTED }),
    }
  })
  const boundaries = tokens.compactions.flatMap((c) =>
    c.atMs !== null && Number.isFinite(c.atMs) ? [{ x: c.atMs, label: COMPACTION_LABEL }] : []
  )
  return {
    series: [{ id: CONTEXT_SERIES_ID, label: 'Context tokens', points }],
    boundaries,
  }
}

/** The id `contextSeries` gave the last point at or before the cursor, or null before the first. */
export function pointIdAtCursor(
  points: TimelineTokenPoint[],
  cursor: number | null
): string | null {
  const at = usableCursor(cursor)
  if (at === null) return null
  const count = countAtOrBefore(
    points.map((p) => p.atMs),
    at
  )
  return count === 0 ? null : pointId(count - 1)
}

function errorsPerFamily(
  tools: Pick<TimelineToolBreakdown, 'byFamily' | 'byName'>,
  errors: Pick<TimelineErrorBreakdown, 'items'>,
  cursor: number
): Map<string, number> {
  const familyOf = new Map(tools.byName.map((n) => [n.name, n.family]))
  const counts = new Map<string, number>()
  for (const item of errors.items) {
    const family = familyOf.get(item.toolName)
    if (family === undefined || item.atMs === null || item.atMs > cursor) continue
    counts.set(family, (counts.get(family) ?? 0) + 1)
  }
  return counts
}

function errorFlag(count: number): BarListRow['flag'] {
  return count > 0
    ? { tone: 'error', label: `${count} ${count === 1 ? 'error' : 'errors'}` }
    : undefined
}

/**
 * One row per family, ordered by session total (never by the value at the cursor, so rows hold
 * still as it moves). `value` is calls so far, `secondaryValue` the total. With no cursor both
 * are the total and the flag counts every error the family had.
 */
export function toolRowsAtCursor(
  tools: Pick<TimelineToolBreakdown, 'byFamily' | 'byName'>,
  errors: Pick<TimelineErrorBreakdown, 'items'> | undefined,
  cursor: number | null
): BarListRow[] {
  const at = usableCursor(cursor)
  const flagged = at !== null && errors ? errorsPerFamily(tools, errors, at) : null
  return [...tools.byFamily]
    .sort((a, b) => b.calls - a.calls)
    .map((family) => {
      const soFar =
        at === null ? family.calls : Math.min(family.calls, countAtOrBefore(family.atMs, at))
      const errorCount = at === null ? family.errors : (flagged?.get(family.family) ?? 0)
      const flag = errorFlag(errorCount)
      return {
        id: family.family,
        label: toolFamilyMeta(family.family).label,
        value: soFar,
        secondaryValue: family.calls,
        ...(flag ? { flag } : {}),
      }
    })
}

/** The bar scale for `toolRowsAtCursor`: the busiest family's total, or 1 with no calls. */
export function toolRowsMax(tools: Pick<TimelineToolBreakdown, 'byFamily'>): number {
  return Math.max(1, ...tools.byFamily.map((f) => f.calls))
}

interface SoFar {
  soFar: number
  total: number
}

/**
 * Files read and written by the cursor, and the touches so far, newest first. An untimed touch
 * counts in the totals and is never placed relative to the cursor. With no cursor, every file
 * counts as touched so far.
 */
export function filesAtCursor(
  files: TimelineFileBreakdown,
  cursor: number | null
): { read: SoFar; written: SoFar; recent: TimelineFileTouch[]; untimed: number } {
  const at = usableCursor(cursor)
  const timed = (t: TimelineFileTouch): t is TimelineFileTouch & { atMs: number } =>
    t.atMs !== null && Number.isFinite(t.atMs)
  const touched = files.touches.filter(timed).filter((t) => at === null || t.atMs <= at)
  const sofar = (access: TimelineFileTouch['access'], total: number): SoFar => ({
    soFar: at === null ? total : touched.filter((t) => t.access === access).length,
    total,
  })
  const recent = touched
    .map((touch, order) => ({ touch, order }))
    .sort((a, b) => b.touch.atMs! - a.touch.atMs! || b.order - a.order)
    .map((entry) => entry.touch)
  return {
    read: sofar('read', files.readCount),
    written: sofar('write', files.writeCount),
    recent,
    untimed: files.touches.filter((t) => !timed(t)).length,
  }
}

/** Errors so far and the latest one at or before the cursor. Untimed errors count in the total only. */
export function errorsAtCursor(
  errors: TimelineErrorBreakdown,
  cursor: number | null
): { soFar: number; total: number; currentId: string | null } {
  const at = usableCursor(cursor)
  const total = errors.items.length
  if (at === null) return { soFar: total, total, currentId: null }
  const reached = errors.items.filter((e) => e.atMs !== null && e.atMs <= at)
  let current: (typeof reached)[number] | null = null
  for (const item of reached) {
    if (current === null || item.atMs! >= current.atMs!) current = item
  }
  return { soFar: reached.length, total, currentId: current?.callId ?? null }
}
