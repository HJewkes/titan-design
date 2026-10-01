import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'

import { Pill } from '../pill'
import { Progress } from '../progress'
import { Typography } from '../typography'
import { StatCard, StatCardHeader } from './StatCard'

interface StatCardStoryArgs {
  title: string
  status: string
  figure: string
  caption: string
  captionPlacement: 'beside' | 'below'
  inset: 'md' | 'lg'
  hasFigure: boolean
  hasBody: boolean
  isLoading: boolean
}

function StatCardStory(args: StatCardStoryArgs) {
  return (
    <View style={{ width: 420 }}>
      <StatCard
        elevation={1}
        inset={args.inset}
        isLoading={args.isLoading}
        captionPlacement={args.captionPlacement}
        header={
          <StatCardHeader
            title={args.title}
            trailing={
              <Pill tone="success" variant="subtle" size="sm" leading="dot">
                {args.status}
              </Pill>
            }
          />
        }
        figure={
          args.hasFigure ? (
            <Typography variant="h3" className="leading-none">
              {args.figure}
            </Typography>
          ) : undefined
        }
        caption={
          args.hasFigure && args.caption ? (
            <Typography variant="body2" color="secondary" className="text-sm">
              {args.caption}
            </Typography>
          ) : undefined
        }
        body={args.hasBody ? <Progress value={4} max={5} accessibilityLabel="4 of 5" /> : undefined}
      />
    </View>
  )
}

const meta: Meta<typeof StatCardStory> = {
  title: 'Components/Molecules/StatCard',
  component: StatCardStory,
  tags: ['autodocs', 'status:candidate', '!status:review'],
  args: {
    title: 'Training days',
    status: 'On track',
    figure: '4 of 5',
    caption: 'Due: 1 more by Sunday',
    captionPlacement: 'beside',
    inset: 'lg',
    hasFigure: true,
    hasBody: true,
    isLoading: false,
  },
  argTypes: {
    title: { control: 'text' },
    status: { control: 'text' },
    figure: { control: 'text' },
    caption: { control: 'text' },
    captionPlacement: { control: 'inline-radio', options: ['beside', 'below'] },
    inset: { control: 'inline-radio', options: ['md', 'lg'] },
    hasFigure: { control: 'boolean' },
    hasBody: { control: 'boolean' },
    isLoading: { control: 'boolean' },
  },
  parameters: {
    docs: {
      description: {
        component:
          '**Molecule.** The stat card template: a header row, a lead figure with one caption ' +
          '(beside it or below it) and a body pinned to the bottom, with every gap, the inset ' +
          'and the paint order set once here. Composes [Card](?path=/docs/components-molecules-card--docs) ' +
          '(elevation, loading skeleton) and [Typography](?path=/docs/foundations-typography--docs) ' +
          "(the header's overline title). Header and figure touch; the figure trims its own line " +
          'box with `leading-none`.\n\n' +
          '**States.** Loading: `isLoading` shows the Card skeleton. Empty: the consumer puts its ' +
          'empty line in `figure`. Error and disabled do not apply: the card holds no data of its ' +
          'own and does not press.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof StatCardStory>

export const Default: Story = {}
