import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'jest-axe'
import { EmptyState } from './EmptyState'

function MockIcon({ size, className }: { size?: number; className?: string }) {
  return <span data-testid="mock-icon" data-size={size} className={className}>Icon</span>
}

describe('EmptyState', () => {
  it('renders with title', () => {
    render(<EmptyState title="No messages" />)
    expect(screen.getByText('No messages')).toBeInTheDocument()
  })

  it('renders with description', () => {
    render(
      <EmptyState
        title="No messages"
        description="You don't have any messages yet."
      />
    )
    expect(screen.getByText("You don't have any messages yet.")).toBeInTheDocument()
  })

  it('renders without description', () => {
    render(<EmptyState title="No data" />)
    expect(screen.getByText('No data')).toBeInTheDocument()
  })

  it('renders with icon', () => {
    render(<EmptyState title="No items" icon={MockIcon} />)
    expect(screen.getByTestId('mock-icon')).toBeInTheDocument()
  })

  it('renders without icon', () => {
    render(<EmptyState title="No items" />)
    expect(screen.queryByTestId('mock-icon')).not.toBeInTheDocument()
  })

  it('passes size prop to icon', () => {
    render(<EmptyState title="No items" icon={MockIcon} />)
    expect(screen.getByTestId('mock-icon')).toHaveAttribute('data-size', '32')
  })

  it('renders action element', () => {
    const onPress = vi.fn()
    render(
      <EmptyState
        title="No results"
        action={<button onClick={onPress}>Create New</button>}
      />
    )
    const actionButton = screen.getByText('Create New')
    expect(actionButton).toBeInTheDocument()

    fireEvent.click(actionButton)
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('renders without action', () => {
    render(<EmptyState title="No data" />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('renders all parts together', () => {
    render(
      <EmptyState
        icon={MockIcon}
        title="No messages"
        description="Check back later"
        action={<button>Refresh</button>}
      />
    )
    expect(screen.getByTestId('mock-icon')).toBeInTheDocument()
    expect(screen.getByText('No messages')).toBeInTheDocument()
    expect(screen.getByText('Check back later')).toBeInTheDocument()
    expect(screen.getByText('Refresh')).toBeInTheDocument()
  })

  it('accepts custom className', () => {
    render(<EmptyState title="Test" className="custom-class" />)
    expect(screen.getByText('Test')).toBeInTheDocument()
  })

  describe('accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(
        <EmptyState
          icon={MockIcon}
          title="No messages"
          description="You don't have any messages yet."
          action={<button>Compose</button>}
        />
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('has no accessibility violations with minimal props', async () => {
      const { container } = render(<EmptyState title="Empty" />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})
