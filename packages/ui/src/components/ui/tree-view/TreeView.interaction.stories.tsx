// APG keyboard tests in a real browser (A5), as play functions. Hidden from the sidebar and docs
// (`!dev`, `!autodocs`). The `!play` playground is opened by `tests/interaction/tree-view.spec.ts`,
// which repeats the keys in Chromium, including scroll-then-focus off the window.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Pressable, Text, View } from 'react-native'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'

import { Surface } from '../surface'
import { fixtureProps, TreeViewStory, type TreeViewStoryArgs } from './fixture-slots'
import { fixtures } from './fixtures'
import { indexNodes, visibleRows } from './tree-model'

const meta: Meta<TreeViewStoryArgs> = {
  title: 'Components/Organisms/TreeView/Interactions',
  tags: ['!dev', '!autodocs', 'interaction', 'play'],
  parameters: { layout: 'fullscreen' },
  args: {
    fixture: 'default',
    density: 'comfortable',
    height: 360,
    isDisabled: false,
    isLoading: false,
    isTruncated: false,
    onSelect: fn(),
    onLoadChildren: fn(),
  },
  decorators: [
    (Story) => (
      <Surface level="base" style={{ minHeight: '100%' }} className="p-gutter-sm">
        <View className="gap-stack-sm">
          <Pressable accessibilityRole="button" accessibilityLabel="Before">
            <Text className="text-text-primary">Before</Text>
          </Pressable>
          <Story />
          <Pressable accessibilityRole="button" accessibilityLabel="After">
            <Text className="text-text-primary">After</Text>
          </Pressable>
        </View>
      </Surface>
    ),
  ],
  render: function Render(args) {
    return <TreeViewStory {...args} />
  },
}
export default meta
type Story = StoryObj<TreeViewStoryArgs>

const focusedLabel = () => document.activeElement?.getAttribute('aria-label')

async function expectFocus(label: string) {
  await waitFor(() => expect(focusedLabel()).toBe(label))
  await expect(document.querySelectorAll('[role="treeitem"][tabindex="0"]')).toHaveLength(1)
}

const DEFAULT_ROOTS = fixtures.default.nodes.filter((node) => node.parentId === null)
const DEFAULT_LABELS = DEFAULT_ROOTS.map((node) => node.label)

const LARGE = fixtures.veryLarge.nodes
const LARGE_ROWS = visibleRows(indexNodes(LARGE), new Set(LARGE.map((node) => node.id)), null)

export const TabEntersOnceAndLeaves: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    canvas.getByRole('button', { name: 'Before' }).focus()
    await userEvent.tab()
    await expectFocus(DEFAULT_LABELS[0])
    await userEvent.tab()
    await expect(canvas.getByRole('button', { name: 'After' })).toHaveFocus()
  },
}

export const ArrowsHomeAndEndMoveFocus: Story = {
  play: async ({ canvasElement }) => {
    within(canvasElement).getByRole('treeitem', { name: DEFAULT_LABELS[0] }).focus()
    await userEvent.keyboard('{ArrowDown}')
    await expectFocus(DEFAULT_LABELS[1])
    await userEvent.keyboard('{ArrowUp}')
    await expectFocus(DEFAULT_LABELS[0])
    await userEvent.keyboard('{End}')
    await expectFocus(DEFAULT_LABELS[DEFAULT_LABELS.length - 1])
    await userEvent.keyboard('{Home}')
    await expectFocus(DEFAULT_LABELS[0])
  },
}

export const RightOpensAndLeftReturnsToTheParent: Story = {
  args: { fixture: 'deep' },
  play: async ({ canvasElement }) => {
    const { revealId = '' } = fixtureProps('deep')
    const target = fixtures.deep.nodes.find((node) => node.id === revealId)
    const parent = fixtures.deep.nodes.find((node) => node.id === target?.parentId)
    within(canvasElement).getByRole('treeitem', { name: target?.label }).focus()
    await userEvent.keyboard('{ArrowLeft}')
    await expectFocus(parent?.label ?? '')
    await userEvent.keyboard('{ArrowLeft}')
    const row = within(canvasElement).getByRole('treeitem', { name: parent?.label })
    await waitFor(() => expect(row).toHaveAttribute('aria-expanded', 'false'))
    await userEvent.keyboard('{ArrowRight}')
    await waitFor(() => expect(row).toHaveAttribute('aria-expanded', 'true'))
    await userEvent.keyboard('{ArrowRight}')
    await expectFocus(fixtures.deep.nodes.find((node) => node.parentId === parent?.id)?.label ?? '')
  },
}

export const EnterAndSpaceSelectOnce: Story = {
  play: async ({ canvasElement, args }) => {
    within(canvasElement).getByRole('treeitem', { name: DEFAULT_LABELS[0] }).focus()
    await userEvent.keyboard('{Enter}')
    await expect(args.onSelect).toHaveBeenCalledTimes(1)
    await userEvent.keyboard('{ArrowDown}')
    await userEvent.keyboard(' ')
    await expect(args.onSelect).toHaveBeenCalledTimes(2)
    await expect(args.onSelect).toHaveBeenLastCalledWith(DEFAULT_ROOTS[1].id)
  },
}

export const EndScrollsTheLastOfFiveThousandIntoFocus: Story = {
  args: { fixture: 'veryLarge' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const first = LARGE_ROWS[0].node.label
    canvas.getByRole('treeitem', { name: first }).focus()
    await userEvent.keyboard('{End}')
    await expectFocus(LARGE_ROWS[LARGE_ROWS.length - 1].node.label)
    await expect(canvas.queryByRole('treeitem', { name: first })).toBeNull()
    const scroller = canvas.getByRole('tree').parentElement?.parentElement as HTMLElement
    const row = (document.activeElement as HTMLElement).getBoundingClientRect()
    await expect(row.bottom).toBeLessThanOrEqual(scroller.getBoundingClientRect().bottom + 1)
    await userEvent.keyboard('{Home}')
    await expectFocus(first)
  },
}

/** No play function: the Playwright spec drives this one with a real keyboard. */
export const VeryLargePlayground: Story = { args: { fixture: 'veryLarge' }, tags: ['!play'] }
