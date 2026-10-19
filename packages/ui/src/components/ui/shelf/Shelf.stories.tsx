import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'

import { Card } from '../card'
import { EmptyState } from '../empty-state'
import { Surface } from '../surface'
import { Typography } from '../typography'
import { Shelf, type ShelfBleed, type ShelfNudge } from './Shelf'
import type { ShelfBreakpoint, ShelfItemWidth } from './shelfMath'

interface StoryArgs {
  count: number
  itemWidth: ShelfItemWidth
  bleed: ShelfBleed
  nudge: ShelfNudge
  nudgeFrom: ShelfBreakpoint
  columnWidth: number
  isLoading: boolean
}

const TITLES = [
  'Snapping a row item by item',
  'Why the next card peeks',
  'Nudging by most of a column',
  'Focus brings a card into view',
  'Bleeding into the page gutter',
  'Breakpoint widths, not classes',
  'An empty row renders nothing',
  'Scroll padding and snap start',
  'Tabbing through a long row',
  'Reduced motion and smooth scroll',
]

function titlesFor(count: number): string[] {
  return Array.from({ length: count }, (_, i) => TITLES[i] ?? `Item ${String(i + 1)}`)
}

function ExampleCard({ title, isLoading }: { title: string; isLoading: boolean }) {
  return (
    <Card
      isLoading={isLoading}
      onPress={() => undefined}
      accessibilityLabel={title}
      className="gap-stack-sm p-inset-lg"
    >
      <Typography variant="subtitle1">{title}</Typography>
      <Typography variant="caption" color="secondary">
        4:12 · 3 tags
      </Typography>
    </Card>
  )
}

const meta: Meta<StoryArgs> = {
  title: 'Components/Molecules/Shelf',
  tags: ['autodocs', 'status:candidate', '!status:review'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '**Molecule.** A horizontal row of same-width items that snaps item by item, with ' +
          'the next item peeking at the trailing edge. `itemWidth` is a number or a map from ' +
          'breakpoint to width, read against the shelf’s own column. `bleed` runs the row ' +
          'into the page gutter while items still rest on the column edge (snap-start plus ' +
          'scroll-padding). On `nudge="auto"` a round arrow at each end shows only when the ' +
          'column is at least `nudgeFrom` (`md`) wide and the row overflows; it moves the ' +
          'row by the whole items that fit in 0.8 of the column. Tabbing to a cut-off item ' +
          'scrolls it whole into view. Composes ' +
          '[Button](?path=/docs/components-molecules-button--docs) + ' +
          '[Surface](?path=/docs/components-atoms-surface--docs) + ' +
          '[Icons](?path=/docs/foundations-icons--docs) over a React Native `ScrollView` ' +
          '(CSS scroll-snap on web, `snapToInterval` on native). Not a Carousel: see ' +
          '`API-NOTE.md` beside the component.\n\n' +
          '**States.** Empty: no items renders nothing, so the caller shows its own ' +
          '`EmptyState` (set `count` to 0). Loading: the shelf has none of its own; pass ' +
          'loading items, as the `isLoading` control does with `Card isLoading`. Error: does ' +
          'not apply; the caller that failed to load the row renders an `Alert`. Disabled: ' +
          'does not apply to a row; each item carries its own `isDisabled`.',
      },
    },
  },
  args: {
    count: 8,
    itemWidth: { xs: 236, sm: 264 },
    bleed: 'sm',
    nudge: 'auto',
    nudgeFrom: 'md',
    columnWidth: 1100,
    isLoading: false,
  },
  argTypes: {
    count: { control: { type: 'range', min: 0, max: 30, step: 1 } },
    itemWidth: { control: 'object' },
    bleed: { control: 'select', options: ['none', 'sm', 'md'] },
    nudge: { control: 'select', options: ['auto', 'always', 'never'] },
    nudgeFrom: { control: 'select', options: ['xs', 'sm', 'md', 'lg', 'xl'] },
    columnWidth: { control: { type: 'range', min: 320, max: 1600, step: 10 } },
    isLoading: { control: 'boolean' },
  },
  decorators: [
    (Story) => (
      <Surface level="base" style={{ minHeight: '100%' }} className="py-gutter-sm">
        <Story />
      </Surface>
    ),
  ],
  render: ({ count, columnWidth, isLoading, ...props }) => (
    <View className="px-gutter-sm" style={{ width: '100%', maxWidth: columnWidth }}>
      {count === 0 ? (
        <EmptyState title="Nothing from yesterday" description="New videos land here." />
      ) : (
        <Shelf label="Yesterday" {...props}>
          {titlesFor(count).map((title) => (
            <ExampleCard key={title} title={title} isLoading={isLoading} />
          ))}
        </Shelf>
      )}
    </View>
  ),
}
export default meta
type Story = StoryObj<StoryArgs>

export const Default: Story = {}
