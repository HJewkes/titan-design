import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'
import { spacingCSSVars } from '../theme/tokens/spacing-vars'

/**
 * tailwind-merge only collapses conflicting classes it recognises, and it
 * recognises a spacing value by matching it against the theme scale it was
 * configured with. `px-squish-x-md` is not a length, so out of the box it read
 * as an unknown class and survived beside `px-squish-x-sm` — both rules then
 * reached the DOM at equal specificity and stylesheet order picked the winner.
 * Badge rendered all three sizes at 8px that way (AW-142 wave two).
 *
 * The key names are DERIVED from `spacingCSSVars`, which `semantic.ts` is the
 * sole source of. `tailwind.config.js` cannot do the same — it is CJS and
 * cannot import a TypeScript module, so it hand-repeats the key list at
 * `tailwind.config.js:23-54` and `global.css` hand-repeats the values. Those
 * two copies are held to `semantic.ts` by `spacing-tokens.test.ts`, not by the
 * language. This file is the one consumer that reads the source directly.
 *
 * Heights need their own group: v2's `h` / `min-h` groups validate lengths
 * directly instead of reading `theme.spacing`.
 */
const nameOf = (prefix: string) =>
  Object.keys(spacingCSSVars)
    .filter((property) => property.startsWith(prefix))
    .map((property) => property.slice(prefix.length))

const spacingKeys = nameOf('--space-')
const controlHeightKeys = nameOf('--size-control-').map((level) => `control-${level}`)

const twMerge = extendTailwindMerge({
  extend: {
    theme: { spacing: spacingKeys, padding: spacingKeys, margin: spacingKeys, gap: spacingKeys },
    classGroups: { h: [{ h: controlHeightKeys }], 'min-h': [{ 'min-h': controlHeightKeys }] },
  },
})

/**
 * Utility function to merge Tailwind CSS classes with proper conflict resolution.
 * Combines clsx for conditional classes with tailwind-merge for deduplication.
 *
 * @example
 * cn('p-4 bg-red-500', isActive && 'bg-blue-500', className)
 * // If isActive is true, returns 'p-4 bg-blue-500' (not 'p-4 bg-red-500 bg-blue-500')
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
