import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'jest-axe'
import { WeightBadge } from './WeightBadge'
import { getSemanticColors } from '../../../theme/tokens/semantic'

// Read from the token, not pinned: these used to be hand-copied hexes and
// silently desynced when borders became alpha hairlines (TD-07.16).
const T = getSemanticColors('dark')

describe('WeightBadge', () => {
  it('renders value and default unit', () => {
    render(<WeightBadge value={225} />)
    expect(screen.getByText('225 lbs')).toBeInTheDocument()
  })

  it('renders with kg unit', () => {
    render(<WeightBadge value={100} unit="kg" />)
    expect(screen.getByText('100 kg')).toBeInTheDocument()
  })

  it('wraps in Pressable when onPress is provided', () => {
    const onPress = vi.fn()
    render(<WeightBadge value={225} onPress={onPress} />)
    const pressable = screen.getByTestId('base-badge-pressable')
    fireEvent.click(pressable)
    expect(onPress).toHaveBeenCalledOnce()
  })

  it('does not render Pressable when onPress is omitted', () => {
    render(<WeightBadge value={225} />)
    expect(screen.queryByTestId('base-badge-pressable')).not.toBeInTheDocument()
  })

  describe('showIcon', () => {
    it('shows the weight icon by default', () => {
      render(<WeightBadge value={225} />)
      expect(screen.getByTestId('base-badge-icon')).toBeInTheDocument()
    })

    it('hides the weight icon when showIcon is false', () => {
      render(<WeightBadge value={225} showIcon={false} />)
      expect(screen.queryByTestId('base-badge-icon')).not.toBeInTheDocument()
    })
  })

  describe('reps (rep-max context)', () => {
    it('shows the estimated 1RM label when reps is omitted', () => {
      render(<WeightBadge value={315} unit="lbs" />)
      expect(
        screen.getByLabelText('Estimated one rep max: 315 lbs'),
      ).toBeInTheDocument()
      expect(screen.queryByTestId('weight-badge-repmax')).not.toBeInTheDocument()
    })

    it('shows the rep-max qualifier and label when reps is provided', () => {
      render(<WeightBadge value={275} unit="lbs" reps={5} />)
      expect(screen.getByTestId('weight-badge-repmax')).toHaveTextContent('5RM')
      expect(
        screen.getByLabelText('5 rep max: 275 lbs'),
      ).toBeInTheDocument()
    })
  })

  describe('isPr', () => {
    it('renders without error when isPr is false', () => {
      render(<WeightBadge value={225} />)
      expect(screen.getByTestId('weight-badge')).toBeInTheDocument()
    })

    it('renders without error when isPr is true', () => {
      render(<WeightBadge value={315} isPr />)
      expect(screen.getByTestId('weight-badge')).toBeInTheDocument()
    })

    it('uses default border color when not a PR', () => {
      render(<WeightBadge value={225} />)
      expect(screen.getByTestId('weight-badge')).toHaveStyle({
        borderTopColor: T['hairline-default'],
      })
    })

    it('uses a brand-primary border ring on PR state', () => {
      render(<WeightBadge value={315} isPr />)
      expect(screen.getByTestId('weight-badge')).toHaveStyle({
        borderTopColor: 'rgba(255, 121, 0, 0.3)',
      })
    })
  })

  describe('size', () => {
    it('defaults to md size', () => {
      render(<WeightBadge value={225} />)
      expect(screen.getByTestId('weight-badge')).toBeInTheDocument()
    })

    it('renders sm size', () => {
      render(<WeightBadge value={225} size="sm" />)
      expect(screen.getByTestId('weight-badge')).toBeInTheDocument()
    })

    it('renders lg size', () => {
      render(<WeightBadge value={225} size="lg" />)
      expect(screen.getByTestId('weight-badge')).toBeInTheDocument()
    })
  })

  describe('delta', () => {
    it('shows positive delta', () => {
      render(<WeightBadge value={225} delta={3} />)
      expect(screen.getByTestId('weight-badge-delta')).toHaveTextContent('+3%')
    })

    it('shows negative delta', () => {
      render(<WeightBadge value={225} delta={-2} />)
      expect(screen.getByTestId('weight-badge-delta')).toHaveTextContent('-2%')
    })

    it('shows zero delta as positive', () => {
      render(<WeightBadge value={225} delta={0} />)
      expect(screen.getByTestId('weight-badge-delta')).toHaveTextContent('+0%')
    })

    it('does not show delta when not provided', () => {
      render(<WeightBadge value={225} />)
      expect(screen.queryByTestId('weight-badge-delta')).not.toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(
        <WeightBadge value={225} isPr onPress={() => {}} />,
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('has no accessibility violations with delta', async () => {
      const { container } = render(
        <WeightBadge value={225} delta={3} onPress={() => {}} />,
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('has no accessibility violations as static badge', async () => {
      const { container } = render(
        <WeightBadge value={315} unit="kg" isPr delta={-2} />,
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('includes delta in the e1RM accessibility label', () => {
      render(<WeightBadge value={225} delta={5} />)
      expect(
        screen.getByLabelText('Estimated one rep max: 225 lbs, +5% change'),
      ).toBeInTheDocument()
    })

    it('includes delta in the rep-max accessibility label', () => {
      render(<WeightBadge value={275} reps={5} delta={-3} />)
      expect(
        screen.getByLabelText('5 rep max: 275 lbs, -3% change'),
      ).toBeInTheDocument()
    })
  })
})
