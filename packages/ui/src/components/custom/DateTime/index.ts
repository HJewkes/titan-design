// Shim for migration M7. DateTime lives in `ui/date-time` now; this file keeps the old import
// path alive for one release. It imports the bindings first and exports them with no `from`
// clause on purpose, so the deprecation tag does not mark the new definition
// (`eslint-rules/deprecated-export-registry.js`, lesson from migration M1, #276).
import { DateTime, formatDateTime } from '../../ui/date-time'
import type { DateTimeFormat, DateTimeProps } from '../../ui/date-time'

/**
 * @deprecated Moved to `ui/date-time` (migration M7). Import from `@titan-design/react-ui` as
 * before, or from `@/components/ui/date-time` by path. This re-export is removed in 0.23.0.
 */
export { DateTime }

/**
 * @deprecated Moved to `ui/date-time` (migration M7). This re-export is removed in 0.23.0.
 */
export { formatDateTime }

/**
 * @deprecated Moved to `ui/date-time` (migration M7). This re-export is removed in 0.23.0.
 */
export type { DateTimeFormat, DateTimeProps }
