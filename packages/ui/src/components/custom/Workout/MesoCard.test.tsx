import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'jest-axe'
import { MesoCard } from './MesoCard'
import type { WeekRowProps } from './WeekRow'

const weeks: WeekRowProps[] = [
  {
    weekNumber: 1,
    totalWeeks: 4,
    workouts: [
      { name: 'Upper', status: 'completed' },
      { name: 'Lower', status: 'completed' },
    ],
    intensityLevel: 0.4,
  },
  {
    weekNumber: 2,
    totalWeeks: 4,
    workouts: [
      { name: 'Upper', status: 'current' },
      { name: 'Lower', status: 'upcoming' },
    ],
    intensityLevel: 0.6,
  },
]

const baseProps = {
  name: 'Accumulation',
  goal: 'Hypertrophy',
  split: 'Upper/Lower',
  weekRange: 'Weeks 1-4',
  totalWeeks: 4,
  weeks,
}

describe('MesoCard', () => {
  describe('rendering', () => {
    it('renders name, goal badge, and sub-header', () => {
      render(<MesoCard {...baseProps} />)
      expect(screen.getByTestId('meso-card')).toBeInTheDocument()
      expect(screen.getByTestId('meso-card-name')).toHaveTextContent('Accumulation')
      expect(screen.getByTestId('meso-card-goal-badge')).toHaveTextContent('Hypertrophy')
      expect(screen.getByTestId('meso-card-subheader')).toHaveTextContent('Upper/Lower · Weeks 1-4')
    })

    it('renders the 3px gradient top accent', () => {
      render(<MesoCard {...baseProps} />)
      expect(screen.getByTestId('meso-card-accent')).toBeInTheDocument()
    })
  })

  describe('expansion', () => {
    it('does not render week list when collapsed', () => {
      render(<MesoCard {...baseProps} />)
      expect(screen.queryByTestId('meso-card-weeks')).not.toBeInTheDocument()
    })

    it('renders the week list when expanded', () => {
      render(<MesoCard {...baseProps} expanded />)
      expect(screen.getByTestId('meso-card-weeks')).toBeInTheDocument()
      expect(screen.getAllByTestId('week-row')).toHaveLength(2)
    })

    it('marks header as a button and fires onToggle', () => {
      const onToggle = vi.fn()
      render(<MesoCard {...baseProps} onToggle={onToggle} />)
      const toggle = screen.getByTestId('meso-card-toggle')
      expect(toggle).toHaveAttribute('aria-expanded', 'false')
      fireEvent.click(toggle)
      expect(onToggle).toHaveBeenCalledOnce()
    })

    it('reflects expanded state via aria-expanded', () => {
      const onToggle = vi.fn()
      render(<MesoCard {...baseProps} onToggle={onToggle} expanded />)
      expect(screen.getByTestId('meso-card-toggle')).toHaveAttribute('aria-expanded', 'true')
    })

    it('renders a static container when not expandable', () => {
      render(<MesoCard {...baseProps} />)
      expect(screen.getByTestId('meso-card-static')).toBeInTheDocument()
      expect(screen.queryByTestId('meso-card-toggle')).not.toBeInTheDocument()
    })

    it('derives current week marker from currentWeek prop', () => {
      render(<MesoCard {...baseProps} currentWeek={2} expanded />)
      expect(screen.getByTestId('week-row-current-dot')).toBeInTheDocument()
    })
  })

  describe('volume heatmap', () => {
    it('renders a heatmap cell per muscle group', () => {
      render(
        <MesoCard
          {...baseProps}
          volumeHeatmap={[
            { group: 'chest', percentage: 80 },
            { group: 'back', percentage: 50 },
            { group: 'legs', percentage: 30 },
          ]}
        />
      )
      expect(screen.getByTestId('meso-card-heatmap')).toBeInTheDocument()
      expect(screen.getAllByTestId('meso-card-heatmap-cell')).toHaveLength(3)
    })

    it('does not render heatmap when no data provided', () => {
      render(<MesoCard {...baseProps} />)
      expect(screen.queryByTestId('meso-card-heatmap')).not.toBeInTheDocument()
    })
  })

  describe('highlighted state', () => {
    it('applies a brand-primary border color when highlighted', () => {
      render(<MesoCard {...baseProps} highlighted />)
      const card = screen.getByTestId('meso-card')
      const style = card.getAttribute('style') ?? ''
      expect(style).toContain('box-shadow')
    })
  })

  describe('accessibility', () => {
    it('has an accessible label describing the meso', () => {
      render(<MesoCard {...baseProps} />)
      expect(screen.getByLabelText('Accumulation, Hypertrophy, Weeks 1-4')).toBeInTheDocument()
    })

    it('exposes the label on the button when expandable', () => {
      render(<MesoCard {...baseProps} onToggle={vi.fn()} />)
      const toggle = screen.getByLabelText('Accumulation, Hypertrophy, Weeks 1-4')
      expect(toggle).toHaveAttribute('role', 'button')
    })

    it('has no accessibility violations', async () => {
      const { container } = render(<MesoCard {...baseProps} />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('has no accessibility violations when expanded with all features', async () => {
      const { container } = render(
        <MesoCard
          {...baseProps}
          currentWeek={2}
          onToggle={vi.fn()}
          expanded
          highlighted
          volumeHeatmap={[
            { group: 'chest', percentage: 80 },
            { group: 'back', percentage: 50 },
          ]}
        />
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})
