import { vi } from 'vitest'

/** Stubs `matchMedia` so `usePrefersReducedMotion` reads `reduced`; undo with `vi.unstubAllGlobals()`. */
export function stubReducedMotion(reduced: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: reduced,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }))
}
