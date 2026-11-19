/**
 * How many entries of an ascending array are at or before `target`, by binary search. Duplicates
 * all count. A `NaN` target counts none.
 */
export function countAtOrBefore(ascending: readonly number[], target: number): number {
  let low = 0
  let high = ascending.length
  while (low < high) {
    const mid = (low + high) >>> 1
    if (ascending[mid]! <= target) low = mid + 1
    else high = mid
  }
  return low
}
