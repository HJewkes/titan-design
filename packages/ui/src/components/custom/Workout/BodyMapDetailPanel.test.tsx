import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'jest-axe'
import {
  BodyMapDetailPanel,
  type ContributingExercise,
  type UpcomingExercise,
} from './BodyMapDetailPanel'
import { MuscleGroup } from './muscleTaxonomy'

const contributing: ContributingExercise[] = [
  { name: 'Barbell Bench Press', sets: 4, contributionWeight: 1 },
  { name: 'Cable Fly', sets: 3, contributionWeight: 0.75 },
]

const upcoming: UpcomingExercise[] = [
  { name: 'Dips', workoutName: 'Push B', sets: 3 },
]

const baseProps = {
  muscleGroup: MuscleGroup.CHEST,
  displayName: 'Chest',
  weeklySets: 14,
  landmarks: { mev: 8, mav: 14, mrv: 20 },
  volumeStatus: 'productive' as const,
  lastTrained: '2 days ago',
  weeklyHistory: [8, 10, 12, 14],
  contributingExercises: contributing,
  upcomingExercises: upcoming,
  isOpen: true,
  onClose: vi.fn(),
}

describe('BodyMapDetailPanel', () => {
  describe('rendering', () => {
    it('renders the panel with the muscle title when open', () => {
      render(<BodyMapDetailPanel {...baseProps} />)
      expect(screen.getByTestId('body-map-detail-panel')).toBeInTheDocument()
      expect(screen.getByTestId('body-map-detail-panel-title')).toHaveTextContent('Chest')
    })

    it('does not render when closed', () => {
      render(<BodyMapDetailPanel {...baseProps} isOpen={false} />)
      expect(screen.queryByTestId('body-map-detail-panel')).not.toBeInTheDocument()
    })

    it('supports the `visible` alias for visibility', () => {
      const { isOpen: _isOpen, ...rest } = baseProps
      render(<BodyMapDetailPanel {...rest} visible />)
      expect(screen.getByTestId('body-map-detail-panel')).toBeInTheDocument()
    })

    it('renders the drag handle, status badge, and last-trained line', () => {
      render(<BodyMapDetailPanel {...baseProps} />)
      expect(screen.getByTestId('body-map-detail-panel-handle')).toBeInTheDocument()
      expect(screen.getByTestId('body-map-detail-panel-status-badge')).toHaveTextContent(
        'productive',
      )
      expect(screen.getByTestId('body-map-detail-panel-last-trained')).toHaveTextContent(
        'Last trained 2 days ago',
      )
    })

    it('shows the weekly set count and MRV suffix', () => {
      render(<BodyMapDetailPanel {...baseProps} />)
      expect(screen.getByTestId('body-map-detail-panel-set-count')).toHaveTextContent('14')
      expect(screen.getByTestId('body-map-detail-panel-mrv-suffix')).toHaveTextContent('/ 20 MRV')
    })
  })

  describe('volume bar', () => {
    it('positions the marker at the midpoint when sets sit between MEV and MRV', () => {
      // mev 8, mrv 20, sets 14 -> (14-8)/(20-8) = 0.5
      render(<BodyMapDetailPanel {...baseProps} />)
      const marker = screen.getByTestId('body-map-detail-panel-volume-marker')
      expect(marker.getAttribute('style') ?? '').toContain('left: 50%')
    })

    it('clamps the marker to the left edge below MEV', () => {
      render(<BodyMapDetailPanel {...baseProps} weeklySets={2} />)
      const marker = screen.getByTestId('body-map-detail-panel-volume-marker')
      expect(marker.getAttribute('style') ?? '').toContain('left: 0%')
    })

    it('clamps the marker to the right edge at or above MRV', () => {
      render(<BodyMapDetailPanel {...baseProps} weeklySets={24} />)
      const marker = screen.getByTestId('body-map-detail-panel-volume-marker')
      expect(marker.getAttribute('style') ?? '').toContain('left: 100%')
    })

    it('exposes the volume bar as a progressbar reflecting sets and landmarks', () => {
      render(<BodyMapDetailPanel {...baseProps} />)
      const bar = screen.getByTestId('body-map-detail-panel-volume-bar')
      expect(bar).toHaveAttribute('aria-valuenow', '14')
      expect(bar).toHaveAttribute('aria-valuemin', '8')
      expect(bar).toHaveAttribute('aria-valuemax', '20')
    })
  })

  describe('lists', () => {
    it('renders contributing exercises with sets and contribution', () => {
      render(<BodyMapDetailPanel {...baseProps} />)
      expect(screen.getByTestId('body-map-detail-panel-contributing-0-name')).toHaveTextContent(
        'Barbell Bench Press',
      )
      expect(screen.getByTestId('body-map-detail-panel-contributing-0-detail')).toHaveTextContent(
        '4 sets · 100%',
      )
      expect(screen.getByTestId('body-map-detail-panel-contributing-1-detail')).toHaveTextContent(
        '3 sets · 75%',
      )
    })

    it('renders upcoming exercises with workout name and sets', () => {
      render(<BodyMapDetailPanel {...baseProps} />)
      expect(screen.getByTestId('body-map-detail-panel-upcoming-0-name')).toHaveTextContent('Dips')
      expect(screen.getByTestId('body-map-detail-panel-upcoming-0-detail')).toHaveTextContent(
        'Push B · 3 sets',
      )
    })

    it('renders the volume sparkline when history is supplied', () => {
      render(<BodyMapDetailPanel {...baseProps} />)
      expect(screen.getByTestId('body-map-detail-panel-sparkline')).toBeInTheDocument()
    })

    it('does not crash and omits sections for empty optional arrays', () => {
      render(
        <BodyMapDetailPanel
          {...baseProps}
          contributingExercises={[]}
          upcomingExercises={[]}
          weeklyHistory={[]}
        />,
      )
      expect(screen.getByTestId('body-map-detail-panel')).toBeInTheDocument()
      expect(screen.queryByTestId('body-map-detail-panel-contributing')).not.toBeInTheDocument()
      expect(screen.queryByTestId('body-map-detail-panel-upcoming')).not.toBeInTheDocument()
      expect(screen.queryByTestId('body-map-detail-panel-sparkline')).not.toBeInTheDocument()
    })

    it('omits the last-trained line and view-exercises button when not provided', () => {
      const { lastTrained: _lt, ...rest } = baseProps
      render(<BodyMapDetailPanel {...rest} />)
      expect(screen.queryByTestId('body-map-detail-panel-last-trained')).not.toBeInTheDocument()
      expect(screen.queryByTestId('body-map-detail-panel-view-exercises')).not.toBeInTheDocument()
    })
  })

  describe('interaction', () => {
    it('calls onClose when the backdrop is pressed', () => {
      const onClose = vi.fn()
      render(<BodyMapDetailPanel {...baseProps} onClose={onClose} />)
      fireEvent.click(screen.getByTestId('body-map-detail-panel-backdrop'))
      expect(onClose).toHaveBeenCalledOnce()
    })

    it('calls onClose when the handle is pressed', () => {
      const onClose = vi.fn()
      render(<BodyMapDetailPanel {...baseProps} onClose={onClose} />)
      fireEvent.click(screen.getByTestId('body-map-detail-panel-handle'))
      expect(onClose).toHaveBeenCalledOnce()
    })

    it('calls onClose when the close button is pressed', () => {
      const onClose = vi.fn()
      render(<BodyMapDetailPanel {...baseProps} onClose={onClose} />)
      fireEvent.click(screen.getByTestId('body-map-detail-panel-close'))
      expect(onClose).toHaveBeenCalledOnce()
    })

    it('calls onViewExercises when the view button is pressed', () => {
      const onViewExercises = vi.fn()
      render(<BodyMapDetailPanel {...baseProps} onViewExercises={onViewExercises} />)
      fireEvent.click(screen.getByTestId('body-map-detail-panel-view-exercises'))
      expect(onViewExercises).toHaveBeenCalledOnce()
    })
  })

  describe('accessibility', () => {
    it('exposes a dialog role labelled with the muscle', () => {
      render(<BodyMapDetailPanel {...baseProps} />)
      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-label', 'Chest volume details')
    })

    it('labels the close affordances', () => {
      render(<BodyMapDetailPanel {...baseProps} />)
      expect(screen.getAllByLabelText('Close Chest details').length).toBeGreaterThan(0)
    })

    it('has no accessibility violations with full content', async () => {
      const { container } = render(
        <BodyMapDetailPanel {...baseProps} onViewExercises={vi.fn()} />,
      )
      expect(await axe(container)).toHaveNoViolations()
    })

    it('has no accessibility violations for each volume status', async () => {
      const statuses = ['under', 'maintenance', 'productive', 'over'] as const
      for (const volumeStatus of statuses) {
        const { container, unmount } = render(
          <BodyMapDetailPanel {...baseProps} volumeStatus={volumeStatus} />,
        )
        expect(await axe(container)).toHaveNoViolations()
        unmount()
      }
    })

    it('has no accessibility violations with only required props', async () => {
      const { container } = render(
        <BodyMapDetailPanel
          muscleGroup={MuscleGroup.CALVES}
          displayName="Calves"
          weeklySets={10}
          landmarks={{ mev: 6, mav: 10, mrv: 16 }}
          volumeStatus="maintenance"
          isOpen
          onClose={vi.fn()}
        />,
      )
      expect(await axe(container)).toHaveNoViolations()
    })
  })
})
