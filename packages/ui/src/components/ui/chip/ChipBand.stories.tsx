import { useEffect, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { ChipBand, type ChipBandProps } from './ChipBand'
import { beatFixture } from './__fixtures__/evidence-chips'

const LOOP_S = 1.5

type StoryArgs = ChipBandProps & {
  /** Loops `progress` from 0 to 1.5 s; the scrubber is ignored while it plays. */
  autoplay: boolean
}

function useLoopedProgress(autoplay: boolean, scrubbed: number): number {
  const [playing, setPlaying] = useState(0)
  useEffect(() => {
    if (!autoplay) return
    let frame = 0
    const origin = performance.now()
    const tick = (now: number) => {
      setPlaying(((now - origin) / 1000) % LOOP_S)
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [autoplay])
  return autoplay ? playing : scrubbed
}

const meta: Meta<StoryArgs> = {
  title: 'Components/Molecules/ChipBand',
  component: ChipBand,
  tags: ['autodocs', 'status:candidate', '!status:review'],
  args: {
    chips: beatFixture('a7-9-machine').chips,
    width: 1800,
    frameHeight: 1080,
    max: 3,
    progress: LOOP_S,
    autoplay: false,
    entry: 'rise',
    reducedMotion: false,
  },
  argTypes: {
    chips: { control: 'object' },
    width: { control: { type: 'range', min: 900, max: 3600, step: 10 } },
    frameHeight: { control: 'select', options: [1080, 1440, 2160] },
    max: { control: { type: 'number', min: 1, max: 6 } },
    progress: { control: { type: 'range', min: 0, max: LOOP_S, step: 0.01 } },
    autoplay: { control: 'boolean' },
    entry: { control: 'inline-radio', options: ['rise', 'fade'] },
    reducedMotion: { control: 'boolean' },
  },
  render: function Render({ autoplay, progress, ...args }) {
    return <ChipBand {...args} progress={useLoopedProgress(autoplay, progress)} />
  },
  parameters: {
    docs: {
      description: {
        component:
          '**Molecule**. One beat’s citations on one line at video scale. Composes ' +
          '[EvidenceChip](?path=/docs/components-molecules-evidencechip--docs) for the lead and its kind ' +
          'capsule for the tabs, and a [Pill](?path=/docs/components-atoms-pill--docs) for the `+d` count. ' +
          '`progress` is the scrubber; `autoplay` loops it.',
      },
    },
  },
}
export default meta
type Story = StoryObj<StoryArgs>

export const Default: Story = {}
