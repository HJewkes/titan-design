import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'

import { Carousel, CarouselSlide } from '../../ui/carousel'
import { Surface } from '../../ui/surface'
import { Tooltip } from '../../ui/tooltip'
import { Typography } from '../../ui/typography'
import {
  LONG_NAME_LIFTS,
  MUSCLES,
  NINE_LIFTS,
  NOTED_LIFTS,
  LiftCard,
  liftSlides,
  muscleSlides,
  wholeBodySlides,
} from './goalCarousel-fixture'

type Cards = 'one' | 'two' | 'nine' | 'unequal' | 'long-names'
type Tip = 'none' | 'in-flow' | 'portal'

type StartAt = 'first' | 'middle' | 'last'

interface StoryArgs {
  cards: Cards
  startAt: StartAt
  loop: boolean
  tip: Tip
}

const SECTION_TITLE: Record<Cards, string> = {
  one: 'Per-lift',
  two: 'Whole body',
  nine: 'Per-lift',
  unequal: 'Muscle priorities',
  'long-names': 'Per-lift',
}

function slidesFor(cards: Cards) {
  switch (cards) {
    case 'one':
      return liftSlides(NINE_LIFTS.slice(0, 1))
    case 'two':
      return wholeBodySlides()
    case 'nine':
      return liftSlides(NINE_LIFTS)
    case 'unequal':
      return [...muscleSlides(MUSCLES), ...liftSlides(NOTED_LIFTS)]
    case 'long-names':
      return liftSlides(LONG_NAME_LIFTS)
  }
}

/** The first card with a tip open by state, never by focus or hover. */
function tipSlide(tip: Exclude<Tip, 'none'>) {
  const lift = NINE_LIFTS[0]
  return (
    <CarouselSlide key="tip" value="tip" label={lift.name}>
      <View className="flex-1 gap-stack-sm">
        <Tooltip
          isOpen
          usePortal={tip === 'portal'}
          placement="top"
          content="Committed 185 x 8 by week 6; stretch 195 x 8."
        >
          <Typography variant="body2" color="secondary">
            {tip === 'portal' ? 'Tip rendered in a portal' : 'Tip rendered in flow'}
          </Typography>
        </Tooltip>
        <LiftCard lift={lift} />
      </View>
    </CarouselSlide>
  )
}

/** Which card the frame opens on, so a static capture can show a middle or the last card. */
function startValue(slides: ReturnType<typeof slidesFor>, startAt: StartAt): string | undefined {
  const index =
    startAt === 'first' ? 0 : startAt === 'last' ? slides.length - 1 : Math.floor(slides.length / 2)
  return slides[index]?.props.value
}

function CarouselStory({ cards, startAt, loop, tip }: StoryArgs) {
  const slides = slidesFor(cards)
  const withTip = tip === 'none' ? slides : [tipSlide(tip), ...slides.slice(1)]
  return (
    <View className="gap-stack-md">
      <Typography variant="h6" style={{ textTransform: 'uppercase' }}>
        {SECTION_TITLE[cards]}
      </Typography>
      <Carousel
        label={SECTION_TITLE[cards]}
        defaultValue={startValue(withTip, startAt)}
        loop={loop}
      >
        {withTip}
      </Carousel>
    </View>
  )
}

const meta: Meta<StoryArgs> = {
  title: 'Custom/Workout/Goals/Carousel Sections',
  tags: ['autodocs', 'status:candidate', '!status:review'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          "**Fixture story.** The goals page's multi-card sections as a " +
          '[Carousel](?path=/docs/components-molecules-carousel--docs), on real goal cards: ' +
          'compact [GoalCard](?path=/docs/custom-workout-goals-goalcard--docs)s, ' +
          '[GoalMuscleCard](?path=/docs/custom-workout-goalmusclecard--docs)s and the ' +
          'Whole body pair (stand-ins until titan PR 273 lands). `cards` picks the fixture; ' +
          '`tip` opens a tip on the first card by state, in flow or in a portal.',
      },
    },
  },
  args: {
    cards: 'nine',
    startAt: 'first',
    loop: true,
    tip: 'none',
  },
  argTypes: {
    cards: { control: 'select', options: ['one', 'two', 'nine', 'unequal', 'long-names'] },
    startAt: { control: 'inline-radio', options: ['first', 'middle', 'last'] },
    loop: { control: 'boolean' },
    tip: { control: 'inline-radio', options: ['none', 'in-flow', 'portal'] },
  },
  decorators: [
    (Story) => (
      <Surface level="base" style={{ minHeight: '100%' }} className="p-gutter-sm">
        <View style={{ width: '100%', maxWidth: 390, alignSelf: 'center' }}>
          <Story />
        </View>
      </Surface>
    ),
  ],
  render: (args) => <CarouselStory {...args} />,
}
export default meta
type Story = StoryObj<StoryArgs>

export const Default: Story = {}
