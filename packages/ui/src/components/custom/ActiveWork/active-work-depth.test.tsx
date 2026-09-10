// The depth contract of the five ActiveWork specimens, asserted against the
// stories Storybook actually renders — so a reverted decorator fails here too.
//
// The planes are asserted as INLINE STYLE on purpose. `Card` writes its
// background into `style`, so a `bg-*` className on a Card is discarded and only
// the inline value is real; asserting the class would pass while the render was
// wrong. That is the exact bug this migration removed. The values come from the
// ramp so a re-space moves them rather than breaking them.
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { composeStories } from '@storybook/react'
import { greyRamp } from '../../../theme/tokens/primitives'
import * as PortfolioStories from './PortfolioOverview.stories'
import * as TaskTableStories from './TaskTable.stories'
import * as SessionReaderStories from './SessionReader.stories'
import * as InitiativeReaderStories from './InitiativeReader.stories'
import * as ExplorerStories from './FileHistoryExplorer.stories'

/** The page plane a `<Surface level="base">` paints. */
const PAGE = greyRamp[925]
/** The card plane, two lifts above the page. */
const CARD = greyRamp[875]
/** One plane DOWN from a card, where a `CardInset` well sits. */
const WELL = greyRamp[900]

function expectLiftedCard(el: HTMLElement) {
  expect(el).toHaveStyle({ backgroundColor: CARD })
  expect(el.style.boxShadow).toContain('inset 0 1px 0')
  expect(el.style.borderTopWidth).toBe('')
}

function expectPage() {
  expect(screen.getByTestId('page-surface')).toHaveStyle({ backgroundColor: PAGE })
}

describe('T1 · PortfolioOverview depth', () => {
  const { Default } = composeStories(PortfolioStories)

  it('puts every KPI tile and initiative card on the lifted card plane', () => {
    render(<Default />)
    expectPage()
    for (const el of screen.getAllByTestId('portfolio-stat')) expectLiftedCard(el)
    for (const el of screen.getAllByTestId('initiative-card')) expectLiftedCard(el)
  })
})

describe('T2 · TaskTable depth', () => {
  const { Default } = composeStories(TaskTableStories)

  it('keeps the grid frame a hairline rule: no plane of its own, no lift', () => {
    render(<Default />)
    expectPage()
    const grid = screen.getByTestId('task-grid')
    expect(grid.style.backgroundColor).toBe('')
    expect(grid.style.boxShadow).toBe('')
  })
})

describe('M1 · Session reader depth', () => {
  const { Default } = composeStories(SessionReaderStories)

  it('lifts the detail card off the page and leaves the list on it', () => {
    render(<Default />)
    expectPage()
    expectLiftedCard(screen.getByTestId('session-detail'))
  })
})

describe('M2 · Initiative reader depth', () => {
  const { Default } = composeStories(InitiativeReaderStories)

  it('lifts all three reader cards onto the card plane', () => {
    render(<Default />)
    expectPage()
    const cards = screen.getAllByTestId('reader-card')
    expect(cards).toHaveLength(3)
    for (const el of cards) expectLiftedCard(el)
  })
})

describe('F1 · FileHistoryExplorer depth', () => {
  const { Default } = composeStories(ExplorerStories)

  it('lifts both panes and sinks the growth well one plane inside the detail', () => {
    render(<Default />)
    expectPage()
    expectLiftedCard(screen.getByTestId('file-list-pane'))
    expectLiftedCard(screen.getByTestId('file-activity-detail'))

    const well = screen.getByTestId('growth-well')
    expect(well).toHaveStyle({ backgroundColor: WELL })
    expect(well.style.boxShadow).toContain('inset')
    expect(well.style.boxShadow).not.toContain('inset 0 1px 0 rgba(255,255,255')
  })

  it('keeps co-change chips tone-only, so only the panes lift', () => {
    render(<Default />)
    const chip = screen.getAllByTestId('co-change-chip')[0]
    expect(chip).toHaveStyle({ backgroundColor: CARD })
    expect(chip.style.boxShadow).toBe('')
  })
})
