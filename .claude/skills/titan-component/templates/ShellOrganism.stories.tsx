// TEMPLATE: story for a shell or layout organism (side nav, rail, pinned strip) whose active key
// is controlled. Copy next to the component, rename Organism, delete this header.
// It shows two things Component.stories.tsx does not:
//   1. An in-context frame: `layout: 'fullscreen'` and a full-height decorator, so the region
//      pins to its edge and stretches with the viewport instead of floating centered.
//   2. Controls sync: the callback writes back to the story args with `useArgs`, so canvas
//      clicks and the Controls panel stay together. `useArgs` must be called directly in a
//      named `render` function, never in a child component.
// For a display-only region, drop `render` and keep the decorator.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useArgs } from 'storybook/preview-api'
import { View } from 'react-native'
import { Organism } from './Organism'
import { Typography } from '../ui/typography'

const meta: Meta<typeof Organism> = {
  title: 'Shell/Organism',
  component: Organism,
  tags: ['autodocs', 'status:candidate', '!status:review'],
  args: { activeKey: 'first' },
  argTypes: {
    activeKey: { control: 'select', options: ['first', 'second', 'third'] },
    onActiveKeyChange: { action: 'activeKeyChange', control: false },
  },
  render: function Render(args) {
    const [, updateArgs] = useArgs()
    return (
      <Organism
        {...args}
        onActiveKeyChange={(key) => {
          updateArgs({ activeKey: key })
          args.onActiveKeyChange?.(key)
        }}
      />
    )
  },
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
          '**Organism** (shell region). Composes ' +
          '[NavItem](?path=/docs/shell-navitem--docs) and ' +
          '[Typography](?path=/docs/foundations-typography--docs). ' +
          'Drive it with `activeKey`; click an item and the Controls panel follows.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof Organism>

export const Default: Story = {}
