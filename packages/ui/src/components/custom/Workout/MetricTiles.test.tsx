import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { MetricTiles } from './MetricTiles'

const STATS = [
  { label: 'Volume', value: '76%' },
  { label: 'Load', value: '7.3k' },
  { label: 'Fatigue', value: 'MOD', valueColor: '#F5A623' },
]

describe('MetricTiles', () => {
  it('renders a tile per metric', () => {
    render(<MetricTiles metrics={STATS} />)
    expect(screen.getByText('Volume')).toBeInTheDocument()
    expect(screen.getByText('76%')).toBeInTheDocument()
    expect(screen.getByText('Load')).toBeInTheDocument()
    expect(screen.getByText('7.3k')).toBeInTheDocument()
    expect(screen.getByText('Fatigue')).toBeInTheDocument()
    expect(screen.getByText('MOD')).toBeInTheDocument()
  })

  it('passes valueColor through to the tile value', () => {
    render(<MetricTiles metrics={STATS} />)
    expect(screen.getByText('MOD')).toHaveStyle({ color: '#F5A623' })
  })

  it('does not tint values without a valueColor', () => {
    render(<MetricTiles metrics={STATS} />)
    expect(screen.getByText('76%').style.color).toBe('')
  })

  it('reflows an arbitrary count of metrics', () => {
    render(
      <MetricTiles
        metrics={[
          { label: 'Time', value: '6:30 PM' },
          { label: 'Until', value: '5h' },
        ]}
      />
    )
    expect(screen.getByText('6:30 PM')).toBeInTheDocument()
    expect(screen.getByText('5h')).toBeInTheDocument()
  })

  it('passes additional props through', () => {
    render(<MetricTiles metrics={STATS} testID="metric-tiles" />)
    expect(screen.getByText('Volume')).toBeInTheDocument()
  })

  describe('accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<MetricTiles metrics={STATS} />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})
