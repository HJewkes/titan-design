import { describe, expect, it } from 'vitest'
import type { ComponentProps, ReactElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { fireEvent, render, screen } from '@testing-library/react'
import { composeStories } from '@storybook/react'
import * as stories from './CapacityBandChart.stories'
import {
  CapacityBandChart,
  type CapacityBandDataPoint,
  type CapacityBandProjection,
  type WorkoutDot,
} from './CapacityBandChart'
import { Surface } from '../../ui/surface'

const band: CapacityBandDataPoint[] = [
  { date: '2026-06-01', bandLow: 40, bandHigh: 70 },
  { date: '2026-06-05', bandLow: 44, bandHigh: 74 },
  { date: '2026-06-09', bandLow: 50, bandHigh: 80 },
  { date: '2026-06-13', bandLow: 54, bandHigh: 86 },
  { date: '2026-06-17', bandLow: 58, bandHigh: 90 },
  { date: '2026-06-21', bandLow: 60, bandHigh: 94 },
  { date: '2026-06-25', bandLow: 62, bandHigh: 96 },
]

const workouts: WorkoutDot[] = [
  { date: '2026-06-02', load: 58, status: 'within' },
  { date: '2026-06-06', load: 80, status: 'above' },
  { date: '2026-06-10', load: 66, status: 'within' },
  { date: '2026-06-14', load: 48, status: 'below' },
  { date: '2026-06-18', load: 76, status: 'within' },
  { date: '2026-06-23', load: 100, status: 'above' },
]

const projection: CapacityBandProjection = {
  withTraining: [
    { date: '2026-06-27', bandLow: 64, bandHigh: 99 },
    { date: '2026-06-29', bandLow: 67, bandHigh: 104 },
  ],
  withRest: [
    { date: '2026-06-27', bandLow: 56, bandHigh: 88 },
    { date: '2026-06-29', bandLow: 48, bandHigh: 78 },
  ],
}

type Props = ComponentProps<typeof CapacityBandChart>

const fixtures: Array<[string, Props]> = [
  ['a one-point band', { band: band.slice(0, 1), workouts, projection, width: 340, height: 200 }],
  ['a band without workouts', { band, workouts: [], width: 340, height: 200 }],
  ['one workout', { band, workouts: workouts.slice(0, 1), width: 340, height: 200 }],
  [
    'workouts out of date order',
    { band, workouts: [...workouts].reverse().slice(1), width: 340, height: 200 },
  ],
  ['a projection without a press handler', { band, workouts, projection, width: 340, height: 200 }],
  [
    'an empty projection',
    { band, workouts, projection: { withTraining: [], withRest: [] }, width: 340, height: 200 },
  ],
]

const composed = Object.entries(composeStories(stories))

// Under test RNW swaps in AnimatedMock, so every animation jumps to its end value
// once the effect starts it. Server markup runs no effects: it is the first frame.
const expectBothFrames = (element: ReactElement) => {
  expect(renderToStaticMarkup(element)).toMatchSnapshot('first frame')
  const { container } = render(element)
  expect(container).toMatchSnapshot('animated')
}

describe('CapacityBandChart characterisation (no loading, error or disabled state)', () => {
  describe.each(['dark', 'light'] as const)('on a %s surface', (theme) => {
    it.each(composed)('renders the %s story unchanged', (_name, Story) => {
      expectBothFrames(
        <Surface theme={theme}>
          <Story />
        </Surface>
      )
    })

    it.each(fixtures)('renders %s unchanged', (_name, props) => {
      expectBothFrames(
        <Surface theme={theme}>
          <CapacityBandChart {...props} />
        </Surface>
      )
    })

    it('renders the Interactive story after a dot press unchanged', () => {
      const { Interactive } = composeStories(stories)
      const { container } = render(
        <Surface theme={theme}>
          <Interactive />
        </Surface>
      )
      fireEvent.click(screen.getAllByTestId('capacity-band-chart-dot')[0])
      expect(container).toMatchSnapshot('pressed')
    })
  })
})
