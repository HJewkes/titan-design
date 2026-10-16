/** Code-unit order, not locale order: every layout breaks ties with it so output never varies by environment. */
export const compareText = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0)
