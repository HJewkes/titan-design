import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'

import { Pill } from '../../ui/pill'
import { Surface } from '../../ui/surface'
import { Typography } from '../../ui/typography'
import { CheckinCard } from './coach-cards'
import { ChatCard } from './ChatCard'
import { CHECKIN } from './coach-thread-fixture'

const meta: Meta<typeof ChatCard> = {
  title: 'Custom/Chat/ChatCard',
  component: ChatCard,
  tags: ['autodocs', 'status:candidate', '!status:review'],
  parameters: {
    docs: {
      description: {
        component:
          '**Molecule.** A structured card a message carries in a `data-*` part: status line, ' +
          'title, subtitle, body, small print and up to three actions. The anatomy is fixed and ' +
          'the content is the caller’s; an app builds its own lockup as an instance. Composes ' +
          '[Card](?path=/docs/components-card--docs) + ' +
          '[Button](?path=/docs/components-button--docs) + ' +
          '[Typography](?path=/docs/foundations-typography--docs).',
      },
    },
  },
  args: {
    title: 'Plan change',
    subtitle: 'Thursday squat',
    footnote: 'Applies from this week',
    actions: [
      { key: 'accept', label: 'Accept', onPress: fn() },
      { key: 'decline', label: 'Decline', onPress: fn() },
    ],
  },
  decorators: [
    (Story) => (
      <Surface level="base" className="p-gutter-sm" style={{ width: 390 }}>
        <Story />
      </Surface>
    ),
  ],
}
export default meta

type Story = StoryObj<typeof ChatCard>

/** The bare anatomy with generic content. */
export const Default: Story = {
  args: {
    status: (
      <Pill tone="brand" leading="dot">
        Proposed
      </Pill>
    ),
    children: <Typography variant="body2">Add 2.5 kg to the top set.</Typography>,
  },
}

/** Instance 1: the coach app's check-in lockup, built from the same anatomy. */
export const Checkin: Story = {
  render: () => <CheckinCard checkin={CHECKIN} />,
}

/** Instance 2: no actions, so it reads as a record rather than a request. */
export const ReadOnly: Story = {
  args: {
    status: (
      <Pill tone="success" leading="dot">
        Logged
      </Pill>
    ),
    title: 'Bench session',
    subtitle: '4 sets, top set 0.52 m/s',
    footnote: 'Saved 08:14',
    actions: [],
    children: <Typography variant="body2">Speed fell 18% by the last rep.</Typography>,
  },
}
