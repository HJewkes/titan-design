// Behaviour and keyboard tests as play functions. Hidden from the sidebar and docs (`!dev`,
// `!autodocs`); `tests/interaction/carousel.spec.ts` runs them in Chromium and reads the
// `data-play-status` marker each one leaves on <body>.
import type { Meta, StoryContext, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { Text, View } from 'react-native'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'

import { Button, ButtonText } from '../button'
import { Card } from '../card'
import { Surface } from '../surface'
import { Carousel, CarouselSlide } from './Carousel'

const NAMES = [
  'Bench press',
  'Back squat',
  'Romanian deadlift',
  'Cable overhead tricep extension',
  'Seated cable row',
  'Lat pulldown',
  'Incline dumbbell press',
  'Leg press',
  'Cable chest press',
]

interface Args {
  count: number
  onValueChange: (value: string, index: number) => void
}

function slides(names: string[]) {
  return names.map((name) => (
    <CarouselSlide key={name} value={name} label={name}>
      <Card className="flex-1 gap-stack-sm p-inset-lg">
        <Text className="font-heading text-lg text-text-primary">{name}</Text>
        <Button variant="outline" size="sm">
          <ButtonText>{`Open ${name}`}</ButtonText>
        </Button>
      </Card>
    </CarouselSlide>
  ))
}

function Refreshing({ count, onValueChange }: Args) {
  const [names, setNames] = useState(NAMES.slice(0, count))
  return (
    <View className="gap-stack-md">
      <Button variant="ghost" size="sm" onPress={() => setNames((all) => all.slice(1))}>
        <ButtonText>Drop first card</ButtonText>
      </Button>
      <Carousel label="Per-lift" onValueChange={onValueChange}>
        {slides(names)}
      </Carousel>
    </View>
  )
}

const meta: Meta<Args> = {
  title: 'Components/Molecules/Carousel/Interactions',
  tags: ['!dev', '!autodocs', 'interaction'],
  parameters: { layout: 'fullscreen' },
  args: { count: 9, onValueChange: fn() },
  decorators: [
    (Story) => (
      <Surface level="base" style={{ minHeight: '100%' }} className="p-gutter-sm">
        <View style={{ width: 360 }}>
          <Story />
        </View>
      </Surface>
    ),
  ],
  render: (args) => <Refreshing {...args} />,
}
export default meta
type Story = StoryObj<Args>
type Play = (context: StoryContext<Args>) => Promise<void>

/** Leaves a pass/fail marker for the Playwright runner, then rethrows so Storybook shows it too. */
function marked(play: Play): Play {
  return async (context) => {
    document.body.dataset.playStatus = 'running'
    try {
      await play(context)
      document.body.dataset.playStatus = 'passed'
    } catch (error) {
      document.body.dataset.playStatus = 'failed'
      document.body.dataset.playError = error instanceof Error ? error.message : String(error)
      throw error
    }
  }
}

function viewport(canvas: HTMLElement): HTMLElement {
  return within(canvas).getByTestId('carousel-viewport')
}

/** Whether the named slide sits at the viewport's leading edge (or its end, for the last). */
async function expectInView(canvas: HTMLElement, name: string) {
  const scroller = viewport(canvas)
  const slide = within(canvas).getByTestId(`carousel-slide-${name}`)
  await waitFor(() => {
    const leading = Math.abs(
      slide.getBoundingClientRect().left - scroller.getBoundingClientRect().left
    )
    const trailing = Math.abs(
      slide.getBoundingClientRect().right - scroller.getBoundingClientRect().right
    )
    expect(Math.min(leading, trailing)).toBeLessThan(2)
  })
}

async function expectPosition(canvas: HTMLElement, text: string) {
  await waitFor(() =>
    expect(within(canvas).getByTestId('carousel-position')).toHaveTextContent(text)
  )
}

export const ArrowsStepOneSlide: Story = {
  play: marked(async ({ canvasElement }) => {
    const next = within(canvasElement).getByRole('button', { name: 'Next slide' })
    await userEvent.click(next)
    await expectPosition(canvasElement, '2 of 9')
    await expectInView(canvasElement, NAMES[1])
  }),
}

export const StopsAtBothEnds: Story = {
  play: marked(async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('button', { name: 'Previous slide' })).toHaveAttribute(
      'aria-disabled',
      'true'
    )
    for (let i = 0; i < 8; i += 1)
      await userEvent.click(canvas.getByRole('button', { name: 'Next slide' }))
    await expectPosition(canvasElement, '9 of 9')
    await expect(canvas.getByRole('button', { name: 'Next slide' })).toHaveAttribute(
      'aria-disabled',
      'true'
    )
    await expectInView(canvasElement, NAMES[8])
  }),
}

/** The distance between two slide starts, once the carousel has measured itself. */
async function measuredStep(canvas: HTMLElement): Promise<number> {
  const left = (name: string) =>
    within(canvas).getByTestId(`carousel-slide-${name}`).getBoundingClientRect().left
  let step = 0
  await waitFor(() => {
    step = left(NAMES[1]) - left(NAMES[0])
    expect(step).toBeGreaterThan(100)
  })
  return step
}

export const SwipeCommitsWhenTheScrollRests: Story = {
  play: marked(async ({ canvasElement, args }) => {
    const step = await measuredStep(canvasElement)
    // react-native-web replaces the node's scrollTo with its own {x, y} one; set the offset as a swipe would.
    viewport(canvasElement).scrollLeft = step * 3
    await expectPosition(canvasElement, '4 of 9')
    await waitFor(() => expect(args.onValueChange).toHaveBeenLastCalledWith(NAMES[3], 3))
    await expect(args.onValueChange).toHaveBeenCalledTimes(1)
  }),
}

export const TabBringsTheFocusedSlideIntoView: Story = {
  play: marked(async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    canvas.getByRole('button', { name: 'Drop first card' }).focus()
    await userEvent.tab()
    await userEvent.tab()
    await userEvent.tab()
    await expect(canvas.getByRole('button', { name: `Open ${NAMES[2]}` })).toHaveFocus()
    await expectPosition(canvasElement, '3 of 9')
    await expectInView(canvasElement, NAMES[2])
  }),
}

export const EnterAndSpaceActivateTheArrows: Story = {
  play: marked(async ({ canvasElement }) => {
    const next = within(canvasElement).getByRole('button', { name: 'Next slide' })
    next.focus()
    await userEvent.keyboard('{Enter}')
    await expectPosition(canvasElement, '2 of 9')
    await userEvent.keyboard(' ')
    await expectPosition(canvasElement, '3 of 9')
    await expect(next).toHaveFocus()
    await expectInView(canvasElement, NAMES[2])
  }),
}

export const RefreshKeepsTheSameCard: Story = {
  play: marked(async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    for (let i = 0; i < 3; i += 1)
      await userEvent.click(canvas.getByRole('button', { name: 'Next slide' }))
    await expectPosition(canvasElement, '4 of 9')
    await userEvent.click(canvas.getByRole('button', { name: 'Drop first card' }))
    await expectPosition(canvasElement, '3 of 8')
    await expect(canvas.getByRole('group', { name: `3 of 8: ${NAMES[3]}` })).toBeInTheDocument()
    await expectInView(canvasElement, NAMES[3])
  }),
}

export const OneCardHasNoControls: Story = {
  args: { count: 1 },
  play: marked(async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText(NAMES[0])).toBeInTheDocument()
    await expect(canvas.queryByRole('region')).toBeNull()
    await expect(canvas.queryByRole('button', { name: 'Next slide' })).toBeNull()
  }),
}
