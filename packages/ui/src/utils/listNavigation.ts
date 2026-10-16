/** How long a typeahead buffer keeps its characters after the last key, in ms. */
export const TYPEAHEAD_RESET_MS = 500

export interface NextActiveIndexInput {
  key: string
  /** Index of the active item; out of range means no item is active. */
  current: number
  count: number
  isDisabled: (index: number) => boolean
  loop: boolean
}

interface SeekInput {
  count: number
  isDisabled: (index: number) => boolean
  loop: boolean
}

function seek(from: number, step: 1 | -1, { count, isDisabled, loop }: SeekInput): number | null {
  let index = from
  for (let visited = 0; visited < count; visited++) {
    if (index < 0 || index >= count) {
      if (!loop) return null
      index = (index + count) % count
    }
    if (!isDisabled(index)) return index
    index += step
  }
  return null
}

const NAVIGATION_KEYS = new Set(['ArrowDown', 'ArrowUp', 'Home', 'End'])

/**
 * The index a list key moves to, or `null` for a key the list does not handle. Disabled items are
 * skipped; `loop` wraps at the ends. A list with no enabled item answers `current`.
 */
export function nextActiveIndex({
  key,
  current,
  count,
  isDisabled,
  loop,
}: NextActiveIndexInput): number | null {
  if (!NAVIGATION_KEYS.has(key)) return null
  const hasCurrent = current >= 0 && current < count
  const edge = { count, isDisabled, loop: false }
  const along = { count, isDisabled, loop }
  let target: number | null
  if (key === 'Home' || (key === 'ArrowDown' && !hasCurrent)) target = seek(0, 1, edge)
  else if (key === 'End' || !hasCurrent) target = seek(count - 1, -1, edge)
  else target = seek(current + (key === 'ArrowDown' ? 1 : -1), key === 'ArrowDown' ? 1 : -1, along)
  return target ?? current
}

export interface TypeaheadMatchInput {
  buffer: string
  labels: string[]
  current: number
  isDisabled: (index: number) => boolean
}

/**
 * The first enabled item whose label starts with `buffer`, or `null`. A single character searches
 * after `current`, so repeating it cycles; a longer buffer includes `current`, so it stays put
 * while the typed prefix still matches it.
 */
export function typeaheadMatch({
  buffer,
  labels,
  current,
  isDisabled,
}: TypeaheadMatchInput): number | null {
  const count = labels.length
  if (buffer === '' || count === 0) return null
  const prefix = buffer.toLowerCase()
  const base = current >= 0 && current < count ? current : -1
  const start = buffer.length > 1 ? Math.max(base, 0) : base + 1
  for (let offset = 0; offset < count; offset++) {
    const index = (start + offset) % count
    if (!isDisabled(index) && labels[index].toLowerCase().startsWith(prefix)) return index
  }
  return null
}

/** Whether a key adds a character to a typeahead buffer. Space counts only mid-word. */
export function isTypeaheadKey(key: string, buffer: string): boolean {
  if (key === ' ') return buffer !== ''
  return [...key].length === 1
}

export interface TypeaheadBuffer {
  /** Appends `key` and returns the buffer; it empties `resetMs` after the last push. */
  push: (key: string) => string
  current: () => string
  clear: () => void
}

export function createTypeaheadBuffer(resetMs: number = TYPEAHEAD_RESET_MS): TypeaheadBuffer {
  let buffer = ''
  let timer: ReturnType<typeof setTimeout> | undefined
  const clear = () => {
    if (timer !== undefined) clearTimeout(timer)
    timer = undefined
    buffer = ''
  }
  const push = (key: string) => {
    if (timer !== undefined) clearTimeout(timer)
    buffer += key
    timer = setTimeout(clear, resetMs)
    return buffer
  }
  return { push, current: () => buffer, clear }
}
