import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { InitiativeHeader } from './InitiativeHeader'

describe('InitiativeHeader', () => {
  it('renders the title, slug, state, rank, ship target and updated date', () => {
    render(
      <InitiativeHeader
        title="active-work — durable workspace state"
        slug="active-work"
        state="focused"
        rank={1}
        shipTarget="2026-Q3"
        updated="2026-07-12"
      />
    )
    expect(screen.getByText('active-work — durable workspace state')).toBeInTheDocument()
    expect(screen.getByText('active-work')).toBeInTheDocument()
    expect(screen.getByText('Focused')).toBeInTheDocument()
    expect(screen.getByText('#1')).toBeInTheDocument()
    expect(screen.getByText('ship 2026-Q3')).toBeInTheDocument()
    expect(screen.getByText('Jul 12, 2026')).toBeInTheDocument()
  })

  it('drops rank, ship target and updated when absent', () => {
    render(<InitiativeHeader title="Quiet" slug="quiet" state="backburner" />)
    expect(screen.getByText('Backburner')).toBeInTheDocument()
    expect(screen.queryByText(/^#/)).not.toBeInTheDocument()
    expect(screen.queryByText(/^ship/)).not.toBeInTheDocument()
    expect(screen.queryByText('updated')).not.toBeInTheDocument()
  })

  it('has no a11y violations', async () => {
    const { container } = render(
      <InitiativeHeader title="active-work" slug="active-work" state="focused" rank={1} />
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})
