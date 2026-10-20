// Frames a story on the canvas the app shows it on (TD-967, TD-970).
//
// Opt-in is `parameters.canvas`: `'page'` puts the story on the `base` plane inside the real
// `Page` gutter; `'panel'` also puts it in a raised panel on that page. A story that adopts a
// canvas also sets `layout: 'fullscreen'`, or the page renders as a centred island. Width-matrix
// stories are left alone: their frames each render the story, and `Page` is a `main` landmark.
//
// Registered before `withSurfaceTheme` in preview.tsx, so the toolbar theme's SurfaceContext
// wraps the canvas and its plane follows light mode.
import type { Decorator } from '@storybook/react-vite'
import { StoryPage, StoryPanel } from '../src/lab/story-canvas'
import { WIDTH_MATRIX_TAG } from './withWidthMatrix'

export const STORY_CANVAS_KINDS = ['page', 'panel'] as const
export type StoryCanvasKind = (typeof STORY_CANVAS_KINDS)[number]

export interface StoryCanvasParameters {
  canvas?: StoryCanvasKind
}

export function storyCanvasKind(
  parameters: Record<string, unknown>,
  tags: readonly string[] = []
): StoryCanvasKind | undefined {
  if (tags.includes(WIDTH_MATRIX_TAG)) return undefined
  const { canvas } = parameters as StoryCanvasParameters
  return STORY_CANVAS_KINDS.find((kind) => kind === canvas)
}

export const withStoryCanvas: Decorator = (Story, context) => {
  const kind = storyCanvasKind(context.parameters, context.tags)
  if (kind === 'page') {
    return (
      <StoryPage>
        <Story />
      </StoryPage>
    )
  }
  if (kind === 'panel') {
    return (
      <StoryPage>
        <StoryPanel>
          <Story />
        </StoryPanel>
      </StoryPage>
    )
  }
  return <Story />
}
