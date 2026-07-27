import type { Meta, StoryObj } from '@storybook/react-vite'
import { ArchiveFrame } from './ArchiveFrame'

/**
 * `Lab/Design Archive/Feature Explorations` — round-1 feature galleries (live
 * fatigue autoreg, live tempo feedback, load-velocity profile, rep quality / RPE,
 * session debrief, session velocity timeline) plus the round-2 load-velocity
 * follow-up. Frozen HTML captures from the pre-titan exploration phase.
 *
 * **Historical record, not current design.** These captures predate the titan
 * token system and carry their own inline CSS variables — not titan tokens, and
 * not the v0.10.0 surface ramp. Read the *reasoning*, not the values. See
 * `.storybook/lab-archive/README.md`.
 */
const meta: Meta<typeof ArchiveFrame> = {
  title: 'Lab/Design Archive/Feature Explorations',
  component: ArchiveFrame,
  parameters: { layout: 'fullscreen' },
}
export default meta

type Story = StoryObj<typeof ArchiveFrame>

const frame = (path: string, title: string): Story => ({
  name: title,
  args: { path, title },
})

export const Index = frame('round1/index.html', 'Overview — Round 1')
export const LiveFatigueAutoreg = frame(
  'round1/live-fatigue-autoreg/gallery.html',
  'Live Fatigue Autoreg'
)
export const LiveTempoFeedback = frame(
  'round1/live-tempo-feedback/gallery.html',
  'Live Tempo Feedback'
)
export const LoadVelocityProfileR1 = frame(
  'round1/load-velocity-profile/gallery.html',
  'Load-Velocity Profile (R1)'
)
export const RepQualityRpe = frame('round1/rep-quality-rpe/gallery.html', 'Rep Quality / RPE')
export const SessionDebrief = frame('round1/session-debrief/gallery.html', 'Session Debrief')
export const SessionVelocityTimeline = frame(
  'round1/session-velocity-timeline/gallery.html',
  'Session Velocity Timeline'
)
export const LoadVelocityProfileR2 = frame(
  'round2/load-velocity-profile/gallery.html',
  'Load-Velocity Profile (R2)'
)
