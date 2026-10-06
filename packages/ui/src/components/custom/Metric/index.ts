// Shim for migration M6. Metric lives in `ui/metric` now; this file keeps the old import path
// alive for one release. It imports the bindings first and exports them with no `from` clause on
// purpose, so the deprecation tag does not mark the new definition
// (`eslint-rules/deprecated-export-registry.js`, lesson from migration M1, #276).
import { Metric, MetricGroup } from '../../ui/metric'
import type { MetricGroupProps, MetricProps, MetricTrend } from '../../ui/metric'

/**
 * @deprecated Moved to `ui/metric` (migration M6). Import from `@titan-design/react-ui` as
 * before, or from `@/components/ui/metric` by path. This re-export is removed in 0.23.0.
 */
export { Metric }

/**
 * @deprecated Moved to `ui/metric` (migration M6). This re-export is removed in 0.23.0.
 */
export { MetricGroup }

/**
 * @deprecated Moved to `ui/metric` (migration M6). This re-export is removed in 0.23.0.
 */
export type { MetricGroupProps, MetricProps, MetricTrend }
