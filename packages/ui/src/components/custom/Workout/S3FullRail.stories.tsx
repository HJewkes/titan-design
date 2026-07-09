/**
 * SHEET · Finalization — the full session rail next to the left nav (neumorphic).
 * Open item: depth tuning · 4-vs-8px strip height · indicator taxonomy. See DECISIONS-ExerciseRow doc.
 */
import type { Meta, StoryObj } from '@storybook/react-vite'
import { NavStub, Rail, Page, T_TERTIARY } from './setHeadingKit'

type Args = { stripHeight: number }
const meta: Meta<Args> = {
  title: 'Lab/Explorations/Full Rail',
  parameters: { layout: 'fullscreen' },
  argTypes: { stripHeight: { control: { type: 'range', min: 3, max: 14, step: 1 } } },
  args: { stripHeight: 8 },
}
export default meta
type Story = StoryObj<Args>

export const NextToNav: Story = {
  name: 'Full look · next to left nav',
  render: (args) => (
    <Page
      title="Session rail — full look next to left nav"
      note="Neumorphic: flat raised nav + heading plane (#1F1F1F); sunk inset exercise list (#131313), depth from the list's inset shadows only. Per-set segmented strip · active pulse · tempo language · no e1RM. Drag stripHeight. OPEN: 4 vs 8px · depth tuning · left-inset strength · indicator taxonomy."
    >
      <div style={{ display: 'flex', alignItems: 'stretch', width: 'fit-content' }}>
        <NavStub />
        <Rail stripH={args.stripHeight} />
        <div style={{ width: 140, background: '#161616', alignSelf: 'stretch', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 10, color: T_TERTIARY, fontFamily: 'monospace' }}>stage</span>
        </div>
      </div>
    </Page>
  ),
}
