import type { Meta, StoryObj } from '@storybook/react-vite'
import { Text, View } from 'react-native'

import { Card } from '../card'
import { Surface } from '../surface'
import { Carousel, CarouselSlide, type CarouselControlsSize, type CarouselPeek } from './Carousel'

interface StoryArgs {
  count: number
  unequal: boolean
  peek: CarouselPeek
  controlsSize: CarouselControlsSize
}

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

/** Every third card carries extra lines, so the slides differ in height. */
function extraLines(index: number, unequal: boolean): number {
  return unequal && index % 3 === 1 ? 4 : 0
}

function ExampleCard({ name, lines }: { name: string; lines: number }) {
  return (
    <Card className="flex-1 gap-stack-sm p-inset-lg">
      <Text className="font-heading text-lg text-text-primary">{name}</Text>
      <Text className="font-body text-sm text-text-secondary">Committed 185 x 8 by week 6</Text>
      {Array.from({ length: lines }, (_, i) => (
        <Text key={i} className="font-body text-sm text-text-tertiary">
          {`Extra detail line ${String(i + 1)}`}
        </Text>
      ))}
    </Card>
  )
}

const meta: Meta<StoryArgs> = {
  title: 'Components/Molecules/Carousel',
  tags: ['autodocs', 'status:candidate', '!status:review'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '**Molecule.** A row of peer cards for a phone column: one card per view with the ' +
          'next one peeking, swiped instead of scrolled past, with previous and next arrows ' +
          'and the position between them under the cards on the page plane. Follows the ' +
          'WAI-ARIA APG carousel pattern (basic, never rotating); every slide stays in the ' +
          'accessibility tree. The current slide is tracked by key, so a refresh that adds ' +
          'or removes a card keeps the same card in view. One card renders plainly; none ' +
          'renders nothing. Composes ' +
          '[Button](?path=/docs/components-molecules-button--docs) + ' +
          '[Icons](?path=/docs/foundations-icons--docs) over a React Native `ScrollView` ' +
          '(CSS scroll-snap on web, `snapToInterval` on native). Give each card `flex-1` ' +
          'to stretch it to the tallest slide. On real goal cards: ' +
          '[Carousel Sections](?path=/docs/custom-workout-goals-carousel-sections--docs).',
      },
    },
  },
  args: { count: 9, unequal: false, peek: 'md', controlsSize: 'lg' },
  argTypes: {
    count: { control: { type: 'range', min: 0, max: 9, step: 1 } },
    unequal: { control: 'boolean' },
    peek: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    controlsSize: { control: 'inline-radio', options: ['md', 'lg'] },
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
  render: ({ count, unequal, peek, controlsSize }) => (
    <Carousel label="Per-lift" peek={peek} controlsSize={controlsSize}>
      {NAMES.slice(0, count).map((name, index) => (
        <CarouselSlide key={name} value={name} label={name}>
          <ExampleCard name={name} lines={extraLines(index, unequal)} />
        </CarouselSlide>
      ))}
    </Carousel>
  ),
}
export default meta
type Story = StoryObj<StoryArgs>

export const Default: Story = {}
