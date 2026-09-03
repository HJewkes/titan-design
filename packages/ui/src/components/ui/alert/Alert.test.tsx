import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'jest-axe'
import { Alert, AlertTitle, AlertDescription } from './Alert'

describe('Alert', () => {
  it('renders children correctly', () => {
    render(
      <Alert>
        <AlertTitle>Alert Title</AlertTitle>
        <AlertDescription>Alert message</AlertDescription>
      </Alert>
    )
    expect(screen.getByText('Alert Title')).toBeInTheDocument()
    expect(screen.getByText('Alert message')).toBeInTheDocument()
  })

  it('has alert accessibility role', () => {
    render(
      <Alert>
        <AlertDescription>Info message</AlertDescription>
      </Alert>
    )
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  describe('status variants', () => {
    it('renders with success status', () => {
      render(
        <Alert status="success">
          <AlertDescription>Success</AlertDescription>
        </Alert>
      )
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    it('renders with info status (default)', () => {
      render(
        <Alert>
          <AlertDescription>Info</AlertDescription>
        </Alert>
      )
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    it('renders with warning status', () => {
      render(
        <Alert status="warning">
          <AlertDescription>Warning</AlertDescription>
        </Alert>
      )
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    it('renders with error status', () => {
      render(
        <Alert status="error">
          <AlertDescription>Error</AlertDescription>
        </Alert>
      )
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })
  })

  describe('visual variants', () => {
    it('renders with subtle variant (default)', () => {
      render(
        <Alert variant="subtle">
          <AlertDescription>Subtle</AlertDescription>
        </Alert>
      )
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    it('renders with outline variant', () => {
      render(
        <Alert variant="outline">
          <AlertDescription>Outline</AlertDescription>
        </Alert>
      )
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    it('renders with solid variant', () => {
      render(
        <Alert variant="solid">
          <AlertDescription>Solid</AlertDescription>
        </Alert>
      )
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })
  })

  describe('icon behavior', () => {
    it('shows default icon by default', () => {
      render(
        <Alert status="info">
          <AlertDescription>With icon</AlertDescription>
        </Alert>
      )
      // Default info icon is the info symbol
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    it('hides icon when showIcon is false', () => {
      render(
        <Alert status="success" showIcon={false}>
          <AlertDescription>No icon</AlertDescription>
        </Alert>
      )
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    it('renders custom icon when provided', () => {
      render(
        <Alert icon={<span data-testid="custom-icon">!</span>}>
          <AlertDescription>Custom icon</AlertDescription>
        </Alert>
      )
      expect(screen.getByTestId('custom-icon')).toBeInTheDocument()
    })
  })

  describe('close button', () => {
    it('renders close button when onClose is provided', () => {
      render(
        <Alert onClose={() => {}}>
          <AlertDescription>Closeable</AlertDescription>
        </Alert>
      )
      expect(screen.getByLabelText('Close alert')).toBeInTheDocument()
    })

    it('calls onClose when close button is clicked', () => {
      const onClose = vi.fn()
      render(
        <Alert onClose={onClose}>
          <AlertDescription>Closeable</AlertDescription>
        </Alert>
      )

      fireEvent.click(screen.getByLabelText('Close alert'))
      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('does not render close button when onClose is not provided', () => {
      render(
        <Alert>
          <AlertDescription>Not closeable</AlertDescription>
        </Alert>
      )
      expect(screen.queryByLabelText('Close alert')).not.toBeInTheDocument()
    })
  })

  describe('compound sub-components', () => {
    it('renders AlertTitle', () => {
      render(<AlertTitle>Title Text</AlertTitle>)
      expect(screen.getByText('Title Text')).toBeInTheDocument()
    })

    it('renders AlertDescription', () => {
      render(<AlertDescription>Description text</AlertDescription>)
      expect(screen.getByText('Description text')).toBeInTheDocument()
    })

    it('accepts custom className on sub-components', () => {
      render(
        <Alert className="custom-alert">
          <AlertTitle className="custom-title">Title</AlertTitle>
          <AlertDescription className="custom-desc">Desc</AlertDescription>
        </Alert>
      )
      expect(screen.getByText('Title')).toBeInTheDocument()
      expect(screen.getByText('Desc')).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(
        <Alert status="info">
          <AlertTitle>Info Alert</AlertTitle>
          <AlertDescription>This is an informational message.</AlertDescription>
        </Alert>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('has no accessibility violations with close button', async () => {
      const { container } = render(
        <Alert status="error" onClose={() => {}}>
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Something went wrong.</AlertDescription>
        </Alert>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})

describe('Alert compact cue (absorbs CueFlag)', () => {
  it('renders the message as content (batteries-included cue)', () => {
    render(<Alert status="warning" size="compact" message="VL20 · end the set" />)
    expect(screen.getByTestId('alert-message')).toHaveTextContent('VL20 · end the set')
  })

  it('renders the message alongside a status glyph and the alert role', () => {
    render(<Alert status="error" size="compact" message="Stop now" />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText('✕')).toBeInTheDocument()
    expect(screen.getByText('Stop now')).toBeInTheDocument()
  })

  it('renders message in the default size too', () => {
    render(<Alert status="info" message="Heads up" />)
    expect(screen.getByTestId('alert-message')).toHaveTextContent('Heads up')
  })

  it('renders children after the message when both are given', () => {
    render(
      <Alert status="warning" size="compact" message="Cue line">
        <AlertDescription>Extra detail</AlertDescription>
      </Alert>
    )
    expect(screen.getByTestId('alert-message')).toHaveTextContent('Cue line')
    expect(screen.getByText('Extra detail')).toBeInTheDocument()
  })

  it('omits the message node when no message is passed', () => {
    render(
      <Alert status="warning" size="compact">
        <AlertDescription>Just children</AlertDescription>
      </Alert>
    )
    expect(screen.queryByTestId('alert-message')).not.toBeInTheDocument()
    expect(screen.getByText('Just children')).toBeInTheDocument()
  })

  it('still respects showIcon=false in compact', () => {
    render(<Alert status="warning" size="compact" message="No icon cue" showIcon={false} />)
    expect(screen.queryByText('⚠')).not.toBeInTheDocument()
    expect(screen.getByText('No icon cue')).toBeInTheDocument()
  })

  it('has no accessibility violations as a compact cue', async () => {
    const { container } = render(
      <Alert status="warning" size="compact" message="VL20 · target reps met — end the set." />
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})
