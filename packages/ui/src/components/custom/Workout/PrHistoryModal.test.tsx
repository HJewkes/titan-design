import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'jest-axe'
import { PrHistoryModal, type PrRecord } from './PrHistoryModal'

const records: PrRecord[] = [
  { type: 'e1rm', value: 245, unit: 'lbs', date: 'Mar 14', isRecent: true },
  { type: 'reps', value: '8 @ 185 lbs', date: 'Feb 28' },
  { type: 'velocity', value: '0.82 m/s', date: 'Jan 30' },
]

const baseProps = {
  exerciseId: 'bench-press',
  exerciseName: 'Bench Press',
  isOpen: true,
  records,
  onClose: vi.fn(),
}

describe('PrHistoryModal', () => {
  describe('rendering', () => {
    it('renders the sheet with title when open', () => {
      render(<PrHistoryModal {...baseProps} />)
      expect(screen.getByTestId('pr-history-modal')).toBeInTheDocument()
      expect(screen.getByTestId('pr-history-modal-title')).toHaveTextContent(
        'Bench Press PR history',
      )
    })

    it('does not render when closed', () => {
      render(<PrHistoryModal {...baseProps} isOpen={false} />)
      expect(screen.queryByTestId('pr-history-modal')).not.toBeInTheDocument()
    })

    it('supports the `visible` alias for visibility', () => {
      render(
        <PrHistoryModal
          exerciseId="bench-press"
          exerciseName="Bench Press"
          visible
          records={records}
          onClose={vi.fn()}
        />,
      )
      expect(screen.getByTestId('pr-history-modal')).toBeInTheDocument()
    })

    it('falls back to exerciseId when no name is given', () => {
      render(
        <PrHistoryModal
          exerciseId="deadlift"
          isOpen
          records={records}
          onClose={vi.fn()}
        />,
      )
      expect(screen.getByTestId('pr-history-modal-title')).toHaveTextContent(
        'deadlift PR history',
      )
    })

    it('renders a drag handle', () => {
      render(<PrHistoryModal {...baseProps} />)
      expect(screen.getByTestId('pr-history-modal-handle')).toBeInTheDocument()
    })
  })

  describe('records', () => {
    it('renders a row per record with type, value, and date', () => {
      render(<PrHistoryModal {...baseProps} />)
      expect(screen.getByTestId('pr-history-modal-record-0-type')).toHaveTextContent(
        'e1RM',
      )
      expect(screen.getByTestId('pr-history-modal-record-0-value')).toHaveTextContent(
        '245 lbs',
      )
      expect(screen.getByTestId('pr-history-modal-record-0-date')).toHaveTextContent(
        'Mar 14',
      )
    })

    it('renders pre-formatted string values verbatim', () => {
      render(<PrHistoryModal {...baseProps} />)
      expect(screen.getByTestId('pr-history-modal-record-1-value')).toHaveTextContent(
        '8 @ 185 lbs',
      )
    })

    it('renders one row per supplied record', () => {
      render(<PrHistoryModal {...baseProps} />)
      expect(screen.getByTestId('pr-history-modal-record-0')).toBeInTheDocument()
      expect(screen.getByTestId('pr-history-modal-record-1')).toBeInTheDocument()
      expect(screen.getByTestId('pr-history-modal-record-2')).toBeInTheDocument()
      expect(
        screen.queryByTestId('pr-history-modal-record-3'),
      ).not.toBeInTheDocument()
    })

    it('marks recent records in their accessible label', () => {
      render(<PrHistoryModal {...baseProps} />)
      expect(
        screen.getByLabelText('e1RM personal record: 245 lbs, Mar 14, recent'),
      ).toBeInTheDocument()
      expect(
        screen.getByLabelText('Reps personal record: 8 @ 185 lbs, Feb 28'),
      ).toBeInTheDocument()
    })

    it('shows an empty state when there are no records', () => {
      render(<PrHistoryModal {...baseProps} records={[]} />)
      expect(screen.getByTestId('pr-history-modal-empty')).toBeInTheDocument()
      expect(
        screen.queryByTestId('pr-history-modal-record-0'),
      ).not.toBeInTheDocument()
    })
  })

  describe('interaction', () => {
    it('calls onClose when the close button is pressed', () => {
      const onClose = vi.fn()
      render(<PrHistoryModal {...baseProps} onClose={onClose} />)
      fireEvent.click(screen.getByTestId('pr-history-modal-close'))
      expect(onClose).toHaveBeenCalledOnce()
    })
  })

  describe('accessibility', () => {
    it('exposes a dialog role labelled with the exercise', () => {
      render(<PrHistoryModal {...baseProps} />)
      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-label', 'Bench Press PR history')
    })

    it('labels the close affordance', () => {
      render(<PrHistoryModal {...baseProps} />)
      expect(screen.getByLabelText('Close PR history')).toBeInTheDocument()
    })

    it('has no accessibility violations', async () => {
      const { container } = render(<PrHistoryModal {...baseProps} />)
      expect(await axe(container)).toHaveNoViolations()
    })

    it('has no accessibility violations across all states (recent, plain, empty-safe)', async () => {
      const { container } = render(
        <PrHistoryModal
          exerciseId="squat"
          exerciseName="Back Squat"
          isOpen
          onClose={vi.fn()}
          records={[
            { type: 'e1rm', value: 405, unit: 'lbs', date: 'Today', isRecent: true },
            { type: 'weight', value: 365, unit: 'lbs', date: 'Last week' },
            { type: 'volume', value: '18,200 lbs', date: 'Mar 1' },
          ]}
        />,
      )
      expect(await axe(container)).toHaveNoViolations()
    })
  })
})
