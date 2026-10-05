import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { composeStories } from '@storybook/react'
import * as trackStories from './ZoneTrack.stories'
import * as meterStories from './FatigueMeter.stories'
import * as landmarkStories from './VolumeLandmarkBar.stories'
import { ZoneTrack, type ZoneTrackProps, type ZoneTrackZone } from './ZoneTrack'
import { WORKOUT_TOKENS } from '../../../theme/workout-tokens'
import { Surface } from '../../ui/surface'

const { green, yellow, orange, red } = WORKOUT_TOKENS.scale

const ZONES: ZoneTrackZone[] = [
  { upTo: 60, color: green },
  { upTo: 70, color: yellow },
  { upTo: 80, color: orange },
  { upTo: 90, color: red },
]

const fixtures: Array<[string, Omit<ZoneTrackProps, 'zones' | 'max'>]> = [
  ['tick lines without labels', { ticks: [{ value: 60 }, { value: 75, emphasized: true }] }],
  ['needle below min', { min: 50, marker: { type: 'needle', value: 40 } }],
  ['needle above max', { min: 50, marker: { type: 'needle', value: 120, color: red } }],
  [
    'track colour with gradient fill',
    { min: 50, trackColor: red, marker: { type: 'fill', value: 72 } },
  ],
  ['glowing fill without colour', { min: 50, marker: { type: 'fill', value: 65, glow: true } }],
  [
    'wall density with overrides',
    {
      min: 50,
      size: 'wall',
      trackHeight: 30,
      needleOverhang: 12,
      marker: { type: 'needle', value: 78 },
      ticks: [{ value: 70, label: 'MID', emphasized: true }],
    },
  ],
]

const composed = [
  ...Object.entries(composeStories(trackStories)),
  ...Object.entries(composeStories(meterStories)),
  ...Object.entries(composeStories(landmarkStories)),
].map(([name, Story], i) => [`${i}:${name}`, Story] as const)

const { ColoredTooltipTicks } = composeStories(trackStories)

describe('ZoneTrack characterisation', () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: new Date('2026-01-01T00:00:00Z') })
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  describe.each(['dark', 'light'] as const)('on a %s surface', (theme) => {
    it.each(composed)('renders the %s story unchanged', (_name, Story) => {
      const { container } = render(
        <Surface theme={theme}>
          <Story />
        </Surface>
      )
      expect(container).toMatchSnapshot()
    })

    it.each(fixtures)('renders %s unchanged', (_name, props) => {
      const { container } = render(
        <Surface theme={theme}>
          <ZoneTrack zones={ZONES} max={90} {...props} />
        </Surface>
      )
      expect(container).toMatchSnapshot()
    })

    it('renders an open tick tooltip unchanged', () => {
      render(
        <Surface theme={theme}>
          <ColoredTooltipTicks />
        </Surface>
      )
      const trigger = screen.getByText('VL20').closest('[tabindex]') as HTMLElement
      fireEvent.mouseEnter(trigger)
      act(() => vi.runAllTimers())
      expect(screen.getByText('20% velocity loss — threshold')).toBeTruthy()
      expect(document.body).toMatchSnapshot()
    })
  })
})
