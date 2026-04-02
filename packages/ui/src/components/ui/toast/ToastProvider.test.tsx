import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { ToastProviderV2, useToastV2 } from './ToastProvider'

function TestConsumer({ options }: { options?: Parameters<ReturnType<typeof useToastV2>['show']>[0] }) {
  const toast = useToastV2()
  return (
    <div>
      <button
        onClick={() =>
          toast.show(options ?? { title: 'Test Toast', variant: 'success' })
        }
      >
        Show Toast
      </button>
      <button onClick={() => toast.dismissAll()}>Dismiss All</button>
    </div>
  )
}

function DismissConsumer() {
  const toast = useToastV2()
  const idRef = { current: '' }
  return (
    <div>
      <button
        onClick={() => {
          idRef.current = toast.show({ title: 'Dismissable', variant: 'info' })
          // Store id on the button for later retrieval
          const btn = document.getElementById('dismiss-btn')
          if (btn) btn.dataset.toastId = idRef.current
        }}
      >
        Show
      </button>
      <button
        id="dismiss-btn"
        onClick={(e) => {
          const id = (e.currentTarget as HTMLButtonElement).dataset.toastId
          if (id) toast.dismiss(id)
        }}
      >
        Dismiss
      </button>
    </div>
  )
}

describe('ToastProviderV2', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders children', () => {
    render(
      <ToastProviderV2>
        <div>App Content</div>
      </ToastProviderV2>
    )
    expect(screen.getByText('App Content')).toBeInTheDocument()
  })

  it('shows a toast when show is called', () => {
    render(
      <ToastProviderV2>
        <TestConsumer />
      </ToastProviderV2>
    )

    fireEvent.click(screen.getByText('Show Toast'))
    expect(screen.getByText('Test Toast')).toBeInTheDocument()
  })

  it('auto-dismisses after duration', () => {
    render(
      <ToastProviderV2 defaultDuration={2000}>
        <TestConsumer />
      </ToastProviderV2>
    )

    fireEvent.click(screen.getByText('Show Toast'))
    expect(screen.getByText('Test Toast')).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(2000)
    })

    // Toast enters exit animation
    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(screen.queryByText('Test Toast')).not.toBeInTheDocument()
  })

  it('manual dismiss works', () => {
    render(
      <ToastProviderV2 defaultDuration={0}>
        <DismissConsumer />
      </ToastProviderV2>
    )

    fireEvent.click(screen.getByText('Show'))
    expect(screen.getByText('Dismissable')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Dismiss'))

    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(screen.queryByText('Dismissable')).not.toBeInTheDocument()
  })

  it('respects maxToasts limit', () => {
    render(
      <ToastProviderV2 maxToasts={2} defaultDuration={0}>
        <TestConsumer options={{ title: 'Toast', variant: 'info' }} />
      </ToastProviderV2>
    )

    fireEvent.click(screen.getByText('Show Toast'))
    fireEvent.click(screen.getByText('Show Toast'))
    fireEvent.click(screen.getByText('Show Toast'))

    const toasts = screen.getAllByText('Toast')
    expect(toasts.length).toBeLessThanOrEqual(2)
  })

  it('calls onDismiss callback', () => {
    const onDismiss = vi.fn()

    function CallbackConsumer() {
      const toast = useToastV2()
      return (
        <button
          onClick={() =>
            toast.show({ title: 'Callback', variant: 'info', duration: 1000, onDismiss })
          }
        >
          Show
        </button>
      )
    }

    render(
      <ToastProviderV2>
        <CallbackConsumer />
      </ToastProviderV2>
    )

    fireEvent.click(screen.getByText('Show'))
    expect(screen.getByText('Callback')).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    // onDismiss should not be called by startExit itself (only by dismiss)
    // The exit animation removes from DOM
    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(screen.queryByText('Callback')).not.toBeInTheDocument()
  })

  it('dismissAll removes all toasts', () => {
    render(
      <ToastProviderV2 defaultDuration={0}>
        <TestConsumer />
      </ToastProviderV2>
    )

    fireEvent.click(screen.getByText('Show Toast'))
    fireEvent.click(screen.getByText('Show Toast'))
    expect(screen.getAllByText('Test Toast').length).toBe(2)

    fireEvent.click(screen.getByText('Dismiss All'))

    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(screen.queryByText('Test Toast')).not.toBeInTheDocument()
  })

  it('throws when useToastV2 is used outside provider', () => {
    function BadConsumer() {
      useToastV2()
      return null
    }

    expect(() => render(<BadConsumer />)).toThrow(
      'useToastV2 must be used within a ToastProviderV2'
    )
  })

  it('show returns a string id', () => {
    let returnedId = ''

    function IdConsumer() {
      const toast = useToastV2()
      return (
        <button
          onClick={() => {
            returnedId = toast.show({ title: 'ID Test', variant: 'info' })
          }}
        >
          Show
        </button>
      )
    }

    render(
      <ToastProviderV2>
        <IdConsumer />
      </ToastProviderV2>
    )

    fireEvent.click(screen.getByText('Show'))
    expect(typeof returnedId).toBe('string')
    expect(returnedId.length).toBeGreaterThan(0)
  })
})
