// Behaviour and keyboard tests as play functions. Hidden from the sidebar and docs (`!dev`,
// `!autodocs`); the `storybook` Vitest project runs them in Chromium.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { expect, userEvent, waitFor, within } from 'storybook/test'

import { Button, ButtonText } from '../button'
import { Card } from '../card'
import { Surface } from '../surface'
import { Typography } from '../typography'
import { Shelf } from './Shelf'

const TITLES = Array.from({ length: 10 }, (_, i) => `Episode ${String(i + 1)}`)

interface Args {
  columnWidth: number
  count: number
}

function Row({ columnWidth, count }: Args) {
  return (
    <View className="gap-stack-md px-gutter-sm" style={{ width: columnWidth }}>
      <Button variant="ghost" size="sm" onPress={() => undefined}>
        <ButtonText>Before the shelf</ButtonText>
      </Button>
      <Shelf label="Yesterday" itemWidth={240} bleed="sm">
        {TITLES.slice(0, count).map((title) => (
          <Card
            key={title}
            onPress={() => undefined}
            accessibilityLabel={title}
            className="p-inset-lg"
          >
            <Typography variant="subtitle1">{title}</Typography>
          </Card>
        ))}
      </Shelf>
    </View>
  )
}

const meta: Meta<Args> = {
  title: 'Components/Molecules/Shelf/Interactions',
  tags: ['!dev', '!autodocs', 'interaction', 'play'],
  parameters: { layout: 'fullscreen' },
  args: { columnWidth: 1100, count: 10 },
  decorators: [
    (Story) => (
      <Surface level="base" style={{ minHeight: '100%' }} className="py-gutter-sm">
        <Story />
      </Surface>
    ),
  ],
  render: (args) => <Row {...args} />,
}
export default meta
type Story = StoryObj<Args>

function viewport(canvas: HTMLElement): HTMLElement {
  return within(canvas).getByTestId('shelf-viewport')
}

/** The named card sits whole inside the shelf's column (the scroller minus its bleed). */
async function expectWhollyInView(canvas: HTMLElement, title: string) {
  const column = within(canvas).getByRole('group', { name: 'Yesterday' })
  const card = within(canvas).getByRole('button', { name: title })
  await waitFor(() => {
    const view = column.getBoundingClientRect()
    const box = card.getBoundingClientRect()
    expect(box.left).toBeGreaterThanOrEqual(view.left - 1)
    expect(box.right).toBeLessThanOrEqual(view.right + 1)
  })
}

/** The named card's leading edge rests on the column's leading edge. */
async function expectAtColumnStart(canvas: HTMLElement, title: string) {
  const column = within(canvas).getByRole('group', { name: 'Yesterday' })
  const card = within(canvas).getByRole('button', { name: title })
  await waitFor(() =>
    expect(
      Math.abs(card.getBoundingClientRect().left - column.getBoundingClientRect().left)
    ).toBeLessThan(2)
  )
}

export const NudgeMovesTheRowAndBack: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.queryByRole('button', { name: 'Back in Yesterday' })).toBeNull()
    await userEvent.click(await canvas.findByRole('button', { name: 'More from Yesterday' }))
    // 0.8 of a 1068px column holds three 252px steps.
    await expectAtColumnStart(canvasElement, TITLES[3])
    await userEvent.click(await canvas.findByRole('button', { name: 'Back in Yesterday' }))
    await expectAtColumnStart(canvasElement, TITLES[0])
    await waitFor(() => expect(viewport(canvasElement).scrollLeft).toBe(0))
  },
}

export const NudgeHidesAtTheEnd: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole('button', { name: 'More from Yesterday' }))
    await expectAtColumnStart(canvasElement, TITLES[3])
    // Three more steps would pass the end, so the second nudge stops on the last card.
    await userEvent.click(canvas.getByRole('button', { name: 'More from Yesterday' }))
    await expectWhollyInView(canvasElement, TITLES[9])
    await waitFor(() =>
      expect(canvas.queryByRole('button', { name: 'More from Yesterday' })).toBeNull()
    )
  },
}

export const PhoneColumnHasNoNudge: Story = {
  args: { columnWidth: 375 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expectWhollyInView(canvasElement, TITLES[0])
    await expect(canvas.queryByRole('button', { name: 'More from Yesterday' })).toBeNull()
  },
}

export const TabBringsACutOffCardIntoView: Story = {
  args: { columnWidth: 375 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    canvas.getByRole('button', { name: 'Before the shelf' }).focus()
    for (let i = 0; i < 4; i += 1) await userEvent.tab()
    await expect(canvas.getByRole('button', { name: TITLES[3] })).toHaveFocus()
    await expectWhollyInView(canvasElement, TITLES[3])
  },
}

export const EmptyRendersNothing: Story = {
  args: { count: 0 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.queryByRole('group', { name: 'Yesterday' })).toBeNull()
    await expect(canvas.queryByTestId('shelf-viewport')).toBeNull()
  },
}
