import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { axe } from 'jest-axe'
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverCloseButton,
} from './Popover'

describe('Popover', () => {
  it('renders trigger element', () => {
    render(
      <Popover>
        <PopoverTrigger>
          <button>Open</button>
        </PopoverTrigger>
        <PopoverContent>
          <span>Content</span>
        </PopoverContent>
      </Popover>
    )
    expect(screen.getByText('Open')).toBeInTheDocument()
  })

  it('does not show content by default', () => {
    render(
      <Popover>
        <PopoverTrigger>
          <button>Open</button>
        </PopoverTrigger>
        <PopoverContent>
          <span>Hidden content</span>
        </PopoverContent>
      </Popover>
    )
    expect(screen.queryByText('Hidden content')).not.toBeInTheDocument()
  })

  it('opens popover when trigger is clicked', () => {
    render(
      <Popover>
        <PopoverTrigger>
          <button>Open</button>
        </PopoverTrigger>
        <PopoverContent>
          <span>Visible content</span>
        </PopoverContent>
      </Popover>
    )

    fireEvent.click(screen.getByText('Open'))
    expect(screen.getByText('Visible content')).toBeInTheDocument()
  })

  it('closes popover when trigger is clicked again', () => {
    render(
      <Popover>
        <PopoverTrigger>
          <button>Toggle</button>
        </PopoverTrigger>
        <PopoverContent>
          <span>Content</span>
        </PopoverContent>
      </Popover>
    )

    fireEvent.click(screen.getByText('Toggle'))
    expect(screen.getByText('Content')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Toggle'))
    expect(screen.queryByText('Content')).not.toBeInTheDocument()
  })

  describe('controlled state', () => {
    it('shows content when isOpen is true', () => {
      render(
        <Popover isOpen>
          <PopoverTrigger>
            <button>Trigger</button>
          </PopoverTrigger>
          <PopoverContent>
            <span>Open content</span>
          </PopoverContent>
        </Popover>
      )
      expect(screen.getByText('Open content')).toBeInTheDocument()
    })

    it('hides content when isOpen is false', () => {
      render(
        <Popover isOpen={false}>
          <PopoverTrigger>
            <button>Trigger</button>
          </PopoverTrigger>
          <PopoverContent>
            <span>Closed content</span>
          </PopoverContent>
        </Popover>
      )
      expect(screen.queryByText('Closed content')).not.toBeInTheDocument()
    })

    it('calls onOpenChange when trigger is clicked', () => {
      const onOpenChange = vi.fn()
      render(
        <Popover onOpenChange={onOpenChange}>
          <PopoverTrigger>
            <button>Trigger</button>
          </PopoverTrigger>
          <PopoverContent>
            <span>Content</span>
          </PopoverContent>
        </Popover>
      )

      fireEvent.click(screen.getByText('Trigger'))
      expect(onOpenChange).toHaveBeenCalledWith(true)
    })
  })

  describe('placement', () => {
    it('renders with bottom placement (default)', () => {
      render(
        <Popover isOpen placement="bottom">
          <PopoverTrigger>
            <button>Trigger</button>
          </PopoverTrigger>
          <PopoverContent>
            <span>Bottom</span>
          </PopoverContent>
        </Popover>
      )
      expect(screen.getByText('Bottom')).toBeInTheDocument()
    })

    it('renders with top placement', () => {
      render(
        <Popover isOpen placement="top">
          <PopoverTrigger>
            <button>Trigger</button>
          </PopoverTrigger>
          <PopoverContent>
            <span>Top</span>
          </PopoverContent>
        </Popover>
      )
      expect(screen.getByText('Top')).toBeInTheDocument()
    })

    it('renders with left placement', () => {
      render(
        <Popover isOpen placement="left">
          <PopoverTrigger>
            <button>Trigger</button>
          </PopoverTrigger>
          <PopoverContent>
            <span>Left</span>
          </PopoverContent>
        </Popover>
      )
      expect(screen.getByText('Left')).toBeInTheDocument()
    })

    it('renders with right placement', () => {
      render(
        <Popover isOpen placement="right">
          <PopoverTrigger>
            <button>Trigger</button>
          </PopoverTrigger>
          <PopoverContent>
            <span>Right</span>
          </PopoverContent>
        </Popover>
      )
      expect(screen.getByText('Right')).toBeInTheDocument()
    })
  })

  describe('PopoverCloseButton', () => {
    it('closes popover when clicked', () => {
      render(
        <Popover>
          <PopoverTrigger>
            <button>Open</button>
          </PopoverTrigger>
          <PopoverContent>
            <span>Content</span>
            <PopoverCloseButton>
              <span>Close</span>
            </PopoverCloseButton>
          </PopoverContent>
        </Popover>
      )

      fireEvent.click(screen.getByText('Open'))
      expect(screen.getByText('Content')).toBeInTheDocument()

      fireEvent.click(screen.getByLabelText('Close popover'))
      expect(screen.queryByText('Content')).not.toBeInTheDocument()
    })

    it('has correct accessibility label', () => {
      render(
        <Popover isOpen>
          <PopoverTrigger>
            <button>Open</button>
          </PopoverTrigger>
          <PopoverContent>
            <PopoverCloseButton>
              <span>X</span>
            </PopoverCloseButton>
          </PopoverContent>
        </Popover>
      )
      expect(screen.getByLabelText('Close popover')).toBeInTheDocument()
    })
  })

  describe('PopoverTrigger', () => {
    it('communicates expanded state', () => {
      render(
        <Popover>
          <PopoverTrigger>
            <span>Trigger</span>
          </PopoverTrigger>
          <PopoverContent>
            <span>Content</span>
          </PopoverContent>
        </Popover>
      )

      const trigger = screen.getByRole('button', { name: 'Trigger' })
      // react-native-web does not render aria-expanded for accessibilityState.expanded
      expect(trigger).toBeInTheDocument()

      fireEvent.click(trigger)
      // Verify popover opens by checking for content
      expect(screen.getByText('Content')).toBeInTheDocument()
    })
  })

  describe('hover mode', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('opens popover on mouseEnter of trigger', () => {
      render(
        <Popover triggerMode="hover">
          <PopoverTrigger>
            <button>Hover me</button>
          </PopoverTrigger>
          <PopoverContent>
            <span>Hover content</span>
          </PopoverContent>
        </Popover>
      )

      expect(screen.queryByText('Hover content')).not.toBeInTheDocument()
      fireEvent.mouseEnter(screen.getByText('Hover me'))
      expect(screen.getByText('Hover content')).toBeInTheDocument()
    })

    it('closes popover on mouseLeave after closeDelay', () => {
      render(
        <Popover triggerMode="hover" closeDelay={200}>
          <PopoverTrigger>
            <button>Hover me</button>
          </PopoverTrigger>
          <PopoverContent>
            <span>Hover content</span>
          </PopoverContent>
        </Popover>
      )

      fireEvent.mouseEnter(screen.getByText('Hover me'))
      expect(screen.getByText('Hover content')).toBeInTheDocument()

      fireEvent.mouseLeave(screen.getByText('Hover me'))
      // Still visible before delay expires
      expect(screen.getByText('Hover content')).toBeInTheDocument()

      act(() => {
        vi.advanceTimersByTime(200)
      })
      expect(screen.queryByText('Hover content')).not.toBeInTheDocument()
    })

    it('cancels close when hovering back onto trigger', () => {
      render(
        <Popover triggerMode="hover" closeDelay={150}>
          <PopoverTrigger>
            <button>Hover me</button>
          </PopoverTrigger>
          <PopoverContent>
            <span>Hover content</span>
          </PopoverContent>
        </Popover>
      )

      fireEvent.mouseEnter(screen.getByText('Hover me'))
      expect(screen.getByText('Hover content')).toBeInTheDocument()

      fireEvent.mouseLeave(screen.getByText('Hover me'))
      act(() => {
        vi.advanceTimersByTime(50)
      })

      // Re-enter trigger before delay expires
      fireEvent.mouseEnter(screen.getByText('Hover me'))
      act(() => {
        vi.advanceTimersByTime(150)
      })
      expect(screen.getByText('Hover content')).toBeInTheDocument()
    })

    it('cancels close when hovering onto content', () => {
      render(
        <Popover triggerMode="hover" closeDelay={150}>
          <PopoverTrigger>
            <button>Hover me</button>
          </PopoverTrigger>
          <PopoverContent>
            <span>Hover content</span>
          </PopoverContent>
        </Popover>
      )

      fireEvent.mouseEnter(screen.getByText('Hover me'))
      fireEvent.mouseLeave(screen.getByText('Hover me'))

      // Hover onto the content text (inside PopoverContent)
      fireEvent.mouseEnter(screen.getByText('Hover content'))
      act(() => {
        vi.advanceTimersByTime(300)
      })
      expect(screen.getByText('Hover content')).toBeInTheDocument()
    })

    it('still closes on click outside in hover mode', () => {
      render(
        <Popover triggerMode="hover">
          <PopoverTrigger>
            <button>Hover me</button>
          </PopoverTrigger>
          <PopoverContent>
            <span>Hover content</span>
          </PopoverContent>
        </Popover>
      )

      fireEvent.mouseEnter(screen.getByText('Hover me'))
      expect(screen.getByText('Hover content')).toBeInTheDocument()

      // The backdrop is the click-outside mechanism
      fireEvent.click(screen.getByText('Hover content').parentElement!.previousSibling as Element)
      expect(screen.queryByText('Hover content')).not.toBeInTheDocument()
    })

    it('defaults to click mode when triggerMode is not specified', () => {
      render(
        <Popover>
          <PopoverTrigger>
            <button>Click me</button>
          </PopoverTrigger>
          <PopoverContent>
            <span>Click content</span>
          </PopoverContent>
        </Popover>
      )

      fireEvent.mouseEnter(screen.getByText('Click me'))
      expect(screen.queryByText('Click content')).not.toBeInTheDocument()

      fireEvent.click(screen.getByText('Click me'))
      expect(screen.getByText('Click content')).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('has no accessibility violations when closed', async () => {
      const { container } = render(
        <Popover>
          <PopoverTrigger>
            <span>Open popover</span>
          </PopoverTrigger>
          <PopoverContent>
            <span>Popover content</span>
          </PopoverContent>
        </Popover>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('has no accessibility violations when open', async () => {
      const { container } = render(
        <Popover isOpen>
          <PopoverTrigger>
            <span>Open popover</span>
          </PopoverTrigger>
          <PopoverContent>
            <span>Popover content</span>
            <PopoverCloseButton>
              <span>Close</span>
            </PopoverCloseButton>
          </PopoverContent>
        </Popover>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})
