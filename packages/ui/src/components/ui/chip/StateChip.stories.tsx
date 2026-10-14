import { useEffect, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { StateChip, type StateChipProps } from './StateChip'
import { CHIP_STATES } from './chipState'

type StoryArgs = StateChipProps & {
  /** 0 renders the app `size`; any other value renders at video scale, 40 px per 1080 px of frame. */
  frameHeight: number
  /** Loop `progress` 0 → 1 over `loopS` seconds, holding the end for a beat. Overrides the `progress` control. */
  autoplay: boolean
  loopS: number
}

const HOLD_S = 0.75

function useLoopProgress(on: boolean, loopS: number): number | undefined {
  const [progress, setProgress] = useState<number>()
  useEffect(() => {
    if (!on) return
    let frame = 0
    const start = performance.now()
    const tick = (now: number) => {
      const s = ((now - start) / 1000) % (loopS + HOLD_S)
      setProgress(Math.min(1, s / loopS))
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [on, loopS])
  return on ? progress : undefined
}

const meta: Meta<StoryArgs> = {
  title: 'Components/Molecules/StateChip',
  component: StateChip,
  tags: ['autodocs', 'status:candidate', '!status:review'],
  args: {
    text: 'ci:green@h',
    state: 'met',
    from: 'unmet',
    progress: 0.8,
    size: 'md',
    frameHeight: 0,
    autoplay: false,
    loopS: 1,
  },
  argTypes: {
    text: { control: 'text' },
    state: { control: 'select', options: [...CHIP_STATES] },
    from: { control: 'select', options: [undefined, ...CHIP_STATES] },
    progress: { control: { type: 'range', min: 0, max: 1, step: 0.01 } },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    frameHeight: { control: { type: 'select' }, options: [0, 720, 1080, 1440, 2160] },
    autoplay: { control: 'boolean' },
    loopS: { control: { type: 'number', min: 0.25, max: 4, step: 0.25 } },
    fontPx: { control: false },
  },
  render: function Render({ frameHeight, autoplay, loopS, progress, ...args }) {
    const looped = useLoopProgress(autoplay, loopS)
    return (
      <StateChip
        {...args}
        progress={looped ?? progress}
        fontPx={frameHeight ? (40 * frameHeight) / 1080 : undefined}
      />
    )
  },
  parameters: {
    docs: {
      description: {
        component:
          '**Molecule**. A [Pill](?path=/docs/components-atoms-pill--docs) preset: the subtle tone capsule ' +
          'reads met (success) or unmet (neutral, dashed border). With `from` and `progress` it draws the ' +
          'change: entering met fills to warning left to right, then turns to success; leaving met ' +
          'cross-fades back with no fill. The accessible name is `text: state` at once. Turn on `autoplay` ' +
          'to loop the change, or set `frameHeight` for video scale. Loading, empty, error and disabled do ' +
          'not apply: the chip is a pure function of its props.',
      },
    },
  },
}
export default meta
type Story = StoryObj<StoryArgs>

export const Default: Story = {}
