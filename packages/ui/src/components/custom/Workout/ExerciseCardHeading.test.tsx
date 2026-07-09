import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'jest-axe'
import { ExerciseCardHeading } from './ExerciseCardHeading'
import type { SetStripSet } from './SetStrip'

const setStates: SetStripSet[] = [
  { status: 'done', velocities: [1, 0.9] },
  { status: 'active', velocities: [0.6], planned: 8 },
]

const baseProps = {
  name: 'Cable Chest Press',
  sets: 3,
  reps: 10,
  load: 90,
  unit: 'lbs' as const,
  tempo: [2, 1, 2, 0] as [number, number, number, number],
  indicator: 'info' as const,
  setStates,
}

describe('ExerciseCardHeading', () => {
  it('composes the heading info block and the per-set strip', () => {
    render(<ExerciseCardHeading {...baseProps} />)
    expect(screen.getByTestId('exercise-card')).toBeInTheDocument()
    expect(screen.getByTestId('exercise-heading')).toBeInTheDocument()
    expect(screen.getByTestId('exercise-card-strip')).toBeInTheDocument()
    expect(screen.getByTestId('set-strip')).toBeInTheDocument()
  })

  it('renders the name and the sets/reps/load line', () => {
    render(<ExerciseCardHeading {...baseProps} />)
    expect(screen.getByTestId('exercise-card-name')).toHaveTextContent('Cable Chest Press')
    const summary = screen.getByTestId('exercise-card-summary')
    expect(summary).toHaveTextContent('3')
    expect(summary).toHaveTextContent('10')
    expect(summary).toHaveTextContent('90')
  })

  it('renders no strip when setStates is empty', () => {
    render(<ExerciseCardHeading {...baseProps} setStates={[]} />)
    expect(screen.getByTestId('exercise-heading')).toBeInTheDocument()
    expect(screen.queryByTestId('exercise-card-strip')).not.toBeInTheDocument()
    expect(screen.queryByTestId('set-strip')).not.toBeInTheDocument()
  })

  it('dims the whole heading when marked dimmed', () => {
    render(<ExerciseCardHeading {...baseProps} dimmed />)
    expect(screen.getByTestId('exercise-card')).toHaveStyle({ opacity: 0.55 })
  })

  it('is full opacity by default', () => {
    render(<ExerciseCardHeading {...baseProps} />)
    expect(screen.getByTestId('exercise-card')).toHaveStyle({ opacity: 1 })
  })

  it('fires onPress when the row is pressed', () => {
    const onPress = vi.fn()
    render(<ExerciseCardHeading {...baseProps} onPress={onPress} />)
    fireEvent.click(screen.getByTestId('exercise-card-header'))
    expect(onPress).toHaveBeenCalledOnce()
  })

  describe('accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<ExerciseCardHeading {...baseProps} onPress={vi.fn()} />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})
