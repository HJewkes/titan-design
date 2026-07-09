import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { SessionHeader } from './SessionHeader'

/**
 * `SessionHeader` — the session-rail heading chrome: an uppercase eyebrow (with an
 * optional live `StatusDot`) over the session title and a mono status sub-line,
 * rendered on the raised charcoal plane. Extracted from `SessionRail` so the header
 * is independently testable and reusable.
 */
const meta: Meta<typeof SessionHeader> = {
  title: 'Shell/SessionRail/SessionHeader',
  component: SessionHeader,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '**Molecule** (shell S3). The session-rail heading chrome — eyebrow + live dot ' +
          'over the title and mono status line, on the raised charcoal plane. Composes ' +
          '[StatusDot](?path=/docs/components-atoms-statusdot--docs). ' +
          'Used-by ↑ [SessionRail](?path=/docs/shell-sessionrail--docs).',
      },
    },
  },
  argTypes: {
    live: { control: 'boolean' },
  },
  decorators: [
    (Story) => (
      <View style={{ width: 246 }}>
        <Story />
      </View>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof SessionHeader>

export const Default: Story = {
  args: {
    title: 'Pull A · Intensification',
    status: 'ex 3/5 · set 2 live',
  },
}

export const Ended: Story = {
  args: {
    title: 'Pull A · Intensification',
    eyebrow: 'Session ended',
    live: false,
  },
  parameters: {
    docs: {
      description: { story: 'Ended session — custom eyebrow, no live dot, no status line.' },
    },
  },
}

export const TitleOnly: Story = {
  args: {
    title: 'Lower B',
  },
  parameters: {
    docs: {
      description: { story: 'No status sub-line — the header collapses to eyebrow + title.' },
    },
  },
}
