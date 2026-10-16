// Shim for migration M5. SparkBars lives in `ui/charts/spark-bars` now; this file keeps the
// old import path alive for one release. It imports the binding first and exports it with no
// `from` clause on purpose, so the deprecation tag does not mark the new definition
// (`eslint-rules/deprecated-export-registry.js`, lesson from migration M1, #276).
import { SparkBars } from '../../ui/charts/spark-bars'
import type { SparkBarsProps } from '../../ui/charts/spark-bars'

/**
 * @deprecated Moved to `ui/charts/spark-bars` (migration M5). Import from
 * `@titan-design/react-ui` as before, or from `@/components/ui/charts/spark-bars` by path.
 * This re-export is removed in 0.23.0.
 */
export { SparkBars }

/**
 * @deprecated Moved to `ui/charts/spark-bars` (migration M5). This re-export is removed in 0.23.0.
 */
export type { SparkBarsProps }
