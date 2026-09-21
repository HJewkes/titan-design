// Shim for migration M3. The component lives in `ui/empty-state` now; this file
// keeps the old import path alive for one release. The re-exports below import
// the bindings first and export them with no `from` clause on purpose:
// `eslint-rules/deprecated-export-registry.js` unifies a re-export identity only
// when the statement carries a source, so `export { X } from '…'` would mark the
// NEW definition deprecated too (lesson from migration M1, #276).
import { EmptyState } from '../../ui/empty-state'
import type { EmptyStateProps } from '../../ui/empty-state'

/**
 * @deprecated Moved to `ui/empty-state` (migration M3). Import from
 * `@titan-design/react-ui` as before, or from `@/components/ui/empty-state` by path.
 * This re-export is removed in 0.23.0.
 */
export { EmptyState }

/**
 * @deprecated Moved to `ui/empty-state` (migration M3). Import this type from
 * `@titan-design/react-ui` as before, or from `@/components/ui/empty-state` by path.
 * This re-export is removed in 0.23.0.
 */
export type { EmptyStateProps }
