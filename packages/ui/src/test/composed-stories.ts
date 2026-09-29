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

const storyModules = import.meta.glob<StoryModule>('../components/**/*.stories.tsx', {
  eager: true,
})

// VolumeStatusPalette › Compare mounts every palette at once and takes 5-6 s on a CI runner.
export const SLOW_STORY_TIMEOUT = 30_000
const SLOW_STORY_IDS = new Set(['lab-decisions-volume-status-palette--compare'])

export function storyTimeout(id: string): number | undefined {
  return SLOW_STORY_IDS.has(id) ? SLOW_STORY_TIMEOUT : undefined
}

export function storyModuleCount(): number {
  return Object.keys(storyModules).length
}

/** Every story under `src/components/`, composed without project annotations. */
export function composedStories(): ComposedStoryEntry[] {
  return Object.entries(storyModules).flatMap(([path, mod]) => {
    const file = path.replace('../components/', '')
    const composed: Record<string, ComponentType & { id: string }> = composeStories(mod)
    return Object.entries(composed).map(([name, Story]) => ({ file, name, id: Story.id, Story }))
  })
}
