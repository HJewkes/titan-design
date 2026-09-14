/**
 * Spacing + sizing custom properties (AW-142).
 *
 * Flattens the nested `space` / `size` objects into the flat `--space-*` /
 * `--size-*` names that `global.css` declares and `tailwind.config.js`
 * references. One derivation, so the numbers exist only in `semantic.ts`:
 * `config.completeness.test.ts` then holds `global.css` to these values, and
 * `spacing-tokens.test.ts` holds the Tailwind theme to the same names.
 *
 * Spacing is theme-independent, so a single `:root` block covers both modes.
 */

import { toSpacingValue } from './primitives'
import { space, size } from './semantic'

type NestedNumbers = { [key: string]: number | NestedNumbers }

/** Depth-first walk emitting `<prefix>-<path>-<joined>` keys for every leaf. */
function flatten(prefix: string, node: NestedNumbers): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [key, value] of Object.entries(node)) {
    const name = `${prefix}-${key}`
    if (typeof value === 'number') {
      out[name] = toSpacingValue(value)
    } else {
      Object.assign(out, flatten(name, value))
    }
  }
  return out
}

/** `{ '--space-inset-md': '12px', '--size-control-md': '40px', … }` */
export const spacingCSSVars: Readonly<Record<string, string>> = Object.freeze({
  ...flatten('--space', space),
  ...flatten('--size', size),
})

/** The Tailwind-facing name for a spacing key, e.g. `inset-md` → `--space-inset-md`. */
export function spacingVar(key: string): string {
  return `var(--space-${key})`
}

/** The Tailwind-facing name for a sizing key, e.g. `control-md` → `--size-control-md`. */
export function sizingVar(key: string): string {
  return `var(--size-${key})`
}
