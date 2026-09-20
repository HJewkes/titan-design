// Shim for migration M2. `Eyebrow` lives in `ui/eyebrow` now; this file keeps the
// old import path alive for one release. The re-exports import the bindings first
// and export them with no `from` clause on purpose: `deprecated-export-registry.js`
// unifies a re-export identity only when the statement carries a source, so
// `export { X } from '…'` would mark the NEW definition deprecated too (M1, #276).
import { Eyebrow } from '../../ui/eyebrow'
import type { EyebrowProps } from '../../ui/eyebrow'

/**
 * @deprecated Moved to `ui/eyebrow` (migration M2); it was never active-work-specific.
 * Import from `@titan-design/react-ui` as before, or from `@/components/ui/eyebrow` by
 * path. This re-export is removed in 0.23.0.
 */
export { Eyebrow }

/**
 * @deprecated Moved to `ui/eyebrow` (migration M2). This re-export is removed in 0.23.0.
 */
export type { EyebrowProps }
