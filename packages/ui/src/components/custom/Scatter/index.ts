// Shim for migration M8. Scatter lives in `ui/charts/scatter` now; this file keeps the old import
// path alive for one release. It imports the binding first and exports it with no `from`
// clause on purpose, so the deprecation tag does not mark the new definition
// (`eslint-rules/deprecated-export-registry.js`, lesson from migration M1, #276).
import { Scatter } from '../../ui/charts/scatter'
import type { ScatterProps, ScatterDatum, ScatterAxis } from '../../ui/charts/scatter'

/**
 * @deprecated Moved to `ui/charts/scatter` (migration M8). Import from `@titan-design/react-ui` as
 * before, or from `@/components/ui/charts/scatter` by path. This re-export is removed in 0.23.0.
 */
export { Scatter }

/**
 * @deprecated Moved to `ui/charts/scatter` (migration M8). This re-export is removed in 0.23.0.
 */
export type { ScatterProps, ScatterDatum, ScatterAxis }
