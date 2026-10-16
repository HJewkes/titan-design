import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { axe } from 'jest-axe'
import { capturedByNode } from '../../../test/classname-capture'
import { Toast, ToastProvider, useToast } from './Toast'
import { resolveAll, spacingClassesAt } from '../../../test/spacing-resolver'

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
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  describe('icon visibility', () => {
    it('shows icon by default', () => {
      render(<Toast title="Test" status="success" />)
      expect(screen.getByText('✓')).toBeInTheDocument()
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

    it('gives an error toast role alert', () => {
      render(<Toast title="Failed" status="error" />)
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    it('gives a success toast role status, not alert', () => {
      render(<Toast title="Saved" status="success" />)
      expect(screen.getByRole('status')).toBeInTheDocument()
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })

    it('hides the status glyph from assistive tech', () => {
      render(<Toast title="Saved" status="success" />)
      expect(screen.getByText('✓')).toHaveAttribute('aria-hidden', 'true')
    })

    it('exposes the close control as a button and hides its glyph', () => {
      render(<Toast title="Saved" isClosable onClose={() => {}} />)
      const close = screen.getByLabelText('Close toast')
      expect(close).toHaveAttribute('role', 'button')
      expect(screen.getByText('×')).toHaveAttribute('aria-hidden', 'true')
    })
  })
})

describe('ToastProvider', () => {
  function TestConsumer() {
    const { addToast, removeAllToasts } = useToast()
    return (
      <div>
        <button onClick={() => addToast({ title: 'New Toast', status: 'success' })}>
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

  describe('auto-dismiss pausing', () => {
    function setup() {
      vi.useFakeTimers()
      render(
        <ToastProvider>
          <TestConsumer />
        </ToastProvider>
      )
      fireEvent.click(screen.getByText('Add Toast'))
      return screen.getByRole('status')
    }

    afterEach(() => {
      vi.useRealTimers()
    })

    it('stays open past the duration while hovered, then dismisses after leaving', () => {
      const toast = setup()
      act(() => {
        vi.advanceTimersByTime(2000)
      })
      fireEvent.pointerEnter(toast)
      act(() => {
        vi.advanceTimersByTime(10000)
      })
      expect(screen.getByText('New Toast')).toBeInTheDocument()

      fireEvent.pointerLeave(toast)
      act(() => {
        vi.advanceTimersByTime(2999)
      })
      expect(screen.getByText('New Toast')).toBeInTheDocument()
      act(() => {
        vi.advanceTimersByTime(1)
      })
      expect(screen.queryByText('New Toast')).not.toBeInTheDocument()
    })

    it('stays open past the duration while focused, then dismisses after blur', () => {
      const toast = setup()
      fireEvent.focus(toast)
      act(() => {
        vi.advanceTimersByTime(6000)
      })
      expect(screen.getByText('New Toast')).toBeInTheDocument()

      fireEvent.blur(toast)
      act(() => {
        vi.advanceTimersByTime(5000)
      })
      expect(screen.queryByText('New Toast')).not.toBeInTheDocument()
    })
  })

  it('throws when useToast is used outside ToastProvider', () => {
    function BadConsumer() {
      useToast()
      return null
    }

    expect(() => render(<BadConsumer />)).toThrow('useToast must be used within a ToastProvider')
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

/**
 * Toast's inset and stack, pinned (AW-142 wave two).
 *
 * The 12px inset is unchanged. The description's `mt-0.5` was 2px, below the
 * grain and off every ramp; it becomes the column's 4px stack gap.
 */
describe('Toast geometry resolves to the spacing tokens', () => {
  it.each([
    [
      'the band',
      () => screen.getByText('Saved').parentElement?.parentElement ?? null,
      ['p-inset-md'],
      ['12px'],
    ],
    [
      'the content column',
      () => screen.getByText('Saved').parentElement,
      ['gap-stack-sm'],
      ['4px'],
    ],
  ] as const)('%s ships its spacing tokens', (_label, find, classes, pixels) => {
    render(<Toast title="Saved" description="Your changes have been saved." />)
    expect(spacingClassesAt(find())).toEqual([...classes])
    expect(resolveAll([...classes])).toEqual([...pixels])
  })
})

// TD-483: the status glyph is a Text node, so it takes the text role, not the fill tone.
describe('Toast status glyph', () => {
  it.each([
    ['success', '✓', 'text-text-success', 'text-status-success'],
    ['warning', '⚠', 'text-text-warning', 'text-status-warning'],
    ['info', 'ℹ', 'text-text-info', 'text-status-info'],
  ] as const)('status=%s paints %s in %s, not %s', (status, glyph, textRole, fillTone) => {
    render(<Toast title="Saved" status={status} />)
    const classes = (capturedByNode.get(screen.getByText(glyph)) ?? '').split(/\s+/)
    expect(classes).toContain(textRole)
    expect(classes).not.toContain(fillTone)
  })
})
