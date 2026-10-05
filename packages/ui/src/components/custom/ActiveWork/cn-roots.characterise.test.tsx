import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import { composeStories } from '@storybook/react'
import { capturedClassNames } from '../../../test/classname-capture'
import * as coChangeChip from './CoChangeChip.stories'
import * as fileHistoryExplorer from './FileHistoryExplorer.stories'
import * as initiativeCard from './InitiativeCard.stories'
import * as portfolioOverview from './PortfolioOverview.stories'
import * as sessionListItem from './SessionListItem.stories'

const suites = {
  CoChangeChip: coChangeChip,
  FileHistoryExplorer: fileHistoryExplorer,
  InitiativeCard: initiativeCard,
  PortfolioOverview: portfolioOverview,
  SessionListItem: sessionListItem,
}

describe('ActiveWork root className characterisation', () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: new Date('2026-01-01T00:00:00Z') })
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  describe.each(Object.entries(suites))('%s', (_name, mod) => {
    it.each(Object.entries(composeStories(mod as never)))(
      'renders the %s story unchanged',
      (_s, Story) => {
        const Component = Story as React.ComponentType<{ testID?: string }>
        render(<Component testID="cn-root" />)
        const classLists = [...capturedClassNames]
          .map(([id, classes]) => [id, classes.split(/\s+/).filter(Boolean)] as const)
          .sort(([a], [b]) => a.localeCompare(b))
        expect(classLists).toMatchSnapshot()
      }
    )
  })
})
