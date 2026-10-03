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
