export function uniqueOptions<O extends { value: string }>(options: ReadonlyArray<O>): O[] {
  const seen = new Set<string>()
  return options.filter((option) => {
    if (seen.has(option.value)) return false
    seen.add(option.value)
    return true
  })
}

export function selectedSet<T>(
  mode: 'single' | 'multiple',
  value: ReadonlyArray<T> | T | null
): ReadonlySet<T> {
  if (mode === 'single') return value === null ? new Set<T>() : new Set<T>([value as T])
  return new Set<T>(value as ReadonlyArray<T>)
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
