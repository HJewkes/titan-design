/**
 * Selected chip faces whose label misses 4.5 in light mode. Chip.test.tsx asserts each
 * as a miss, so a token fix fails the suite until its entry is removed; FacetBar's
 * contrast rows skip the same entries.
 */
export const chipLightContrastExceptions: readonly string[] = ['primary', 'warning']
