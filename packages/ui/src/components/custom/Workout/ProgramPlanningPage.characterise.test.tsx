import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { composeStories } from '@storybook/react'
import type { ReactElement } from 'react'
import * as stories from './ProgramPlanningPage.stories'
import { Surface } from '../../ui/surface'
import { capturedClassNames } from '../../../test/classname-capture'

const composed = composeStories(stories)
const { Default } = composed
const storyEntries = Object.entries(composed)

const click = (testID: string, index = 0) => fireEvent.click(screen.getAllByTestId(testID)[index])

const expectUnchanged = (container: HTMLElement) => {
  expect(container).toMatchSnapshot()
  expect(Object.fromEntries([...capturedClassNames].sort())).toMatchSnapshot()
}

describe('ProgramPlanningPage characterisation', () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: new Date('2026-01-01T00:00:00Z') })
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  describe.each(['dark', 'light'] as const)('on a %s surface', (theme) => {
    const renderOn = (element: ReactElement) =>
      render(<Surface theme={theme}>{element}</Surface>).container

    it.each(storyEntries)('renders the %s story unchanged', (_name, Story) => {
      expectUnchanged(renderOn(<Story />))
    })

    it('drills meso -> week -> workout -> exercise and rewinds by breadcrumb', () => {
      const container = renderOn(<Default />)
      click('workout-pill-pressable')
      expectUnchanged(container)
      click('workout-card-toggle')
      expectUnchanged(container)
      click('exercise-card')
      expect(screen.getByTestId('exercise-card-body')).toBeInTheDocument()
      expectUnchanged(container)
      click('program-planning-page-crumb-week')
      expectUnchanged(container)
      click('program-planning-page-crumb-meso')
      expectUnchanged(container)
    })

    it('switches meso from the progress bar', () => {
      const container = renderOn(<Default />)
      click('meso-segment-m2')
      expectUnchanged(container)
    })

    it('renders an empty program', () => {
      expectUnchanged(renderOn(<Default mesos={[]} />))
    })
  })
})
