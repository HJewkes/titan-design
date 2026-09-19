import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ReactElement, ReactNode } from 'react'
import { View } from 'react-native'

import { useMeasuredWidth } from '../../../hooks/useMeasuredWidth'
import { space } from '../../../theme/tokens/semantic'
import { Carousel, type CarouselSlideProps } from '../../ui/carousel'
import {
  MUSCLES,
  NINE_LIFTS,
  liftSlides,
  muscleSlides,
  wholeBodySlides,
} from './goalCarousel-fixture'
import { Surface } from '../../ui/surface'
import { Typography } from '../Typography'
import { GoalCard } from './GoalCard'
import { PRIMARY_GOAL_SCENARIOS as S } from './primaryGoal-fixture'

/** The SPA's wall grid: `repeat(auto-fill, minmax(420px, 1fr))`. */
const CARD_MIN_WIDTH = 420
const GRID_GAP = space.stack.lg

type Frame = 'fill' | 'w850'
type SlideCap = 'none' | 'c480'

interface PageArgs {
  frame: Frame
  slideCap: SlideCap
}

/** How many columns the SPA's auto-fill grid gives this width. */
function gridColumns(width: number): number {
  return Math.max(1, Math.floor((width + GRID_GAP) / (CARD_MIN_WIDTH + GRID_GAP)))
}

type SlideElement = ReactElement<CarouselSlideProps>

/** The wall's grid, unchanged: every slide's card in auto-fill columns. */
function CardGrid({ slides, width }: { slides: SlideElement[]; width: number }) {
  const columns = gridColumns(width)
  const cardWidth = (width - (columns - 1) * GRID_GAP) / columns
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: GRID_GAP, alignItems: 'stretch' }}>
      {slides.map((slide) => (
        <View key={slide.props.value} style={{ width: cardWidth }}>
          {slide.props.children}
        </View>
      ))}
    </View>
  )
}

interface SectionProps {
  title: string
  slides: SlideElement[]
  width: number
  maxSlideWidth?: number
}

/** A carousel wherever the grid would be one column (owner, Q3); the grid otherwise. */
function GoalSection({ title, slides, width, maxSlideWidth }: SectionProps) {
  const oneColumn = gridColumns(width) === 1
  return (
    <View className="gap-stack-md">
      <Typography variant="h6" style={{ textTransform: 'uppercase' }}>
        {title}
      </Typography>
      {oneColumn ? (
        <Carousel label={title} maxSlideWidth={maxSlideWidth}>
          {slides}
        </Carousel>
      ) : (
        <CardGrid slides={slides} width={width} />
      )}
    </View>
  )
}

function Frame({ frame, children }: { frame: Frame; children: ReactNode }) {
  return (
    <Surface level="base" style={{ minHeight: '100%' }} className="p-gutter-sm">
      <View
        style={{ width: '100%', maxWidth: frame === 'w850' ? 850 : undefined, alignSelf: 'center' }}
      >
        {children}
      </View>
    </Surface>
  )
}

function GoalsPage({ frame, slideCap }: PageArgs) {
  const { width, onLayout } = useMeasuredWidth()
  const cap = slideCap === 'c480' ? 480 : undefined
  const lead = NINE_LIFTS[0]
  return (
    <Frame frame={frame}>
      <View onLayout={onLayout} className="gap-section-sm">
        <GoalCard {...S.onTrack} size="full" title={lead.name} />
        {width !== null && (
          <>
            <GoalSection
              title="Per-lift"
              slides={liftSlides(NINE_LIFTS.slice(1))}
              width={width}
              maxSlideWidth={cap}
            />
            <GoalSection
              title="Muscle priorities"
              slides={muscleSlides(MUSCLES)}
              width={width}
              maxSlideWidth={cap}
            />
            <GoalSection
              title="Whole body"
              slides={wholeBodySlides()}
              width={width}
              maxSlideWidth={cap}
            />
          </>
        )}
      </View>
    </Frame>
  )
}

const meta: Meta<PageArgs> = {
  title: 'Pages/Goals/Carousel',
  tags: ['autodocs', 'status:candidate', '!status:review'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '**Composition.** The `#/goals` page with its multi-card sections as ' +
          '[Carousel](?path=/docs/components-molecules-carousel--docs)s wherever the wall ' +
          'grid (`minmax(420px, 1fr)`) would be one column, and the grid otherwise. The lead ' +
          'lift leaves the per-lift list (owner, VW-467 Q4). `frame: w850` holds the column ' +
          'at 850 px to show the width between phone and wall. The Whole body cards are ' +
          'stand-ins until titan PR 273 lands.',
      },
    },
  },
  args: { frame: 'fill', slideCap: 'none' },
  argTypes: {
    frame: { control: 'inline-radio', options: ['fill', 'w850'] },
    slideCap: { control: 'inline-radio', options: ['none', 'c480'] },
  },
  render: (args) => <GoalsPage {...args} />,
}
export default meta
type Story = StoryObj<PageArgs>

export const Default: Story = {}
