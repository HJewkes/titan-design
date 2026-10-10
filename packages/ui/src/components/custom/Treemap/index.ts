// Shim for migration M8. Treemap lives in `ui/charts/treemap` now; this file keeps the old import
// path alive for one release. It imports the binding first and exports it with no `from`
// clause on purpose, so the deprecation tag does not mark the new definition
// (`eslint-rules/deprecated-export-registry.js`, lesson from migration M1, #276).
import { Treemap } from '../../ui/charts/treemap'
import type { TreemapProps, TreemapDatum, TreemapScale } from '../../ui/charts/treemap'

/**
 * @deprecated Moved to `ui/charts/treemap` (migration M8). Import from `@titan-design/react-ui` as
 * before, or from `@/components/ui/charts/treemap` by path. This re-export is removed in 0.23.0.
 */
export { Treemap }

/**
 * @deprecated Moved to `ui/charts/treemap` (migration M8). This re-export is removed in 0.23.0.
 */
export type { TreemapProps, TreemapDatum, TreemapScale }
