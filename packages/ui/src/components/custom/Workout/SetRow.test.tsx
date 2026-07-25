import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { View } from 'react-native'
import { SetRow, type SetRowProps } from './SetRow'

// Literal-hex text treatments (dark theme neutral 100 / 400).
const T_ACTIVE = '#F3F4F6'
const T_MUTED = '#9CA3AF'

const doneRow: SetRowProps = {
  state: 'done',
  setNumber: 1,
  unit: 'lbs',
  reps: 8,
  weight: 135,
  rpe: 7.5,
  velocities: [1.1, 0.95, 0.82],
}

const liveRow: SetRowProps = {
  state: 'live',
  setNumber: 2,
  unit: 'lbs',
  target: { reps: 10, weight: 150 },
  reps: 4,
  weight: 150,
  velocities: [0.95, 0.9],
}

const todoRow: SetRowProps = {
  state: 'todo',
  setNumber: 3,
  unit: 'lbs',
  target: { reps: 10, weight: 150 },
}

describe('SetRow', () => {
  describe('done state', () => {
    it('renders set number, recorded reps and weight', () => {
      render(<SetRow {...doneRow} />)
      expect(screen.getByTestId('set-row')).toBeInTheDocument()
      expect(screen.getByTestId('set-row-set-number')).toHaveTextContent('1')
      expect(screen.getByTestId('set-row-reps')).toHaveTextContent('8')
      expect(screen.getByTestId('set-row-weight')).toHaveTextContent('135')
    })

    it('renders the RPE value', () => {
      render(<SetRow {...doneRow} rpe={9.5} />)
      expect(screen.getByTestId('set-row-rpe')).toHaveTextContent('9.5')
    })

    it('is muted (done + upcoming share one treatment)', () => {
      render(<SetRow {...doneRow} />)
      expect(screen.getByText('8')).toHaveStyle({ color: T_MUTED })
    })

    it('renders the flat compact strip (done reps, no todo stubs)', () => {
      render(<SetRow {...doneRow} />)
      expect(screen.getByTestId('velocity-strip-compact')).toBeInTheDocument()
      expect(screen.getAllByTestId(/^velocity-bar-\d+$/)).toHaveLength(3)
      expect(screen.queryByTestId('velocity-slot-todo')).not.toBeInTheDocument()
    })
  })

  describe('live state', () => {
    it('shows the TARGET reps and weight (no "reps-done/target")', () => {
      render(<SetRow {...liveRow} />)
      expect(screen.getByTestId('set-row-reps')).toHaveTextContent('10')
      expect(screen.getByTestId('set-row-weight')).toHaveTextContent('150')
      expect(screen.getByTestId('set-row-reps')).not.toHaveTextContent('4/10')
    })

    it('stands out by brightness (neutral 100)', () => {
      render(<SetRow {...liveRow} />)
      expect(screen.getByText('2')).toHaveStyle({ color: T_ACTIVE })
    })

    it('renders the velocity-height spotlight strip', () => {
      render(<SetRow {...liveRow} />)
      expect(screen.getByTestId('velocity-strip-spotlight')).toBeInTheDocument()
      // 2 performed reps + grey stubs to the target (10).
      expect(screen.getAllByTestId(/^velocity-bar-\d+$/)).toHaveLength(2)
      expect(screen.getAllByTestId('velocity-slot-todo')).toHaveLength(8)
    })
  })

  describe('todo state', () => {
    it('shows the target and a dash for RPE', () => {
      render(<SetRow {...todoRow} />)
      expect(screen.getByTestId('set-row-reps')).toHaveTextContent('10')
      expect(screen.getByTestId('set-row-weight')).toHaveTextContent('150')
      expect(screen.getByTestId('set-row-rpe')).toHaveTextContent('—')
    })

    it('is muted and renders an all-grey compact stub strip', () => {
      render(<SetRow {...todoRow} />)
      expect(screen.getByText('3')).toHaveStyle({ color: T_MUTED })
      expect(screen.getByTestId('velocity-strip-compact')).toBeInTheDocument()
      expect(screen.getAllByTestId('velocity-slot-todo')).toHaveLength(10)
      expect(screen.queryByTestId(/^velocity-bar-\d+$/)).not.toBeInTheDocument()
    })

    it('honors an explicit planned count for the stubs', () => {
      render(<SetRow {...todoRow} planned={6} />)
      expect(screen.getAllByTestId('velocity-slot-todo')).toHaveLength(6)
    })
  })

  describe('set type badge', () => {
    it('renders the set-type badge instead of the set number', () => {
      render(<SetRow {...doneRow} setType="W" />)
      expect(screen.getByTestId('set-row-type-badge')).toHaveTextContent('W')
    })

    it('does not render the type badge when setType is absent', () => {
      render(<SetRow {...doneRow} />)
      expect(screen.queryByTestId('set-row-type-badge')).not.toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('labels a done row with its recorded values', () => {
      render(<SetRow {...doneRow} />)
      expect(screen.getByLabelText('Set 1: 8 reps at 135 lbs')).toBeInTheDocument()
    })

    it('labels a live row as in progress against its target', () => {
      render(<SetRow {...liveRow} />)
      expect(screen.getByLabelText('Set 2: 10 reps at 150 lbs, in progress')).toBeInTheDocument()
    })

    it('labels a todo row as upcoming', () => {
      render(<SetRow {...todoRow} />)
      expect(screen.getByLabelText('Set 3: 10 reps at 150 lbs, upcoming')).toBeInTheDocument()
    })

    it('has no accessibility violations across states', async () => {
      const { container } = render(
        <View>
          <SetRow {...doneRow} />
          <SetRow {...liveRow} />
          <SetRow {...todoRow} />
        </View>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})
