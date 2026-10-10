/** `pluralize(1, 'file', 'files')` is "1 file"; every other count, including 0, takes `many`. */
export function pluralize(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`
}
