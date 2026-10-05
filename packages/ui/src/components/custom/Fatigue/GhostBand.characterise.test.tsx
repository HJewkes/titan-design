import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import { composeStories } from '@storybook/react'
import { GhostBand, BAND_H, type GhostBandProps } from './GhostBand'
import * as sparkStories from './GhostSpark.stories'
import * as cardStories from './LiveFatigueCard.stories'
import * as panelStories from './LiveFatiguePanel.stories'
import { Surface } from '../../ui/surface'
import type { PhaseSegment } from './fatigue-model'

const x = (ms: number) => 12 + (ms / 4000) * 300
const TEMPO: [number, number, number, number] = [2.6, 0.4, 0.95, 0.28]

const seamed: PhaseSegment[] = [
  { phase: 'eccentric', startMs: 0, endMs: 1182 },
  { phase: 'idle', startMs: 1273, endMs: 1600 },
  { phase: 'concentric', startMs: 1691, endMs: 3545 },
]
const onPace: PhaseSegment[] = [
  { phase: 'eccentric', startMs: 0, endMs: 2600 },
  { phase: 'hold', startMs: 2600, endMs: 3000 },
  { phase: 'concentric', startMs: 3000, endMs: 3950 },
]
const fast: PhaseSegment[] = [{ phase: 'eccentric', startMs: 0, endMs: 1300 }]
const slow: PhaseSegment[] = [{ phase: 'eccentric', startMs: 0, endMs: 9000 }]
const narrowHold: PhaseSegment[] = [
  { phase: 'hold', startMs: 0, endMs: 80 },
  { phase: 'idle', startMs: 80, endMs: 600 },
]
const tooNarrow: PhaseSegment[] = [
  { phase: 'eccentric', startMs: 0, endMs: 100 },
  { phase: 'concentric', startMs: 100, endMs: 2000 },
]
const zeroWidth: PhaseSegment[] = [
  { phase: 'idle', startMs: 500, endMs: 500 },
  { phase: 'hold', startMs: 700, endMs: 700 },
]

const bands: Array<[string, PhaseSegment[], Partial<GhostBandProps>]> = [
  ['default band', seamed, {}],
  ['labelled band', seamed, { showLabels: true }],
  ['label colour', seamed, { showLabels: true, labelColor: '#ff00ff' }],
  ['on pace', onPace, { targetTempoSeconds: TEMPO, showLabels: true }],
  ['fast phase', fast, { targetTempoSeconds: TEMPO, showLabels: true }],
  ['slow phase', slow, { targetTempoSeconds: TEMPO, showLabels: true }],
  ['prescribed', onPace, { targetTempoSeconds: TEMPO, prescribed: true, showLabels: true }],
  ['narrow hold beside idle', narrowHold, { showLabels: true }],
  ['run too narrow for its label', tooNarrow, { showLabels: true }],
  ['every run zero-width', zeroWidth, { showLabels: true }],
  ['custom height', seamed, { height: 28, showLabels: true }],
]

const composed = [
  ...Object.entries(composeStories(sparkStories)),
  ...Object.entries(composeStories(cardStories)),
  ...Object.entries(composeStories(panelStories)),
].map(([name, Story], i) => [`${i}:${name}`, Story] as const)

describe('GhostBand characterisation', () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: new Date('2026-01-01T00:00:00Z') })
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  describe.each(['dark', 'light'] as const)('on a %s surface', (theme) => {
    it.each(bands)('renders %s unchanged', (_name, segments, props) => {
      const { container } = render(
        <Surface theme={theme}>
          <svg>
            <GhostBand segments={segments} x={x} top={0} height={BAND_H} {...props} />
          </svg>
        </Surface>
      )
      expect(container).toMatchSnapshot()
    })

    it.each(composed)('renders the %s story unchanged', (_name, Story) => {
      const { container } = render(
        <Surface theme={theme}>
          <Story />
        </Surface>
      )
      expect(container).toMatchSnapshot()
    })
  })
})
