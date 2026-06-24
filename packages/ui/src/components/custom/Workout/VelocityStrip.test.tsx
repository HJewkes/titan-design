import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'jest-axe'
import {
  VelocityStrip,
  getVelocityZoneColor,
  getVelocityZoneName,
  calculateVelocityLoss,
  calculateMeanVelocity,
} from './VelocityStrip'

const sampleVelocities = [1.1, 0.95, 0.82, 0.68, 0.45]

describe('VelocityStrip', () => {
  it('renders correct number of segments', () => {
    render(<VelocityStrip velocities={sampleVelocities} />)
    for (let i = 0; i < sampleVelocities.length; i++) {
      expect(screen.getByTestId(`velocity-bar-${i}`)).toBeInTheDocument()
    }
  })

  it('renders with expanded state', () => {
    render(<VelocityStrip velocities={sampleVelocities} expanded />)
    expect(screen.getByTestId('velocity-strip')).toBeInTheDocument()
    expect(screen.getByTestId('velocity-info-row')).toBeInTheDocument()
  })

  it('shows velocity labels when expanded', () => {
    render(<VelocityStrip velocities={sampleVelocities} expanded />)
    for (let i = 0; i < sampleVelocities.length; i++) {
      expect(screen.getByTestId(`velocity-label-${i}`)).toBeInTheDocument()
    }
  })

  it('fires onToggle on press', () => {
    const onToggle = vi.fn()
    render(
      <VelocityStrip velocities={sampleVelocities} onToggle={onToggle} />,
    )
    const pressable = screen.getByTestId('velocity-strip-pressable')
    fireEvent.click(pressable)
    expect(onToggle).toHaveBeenCalledOnce()
  })

  it('fires onRepPress with correct index when bar is tapped', () => {
    const onRepPress = vi.fn()
    render(
      <VelocityStrip
        velocities={sampleVelocities}
        expanded
        onRepPress={onRepPress}
      />,
    )
    const bar = screen.getByTestId('velocity-bar-pressable-2')
    fireEvent.click(bar)
    expect(onRepPress).toHaveBeenCalledWith(2, 0.82)
  })

  it('sets accessibility role and label', () => {
    render(<VelocityStrip velocities={sampleVelocities} />)
    expect(
      screen.getByLabelText(
        'Velocity chart for set, 5 reps, tap to expand',
      ),
    ).toBeInTheDocument()
  })

  it('sets expanded accessibility label when expanded', () => {
    render(<VelocityStrip velocities={sampleVelocities} expanded />)
    expect(
      screen.getByLabelText(
        'Velocity chart for set, 5 reps, tap to collapse',
      ),
    ).toBeInTheDocument()
  })

  describe('showInfo prop', () => {
    it('shows info row when expanded and showInfo is true (default)', () => {
      render(<VelocityStrip velocities={sampleVelocities} expanded />)
      expect(screen.getByTestId('velocity-info-row')).toBeInTheDocument()
    })

    it('hides info row when expanded and showInfo is false', () => {
      render(<VelocityStrip velocities={sampleVelocities} expanded showInfo={false} />)
      expect(screen.queryByTestId('velocity-info-row')).not.toBeInTheDocument()
    })

    it('does not show info row when collapsed regardless of showInfo', () => {
      render(<VelocityStrip velocities={sampleVelocities} showInfo />)
      expect(screen.queryByTestId('velocity-info-row')).not.toBeInTheDocument()
    })
  })

  describe('mini variant', () => {
    it('renders mini strip', () => {
      render(<VelocityStrip velocities={sampleVelocities} variant="mini" />)
      expect(screen.getByTestId('velocity-strip-mini')).toBeInTheDocument()
    })

    it('does not respond to press', () => {
      const onToggle = vi.fn()
      render(
        <VelocityStrip
          velocities={sampleVelocities}
          variant="mini"
          onToggle={onToggle}
        />,
      )
      expect(
        screen.queryByTestId('velocity-strip-pressable'),
      ).not.toBeInTheDocument()
    })

    it('renders correct number of segments', () => {
      render(<VelocityStrip velocities={sampleVelocities} variant="mini" />)
      for (let i = 0; i < sampleVelocities.length; i++) {
        expect(screen.getByTestId(`velocity-bar-${i}`)).toBeInTheDocument()
      }
    })
  })

  describe('accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(
        <VelocityStrip velocities={sampleVelocities} onToggle={() => {}} />,
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('has no accessibility violations when expanded', async () => {
      const { container } = render(
        <VelocityStrip velocities={sampleVelocities} expanded onToggle={() => {}} />,
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('has no accessibility violations when expanded with rep press', async () => {
      const { container } = render(
        <VelocityStrip
          velocities={sampleVelocities}
          expanded
          onRepPress={() => {}}
        />,
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('has no accessibility violations in mini variant', async () => {
      const { container } = render(
        <VelocityStrip velocities={sampleVelocities} variant="mini" />,
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('outer pressable has accessibility label when onToggle provided', () => {
      render(<VelocityStrip velocities={sampleVelocities} onToggle={() => {}} />)
      expect(
        screen.getByLabelText('Velocity chart for set, 5 reps, tap to expand'),
      ).toBeInTheDocument()
    })

    it('rep pressables have accessibility labels when expanded with onRepPress', () => {
      render(
        <VelocityStrip
          velocities={sampleVelocities}
          expanded
          onRepPress={() => {}}
        />,
      )
      expect(
        screen.getByLabelText('Rep 1: 1.10 meters per second, tap for details'),
      ).toBeInTheDocument()
    })
  })
})

describe('getVelocityZoneColor', () => {
  it('returns vel-green for velocities >= 1.0', () => {
    expect(getVelocityZoneColor(1.0)).toBe('vel-green')
    expect(getVelocityZoneColor(1.5)).toBe('vel-green')
  })

  it('returns vel-yellow for velocities >= 0.75 and < 1.0', () => {
    expect(getVelocityZoneColor(0.75)).toBe('vel-yellow')
    expect(getVelocityZoneColor(0.99)).toBe('vel-yellow')
  })

  it('returns vel-orange for velocities >= 0.50 and < 0.75', () => {
    expect(getVelocityZoneColor(0.5)).toBe('vel-orange')
    expect(getVelocityZoneColor(0.74)).toBe('vel-orange')
  })

  it('returns vel-red for velocities < 0.50', () => {
    expect(getVelocityZoneColor(0.49)).toBe('vel-red')
    expect(getVelocityZoneColor(0.1)).toBe('vel-red')
  })
})

describe('getVelocityZoneName', () => {
  it('returns correct zone names', () => {
    expect(getVelocityZoneName(1.2)).toBe('Speed')
    expect(getVelocityZoneName(0.85)).toBe('Power')
    expect(getVelocityZoneName(0.6)).toBe('Strength-Speed')
    expect(getVelocityZoneName(0.3)).toBe('Strength')
  })
})

describe('calculateVelocityLoss', () => {
  it('calculates percentage loss from first to last rep', () => {
    expect(calculateVelocityLoss([1.0, 0.8])).toBe(20)
  })

  it('returns 0 for single rep', () => {
    expect(calculateVelocityLoss([1.0])).toBe(0)
  })

  it('returns 0 for empty array', () => {
    expect(calculateVelocityLoss([])).toBe(0)
  })
})

describe('calculateMeanVelocity', () => {
  it('calculates mean of velocities', () => {
    expect(calculateMeanVelocity([1.0, 0.8, 0.6])).toBeCloseTo(0.8)
  })

  it('returns 0 for empty array', () => {
    expect(calculateMeanVelocity([])).toBe(0)
  })
})
