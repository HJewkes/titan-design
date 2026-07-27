import type { Meta, StoryObj } from '@storybook/react-vite'
import { ArchiveFrame } from './ArchiveFrame'

/**
 * `Lab/Design Archive/Shell Specimens` — the S1 top-bar and S2 side-nav shell
 * specimens from the dashboard shell wave. Frozen HTML; S3 (session rail) already
 * lives as a React specimen under `components/shell/SessionRailSpecimen`.
 *
 * **Historical record, not current design.** These captures predate the titan
 * token system and carry their own inline CSS variables — not titan tokens, and
 * not the v0.10.0 surface ramp. Read the *reasoning*, not the values. See
 * `.storybook/lab-archive/README.md`.
 */
const meta: Meta<typeof ArchiveFrame> = {
  title: 'Lab/Design Archive/Shell Specimens',
  component: ArchiveFrame,
  parameters: { layout: 'fullscreen' },
}
export default meta

type Story = StoryObj<typeof ArchiveFrame>

const frame = (path: string, title: string): Story => ({
  name: title,
  args: { path, title },
})

export const S1TopBar = frame('shell/S1-topbar/specimen.html', 'S1 · Top Bar')
export const S2SideNav = frame('shell/S2-sidenav/specimen.html', 'S2 · Side Nav')
