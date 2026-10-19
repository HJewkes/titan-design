// Subpath entry: @titan-design/react-ui/visual-router
//
// The visual router (TP-3597): the semantic patterns, the 45-type catalogue with honest build
// status, and `routeVisual`. Data plus one pure function, so the entry carries no React.
// `docs/visual-router.md` is its generated digest (`pnpm visual-router:digest`).
export type * from './visual/router/types'
export { PATTERNS, PATTERN_BY_ID } from './visual/router/patterns'
export { CATALOGUE, TYPE_BY_ID } from './visual/router/catalogue'
export { routeVisual, type RouteRequest, type RouteResult } from './visual/router/route'
