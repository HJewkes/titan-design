/** A pin's id is its frame's key and its number: `${key}-${n}`. */
export function pinId(key: string, n: number): string {
  return `${key}-${n}`
}

/** The number a pin is shown by; 0 for an id that does not end in one. */
export function pinNumber(id: string): number {
  return Number(id.split('-').pop()) || 0
}
