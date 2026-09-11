import type { Meta, StoryObj } from '@storybook/react-vite'
import { useArgs } from 'storybook/preview-api'
import { View } from 'react-native'
import { SideNav } from './SideNav'
import { Typography } from '../custom/Typography'
import { Surface } from '../ui/surface'
import { BotIcon, BrainIcon, LayersIcon } from '../icons'
import { workoutNavItems } from './workout'
import { brandPresets } from './brands'

const meta: Meta<typeof SideNav> = {
  title: 'Shell/SideNav',
  component: SideNav,
  tags: ['autodocs', 'status:candidate', '!status:review'],
  args: { items: workoutNavItems, activeKey: 'live', liveKey: null },
  argTypes: {
    activeKey: { control: 'select', options: ['live', 'review', 'program', 'body'] },
    liveKey: { control: 'select', options: [null, 'live', 'review', 'program', 'body'] },
    items: { control: false },
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
      <Surface level="base" className="min-h-screen flex-row">
        <Story />
        <View className="flex-1 items-center justify-center">
          <Typography variant="body2" color="tertiary">
            main viewport
          </Typography>
        </View>
      </Surface>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '**Organism** (shell region). The persistent 60px left rail that switches the main viewport ' +
          "between an app's categories. Composes [NavItem](?path=/docs/shell-navitem--docs) × `items` + the " +
          'shared [icon set](?path=/docs/foundations-icons--docs). It has no built-in categories: `items` is ' +
          'required, and each app supplies its own (the workout set is `workoutNavItems`). ' +
          'Presentational — drive it with `activeKey` / ' +
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

/** A different app's categories and accent in the same rail (AW-132). */
export const AnotherApp: Story = {
  args: {
    items: [
      { key: 'notes', label: 'Notes', icon: <LayersIcon size={20} color="currentColor" /> },
      { key: 'graph', label: 'Graph', icon: <BrainIcon size={20} color="currentColor" /> },
      { key: 'agents', label: 'Agents', icon: <BotIcon size={20} color="currentColor" /> },
    ],
    activeKey: 'graph',
    accentClassName: brandPresets.brain.accentClassName,
    accentBarClassName: brandPresets.brain.accentBarClassName,
  },
  parameters: {
    docs: {
      description: {
        story:
          "The brain app's three categories in its own accent. Same rail, same states, different " +
          '`items` and accent. `AppShell` passes the accent down from its `brand`; drive the bare ' +
          'rail with `accentClassName` / `accentBarClassName`.',
      },
    },
  },
}
