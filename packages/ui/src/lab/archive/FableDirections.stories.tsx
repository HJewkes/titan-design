import type { Meta, StoryObj } from '@storybook/react-vite'
import { ArchiveFrame } from './ArchiveFrame'

/**
 * `Lab/Design Archive/Fable Directions` — the four parallel drill-down directions
 * explored in the fable pass (A stage-rail, B expand-canvas, C miller-columns,
 * D glance-overlay), the R2 synthesis that converged them, and the body-part
 * navigation pass. Frozen HTML captures; the R2 rail was later ported to titan
 * (see `components/shell/SessionRailSpecimen`).
 *
 * **Historical record, not current design.** These captures predate the titan
 * token system and carry their own inline CSS variables — not titan tokens, and
 * not the v0.10.0 surface ramp. Read the *reasoning* (each direction's brief and
 * its tradeoffs), not the values. See `.storybook/lab-archive/README.md`.
 */
const meta: Meta<typeof ArchiveFrame> = {
  title: 'Lab/Design Archive/Fable Directions',
  component: ArchiveFrame,
  parameters: { layout: 'fullscreen' },
}
export default meta

type Story = StoryObj<typeof ArchiveFrame>

const frame = (path: string, title: string): Story => ({
  name: title,
  args: { path, title },
})

export const Index = frame('drilldown-pass/index.html', 'Overview — Drilldown Pass')
export const AStageRail = frame('drilldown-pass/a-stage-rail/gallery.html', 'A · Stage Rail')
export const BExpandCanvas = frame(
  'drilldown-pass/b-expand-canvas/gallery.html',
  'B · Expand Canvas'
)
export const CMillerColumns = frame(
  'drilldown-pass/c-miller-columns/gallery.html',
  'C · Miller Columns'
)
export const DGlanceOverlay = frame(
  'drilldown-pass/d-glance-overlay/gallery.html',
  'D · Glance Overlay'
)
export const R2Synthesis = frame('drilldown-pass/r2-synthesis/gallery.html', 'R2 Synthesis')
export const BodyPartPass = frame('drilldown-pass/body-part-pass/options.html', 'Body-Part Pass')
