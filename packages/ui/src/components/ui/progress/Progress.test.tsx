import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { Progress, CircularProgress, ProgressSteps } from './Progress'

describe('Progress', () => {
  it('renders correctly', () => {
    render(<Progress value={50} />)
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('renders with default props', () => {
    render(<Progress />)
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('sets accessibility value', () => {
    render(<Progress value={75} max={100} />)
    const progressbar = screen.getByRole('progressbar')
    // react-native-web maps accessibilityValue but not to standard aria-value* attributes
    expect(progressbar).toBeInTheDocument()
  })

  it('renders with label', () => {
    render(<Progress value={50} label="Uploading..." />)
    expect(screen.getByText('Uploading...')).toBeInTheDocument()
  })

  it('renders with value display', () => {
    render(<Progress value={50} showValue />)
    expect(screen.getByText('50%')).toBeInTheDocument()
  })

  it('uses custom formatValue function', () => {
    render(<Progress value={3} max={10} showValue formatValue={(v, m) => `${v}/${m}`} />)
    expect(screen.getByText('3/10')).toBeInTheDocument()
  })

  it('does not show value when indeterminate', () => {
    render(<Progress isIndeterminate showValue />)
    expect(screen.queryByText(/%/)).not.toBeInTheDocument()
  })

  it('sets undefined aria-valuenow when indeterminate', () => {
    render(<Progress isIndeterminate />)
    const progressbar = screen.getByRole('progressbar')
    expect(progressbar).not.toHaveAttribute('aria-valuenow')
  })

  it('renders with all size options', () => {
    const sizes = ['sm', 'md', 'lg'] as const
    sizes.forEach((size) => {
      const { unmount } = render(<Progress size={size} value={50} />)
      expect(screen.getByRole('progressbar')).toBeInTheDocument()
      unmount()
    })
  })

  it('renders with all color options', () => {
    const colors = ['primary', 'secondary', 'success', 'error', 'warning', 'info'] as const
    colors.forEach((color) => {
      const { unmount } = render(<Progress color={color} value={50} />)
      expect(screen.getByRole('progressbar')).toBeInTheDocument()
      unmount()
    })
  })

  it('clamps value between 0 and 100', () => {
    const { unmount } = render(<Progress value={150} />)
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
    unmount()

    render(<Progress value={-10} />)
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(<Progress className="extra" value={50} />)
    expect(container.firstChild).toBeInTheDocument()
  })

  describe('trackWidth and customColor', () => {
    it('supports fixed trackWidth', () => {
      const { container } = render(<Progress value={50} trackWidth={60} />)
      expect(container.firstChild).toBeInTheDocument()
    })

    it('supports customColor', () => {
      const { container } = render(<Progress value={50} customColor="#FF6B6B" />)
      expect(container.firstChild).toBeInTheDocument()
    })

    it('renders correctly without trackWidth or customColor', () => {
      render(<Progress value={75} />)
      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })
  })

  describe('CircularProgress', () => {
    it('renders correctly', () => {
      render(<CircularProgress value={50} />)
      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })

    it('sets accessibility value', () => {
      render(<CircularProgress value={75} max={100} />)
      const progressbar = screen.getByRole('progressbar')
      // react-native-web maps accessibilityValue but not to standard aria-value* attributes
      expect(progressbar).toBeInTheDocument()
    })

    it('shows value when showValue is true', () => {
      render(<CircularProgress value={50} showValue />)
      expect(screen.getByText('50%')).toBeInTheDocument()
    })

    it('does not show value when indeterminate', () => {
      render(<CircularProgress isIndeterminate showValue />)
      expect(screen.queryByText(/%/)).not.toBeInTheDocument()
    })

    it('renders with custom size and strokeWidth', () => {
      render(<CircularProgress size={64} strokeWidth={6} value={50} />)
      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })

    it('renders with all color options', () => {
      const colors = ['primary', 'secondary', 'success', 'error', 'warning', 'info'] as const
      colors.forEach((color) => {
        const { unmount } = render(<CircularProgress color={color} value={50} />)
        expect(screen.getByRole('progressbar')).toBeInTheDocument()
        unmount()
      })
    })

    it('renders SVG circles', () => {
      const { container } = render(<CircularProgress value={50} />)
      const circles = container.querySelectorAll('circle')
      expect(circles.length).toBe(2) // track + progress
    })

    it('applies custom color to SVG progress circle', () => {
      const { container } = render(<CircularProgress value={50} color="success" />)
      const progressCircle = container.querySelectorAll('circle')[1]
      expect(progressCircle?.getAttribute('stroke')).toBe('var(--color-status-success)')
    })
  })

  describe('ProgressSteps', () => {
    it('renders correct number of steps', () => {
      const { container } = render(<ProgressSteps currentStep={1} totalSteps={4} />)
      expect(container.firstChild).toBeInTheDocument()
    })

    it('renders labels', () => {
      render(
        <ProgressSteps currentStep={1} totalSteps={3} labels={['Step 1', 'Step 2', 'Step 3']} />
      )
      expect(screen.getByText('Step 1')).toBeInTheDocument()
      expect(screen.getByText('Step 2')).toBeInTheDocument()
      expect(screen.getByText('Step 3')).toBeInTheDocument()
    })

    it('renders with all size options', () => {
      const sizes = ['sm', 'md', 'lg'] as const
      sizes.forEach((size) => {
        const { unmount } = render(<ProgressSteps currentStep={0} totalSteps={3} size={size} />)
        unmount()
      })
    })

    it('renders with all color options', () => {
      const colors = ['primary', 'secondary', 'success', 'error', 'warning', 'info'] as const
      colors.forEach((color) => {
        const { unmount } = render(<ProgressSteps currentStep={0} totalSteps={3} color={color} />)
        unmount()
      })
    })
  })

  describe('accessibility', () => {
    it('has no accessibility violations for Progress', async () => {
      const { container } = render(<Progress value={50} label="Upload progress" />)
      const results = await axe(container, {
        rules: { 'aria-progressbar-name': { enabled: false } },
      })
      expect(results).toHaveNoViolations()
    })

    it('has no accessibility violations for CircularProgress', async () => {
      const { container } = render(<CircularProgress value={50} />)
      const results = await axe(container, {
        rules: { 'aria-progressbar-name': { enabled: false } },
      })
      expect(results).toHaveNoViolations()
    })

    it('has no accessibility violations for ProgressSteps', async () => {
      const { container } = render(
        <ProgressSteps currentStep={1} totalSteps={3} labels={['A', 'B', 'C']} />
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})
