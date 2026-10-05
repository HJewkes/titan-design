import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import { composeStories } from '@storybook/react'
import * as stories from './MesoStatusCard.stories'
import { MesoStatusCard, type MesoStatusCardProps } from './MesoStatusCard'
import { Surface } from '../../ui/surface'
import { capturedClassNames } from '../../../test/classname-capture'

const composed = composeStories(stories)
const storyEntries = Object.entries(composed)

const base = composed.Default.args as MesoStatusCardProps

const expectUnchanged = (container: HTMLElement) => {
  expect(container).toMatchSnapshot()
  expect(Object.fromEntries([...capturedClassNames].sort())).toMatchSnapshot()
}

const fixtures: [string, Partial<MesoStatusCardProps>][] = [
  ['success badge', { statusBadge: { label: 'Fine', variant: 'success' } }],
  ['warning badge', { statusBadge: { label: 'Watch', variant: 'warning' } }],
  ['error badge', { statusBadge: { label: 'Stop', variant: 'error' } }],
  ['info badge', { statusBadge: { label: 'Ahead', variant: 'info' } }],
  [
    'gauge levels at every edge',
    {
      gauges: [-0.2, NaN, 0.39, 0.4, 0.7, 1.5].map((level, i) => ({
        label: `G${i}`,
        level,
        sublabel: i % 2 === 0 ? 'Sub' : undefined,
      })),
    },
  ],
  ['coaching with no highlights', { coaching: { text: 'Hold steady.' } }],
  ['coaching with empty highlights', { coaching: { text: 'Hold steady.', highlights: [] } }],
  ['coaching with a blank highlight', { coaching: { text: 'Hold steady.', highlights: [''] } }],
  [
    'coaching with regex characters',
    {
      coaching: {
        text: 'Add +5 lb (RPE 8) then +5 lb (RPE 8) again.',
        highlights: ['+5 lb (RPE 8)', 'again.'],
      },
    },
  ],
  ['no metrics or gauges', { metrics: [], gauges: [] }],
  ['no coaching or next target', { coaching: undefined, nextTarget: undefined }],
  ['basis and className', { basis: 'basis line', className: 'mt-4' }],
]

describe('MesoStatusCard characterisation', () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: new Date('2026-01-01T00:00:00Z') })
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  describe.each(['dark', 'light'] as const)('on a %s surface', (theme) => {
    it.each(storyEntries)('renders the %s story unchanged', (_name, Story) => {
      const { container } = render(
        <Surface theme={theme}>
          <Story />
        </Surface>
      )
      expectUnchanged(container)
    })

    it.each(fixtures)('renders the %s fixture unchanged', (_name, overrides) => {
      const { container } = render(
        <Surface theme={theme}>
          <MesoStatusCard {...base} {...overrides} />
        </Surface>
      )
      expectUnchanged(container)
    })
  })
})
