import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'jest-axe'
import { ExerciseHeading } from './ExerciseHeading'

const baseProps = {
  name: 'Seated Cable Row',
  sets: 5,
  reps: 8,
  load: 145,
  unit: 'lbs' as const,
  tempo: [3, 1, 2, 0] as [number, number, number, number],
  indicator: 'pr' as const,
}

describe('ExerciseHeading', () => {
  it('renders the exercise name', () => {
    render(<ExerciseHeading {...baseProps} />)
    expect(screen.getByTestId('exercise-card-name')).toHaveTextContent('Seated Cable Row')
  })

  it('renders the sets/reps/load line with separators', () => {
    render(<ExerciseHeading {...baseProps} />)
    const summary = screen.getByTestId('exercise-card-summary')
    expect(summary).toHaveTextContent('5')
    expect(summary).toHaveTextContent('8')
    expect(summary).toHaveTextContent('145')
    expect(summary).toHaveTextContent('×')
    expect(summary).toHaveTextContent('@')
  })

  it('renders the indicator chip when provided', () => {
    render(<ExerciseHeading {...baseProps} />)
    expect(screen.getByLabelText('Personal record')).toBeInTheDocument()
  })

  it('omits the indicator chip when absent', () => {
    render(<ExerciseHeading {...baseProps} indicator={undefined} />)
    expect(screen.queryByTestId('exercise-indicator')).not.toBeInTheDocument()
  })

  it('renders the TempoDisplay without its TEMPO caption when tempo is given', () => {
    render(<ExerciseHeading {...baseProps} />)
    expect(screen.getByTestId('tempo-display')).toBeInTheDocument()
    expect(screen.queryByText('TEMPO')).not.toBeInTheDocument()
  })

  it('omits the TempoDisplay when no tempo', () => {
    render(<ExerciseHeading {...baseProps} tempo={undefined} />)
    expect(screen.queryByTestId('tempo-display')).not.toBeInTheDocument()
  })

  it('fires onPress when the name row is pressed', () => {
    const onPress = vi.fn()
    render(<ExerciseHeading {...baseProps} onPress={onPress} />)
    fireEvent.click(screen.getByTestId('exercise-card-header'))
    expect(onPress).toHaveBeenCalledOnce()
  })

  it('dims the block when marked dimmed', () => {
    render(<ExerciseHeading {...baseProps} dimmed />)
    expect(screen.getByTestId('exercise-heading')).toHaveStyle({ opacity: 0.55 })
  })

  it('is full opacity by default', () => {
    render(<ExerciseHeading {...baseProps} />)
    expect(screen.getByTestId('exercise-heading')).toHaveStyle({ opacity: 1 })
  })

  describe('accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<ExerciseHeading {...baseProps} onPress={vi.fn()} />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})
