import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { InitiativeCard, type InitiativeState } from './InitiativeCard'

const base = {
  title: 'active-work — durable workspace state',
  slug: 'active-work',
  openCount: 4,
  severityCounts: { critical: 0, high: 1, medium: 2, low: 1 },
}

describe('InitiativeCard', () => {
  it('renders title, slug, and open count', () => {
    render(<InitiativeCard {...base} state="focused" />)
    expect(screen.getByText(base.title)).toBeInTheDocument()
    expect(screen.getByText(base.slug)).toBeInTheDocument()
    expect(screen.getByText('4 open')).toBeInTheDocument()
  })

  it('renders a rank pill only when rank is given', () => {
    const { rerender } = render(<InitiativeCard {...base} state="focused" rank={1} />)
    expect(screen.getByText('#1')).toBeInTheDocument()
    rerender(<InitiativeCard {...base} state="focused" />)
    expect(screen.queryByText('#1')).not.toBeInTheDocument()
  })

  it('renders the top task when given', () => {
    render(
      <InitiativeCard
        {...base}
        state="focused"
        topTask={{ id: 'AW-6', title: 'Discovery sources' }}
      />
    )
    expect(screen.getByText('AW-6')).toBeInTheDocument()
    expect(screen.getByText('Discovery sources')).toBeInTheDocument()
  })

  it('renders a fallback when there is no top task', () => {
    render(<InitiativeCard {...base} state="focused" topTask={undefined} />)
    expect(screen.getByText('no open tasks')).toBeInTheDocument()
  })

  it('labels every lifecycle state', () => {
    const states: InitiativeState[] = ['focused', 'backburner', 'paused', 'done']
    for (const state of states) {
      const { unmount } = render(<InitiativeCard {...base} state={state} />)
      unmount()
    }
  })

  it('omits the severity bar when all counts are zero', () => {
    render(
      <InitiativeCard
        {...base}
        state="done"
        severityCounts={{ critical: 0, high: 0, medium: 0, low: 0 }}
      />
    )
    expect(screen.queryByTestId('segmented-bar-segment')).not.toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<InitiativeCard {...base} state="focused" rank={1} />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
