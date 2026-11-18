/**
 * The one list of which stories carry a committed Layer-2 visual baseline.
 * `tests/visual/stories.spec.ts` declares a test per baselined story and
 * `visual-coverage.ts` checks the snapshot directory against the same list.
 * Widen it here as baselines are seeded. This file has no imports so Playwright
 * and Vitest can both load it.
 */
export const BASELINE_PREFIXES = [
  'shell-',
  'foundations-icons--',
  'custom-workout-mesoprogressbar--',
  'custom-workout-dataviz-velocitystrip',
  'custom-workout-dataviz-dualvelocitystrip--',
  'custom-workout-mesocard--',
  'custom-workout-segmentedbar--',
  'custom-workout-dataviz-goaltrajectorychart--',
  'custom-workout-dataviz-strengthtrendchart--',
  'pages-active-workout--',
  'pages-exercise-detail--',
  'pages-program-planning--',
  'pages-training-status--',
  'custom-activework-',
  'components-molecules-mediathumb--',
  'components-atoms-mediathumbbadge--',
] as const

// The owner-locked Chat design (VW-393), listed by id so the interactive stories stay out.
export const BASELINE_IDS = [
  'custom-chat-coachpreset--phone',
  'custom-chat-coachpreset--wall-drawer',
  'custom-chat-messagelist--direct',
  'custom-chat-messagelist--group',
  'custom-chat-messagelist--endorsed',
  'custom-chat-messagelist--revealed-times',
  'custom-chat-messagelist--windowed',
  'custom-chat-composer--typed',
] as const

export interface ExcludedPrefix {
  readonly prefix: string
  readonly reason: string
}

/** Prefixes carved out of `BASELINE_PREFIXES`, each with the reason it has no baseline. */
export const EXCLUDED_PREFIXES: readonly ExcludedPrefix[] = []

export interface VisualScope {
  readonly prefixes: readonly string[]
  readonly ids: readonly string[]
  readonly excluded: readonly ExcludedPrefix[]
}

export const VISUAL_SCOPE: VisualScope = {
  prefixes: BASELINE_PREFIXES,
  ids: BASELINE_IDS,
  excluded: EXCLUDED_PREFIXES,
}

/** Whether a story id must have a committed baseline; an excluded prefix wins over a baselined one. */
export function isBaselined(id: string, scope: VisualScope = VISUAL_SCOPE): boolean {
  if (scope.excluded.some(({ prefix }) => id.startsWith(prefix))) return false
  return scope.ids.includes(id) || scope.prefixes.some((prefix) => id.startsWith(prefix))
}
