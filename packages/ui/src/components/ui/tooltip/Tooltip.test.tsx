import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Text } from 'react-native'
import { axe } from 'jest-axe'
import { Tooltip } from './Tooltip'
import { PinnedTipContext, TipTrigger } from './TipTrigger'
import { Modal } from '../modal'
import { resolveAll, siblingSource } from '../../../test/spacing-resolver'

function hoverTrigger(triggerText: string) {
  const button = screen.getByText(triggerText)
  // The Pressable wrapper is the parent element with tabindex
  const pressable = button.closest('[tabindex]') ?? button
  fireEvent.mouseEnter(pressable)
}

function unhoverTrigger(triggerText: string) {
  const button = screen.getByText(triggerText)
  const pressable = button.closest('[tabindex]') ?? button
  fireEvent.mouseLeave(pressable)
}

describe('Tooltip', () => {
  it('renders trigger children', () => {
    render(
      <Tooltip label="Tooltip text">
        <button>Hover me</button>
      </Tooltip>
    )
    expect(screen.getByText('Hover me')).toBeInTheDocument()
  })

  it('does not show tooltip content by default', () => {
    render(
      <Tooltip label="Hidden tooltip">
        <button>Trigger</button>
      </Tooltip>
    )
    expect(screen.queryByText('Hidden tooltip')).not.toBeInTheDocument()
  })

  it('shows tooltip on hover', () => {
    render(
      <Tooltip label="Visible tooltip">
        <button>Hover me</button>
      </Tooltip>
    )

    hoverTrigger('Hover me')
    expect(screen.getByText('Visible tooltip')).toBeInTheDocument()
  })

  it('hides tooltip on hover out', () => {
    render(
      <Tooltip label="Tooltip text">
        <button>Hover me</button>
      </Tooltip>
    )

    hoverTrigger('Hover me')
    expect(screen.getByText('Tooltip text')).toBeInTheDocument()

    unhoverTrigger('Hover me')
    expect(screen.queryByText('Tooltip text')).not.toBeInTheDocument()
  })

  describe('rich content', () => {
    it('renders content prop instead of label', () => {
      render(
        <Tooltip content={<span data-testid="rich">Rich content</span>}>
          <button>Hover me</button>
        </Tooltip>
      )

      hoverTrigger('Hover me')
      expect(screen.getByTestId('rich')).toBeInTheDocument()
      expect(screen.getByText('Rich content')).toBeInTheDocument()
    })

    it('content takes precedence over label', () => {
      render(
        <Tooltip label="Plain label" content={<em>Rich wins</em>}>
          <button>Hover me</button>
        </Tooltip>
      )

      hoverTrigger('Hover me')
      expect(screen.getByText('Rich wins')).toBeInTheDocument()
      expect(screen.queryByText('Plain label')).not.toBeInTheDocument()
    })
  })

  describe('disabled state', () => {
    it('does not show tooltip when isDisabled is true', () => {
      render(
        <Tooltip label="Disabled tooltip" isDisabled>
          <button>Trigger</button>
        </Tooltip>
      )

      hoverTrigger('Trigger')
      expect(screen.queryByText('Disabled tooltip')).not.toBeInTheDocument()
    })
  })

  describe('placement', () => {
    it('renders with top placement (default)', () => {
      render(
        <Tooltip label="Top tooltip" placement="top">
          <button>Trigger</button>
        </Tooltip>
      )

      hoverTrigger('Trigger')
      expect(screen.getByText('Top tooltip')).toBeInTheDocument()
    })

    it('renders with bottom placement', () => {
      render(
        <Tooltip label="Bottom tooltip" placement="bottom">
          <button>Trigger</button>
        </Tooltip>
      )

      hoverTrigger('Trigger')
      expect(screen.getByText('Bottom tooltip')).toBeInTheDocument()
    })

    it('renders with left placement', () => {
      render(
        <Tooltip label="Left tooltip" placement="left">
          <button>Trigger</button>
        </Tooltip>
      )

      hoverTrigger('Trigger')
      expect(screen.getByText('Left tooltip')).toBeInTheDocument()
    })

    it('renders with right placement', () => {
      render(
        <Tooltip label="Right tooltip" placement="right">
          <button>Trigger</button>
        </Tooltip>
      )

      hoverTrigger('Trigger')
      expect(screen.getByText('Right tooltip')).toBeInTheDocument()
    })

    it('renders with top-start placement', () => {
      render(
        <Tooltip label="Top-start" placement="top-start">
          <button>Trigger</button>
        </Tooltip>
      )

      hoverTrigger('Trigger')
      expect(screen.getByText('Top-start')).toBeInTheDocument()
    })

    it('renders with bottom-end placement', () => {
      render(
        <Tooltip label="Bottom-end" placement="bottom-end">
          <button>Trigger</button>
        </Tooltip>
      )

      hoverTrigger('Trigger')
      expect(screen.getByText('Bottom-end')).toBeInTheDocument()
    })
  })

  describe('arrow', () => {
    it('renders with arrow by default', () => {
      render(
        <Tooltip label="With arrow">
          <button>Trigger</button>
        </Tooltip>
      )

      hoverTrigger('Trigger')
      expect(screen.getByText('With arrow')).toBeInTheDocument()
    })

    it('renders without arrow when hasArrow is false', () => {
      render(
        <Tooltip label="No arrow" hasArrow={false}>
          <button>Trigger</button>
        </Tooltip>
      )

      hoverTrigger('Trigger')
      expect(screen.getByText('No arrow')).toBeInTheDocument()
    })
  })

  describe('portal mode', () => {
    it('renders tooltip into document.body when usePortal is true', () => {
      render(
        <Tooltip label="Portal tooltip" usePortal>
          <button>Hover me</button>
        </Tooltip>
      )

      hoverTrigger('Hover me')
      expect(screen.getByText('Portal tooltip')).toBeInTheDocument()
      expect(screen.getByTestId('tooltip-portal')).toBeInTheDocument()
      expect(screen.getByTestId('tooltip-portal').parentElement).toBe(document.body)
    })

    it('applies fixed positioning and z-index to portal tooltip', () => {
      render(
        <Tooltip label="Styled portal" usePortal>
          <button>Hover me</button>
        </Tooltip>
      )

      hoverTrigger('Hover me')
      const portal = screen.getByTestId('tooltip-portal')
      expect(portal.style.position).toBe('fixed')
      expect(portal.style.zIndex).toBe('10000')
      expect(portal.style.pointerEvents).toBe('none')
    })

    it('hides portal tooltip on hover out', () => {
      render(
        <Tooltip label="Portal hide" usePortal>
          <button>Hover me</button>
        </Tooltip>
      )

      hoverTrigger('Hover me')
      expect(screen.getByText('Portal hide')).toBeInTheDocument()

      unhoverTrigger('Hover me')
      expect(screen.queryByText('Portal hide')).not.toBeInTheDocument()
    })

    it('does not render portal when usePortal is false (default)', () => {
      render(
        <Tooltip label="Inline tooltip">
          <button>Hover me</button>
        </Tooltip>
      )

      hoverTrigger('Hover me')
      expect(screen.getByText('Inline tooltip')).toBeInTheDocument()
      expect(screen.queryByTestId('tooltip-portal')).not.toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(
        <Tooltip label="Accessible tooltip">
          <button>Trigger button</button>
        </Tooltip>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})

describe('controlled visibility', () => {
  it('follows isOpen instead of its own hover, and renders no pressable wrapper', () => {
    const { rerender } = render(
      <Tooltip label="Controlled" isOpen={false}>
        <Text>Trigger</Text>
      </Tooltip>
    )
    hoverTrigger('Trigger')
    expect(screen.queryByText('Controlled')).not.toBeInTheDocument()
    rerender(
      <Tooltip label="Controlled" isOpen>
        <Text>Trigger</Text>
      </Tooltip>
    )
    expect(screen.getByText('Controlled')).toBeInTheDocument()
    expect(screen.getByText('Trigger').parentElement).not.toHaveAttribute('tabindex')
  })
})

/**
 * Tooltip's chrome, pinned (AW-142 wave two). Unchanged in pixels.
 */
describe('Tooltip geometry resolves to the spacing tokens', () => {
  const source = siblingSource(import.meta.url, 'Tooltip.tsx')

  it.each([['the bubble', 'px-inset-md py-inset-sm rounded-md', ['12px', '8px']]] as const)(
    '%s ships `%s`',
    (_label, classes, pixels) => {
      expect(source).toContain(classes)
      const spacing = classes.split(' ').filter((c) => resolveAll([c])[0] !== undefined)
      expect(resolveAll(spacing)).toEqual([...pixels])
    }
  )
})

describe('TipTrigger', () => {
  function renderTip() {
    return render(
      <TipTrigger label="Goal status: Behind" content={<Text>Under the band</Text>} testID="tip">
        <Text>Behind</Text>
      </TipTrigger>
    )
  }

  it('names the trigger before the tip is open', () => {
    renderTip()
    expect(screen.getByRole('button', { name: 'Goal status: Behind' })).toBeInTheDocument()
    expect(screen.queryByText('Under the band')).toBeNull()
  })

  it('opens on hover and closes when the pointer leaves', () => {
    renderTip()
    const trigger = screen.getByTestId('tip')

    fireEvent.mouseEnter(trigger)
    expect(screen.getByText('Under the band')).toBeInTheDocument()

    fireEvent.mouseLeave(trigger)
    expect(screen.queryByText('Under the band')).toBeNull()
  })

  it('opens on keyboard focus', () => {
    renderTip()

    fireEvent.focus(screen.getByTestId('tip'))

    expect(screen.getByText('Under the band')).toBeInTheDocument()
  })

  it('toggles on press, for touch', () => {
    renderTip()
    const trigger = screen.getByTestId('tip')

    fireEvent.click(trigger)
    expect(screen.getByText('Under the band')).toBeInTheDocument()

    fireEvent.click(trigger)
    expect(screen.queryByText('Under the band')).toBeNull()
  })

  it('closes on Escape', () => {
    renderTip()
    fireEvent.focus(screen.getByTestId('tip'))
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByText('Under the band')).toBeNull()
  })

  it('closes on a press outside the trigger, not on one inside it', () => {
    renderTip()
    const trigger = screen.getByTestId('tip')
    fireEvent.focus(trigger)
    fireEvent.pointerDown(trigger)
    expect(screen.getByText('Under the band')).toBeInTheDocument()
    fireEvent.pointerDown(document.body)
    expect(screen.queryByText('Under the band')).toBeNull()
  })

  // Records current behaviour: the tip closes on Escape keydown, RNW's Modal on the keyup of
  // the same press, so one Escape closes both. A tip-first Escape would need a follow-up.
  it('closes both the tip and the modal holding it on one Escape press', () => {
    const onClose = vi.fn()
    render(
      <Modal isOpen onClose={onClose} animationType="none">
        <TipTrigger label="Goal status: Behind" content={<Text>Under the band</Text>} testID="tip">
          <Text>Behind</Text>
        </TipTrigger>
      </Modal>
    )
    fireEvent.focus(screen.getByTestId('tip'))
    fireEvent.keyDown(document, { key: 'Escape' })
    fireEvent.keyUp(document, { key: 'Escape' })
    expect(screen.queryByText('Under the band')).toBeNull()
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  // Records current behaviour: in-flow tip content has pointerEvents none, so a press on the
  // visible tip lands outside the trigger and closes it.
  it('closes when the visible tip itself is pressed', () => {
    render(
      <TipTrigger
        label="Goal status: Behind"
        content={<Text>Under the band</Text>}
        usePortal={false}
        testID="tip"
      >
        <Text>Behind</Text>
      </TipTrigger>
    )
    fireEvent.focus(screen.getByTestId('tip'))
    fireEvent.pointerDown(screen.getByText('Under the band'))
    expect(screen.queryByText('Under the band')).toBeNull()
  })

  it("names the open tip as the trigger's description", () => {
    renderTip()
    const trigger = screen.getByTestId('tip')
    expect(trigger).not.toHaveAttribute('aria-describedby')
    fireEvent.focus(trigger)
    expect(trigger).toHaveAccessibleDescription('Under the band')
  })

  it('has no accessibility violations', async () => {
    const { container } = renderTip()
    expect(await axe(container)).toHaveNoViolations()
  })
})

describe('PinnedTipContext', () => {
  function renderPinned() {
    return render(
      <PinnedTipContext.Provider value="Goal status: Behind">
        <TipTrigger label="Goal status: Behind" content={<Text>Under the band</Text>} testID="tip">
          <Text>Behind</Text>
        </TipTrigger>
        <TipTrigger label="Priority" content={<Text>Specialize</Text>} testID="other">
          <Text>P</Text>
        </TipTrigger>
      </PinnedTipContext.Provider>
    )
  }

  it('is inert without a provider: closed at first paint, and closes as before', () => {
    render(
      <TipTrigger label="Goal status: Behind" content={<Text>Under the band</Text>} testID="tip">
        <Text>Behind</Text>
      </TipTrigger>
    )
    const trigger = screen.getByTestId('tip')
    expect(screen.queryByText('Under the band')).toBeNull()
    fireEvent.focus(trigger)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByText('Under the band')).toBeNull()
  })

  it('is not exported from the package', async () => {
    const pkg = await import('../../../index')
    const tooltip = await import('./index')
    expect(Object.keys(pkg)).not.toContain('PinnedTipContext')
    expect(Object.keys(tooltip)).not.toContain('PinnedTipContext')
  })

  it('opens the tip with the matching label from the first paint, and only that one', () => {
    renderPinned()
    expect(screen.getByText('Under the band')).toBeInTheDocument()
    expect(screen.queryByText('Specialize')).toBeNull()
  })

  it('keeps it open through a stray press, Escape, blur and hover out', () => {
    renderPinned()
    const trigger = screen.getByTestId('tip')
    fireEvent.pointerDown(document.body)
    fireEvent.keyDown(document, { key: 'Escape' })
    fireEvent.focus(trigger)
    fireEvent.blur(trigger)
    fireEvent.mouseLeave(trigger)
    expect(screen.getByText('Under the band')).toBeInTheDocument()
  })
})
