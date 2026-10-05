import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ComponentProps } from 'react'
import { render } from '@testing-library/react'
import { composeStories } from '@storybook/react'
import * as stories from './DualGhostSpark.stories'
import { DualGhostSpark } from './DualGhostSpark'
import { buildMockModel, TARGET_TEMPO_SECONDS } from './fatigue-mock'
import { Surface } from '../../ui/surface'

const CURVES = buildMockModel(2).velocityCurves

const fixtures: Array<[string, Partial<ComponentProps<typeof DualGhostSpark>>]> = [
  ['device labels hidden', { showDeviceLabels: false }],
  ['custom device labels', { leftLabel: 'L ARM', rightLabel: 'R ARM' }],
  ['band pacing', { targetTempoSeconds: TARGET_TEMPO_SECONDS }],
  ['left only', { right: [] }],
  ['right only', { left: [] }],
  ['custom height', { height: 120 }],
]

const composed = Object.entries(composeStories(stories))

describe('DualGhostSpark characterisation', () => {
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
          <DualGhostSpark left={CURVES} right={CURVES} width={360} {...props} />
        </Surface>
      )
      expect(container).toMatchSnapshot()
    })
  })
})
