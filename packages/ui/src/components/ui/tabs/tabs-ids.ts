export const tabId = (baseId: string, index: number) => `${baseId}-tab-${index}`
export const panelId = (baseId: string, index: number) => `${baseId}-panel-${index}`

/** The next enabled tab from `from`, stepping by `step` and wrapping; `from` when none is enabled. */
export function nextEnabledIndex(enabled: boolean[], from: number, step: 1 | -1): number {
  const count = enabled.length
  for (let i = 1; i <= count; i++) {
    const candidate = (from + step * i + count * i) % count
    if (enabled[candidate]) return candidate
  }
  return from
}
