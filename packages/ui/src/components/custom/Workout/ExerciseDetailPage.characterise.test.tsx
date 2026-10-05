import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { composeStories } from '@storybook/react'
import type { ReactElement } from 'react'
import * as stories from './ExerciseDetailPage.stories'
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

describe('ExerciseDetailPage characterisation', () => {
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

    it.each(storyEntries)('renders the %s story history then advanced tabs', (_name, Story) => {
      const container = renderOn(<Story />)
      click('exercise-detail-page-tab-history')
      expectUnchanged(container)
      click('exercise-detail-page-tab-advanced')
      expectUnchanged(container)
    })

    it('renders the Default story with the first progression card expanded', () => {
      const container = renderOn(<Default />)
      click('exercise-card')
      expect(screen.getByTestId('exercise-card-body')).toBeInTheDocument()
      expectUnchanged(container)
    })

    it('keeps each list expansion across a tab switch', () => {
      const container = renderOn(<Default />)
      click('exercise-card')
      click('exercise-detail-page-tab-history')
      click('exercise-card', 1)
      click('exercise-detail-page-tab-progress')
      expect(screen.getByTestId('exercise-card-body')).toBeInTheDocument()
      expectUnchanged(container)
      click('exercise-detail-page-tab-history')
      expectUnchanged(container)
    })

    it('renders empty lists and no e1RM pill', () => {
      const exercise = { ...Default.args.exercise!, currentE1rm: undefined }
      const container = renderOn(<Default exercise={exercise} progression={[]} history={[]} />)
      expectUnchanged(container)
      click('exercise-detail-page-tab-history')
      expectUnchanged(container)
    })
  })
})
