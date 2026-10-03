// Shim for migration M6. FilePathLabel lives in `ui/file-path-label` now; this file keeps the
// old import path alive for one release. It imports the bindings first and exports them with no
// `from` clause on purpose, so the deprecation tag does not mark the new definition
// (`eslint-rules/deprecated-export-registry.js`, lesson from migration M1, #276).
import { FilePathLabel, splitPath } from '../../ui/file-path-label'
import type { FilePathLabelProps, FilePathLabelSize } from '../../ui/file-path-label'

/**
 * @deprecated Moved to `ui/file-path-label` (migration M6). Import from
 * `@titan-design/react-ui` as before, or from `@/components/ui/file-path-label` by path.
 * This re-export is removed in 0.23.0.
 */
export { FilePathLabel }

/**
 * @deprecated Moved to `ui/file-path-label` (migration M6). This re-export is removed in 0.23.0.
 */
export { splitPath }

/**
 * @deprecated Moved to `ui/file-path-label` (migration M6). This re-export is removed in 0.23.0.
 */
export type { FilePathLabelProps, FilePathLabelSize }
