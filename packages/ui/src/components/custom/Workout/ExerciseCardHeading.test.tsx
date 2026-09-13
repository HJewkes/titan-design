import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { axe } from 'jest-axe'
import { ExerciseCardHeading } from './ExerciseCardHeading'
import { exerciseLiveColor, exerciseRowStateColor } from './exerciseRowState'
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

  // The three former call sites, each proven to render from the one component.
  describe('density', () => {
    it('rail: the prescription sits on its own line beside the tempo', () => {
      render(<ExerciseCardHeading {...baseProps} />)
      const header = screen.getByTestId('exercise-card-header')
      expect(header).not.toContainElement(screen.getByTestId('exercise-card-summary'))
      expect(screen.getByTestId('tempo-display')).toBeInTheDocument()
    })

    it('compact: name and prescription share the header row, and the tempo is dropped', () => {
      render(<ExerciseCardHeading {...baseProps} density="compact" />)
      const header = screen.getByTestId('exercise-card-header')
      expect(header).toContainElement(screen.getByTestId('exercise-card-name'))
      expect(header).toContainElement(screen.getByTestId('exercise-card-summary'))
      expect(screen.queryByTestId('tempo-display')).not.toBeInTheDocument()
    })

    it('upcoming: dims itself and carries the free-text prescription + previous best', () => {
      render(
        <ExerciseCardHeading
          name="Deadlift"
          density="upcoming"
          prescription="3×8-12 @ RPE 8"
          previousBest="185 lbs × 10"
        />
      )
      expect(screen.getByTestId('exercise-card')).toHaveStyle({ opacity: 0.6 })
      expect(screen.getByTestId('exercise-card-prescription')).toHaveTextContent('3×8-12 @ RPE 8')
      expect(screen.getByTestId('exercise-card-previous-best')).toHaveTextContent('185 lbs × 10')
    })

    it('upcoming: an explicit dimmed=false overrides the density default', () => {
      render(<ExerciseCardHeading name="Deadlift" density="upcoming" dimmed={false} />)
      expect(screen.getByTestId('exercise-card')).toHaveStyle({ opacity: 1 })
    })

    // The fourth call site: voltras-mcp's SPA recap card, which takes a STRING load for
    // a weightless mode rather than fabricating a 0 (VMCP-03.05).
    it('rail: a string load and a testID override still render standalone', () => {
      render(
        <ExerciseCardHeading
          name="Cable Row"
          sets={3}
          reps={10}
          load="—"
          unit="lbs"
          indicator="velocity-loss"
          setStates={[{ status: 'done', velocities: [0.8, 0.7] }]}
          testID="recap-card-heading"
        />
      )
      expect(screen.getByTestId('recap-card-heading')).toBeInTheDocument()
      expect(screen.getByTestId('exercise-card-summary')).toHaveTextContent('—')
    })
  })

  describe('interaction states', () => {
    it('has no wash at rest', () => {
      render(<ExerciseCardHeading {...baseProps} />)
      expect(screen.getByTestId('exercise-card')).not.toHaveStyle({
        backgroundColor: exerciseRowStateColor('hovered'),
      })
    })

    it('washes on hover of the heading row', () => {
      render(<ExerciseCardHeading {...baseProps} />)
      fireEvent.mouseEnter(screen.getByTestId('exercise-card-header'))
      expect(screen.getByTestId('exercise-card')).toHaveStyle({
        backgroundColor: exerciseRowStateColor('hovered'),
      })
    })

    it('clears the hover wash when the pointer leaves', () => {
      render(<ExerciseCardHeading {...baseProps} />)
      const header = screen.getByTestId('exercise-card-header')
      fireEvent.mouseEnter(header)
      fireEvent.mouseLeave(header)
      expect(screen.getByTestId('exercise-card')).not.toHaveStyle({
        backgroundColor: exerciseRowStateColor('hovered'),
      })
    })

    it('washes while selected, and the selection outranks a hover', () => {
      render(<ExerciseCardHeading {...baseProps} isSelected />)
      fireEvent.mouseEnter(screen.getByTestId('exercise-card-header'))
      expect(screen.getByTestId('exercise-card')).toHaveStyle({
        backgroundColor: exerciseRowStateColor('selected'),
      })
    })

    // RNW's Pressability grants the responder before it schedules onPressIn, so the
    // wash lands a tick after the mousedown.
    it('a press outranks the selection wash', async () => {
      render(<ExerciseCardHeading {...baseProps} isSelected onPress={vi.fn()} />)
      fireEvent.mouseDown(screen.getByTestId('exercise-card-header'), { button: 0, detail: 1 })
      await waitFor(() =>
        expect(screen.getByTestId('exercise-card')).toHaveStyle({
          backgroundColor: exerciseRowStateColor('pressed'),
        })
      )
    })

    it('tints the name with the live tone while the exercise is being performed', () => {
      render(<ExerciseCardHeading {...baseProps} isLive />)
      expect(screen.getByTestId('exercise-card-name')).toHaveStyle({
        color: exerciseLiveColor(),
      })
    })

    it('leaves the name on the primary tone when not live', () => {
      render(<ExerciseCardHeading {...baseProps} />)
      expect(screen.getByTestId('exercise-card-name')).not.toHaveStyle({
        color: exerciseLiveColor(),
      })
    })

    // The rail renders on the wall during a set; titan's "the grain is static" rule
    // makes a live state a tone change, never motion.
    it('the live state adds no animation or transition', () => {
      const { container } = render(<ExerciseCardHeading {...baseProps} isLive />)
      expect(container.innerHTML).not.toMatch(/animation|transition/i)
    })
  })

  describe('accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<ExerciseCardHeading {...baseProps} onPress={vi.fn()} />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('has no accessibility violations in the upcoming density', async () => {
      const { container } = render(
        <ExerciseCardHeading
          name="Deadlift"
          density="upcoming"
          prescription="3×8-12 @ RPE 8"
          previousBest="185 lbs × 10"
          onPress={vi.fn()}
        />
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('names the row from its prescription, structured or free-text', () => {
      render(<ExerciseCardHeading {...baseProps} onPress={vi.fn()} />)
      expect(screen.getByLabelText('Cable Chest Press, 3×10 @ 90 lbs')).toBeInTheDocument()
    })
  })
})
