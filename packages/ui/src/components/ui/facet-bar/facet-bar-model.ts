export function uniqueOptions<O extends { value: string }>(options: ReadonlyArray<O>): O[] {
  const seen = new Set<string>()
  return options.filter((option) => {
    if (seen.has(option.value)) return false
    seen.add(option.value)
    return true
  })
}

type FacetMode = 'single' | 'multiple'

/** A value held under the other mode becomes the nearest value of this one. */
export function coerceToMode<T>(
  mode: FacetMode,
  value: ReadonlyArray<T> | T | null
): T[] | T | null {
  if (mode === 'single') {
    if (!Array.isArray(value)) return value as T | null
    return value.length > 0 ? (value[0] as T) : null
  }
  if (Array.isArray(value)) return [...value] as T[]
  return value === null ? [] : [value as T]
}

export function selectedSet<T>(
  mode: FacetMode,
  value: ReadonlyArray<T> | T | null
): ReadonlySet<T> {
  const coerced = coerceToMode(mode, value)
  if (mode === 'single') return coerced === null ? new Set<T>() : new Set<T>([coerced as T])
  return new Set<T>(coerced as T[])
}

/** Known values follow `order`; values with no option keep their order after them. */
export function toggleMultiple<T>(
  current: ReadonlyArray<T>,
  pressed: T,
  order: ReadonlyArray<T>
): T[] {
  const next = new Set<T>(current)
  if (next.has(pressed)) next.delete(pressed)
  else next.add(pressed)
  const known = order.filter((value, index) => next.has(value) && order.indexOf(value) === index)
  const knownSet = new Set<T>(known)
  const unknown = [...next].filter((value) => !knownSet.has(value))
  return [...known, ...unknown]
}

export function toggleSingle<T>(current: T | null, pressed: T): T | null {
  return current === pressed ? null : pressed
}
