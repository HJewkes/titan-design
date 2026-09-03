import type { Meta, StoryObj } from '@storybook/react-vite'
import { ArchiveFrame } from './ArchiveFrame'

/**
 * `Lab/Design Archive/Screen Prototypes` — the latest capture of each full-screen
 * prototype from `voltras/docs/prototypes` (older `versions/` iterations dropped),
 * plus the built R2 dashboard SPA. Frozen HTML; the SPA is its static bundle,
 * iframed as-is.
 *
 * **Historical record, not current design.** These captures predate the titan
 * token system and carry their own inline CSS variables — not titan tokens, and
 * not the v0.10.0 surface ramp. Read the *reasoning*, not the values. See
 * `.storybook/lab-archive/README.md`.
 */
const meta: Meta<typeof ArchiveFrame> = {
  title: 'Lab/Design Archive/Screen Prototypes',
  component: ArchiveFrame,
  parameters: { layout: 'fullscreen' },
}
export default meta

type Story = StoryObj<typeof ArchiveFrame>

const frame = (path: string, title: string): Story => ({
  name: title,
  args: { path, title },
})

export const ActiveWorkout = frame('prototypes/active-workout.html', 'Active Workout')
export const ExerciseDetail = frame('prototypes/exercise-detail.html', 'Exercise Detail')
export const ProgramPlanning = frame('prototypes/program-planning.html', 'Program Planning')
export const TrainingStatus = frame('prototypes/training-status.html', 'Training Status')
export const AnalyticsHeatmap = frame('prototypes/analytics-heatmap.html', 'Analytics Heatmap')
export const PrePostWorkout = frame('prototypes/pre-post-workout.html', 'Pre / Post Workout')
export const ComponentDemo = frame('prototypes/component-demo.html', 'Component Demo')
export const BodyMapHybrid = frame('prototypes/body-map-hybrid.html', 'Body Map (Hybrid)')
export const R2DashboardSpa = frame('r2-spa/index.html', 'R2 Dashboard (SPA)')
