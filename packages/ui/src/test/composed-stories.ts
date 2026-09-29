/// <reference types="vite/client" />
import type { ComponentType } from 'react'
import { composeStories } from '@storybook/react'

type StoryModule = Parameters<typeof composeStories>[0]

export interface ComposedStoryEntry {
  /** Story file relative to `src/components/`, for test labels. */
  file: string
  name: string
  id: string
  Story: ComponentType
}

// Lazy, so a caller that needs part of the tree imports only those modules.
const storyModules = import.meta.glob<StoryModule>('../components/**/*.stories.tsx')

// VolumeStatusPalette › Compare mounts every palette at once and takes 5-6 s on a CI runner.
export const SLOW_STORY_TIMEOUT = 30_000
const SLOW_STORY_IDS = new Set(['lab-decisions-volume-status-palette--compare'])

export function storyTimeout(id: string): number | undefined {
  return SLOW_STORY_IDS.has(id) ? SLOW_STORY_TIMEOUT : undefined
}

export function storyModuleCount(): number {
  return Object.keys(storyModules).length
}

/** Stories under `src/components/` whose file passes `include`, composed without project annotations. */
export async function loadComposedStories(
  include: (file: string) => boolean = () => true
): Promise<ComposedStoryEntry[]> {
  const files = Object.keys(storyModules).filter((path) => include(toFile(path)))
  const modules = await Promise.all(files.map((path) => storyModules[path]()))
  return modules.flatMap((mod, index) => {
    const composed: Record<string, ComponentType & { id: string }> = composeStories(mod)
    return Object.entries(composed).map(([name, Story]) => ({
      file: toFile(files[index]),
      name,
      id: Story.id,
      Story,
    }))
  })
}

function toFile(path: string): string {
  return path.replace('../components/', '')
}
