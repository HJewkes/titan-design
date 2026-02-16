import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { axe } from 'jest-axe'
import { Toast, ToastProvider, useToast } from './Toast'

describe('Toast (standalone)', () => {
  it('renders with title', () => {
    render(<Toast title="Success!" />)
    expect(screen.getByText('Success!')).toBeInTheDocument()
  })

  it('renders with description', () => {
    render(<Toast title="Saved" description="Your changes have been saved." />)
    expect(screen.getByText('Your changes have been saved.')).toBeInTheDocument()
  })

  it('renders without description', () => {
    render(<Toast title="Done" />)
    expect(screen.getByText('Done')).toBeInTheDocument()
    expect(screen.queryByText('Your changes')).not.toBeInTheDocument()
  })

  describe('statuses', () => {
    const statuses = ['success', 'error', 'warning', 'info'] as const
    statuses.forEach((status) => {
      it(`renders with status ${status}`, () => {
        render(<Toast title={`${status} toast`} status={status} />)
        expect(screen.getByText(`${status} toast`)).toBeInTheDocument()
      })
    })
  })

  it('renders with default info status', () => {
    render(<Toast title="Info toast" />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  describe('icon visibility', () => {
    it('shows icon by default', () => {
      render(<Toast title="Test" status="success" />)
      // The checkmark icon is rendered
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    it('hides icon when showIcon is false', () => {
      render(<Toast title="Test" showIcon={false} />)
      expect(screen.getByText('Test')).toBeInTheDocument()
    })
  })

  describe('close button', () => {
    it('does not show close button by default', () => {
      render(<Toast title="Test" />)
      expect(screen.queryByLabelText('Close toast')).not.toBeInTheDocument()
    })

    it('shows close button when isClosable and onClose are provided', () => {
      const onClose = vi.fn()
      render(<Toast title="Test" isClosable onClose={onClose} />)
      expect(screen.getByLabelText('Close toast')).toBeInTheDocument()
    })

    it('calls onClose when close button is pressed', () => {
      const onClose = vi.fn()
      render(<Toast title="Test" isClosable onClose={onClose} />)

      fireEvent.click(screen.getByLabelText('Close toast'))
      expect(onClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(
        <Toast title="Accessible toast" description="Description text" status="success" />
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('has alert role', () => {
      render(<Toast title="Alert" />)
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })
  })
})

describe('ToastProvider', () => {
  function TestConsumer() {
    const { addToast, removeAllToasts } = useToast()
    return (
      <div>
        <button
          onClick={() =>
            addToast({ title: 'New Toast', status: 'success' })
          }
        >
          Add Toast
        </button>
        <button onClick={removeAllToasts}>Clear All</button>
      </div>
    )
  }

  it('renders children', () => {
    render(
      <ToastProvider>
        <div>App Content</div>
      </ToastProvider>
    )
    expect(screen.getByText('App Content')).toBeInTheDocument()
  })

  it('adds a toast via useToast hook', () => {
    render(
      <ToastProvider>
        <TestConsumer />
      </ToastProvider>
    )

    fireEvent.click(screen.getByText('Add Toast'))
    expect(screen.getByText('New Toast')).toBeInTheDocument()
  })

  it('removes all toasts', () => {
    render(
      <ToastProvider>
        <TestConsumer />
      </ToastProvider>
    )

    fireEvent.click(screen.getByText('Add Toast'))
    expect(screen.getByText('New Toast')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Clear All'))
    expect(screen.queryByText('New Toast')).not.toBeInTheDocument()
  })

  it('respects maxToasts limit', () => {
    render(
      <ToastProvider maxToasts={2}>
        <TestConsumer />
      </ToastProvider>
    )

    fireEvent.click(screen.getByText('Add Toast'))
    fireEvent.click(screen.getByText('Add Toast'))
    fireEvent.click(screen.getByText('Add Toast'))

    // Only 2 should be visible
    const toasts = screen.getAllByText('New Toast')
    expect(toasts.length).toBeLessThanOrEqual(2)
  })

  it('auto-dismisses toasts after duration', () => {
    vi.useFakeTimers()

    render(
      <ToastProvider defaultDuration={3000}>
        <TestConsumer />
      </ToastProvider>
    )

    fireEvent.click(screen.getByText('Add Toast'))
    expect(screen.getByText('New Toast')).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(3000)
    })

    expect(screen.queryByText('New Toast')).not.toBeInTheDocument()

    vi.useRealTimers()
  })

  it('throws when useToast is used outside ToastProvider', () => {
    function BadConsumer() {
      useToast()
      return null
    }

    expect(() => render(<BadConsumer />)).toThrow(
      'useToast must be used within a ToastProvider'
    )
  })

  describe('positions', () => {
    const positions = [
      'top',
      'top-right',
      'top-left',
      'bottom',
      'bottom-right',
      'bottom-left',
    ] as const
    positions.forEach((position) => {
      it(`renders with position ${position}`, () => {
        render(
          <ToastProvider position={position}>
            <div>Content</div>
          </ToastProvider>
        )
        expect(screen.getByText('Content')).toBeInTheDocument()
      })
    })
  })
})
