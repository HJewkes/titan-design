import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'jest-axe'
import { ExerciseIndicator, type ExerciseIndicatorKind } from './ExerciseIndicator'

const kinds: { kind: ExerciseIndicatorKind; glyph: string; label: string }[] = [
  { kind: 'pr', glyph: '★', label: 'Personal record' },
  { kind: 'issue', glyph: '!', label: 'Form issue' },
  { kind: 'info', glyph: 'i', label: 'More info' },
]

describe('ExerciseIndicator', () => {
  it.each(kinds)('renders the $kind chip glyph and accessible label', ({ kind, glyph, label }) => {
    render(<ExerciseIndicator kind={kind} />)
    expect(screen.getByTestId('exercise-indicator')).toHaveTextContent(glyph)
    expect(screen.getByLabelText(label)).toBeInTheDocument()
  })

  it('tints the glyph with the kind color', () => {
    render(<ExerciseIndicator kind="issue" />)
    // issue = red 600 ramp pin (#D14343), rendered by RNW as rgb
    expect(screen.getByText('!')).toHaveStyle({ color: 'rgb(209, 67, 67)' })
  })

  it('is presentational (no button role) without onPress', () => {
    render(<ExerciseIndicator kind="pr" />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('becomes a button and fires onPress when interactive', () => {
    const onPress = vi.fn()
    render(<ExerciseIndicator kind="pr" onPress={onPress} />)
    const button = screen.getByRole('button', { name: 'Personal record' })
    fireEvent.click(button)
    expect(onPress).toHaveBeenCalledOnce()
  })

  describe('accessibility', () => {
    it.each(kinds)('has no accessibility violations for $kind', async ({ kind }) => {
      const { container } = render(<ExerciseIndicator kind={kind} />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})
