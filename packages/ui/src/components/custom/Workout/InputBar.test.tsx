import { describe, it, expect, vi } from 'vitest'
import { capturedClassNames } from '../../../test/classname-capture'
import { resolveAll, spacingClassesOf } from '../../../test/spacing-resolver'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'jest-axe'
import { InputBar, type InputBarProps } from './InputBar'

const defaultProps: InputBarProps = {
  exerciseName: 'Bench Press',
  setNumber: 2,
  totalSets: 5,
  reps: '5',
  weight: '135',
  unit: 'lbs',
  onRepsChange: vi.fn(),
  onWeightChange: vi.fn(),
  onRecord: vi.fn(),
  canRecord: true,
  visible: true,
}

function renderInputBar(overrides: Partial<InputBarProps> = {}) {
  return render(<InputBar {...defaultProps} {...overrides} />)
}

describe('InputBar', () => {
  it('renders with all props', () => {
    renderInputBar()
    expect(screen.getByTestId('input-bar')).toBeInTheDocument()
  })

  it('displays exercise name', () => {
    renderInputBar({ exerciseName: 'Squat' })
    expect(screen.getByTestId('input-bar-exercise-name')).toHaveTextContent('Squat')
  })

  it('displays set info with total', () => {
    renderInputBar({ setNumber: 3, totalSets: 4 })
    expect(screen.getByTestId('input-bar-set-info')).toHaveTextContent('Set 3/4')
  })

  it('displays set info without total', () => {
    renderInputBar({ setNumber: 1, totalSets: null })
    expect(screen.getByTestId('input-bar-set-info')).toHaveTextContent('Set 1')
  })

  it.each(['input-bar-reps', 'input-bar-weight'])(
    'lets the %s field shrink to its box instead of its intrinsic width',
    (testId) => {
      renderInputBar()
      expect(capturedClassNames.get(testId)?.split(/\s+/)).toContain('min-w-0')
    }
  )

  it('fires onRepsChange when reps input changes', () => {
    const onRepsChange = vi.fn()
    renderInputBar({ onRepsChange })
    const input = screen.getByTestId('input-bar-reps')
    fireEvent.change(input, { target: { value: '8' } })
    expect(onRepsChange).toHaveBeenCalled()
  })

  it('fires onWeightChange when weight input changes', () => {
    const onWeightChange = vi.fn()
    renderInputBar({ onWeightChange })
    const input = screen.getByTestId('input-bar-weight')
    fireEvent.change(input, { target: { value: '225' } })
    expect(onWeightChange).toHaveBeenCalled()
  })

  it('fires onRecord when record button is clicked', () => {
    const onRecord = vi.fn()
    renderInputBar({ onRecord })
    fireEvent.click(screen.getByTestId('input-bar-record'))
    expect(onRecord).toHaveBeenCalledOnce()
  })

  it('disables the record button and ignores presses when canRecord is false', () => {
    const onRecord = vi.fn()
    renderInputBar({ canRecord: false, onRecord })
    const button = screen.getByTestId('input-bar-record')
    expect(button).toHaveAttribute('aria-disabled', 'true')
    fireEvent.click(button)
    expect(onRecord).not.toHaveBeenCalled()
  })

  it('returns null when visible is false', () => {
    renderInputBar({ visible: false })
    expect(screen.queryByTestId('input-bar')).not.toBeInTheDocument()
  })

  it('shows correct unit label', () => {
    renderInputBar({ unit: 'kg' })
    expect(screen.getByTestId('input-bar-unit')).toHaveTextContent('kg')
  })

  it('shows lbs unit label', () => {
    renderInputBar({ unit: 'lbs' })
    expect(screen.getByTestId('input-bar-unit')).toHaveTextContent('lbs')
  })

  describe('accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = renderInputBar()
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('has toolbar role on container', () => {
      renderInputBar()
      expect(screen.getByRole('toolbar')).toBeInTheDocument()
    })

    it('has correct accessibility label on record button', () => {
      renderInputBar()
      expect(screen.getByLabelText('Record set')).toBeInTheDocument()
    })

    it('has correct accessibility label on reps input', () => {
      renderInputBar()
      expect(screen.getByLabelText('Reps')).toBeInTheDocument()
    })

    it('has correct accessibility label on weight input', () => {
      renderInputBar({ unit: 'kg' })
      expect(screen.getByLabelText('Weight in kg')).toBeInTheDocument()
    })
  })
})

/**
 * InputBar's geometry, pinned (AW-142). The bar keeps its pixels. The numeric
 * inputs take their height from the ui Input `sm` rung (TD-580) instead of
 * their own vertical padding.
 */
describe('InputBar geometry resolves to the spacing tokens', () => {
  it('keeps the bar inset and its gap', () => {
    renderInputBar()
    const classes = spacingClassesOf('input-bar')
    expect(classes).toEqual(['w-full', 'pt-2.5', 'px-gutter-sm', 'pb-inset-md', 'gap-2.5'])
    expect(resolveAll(classes)).toEqual(['100%', '10px', '16px', '12px', '10px'])
  })

  it.each(['input-bar-reps', 'input-bar-weight'])('puts %s on the Input sm rung', (testId) => {
    renderInputBar()
    expect(spacingClassesOf(testId)).toEqual(['h-8', 'px-0.5'])
  })
})
