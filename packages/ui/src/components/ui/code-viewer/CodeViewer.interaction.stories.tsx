// Web keyboard proof as play functions, in the style of `ui/carousel/Carousel.interaction.stories.tsx`.
// Hidden from the sidebar and docs (`!dev`, `!autodocs`); `pnpm test:storybook` runs them in Chromium.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'

import { Button, ButtonText } from '../button'
import { Surface } from '../surface'
import { CodeViewer } from './CodeViewer'
import { fixedWindowOneLine, scale5k, type SourceExcerpt } from './fixtures'
import type { CodeViewerProps } from './types'

type Args = Partial<CodeViewerProps> & { excerpt: SourceExcerpt }

function Subject({ excerpt, ...props }: Args) {
  return (
    <View className="gap-stack-md">
      <Button variant="ghost" size="sm">
        <ButtonText>Before</ButtonText>
      </Button>
      <CodeViewer
        accessibilityLabel="Source"
        text={excerpt.text}
        startLine={excerpt.startLine}
        highlights={excerpt.highlights}
        {...props}
      />
      <Button variant="ghost" size="sm">
        <ButtonText>After</ButtonText>
      </Button>
    </View>
  )
}

const meta: Meta<Args> = {
  title: 'Components/Molecules/CodeViewer/Interactions',
  tags: ['!dev', '!autodocs', 'interaction', 'play'],
  parameters: { layout: 'fullscreen' },
  args: { excerpt: fixedWindowOneLine, onSelectedRangeChange: fn() },
  argTypes: { excerpt: { control: false } },
  decorators: [
    (Story) => (
      <Surface level="base" style={{ minHeight: '100%' }} className="p-gutter-sm">
        <View style={{ width: 480 }}>
          <Story />
        </View>
      </Surface>
    ),
  ],
  render: (args) => <Subject {...args} />,
}
export default meta
type Story = StoryObj<Args>

const startFromBefore = (canvas: HTMLElement) =>
  within(canvas).getByRole('button', { name: 'Before' }).focus()
const listbox = (canvas: HTMLElement) =>
  within(canvas).getByRole('listbox', { name: 'Select lines' })
const activeLine = (canvas: HTMLElement) => {
  const id = listbox(canvas).getAttribute('aria-activedescendant') ?? ''
  return canvas.ownerDocument.getElementById(id)?.getAttribute('aria-label')
}

export const TabReachesTheCodeThenTheLineNumbers: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    startFromBefore(canvasElement)
    await userEvent.tab()
    await expect(canvas.getByTestId('code-viewer-code')).toHaveFocus()
    await userEvent.tab()
    await expect(listbox(canvasElement)).toHaveFocus()
    await userEvent.tab()
    await expect(canvas.getByRole('button', { name: 'After' })).toHaveFocus()
  },
}

export const TabSkipsADisabledListbox: Story = {
  args: { isDisabled: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    startFromBefore(canvasElement)
    await userEvent.tab()
    await expect(canvas.getByTestId('code-viewer-code')).toHaveFocus()
    await userEvent.tab()
    await expect(canvas.getByRole('button', { name: 'After' })).toHaveFocus()
    await expect(listbox(canvasElement)).toHaveAttribute('aria-disabled', 'true')
  },
}

export const KeysSelectARangeOfLines: Story = {
  play: async ({ canvasElement, args }) => {
    listbox(canvasElement).focus()
    await userEvent.keyboard('{ArrowDown}{ArrowDown}')
    await expect(activeLine(canvasElement)).toBe('Line 24')
    await userEvent.keyboard(' ')
    await userEvent.keyboard('{Shift>}{ArrowDown}{ArrowDown}{/Shift}')
    await expect(args.onSelectedRangeChange).toHaveBeenLastCalledWith({
      startLine: 24,
      endLine: 26,
    })
    const selected = within(canvasElement)
      .getAllByRole('option')
      .filter((node) => node.getAttribute('aria-selected') === 'true')
    await expect(selected).toHaveLength(3)
    await expect(listbox(canvasElement)).toHaveFocus()
    await userEvent.keyboard('{Escape}')
    await expect(args.onSelectedRangeChange).toHaveBeenLastCalledWith(null)
  },
}

export const PressingALineKeepsFocusOnTheListbox: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('option', { name: 'Line 25' }))
    await expect(canvas.getByRole('option', { name: 'Line 25' })).toHaveAttribute(
      'aria-selected',
      'true'
    )
    await expect(listbox(canvasElement)).toHaveFocus()
    await userEvent.keyboard('{ArrowDown}')
    await expect(activeLine(canvasElement)).toBe('Line 26')
  },
}

export const CopyExcludesLineNumbers: Story = {
  play: async ({ canvasElement }) => {
    const region = within(canvasElement).getByRole('region', { name: 'Source' })
    const selection = canvasElement.ownerDocument.getSelection()
    selection?.selectAllChildren(region)
    const copied = selection?.toString() ?? ''
    selection?.removeAllRanges()
    const lines = (text: string) => text.split('\n').filter((line) => line.trim() !== '')
    // The summary is prose above the code; everything after it is the source and nothing else.
    await expect(lines(copied)).toEqual(['Flagged: line 27', ...lines(fixedWindowOneLine.text)])
  },
}

// The vitest browser project renders without NativeWind classes, so this asserts the scroll offset
// (set from the fixed row height) and not the row's on-screen box.
export const EndAndHomeScrollTheWindow: Story = {
  args: { excerpt: scale5k },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const scroller = canvas.getByTestId('code-viewer-scroll')
    listbox(canvasElement).focus()
    await userEvent.keyboard('{End}')
    await expect(activeLine(canvasElement)).toBe('Line 5000')
    await waitFor(() => expect(scroller.scrollTop).toBe(5000 * 18 - 480))
    await expect(canvas.getByRole('option', { name: 'Line 5000' })).toBeInTheDocument()
    await expect(canvas.getAllByTestId('code-line').length).toBeLessThan(80)
    await userEvent.keyboard('{Home}')
    await waitFor(() => expect(scroller.scrollTop).toBe(0))
    await expect(canvas.getByRole('option', { name: 'Line 2' })).toBeInTheDocument()
  },
}
