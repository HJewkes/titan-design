import type { Meta, StoryObj } from '@storybook/react-vite'
import { type ComponentProps, useState } from 'react'
import { SideNav } from './SideNav'

const meta: Meta<typeof SideNav> = {
  title: 'Shell/SideNav',
  component: SideNav,
  tags: ['autodocs'],
  args: { activeKey: 'live', liveKey: null },
  argTypes: {
    activeKey: { control: 'select', options: ['live', 'review', 'program', 'body'] },
    liveKey: { control: 'select', options: [null, 'live', 'review', 'program', 'body'] },
    onNavigate: { action: 'navigate' },
  },
  parameters: {
    docs: {
      description: {
        component:
          '**Organism** (shell region). The persistent 60px left rail switching Live · Review · Program · ' +
          'Body. Composes [NavItem](?path=/docs/shell-sidenav-navitem--docs) × the four categories + the ' +
          'shared [icon set](?path=/docs/icons--docs). Presentational — drive it with `activeKey` / ' +
          '`onNavigate` / `liveKey`. Active = left accent bar; `liveKey` (when not active) tints that ' +
          'label a muted green.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof SideNav>

export const Default: Story = {}

export const LiveElsewhere: Story = {
  args: { activeKey: 'program', liveKey: 'live' },
  parameters: {
    docs: {
      description: {
        story:
          'A set runs on Live while the operator is on Program → the Live item carries a quiet green label cue.',
      },
    },
  },
}

function InteractiveSideNav(args: ComponentProps<typeof SideNav>) {
  const [active, setActive] = useState('live')
  return <SideNav {...args} activeKey={active} onNavigate={setActive} />
}

export const Interactive: Story = {
  render: (args) => <InteractiveSideNav {...args} />,
  parameters: {
    docs: { description: { story: 'Click a category — the active state follows `onNavigate`.' } },
  },
}
