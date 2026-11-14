import { describe, it, expect, vi, afterEach } from 'vitest'
import { Animated } from 'react-native'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { PrBadge } from './PrBadge'
import { capturedClassNames } from '../../../test/classname-capture'
import { stubReducedMotion } from '../../../test/reduced-motion-stub'

describe('PrBadge', () => {
  it('renders star and default PR label', () => {
    render(<PrBadge animate={false} />)
    expect(screen.getByText(/\u2605 PR e1RM/)).toBeInTheDocument()
  })

  it('renders the label inside a brand-toned subtle Pill', () => {
    render(<PrBadge animate={false} />)
    // className never reaches the DOM under react-native-web; the capture map records it.
    const classes = (capturedClassNames.get('pr-badge') ?? '').split(/\s+/)
    expect(classes).toEqual(
      expect.arrayContaining(['bg-brand-primary-subtle', 'text-on-brand-primary-subtle', 'rounded'])
    )
    expect(screen.getByTestId('pr-badge')).toHaveTextContent('★ PR e1RM')
  })

  it('renders with animation wrapper when animate is true', () => {
    render(<PrBadge animate />)
    expect(screen.getByTestId('pr-badge-animated')).toBeInTheDocument()
  })

  it('renders without animation wrapper when animate is false', () => {
    render(<PrBadge animate={false} />)
    expect(screen.queryByTestId('pr-badge-animated')).not.toBeInTheDocument()
  })

  it('defaults to animated', () => {
    render(<PrBadge />)
    expect(screen.getByTestId('pr-badge-animated')).toBeInTheDocument()
  })

  it('sets accessibility label with resolved label', () => {
    render(<PrBadge animate={false} />)
    expect(screen.getByLabelText('Personal record: PR e1RM')).toBeInTheDocument()
  })

  describe('type prop', () => {
    it('generates label from e1rm type', () => {
      render(<PrBadge type="e1rm" animate={false} />)
      expect(screen.getByText(/PR e1RM/)).toBeInTheDocument()
    })

    it('generates label from weight type', () => {
      render(<PrBadge type="weight" animate={false} />)
      expect(screen.getByText(/PR Weight/)).toBeInTheDocument()
    })

    it('generates label from reps type', () => {
      render(<PrBadge type="reps" animate={false} />)
      expect(screen.getByText(/PR Reps/)).toBeInTheDocument()
    })

    it('generates label from volume type', () => {
      render(<PrBadge type="volume" animate={false} />)
      expect(screen.getByText(/PR Volume/)).toBeInTheDocument()
    })

    it('generates label from velocity type', () => {
      render(<PrBadge type="velocity" animate={false} />)
      expect(screen.getByText(/PR Velocity/)).toBeInTheDocument()
    })
  })

  describe('custom label', () => {
    it('uses custom label over auto-generated', () => {
      render(<PrBadge label="PR 5RM" animate={false} />)
      expect(screen.getByText(/PR 5RM/)).toBeInTheDocument()
    })

    it('sets accessibility label with custom label', () => {
      render(<PrBadge label="PR 5RM" animate={false} />)
      expect(screen.getByLabelText('Personal record: PR 5RM')).toBeInTheDocument()
    })
  })

  describe('compact mode', () => {
    it('renders only the star icon when compact', () => {
      render(<PrBadge compact animate={false} />)
      const star = screen.getByTestId('pr-badge-star')
      expect(star).toBeInTheDocument()
      // The compact star is now a Lucide SVG icon, not text
      expect(star.querySelector('svg')).toBeInTheDocument()
      expect(star).not.toHaveTextContent('\u2605')
    })

    it('does not show label text in compact mode', () => {
      render(<PrBadge compact animate={false} />)
      expect(screen.queryByText(/PR e1RM/)).not.toBeInTheDocument()
    })

    it('has correct accessibility label in compact mode', () => {
      render(<PrBadge compact animate={false} />)
      expect(screen.getByLabelText('Personal record: PR e1RM')).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<PrBadge animate={false} />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('has no accessibility violations in compact mode', async () => {
      const { container } = render(<PrBadge compact animate={false} />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})

describe('PrBadge reduced motion', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  /** Spies on timing without running it; each call's target value tells opacity (0) from scale. */
  function spyTiming() {
    const spy = vi.spyOn(Animated, 'timing').mockImplementation(
      () => ({ start: () => {}, stop: () => {}, reset: () => {} }) as Animated.CompositeAnimation
    )
    const startingValues = () =>
      spy.mock.calls.map(([value]) => (value as unknown as { __getValue(): number }).__getValue())
    return { spy, startingValues }
  }

  // Catches: dropping the guard, so the 400 ms scale pop runs for reduced-motion users.
  it('runs one 150 ms opacity timing and none on scale when reduced', () => {
    stubReducedMotion(true)
    const { spy, startingValues } = spyTiming()
    render(<PrBadge animate />)
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ toValue: 1, duration: 150 })
    )
    expect(startingValues()).toEqual([0])
  })

  // Catches: the scale starting at 0.8 on the first frame before the effect runs.
  it('renders the wrapper at scale 1 on the first render when reduced', () => {
    stubReducedMotion(true)
    spyTiming()
    render(<PrBadge animate />)
    expect(screen.getByTestId('pr-badge-animated').style.transform).toContain('scale(1)')
  })

  // Catches: the guard being hard-wired on, which would drop the default entrance.
  it('still starts the scale animation when reduced motion is not preferred', () => {
    stubReducedMotion(false)
    const { startingValues } = spyTiming()
    render(<PrBadge animate />)
    expect(startingValues()).toContain(0.8)
  })

  it('has no accessibility violations under reduced motion', async () => {
    stubReducedMotion(true)
    const { container } = render(<PrBadge animate />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
