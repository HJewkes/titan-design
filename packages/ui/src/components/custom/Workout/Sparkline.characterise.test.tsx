import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import { composeStories } from '@storybook/react'
import * as stories from './Sparkline.stories'
import { Sparkline, type SparklineProps } from './Sparkline'
import { Surface } from '../../ui/surface'

const DATA = [3, 5, 4, 8, 6, 9]
const REF = '#ff00ff'

const fixtures: Array<[string, SparklineProps]> = [
  ['empty data', { data: [] }],
  ['one point', { data: [4], showDots: true }],
  [
    'x values and both domains',
    { data: DATA, xValues: [0, 1, 2, 4, 7, 8], domain: { x: [0, 12], y: [0, 12] } },
  ],
  ['band without colour', { data: DATA, band: { from: 4, to: 7 } }],
  ['reversed band with colour', { data: DATA, band: { from: 8, to: 5, color: REF } }],
  [
    'dashed labelled reference on the left',
    {
      data: DATA,
      referenceLines: [
        { value: 7, color: REF, dashed: true, label: 'GOAL' },
        { value: 4, color: REF },
      ],
      referenceLabelPlacement: 'left',
    },
  ],
  ['colour override with dots', { data: DATA, color: REF, showDots: true, highlightLast: true }],
]

const composed = Object.entries(composeStories(stories))

describe('Sparkline characterisation', () => {
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
          <Sparkline {...props} />
        </Surface>
      )
      expect(container).toMatchSnapshot()
    })
  })
})
