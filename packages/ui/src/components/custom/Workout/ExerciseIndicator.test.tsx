import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'jest-axe'
import {
  ExerciseIndicator,
  resolveIndicator,
  INDICATOR_PRECEDENCE,
  type ExerciseIndicatorKind,
} from './ExerciseIndicator'

// tier color = titan status token, applied as the glyph's SVG stroke (literal hex):
// danger=status-error, warning=status-warning, success=status-success, info=status-info.
const kinds: { kind: ExerciseIndicatorKind; label: string; tier: string }[] = [
  { kind: 'imbalance', label: 'Left/right imbalance', tier: '#D14343' },
  { kind: 'overshoot', label: 'Load overshoot', tier: '#D14343' },
  { kind: 'velocity-loss', label: 'Velocity loss', tier: '#F9B415' },
  { kind: 'missed-reps', label: 'Missed reps', tier: '#F9B415' },
  { kind: 'pr', label: 'Personal record', tier: '#2ED573' },
  { kind: 'info', label: 'More info', tier: '#2196F3' },
]

describe('ExerciseIndicator', () => {
  it.each(kinds)('renders the $kind chip glyph and accessible label', ({ kind, label }) => {
    const { container } = render(<ExerciseIndicator kind={kind} />)
    // glyph is an inline SVG (lucide-mirrored), not a text character
    expect(container.querySelector('svg')).toBeInTheDocument()
    expect(screen.getByLabelText(label)).toBeInTheDocument()
  })

  it.each(kinds)('tints the $kind glyph with its tier color', ({ kind, tier }) => {
    const { container } = render(<ExerciseIndicator kind={kind} />)
    expect(container.querySelector('svg')!.getAttribute('stroke')).toBe(tier)
  })

  it('renders a decorative (aria-hidden) glyph so the chip owns the label', () => {
    const { container } = render(<ExerciseIndicator kind="pr" />)
    expect(container.querySelector('svg')!.getAttribute('aria-hidden')).toBe('true')
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

describe('resolveIndicator', () => {
  it('returns undefined when no signals are active', () => {
    expect(resolveIndicator([])).toBeUndefined()
  })

  it('returns the sole candidate unchanged', () => {
    expect(resolveIndicator(['velocity-loss'])).toBe('velocity-loss')
  })

  it('picks the highest-precedence kind regardless of input order', () => {
    expect(resolveIndicator(['info', 'pr', 'overshoot'])).toBe('overshoot')
    expect(resolveIndicator(['overshoot', 'pr', 'info'])).toBe('overshoot')
  })

  it('lets imbalance (rank 1) win over every other signal', () => {
    expect(resolveIndicator([...INDICATOR_PRECEDENCE])).toBe('imbalance')
  })

  it('ranks the soft alerts above pr (alert > pr)', () => {
    expect(resolveIndicator(['pr', 'missed-reps'])).toBe('missed-reps')
    expect(resolveIndicator(['pr', 'velocity-loss'])).toBe('velocity-loss')
  })

  it('falls to info only when it is the lowest active signal', () => {
    expect(resolveIndicator(['info', 'pr'])).toBe('pr')
    expect(resolveIndicator(['info'])).toBe('info')
  })

  it('ignores duplicate candidates', () => {
    expect(resolveIndicator(['pr', 'pr', 'info'])).toBe('pr')
  })
})
