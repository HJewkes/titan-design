import type { Meta, StoryObj } from '@storybook/react-vite'
import React from 'react'
import { View } from 'react-native'
import { Card } from '../card'
import { Chip } from '../chip'
import { Typography } from '../typography'
import { BeatStage } from './BeatStage'
import { stageBox, type StageChrome } from './stage-box'

const FRAMES = { '1080p': { width: 1920, height: 1080 }, '1440p': { width: 2560, height: 1440 } }

interface Args {
  resolution: keyof typeof FRAMES
  headline: 'body' | 'title'
  headerAt: 'top' | 'bottom'
  chipRows: 0 | 1 | 2
  chipBand: 'in keep-out' | 'above keep-out'
  keepOut: boolean
  units: 'canvas' | 'frame'
  captions: boolean
  seed: number
}

const STAGES = [
  { name: 'Ingest', value: '12 ms', elevation: 1 },
  { name: 'Transform', value: '48 ms', elevation: 2 },
  { name: 'Publish', value: '9 ms', elevation: 3 },
] as const

function Header({ headline }: Pick<Args, 'headline'>) {
  if (headline === 'body') {
    return (
      <Typography variant="h2" className="text-2xl">
        Four stages share one queue
      </Typography>
    )
  }
  return (
    <View className="gap-1">
      <Typography variant="h2">Four stages share one queue</Typography>
      <Typography variant="body1" color="secondary" className="text-xl">
        Every job waits for the slowest one
      </Typography>
    </View>
  )
}

function StageCards() {
  return (
    <View className="flex-row gap-4 px-8 pt-4">
      {STAGES.map(({ name, value, elevation }) => (
        <Card key={name} elevation={elevation} className="flex-1 gap-1 p-4">
          <Typography variant="h3">{name}</Typography>
          <Typography variant="body1" className="font-heading text-4xl font-bold">
            {value}
          </Typography>
        </Card>
      ))}
    </View>
  )
}

function Chips({ rows }: { rows: number }) {
  return (
    <View className="gap-[7px]">
      <View className="flex-row gap-2">
        {['measured', 'docs claim', '+2 more'].map((label) => (
          <Chip key={label} size="md">
            {label}
          </Chip>
        ))}
      </View>
      {rows === 2 ? (
        <Typography variant="body1" color="secondary">
          Chapter 2 of 5 · The queue
        </Typography>
      ) : null}
    </View>
  )
}

// Story-only: a burnt-in caption where a player draws one, to judge what may sit under it.
function CaptionPill({ resolution, chrome }: Pick<Args, 'resolution'> & { chrome: StageChrome }) {
  const { keepOut } = stageBox(FRAMES[resolution], chrome)
  return (
    <View
      pointerEvents="none"
      className="absolute items-center"
      style={{ left: 0, right: 0, top: keepOut.y + keepOut.height * 0.35 }}
    >
      <View className="rounded-md bg-background-frame px-6 py-2">
        <Typography variant="h4">and that is where the time goes.</Typography>
      </View>
    </View>
  )
}

function chromeOf(args: Args): StageChrome {
  const above = args.chipBand === 'above keep-out'
  return {
    header: { headline: args.headline, sub: args.headline === 'title' },
    headerAt: args.headerAt,
    chipRows: above ? 0 : args.chipRows,
    keepOutFraction: args.keepOut ? undefined : 1,
  }
}

function Render(args: Args) {
  const chrome = chromeOf(args)
  const above = args.chipBand === 'above keep-out' && args.chipRows > 0
  return (
    <View className="relative self-start">
      <BeatStage
        frame={FRAMES[args.resolution]}
        chrome={chrome}
        units={args.units}
        seed={args.seed}
        label="queue"
        header={<Header headline={args.headline} />}
        chips={above ? undefined : <Chips rows={args.chipRows} />}
      >
        <View className="flex-1 justify-between">
          <StageCards />
          {above ? (
            <View className="px-[30px] pb-[10px]">
              <Chips rows={args.chipRows} />
            </View>
          ) : null}
        </View>
      </BeatStage>
      {args.captions ? <CaptionPill resolution={args.resolution} chrome={chrome} /> : null}
    </View>
  )
}

const meta: Meta<Args> = {
  title: 'Components/Organisms/BeatStage',
  component: BeatStage as unknown as React.ComponentType<Args>,
  tags: ['autodocs', 'status:candidate', '!status:review'],
  args: {
    resolution: '1080p',
    headline: 'body',
    headerAt: 'top',
    chipRows: 2,
    chipBand: 'in keep-out',
    keepOut: true,
    units: 'canvas',
    captions: false,
    seed: 0,
  },
  argTypes: {
    resolution: { control: 'select', options: Object.keys(FRAMES) },
    headline: { control: 'select', options: ['body', 'title'] },
    headerAt: { control: 'select', options: ['top', 'bottom'] },
    chipRows: { control: 'select', options: [0, 1, 2] },
    chipBand: { control: 'select', options: ['in keep-out', 'above keep-out'] },
    keepOut: { control: 'boolean' },
    units: { control: 'select', options: ['canvas', 'frame'] },
    captions: { control: 'boolean' },
    seed: { control: { type: 'number', min: 0, step: 1 } },
  },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '**Organism.** Composes [AmbientStage](?path=/docs/components-organisms-ambientstage--docs) ' +
          'inside a `base` [Surface](?path=/docs/components-atoms-surface--docs), with ' +
          '[Card](?path=/docs/components-molecules-card--docs) `elevation` 1, 2 and 3 on the stage, ' +
          '[Typography](?path=/docs/foundations-typography--docs) in the header and a ' +
          '[Chip](?path=/docs/components-atoms-chip--docs) row standing in for the chip band. ' +
          '`stageBox` places a header band, the stage, a chip band and an 83% caption keep-out; ' +
          '`keepOut` off ends the stage at the chip band instead. `canvas` units lay the slots out ' +
          'on a 540-high canvas scaled to the frame, so `h2` reads 96 px at 1080. `captions` draws a ' +
          'story-only caption in the keep-out. Loading and disabled do not apply; an empty stage is ' +
          'legal, and the error state is the overflow throw in development.',
      },
    },
  },
  render: Render,
}
export default meta
type Story = StoryObj<Args>

export const Default: Story = {}
