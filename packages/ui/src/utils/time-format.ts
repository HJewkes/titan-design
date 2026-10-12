/**
 * A compact age label for a dense column: `today`, `4d ago`, `3mo ago`.
 *
 * Deliberately not `DateTime format="relative"` — that renders Intl prose ("4
 * days ago"), which is too long for a 74px column, and it reads `Date.now()`
 * internally so a story or a visual baseline could never be deterministic. `now`
 * is injected here for exactly that reason.
 */
export function formatTaskAge(iso: string | null | undefined, now: number): string {
  if (!iso) return '—'
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return '—'

  const days = Math.floor((now - then) / 86_400_000)
  if (days <= 0) return 'today'
  if (days === 1) return '1d ago'
  if (days < 30) return `${days}d ago`
  return `${Math.floor(days / 30)}mo ago`
}

/**
 * A session's wall-clock length as `1h 4m` or `42m`. Empty when the span is
 * missing, unparseable or not positive, so callers can drop the separator
 * rather than render `0m`.
 */
export function formatSessionDuration(started: string, ended: string): string {
  const ms = new Date(ended).getTime() - new Date(started).getTime()
  if (!(ms > 0)) return ''
  const minutes = Math.round(ms / 60_000)
  const hours = Math.floor(minutes / 60)
  return hours ? `${hours}h ${minutes % 60}m` : `${minutes}m`
}

/**
 * An observed span in milliseconds, at the precision a reader can use: `340 ms` under a second,
 * `4.2 s` under a minute, `4m 12s` under an hour, `2h 5m` above. A zero trailing unit is
 * dropped (`32m`, `2h`). A negative or non-finite span prints the en-dash placeholder, since
 * no duration is better than a wrong one.
 */
export function formatDurationMs(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return '–'
  const wholeMs = Math.round(ms)
  if (wholeMs < 1_000) return `${wholeMs} ms`
  const tenths = Math.round(ms / 100)
  if (tenths < 600) return `${(tenths / 10).toFixed(1)} s`
  const seconds = Math.round(ms / 1_000)
  if (seconds < 3_600) return joinUnits(Math.floor(seconds / 60), 'm', seconds % 60, 's')
  const minutes = Math.round(ms / 60_000)
  return joinUnits(Math.floor(minutes / 60), 'h', minutes % 60, 'm')
}

function joinUnits(major: number, majorUnit: string, minor: number, minorUnit: string): string {
  return minor === 0 ? `${major}${majorUnit}` : `${major}${majorUnit} ${minor}${minorUnit}`
}
