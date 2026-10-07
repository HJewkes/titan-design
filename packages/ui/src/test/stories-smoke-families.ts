/**
 * The smoke test is split into one file per story family so the workers share the load
 * (TD-732). A story file belongs to exactly one family; `stories-smoke-ui.test.tsx` asserts the
 * partition covers every `src/components/` story file.
 */
export type StoryFamily = 'ui' | 'workout' | 'custom'

export function storyFamily(file: string): StoryFamily {
  if (file.startsWith('custom/Workout/')) return 'workout'
  if (file.startsWith('custom/')) return 'custom'
  return 'ui'
}

export const includeFamily = (family: StoryFamily) => (file: string) => storyFamily(file) === family
