import type { Meta, StoryObj } from '@storybook/react-vite'
import { Card } from '../../ui/card'
import { Surface } from '../../ui/surface'
import { OpenLoops } from './OpenLoops'
import { sessionLinkers } from './session-linkers'
import { INITIATIVE_LOOPS_FIXTURE, INITIATIVE_NOW } from './initiative-fixture'

/**
 * **OpenLoops** — the initiative's hanging threads from the session ledger,
 * each with its kind, age and auto-linked text. The durable current state a
 * session picks up.
 *
 * Composes `Eyebrow` · `Pill` · `Divider` · `MarkdownProse`.
 */
const meta: Meta<typeof OpenLoops> = {
  title: 'Custom/ActiveWork/OpenLoops',
  component: OpenLoops,
  tags: ['autodocs', 'status:candidate', '!status:review'],
  args: {
    loops: INITIATIVE_LOOPS_FIXTURE,
    now: INITIATIVE_NOW,
    linkers: sessionLinkers(),
  },
  argTypes: {
    loops: { table: { disable: true } },
    now: { table: { disable: true } },
    linkers: { table: { disable: true } },
  },
  decorators: [
    (Story) => (
      <Surface level="base" className="min-h-screen w-full max-w-[620px] p-6" testID="page-surface">
        <Card className="gap-1 p-4">
          <Story />
        </Card>
      </Surface>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Composes **Eyebrow** · **Pill** · **Divider** · **MarkdownProse**. Used-by ↑ the Initiative Reader composition.',
      },
    },
  },
}
export default meta

type Story = StoryObj<typeof OpenLoops>

/** Five loops of mixed kind. */
export const Default: Story = {}

/** No open loops: the empty state. */
export const Empty: Story = {
  args: { loops: [] },
}
