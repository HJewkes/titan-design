// Shim for migration M8. Gauge lives in `ui/charts/gauge` now; this file keeps the old import
// path alive for one release. It imports the binding first and exports it with no `from`
// clause on purpose, so the deprecation tag does not mark the new definition
// (`eslint-rules/deprecated-export-registry.js`, lesson from migration M1, #276).
import { Gauge } from '../../ui/charts/gauge'
import type { GaugeProps, GaugeThreshold } from '../../ui/charts/gauge'

/**
 * @deprecated Moved to `ui/charts/gauge` (migration M8). Import from `@titan-design/react-ui` as
 * before, or from `@/components/ui/charts/gauge` by path. This re-export is removed in 0.23.0.
 */
export { Gauge }

/**
 * @deprecated Moved to `ui/charts/gauge` (migration M8). This re-export is removed in 0.23.0.
 */
export type { GaugeProps, GaugeThreshold }
