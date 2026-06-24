import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'jest-axe'
import { E1rmBadge } from './E1rmBadge'

describe('E1rmBadge', () => {
  it('renders value and default unit', () => {
    render(<E1rmBadge value={225} />)
    expect(screen.getByText('225 lbs')).toBeInTheDocument()
  })

  it('renders with kg unit', () => {
    render(<E1rmBadge value={100} unit="kg" />)
    expect(screen.getByText('100 kg')).toBeInTheDocument()
  })

  it('wraps in Pressable when onPress is provided', () => {
    const onPress = vi.fn()
    render(<E1rmBadge value={225} onPress={onPress} />)
    const pressable = screen.getByTestId('e1rm-badge-pressable')
    fireEvent.click(pressable)
    expect(onPress).toHaveBeenCalledOnce()
  })

  it('does not render Pressable when onPress is omitted', () => {
    render(<E1rmBadge value={225} />)
    expect(screen.queryByTestId('e1rm-badge-pressable')).not.toBeInTheDocument()
  })

  it('sets accessibility label with value and unit', () => {
    render(<E1rmBadge value={315} unit="lbs" />)
    expect(
      screen.getByLabelText('Estimated one rep max: 315 lbs'),
    ).toBeInTheDocument()
  })

  describe('showIcon', () => {
    it('shows crown icon by default', () => {
      render(<E1rmBadge value={225} />)
      expect(screen.getByTestId('e1rm-icon')).toBeInTheDocument()
    })

    it('hides crown icon when showIcon is false', () => {
      render(<E1rmBadge value={225} showIcon={false} />)
      expect(screen.queryByTestId('e1rm-icon')).not.toBeInTheDocument()
    })
  })

  describe('isPr', () => {
    it('renders without error when isPr is false', () => {
      render(<E1rmBadge value={225} />)
      expect(screen.getByTestId('e1rm-badge')).toBeInTheDocument()
    })

    it('renders without error when isPr is true', () => {
      render(<E1rmBadge value={315} isPr />)
      expect(screen.getByTestId('e1rm-badge')).toBeInTheDocument()
    })

    it('uses default border color when not a PR', () => {
      render(<E1rmBadge value={225} />)
      expect(screen.getByTestId('e1rm-badge')).toHaveStyle({
        borderTopColor: '#1F1F1F',
      })
    })

    it('uses brand-primary-subtle border color on PR state', () => {
      render(<E1rmBadge value={315} isPr />)
      expect(screen.getByTestId('e1rm-badge')).toHaveStyle({
        borderTopColor: 'rgba(255, 121, 0, 0.12)',
      })
    })
  })

  describe('size', () => {
    it('defaults to md size', () => {
      render(<E1rmBadge value={225} />)
      expect(screen.getByTestId('e1rm-badge')).toBeInTheDocument()
    })

    it('renders sm size', () => {
      render(<E1rmBadge value={225} size="sm" />)
      expect(screen.getByTestId('e1rm-badge')).toBeInTheDocument()
    })

    it('renders lg size', () => {
      render(<E1rmBadge value={225} size="lg" />)
      expect(screen.getByTestId('e1rm-badge')).toBeInTheDocument()
    })
  })

  describe('delta', () => {
    it('shows positive delta', () => {
      render(<E1rmBadge value={225} delta={3} />)
      const delta = screen.getByTestId('e1rm-delta')
      expect(delta).toHaveTextContent('+3%')
    })

    it('shows negative delta', () => {
      render(<E1rmBadge value={225} delta={-2} />)
      const delta = screen.getByTestId('e1rm-delta')
      expect(delta).toHaveTextContent('-2%')
    })

    it('shows zero delta as positive', () => {
      render(<E1rmBadge value={225} delta={0} />)
      const delta = screen.getByTestId('e1rm-delta')
      expect(delta).toHaveTextContent('+0%')
    })

    it('does not show delta when not provided', () => {
      render(<E1rmBadge value={225} />)
      expect(screen.queryByTestId('e1rm-delta')).not.toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(
        <E1rmBadge value={225} isPr onPress={() => {}} />,
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('has no accessibility violations with delta', async () => {
      const { container } = render(
        <E1rmBadge value={225} delta={3} onPress={() => {}} />,
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('has no accessibility violations as static badge', async () => {
      const { container } = render(<E1rmBadge value={315} unit="kg" isPr delta={-2} />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('pressable includes delta in accessibility label', () => {
      render(<E1rmBadge value={225} delta={5} onPress={() => {}} />)
      expect(
        screen.getByLabelText('Estimated one rep max: 225 lbs, +5% change'),
      ).toBeInTheDocument()
    })

    it('pressable includes negative delta in accessibility label', () => {
      render(<E1rmBadge value={225} delta={-3} onPress={() => {}} />)
      expect(
        screen.getByLabelText('Estimated one rep max: 225 lbs, -3% change'),
      ).toBeInTheDocument()
    })
  })
})
