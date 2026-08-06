import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { PortfolioOverview } from './PortfolioOverview'

const stats = [
  { value: '1', label: 'Focused' },
  { value: '4', label: 'Open tasks' },
]

const sections = [
  {
    heading: 'Focused · by rank',
    items: [
      {
        title: 'active-work — durable workspace state',
        slug: 'active-work',
        state: 'focused' as const,
        rank: 1,
        openCount: 4,
        severityCounts: { critical: 0, high: 1, medium: 2, low: 1 },
        topTask: { id: 'AW-6', title: 'Discovery sources' },
      },
    ],
  },
  {
    heading: 'Backburner',
    items: [
      {
        title: 'Denver Rezzy',
        slug: 'denver-rezzy',
        state: 'backburner' as const,
        openCount: 0,
        severityCounts: { critical: 0, high: 0, medium: 0, low: 0 },
      },
    ],
  },
]

describe('PortfolioOverview', () => {
  it('renders the title, subtitle, and KPI stats', () => {
    render(
      <PortfolioOverview
        title="Portfolio"
        subtitle="1 initiative · 4 open tasks"
        stats={stats}
        sections={[]}
      />
    )
    expect(screen.getByText('Portfolio')).toBeInTheDocument()
    expect(screen.getByText('1 initiative · 4 open tasks')).toBeInTheDocument()
    expect(screen.getByText('Focused')).toBeInTheDocument()
    expect(screen.getByText('Open tasks')).toBeInTheDocument()
  })

  it('renders every section heading and its initiative cards', () => {
    render(<PortfolioOverview title="Portfolio" stats={stats} sections={sections} />)
    expect(screen.getByText('Focused · by rank')).toBeInTheDocument()
    // "Backburner" appears twice: the section eyebrow and the card's StatusDot label.
    expect(screen.getAllByText('Backburner').length).toBeGreaterThanOrEqual(2)
    expect(screen.getByText('active-work — durable workspace state')).toBeInTheDocument()
    expect(screen.getByText('Denver Rezzy')).toBeInTheDocument()
  })

  it('renders with no sections at all', () => {
    render(<PortfolioOverview title="Portfolio" stats={stats} sections={[]} />)
    expect(screen.getByText('Portfolio')).toBeInTheDocument()
  })

  it('omits the subtitle when none is given', () => {
    render(<PortfolioOverview title="Portfolio" stats={stats} sections={[]} />)
    expect(screen.queryByText(/open tasks$/)).not.toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(
      <PortfolioOverview title="Portfolio" subtitle="Overview" stats={stats} sections={sections} />
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})
