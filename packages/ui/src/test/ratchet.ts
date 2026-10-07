/** The wording a ratchet uses for entries the baseline lacks (`added`) and no longer needs (`stale`). */
export interface RatchetMessages {
  added: (items: string[]) => string
  stale: (items: string[]) => string
}

/**
 * A shrink-only baseline check: one problem when `current` holds entries `baselined` does not list,
 * one when `baselined` lists entries `current` no longer holds. Order is added, then stale.
 */
export function ratchetProblems(
  current: string[],
  baselined: string[],
  messages: RatchetMessages
): string[] {
  const added = current.filter((item) => !baselined.includes(item))
  const stale = baselined.filter((item) => !current.includes(item))
  return [
    ...(added.length > 0 ? [messages.added(added)] : []),
    ...(stale.length > 0 ? [messages.stale(stale)] : []),
  ]
}
