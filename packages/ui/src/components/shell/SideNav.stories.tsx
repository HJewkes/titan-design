import type { Meta, StoryObj } from '@storybook/react-vite'
import { useArgs } from 'storybook/preview-api'
import { View } from 'react-native'
import { SideNav } from './SideNav'
import { Typography } from '../custom/Typography'

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
  // Interactive AND Controls-synced: clicking a category writes `activeKey` back to the
  // story args (canvas + Controls stay in lock-step) and still fires the `onNavigate`
  // action. `useArgs` must be called directly in the story/render fn (not a child
  // component), so the rules-of-hooks lint is disabled here — the idiomatic SB pattern.
  render: (args) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [, updateArgs] = useArgs()
    return (
      <SideNav
        {...args}
        onNavigate={(key) => {
          updateArgs({ activeKey: key })
          args.onNavigate?.(key)
        }}
      />
    )
  },
  // Render in-context: full-height shell frame so the rail snaps to the left edge and
  // stretches with the viewport (resize the canvas height to see it hold).
  decorators: [
    (Story) => (
      <View className="min-h-screen flex-row bg-background-default">
        <Story />
        <View className="flex-1 items-center justify-center">
          <Typography variant="body2" color="tertiary">
            main viewport
          </Typography>
        </View>
      </View>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '**Organism** (shell region). The persistent 60px left rail switching Live · Review · Plan · ' +
          'Body. Composes [NavItem](?path=/docs/shell-navitem--docs) × the four categories + the ' +
          'shared [icon set](?path=/docs/foundations-icons--docs). Presentational — drive it with `activeKey` / ' +
          '`onNavigate` / `liveKey`. Active = left accent bar; `liveKey` (when not active) tints that ' +
          'label a muted green.\n\n' +
          '**Try it:** stories render in a full-height shell frame — the rail pins to the left edge and ' +
          'stretches to the viewport, items staying top-aligned. **Resize the canvas** to see it hold at ' +
          'any height. Use the **Controls** to move `activeKey` / `liveKey`.',
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
          'A set runs on Live while the operator is on Plan → the Live item carries a quiet green label cue. ' +
          '(Still clickable — try switching away and back.)',
      },
    },
  },
}
