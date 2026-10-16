import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { Text } from 'react-native'
import { axe } from 'jest-axe'
import { Tooltip } from './Tooltip'
import { PinnedTipContext, TipTrigger } from './TipTrigger'
import * as tooltipBarrel from './index'
import { Button, ButtonText } from '../button'
import { Modal } from '../modal'
import { resolveAll, spacingClassesAt } from '../../../test/spacing-resolver'

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

  describe('open delay', () => {
    afterEach(() => {
      vi.useRealTimers()
    })

    it('shows the tooltip only after openDelay has passed', () => {
      vi.useFakeTimers()
      render(
        <Tooltip label="Delayed tooltip" openDelay={300}>
          <button>Hover me</button>
        </Tooltip>
      )

      hoverTrigger('Hover me')
      act(() => {
        vi.advanceTimersByTime(299)
      })
      expect(screen.queryByText('Delayed tooltip')).not.toBeInTheDocument()

      act(() => {
        vi.advanceTimersByTime(1)
      })
      expect(screen.getByText('Delayed tooltip')).toBeInTheDocument()
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

describe('defaultIsOpen and onOpenChange', () => {
  it('reports hover in and out through onOpenChange', () => {
    const onOpenChange = vi.fn()
    render(
      <Tooltip label="Tip" defaultIsOpen={false} onOpenChange={onOpenChange}>
        <Text>Trigger</Text>
      </Tooltip>
    )
    hoverTrigger('Trigger')
    unhoverTrigger('Trigger')
    expect(onOpenChange.mock.calls).toEqual([[true], [false]])
  })

  it('starts visible with defaultIsOpen', () => {
    render(
      <Tooltip label="Tip" defaultIsOpen>
        <Text>Trigger</Text>
      </Tooltip>
    )
    expect(screen.getByText('Tip')).toBeInTheDocument()
  })
})

describe('keyboard focus on a focusable trigger', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  function renderButtonTip() {
    const result = render(
      <Tooltip label="Saves the draft">
        <Button>
          <ButtonText>Save</ButtonText>
        </Button>
      </Tooltip>
    )
    return { ...result, button: screen.getByRole('button', { name: 'Save' }) }
  }

  it('shows the tooltip when the trigger takes focus', () => {
    const { button } = renderButtonTip()

    fireEvent.focus(button)

    expect(screen.getByText('Saves the draft')).toBeInTheDocument()
  })

  it('hides the tooltip on Escape while the trigger keeps focus', () => {
    const { button } = renderButtonTip()
    fireEvent.focus(button)
    expect(screen.getByText('Saves the draft')).toBeInTheDocument()

    fireEvent.keyDown(button, { key: 'Escape' })

    expect(screen.queryByText('Saves the draft')).not.toBeInTheDocument()
  })

  it('hides the tooltip when the trigger loses focus', () => {
    const { button } = renderButtonTip()
    fireEvent.focus(button)
    expect(screen.getByText('Saves the draft')).toBeInTheDocument()

    fireEvent.blur(button)

    expect(screen.queryByText('Saves the draft')).not.toBeInTheDocument()
  })

  it('opens on keyboard focus once enabled, after a mousedown on the disabled Button', () => {
    vi.useFakeTimers()
    const tip = (isDisabled: boolean) => (
      <Tooltip label="Saves the draft" openDelay={300}>
        <Button isDisabled={isDisabled}>
          <ButtonText>Save</ButtonText>
        </Button>
      </Tooltip>
    )
    const { rerender } = render(tip(true))
    const button = screen.getByRole('button', { name: 'Save' })
    fireEvent.mouseDown(button, { button: 0, detail: 1 })
    fireEvent.mouseUp(button, { button: 0, detail: 1 })
    rerender(tip(false))

    fireEvent.focus(button)
    act(() => vi.advanceTimersByTime(300))

    expect(screen.getByText('Saves the draft')).toBeInTheDocument()
  })

  it('closes after a mouse click and stays closed when the pointer leaves', () => {
    const { button } = renderButtonTip()
    fireEvent.mouseEnter(button)
    expect(screen.getByText('Saves the draft')).toBeInTheDocument()

    fireEvent.mouseDown(button, { button: 0, detail: 1 })
    fireEvent.focus(button)
    fireEvent.mouseUp(button, { button: 0, detail: 1 })
    fireEvent.click(button, { button: 0, detail: 1 })
    fireEvent.mouseLeave(button)

    expect(screen.queryByText('Saves the draft')).not.toBeInTheDocument()
  })

  it('adds no tab stop and no second button around the trigger', () => {
    const { container } = renderButtonTip()

    expect(container.querySelectorAll('[tabindex="0"]')).toHaveLength(1)
    expect(screen.getAllByRole('button')).toHaveLength(1)
  })

  it('has no accessibility violations while open from focus', async () => {
    const { container, button } = renderButtonTip()
    fireEvent.focus(button)

    expect(await axe(container)).toHaveNoViolations()
  })

  it('still follows a controlled isOpen over focus', () => {
    render(
      <Tooltip label="Controlled" isOpen={false}>
        <Button>
          <ButtonText>Save</ButtonText>
        </Button>
      </Tooltip>
    )

    fireEvent.focus(screen.getByRole('button', { name: 'Save' }))

    expect(screen.queryByText('Controlled')).not.toBeInTheDocument()
  })
})

/**
 * Tooltip's chrome, pinned (AW-142 wave two). Unchanged in pixels.
 */
describe('Tooltip geometry resolves to the spacing tokens', () => {
  it('the bubble ships its inset', () => {
    render(
      <Tooltip label="Bubble" isOpen>
        <button>Trigger</button>
      </Tooltip>
    )
    expect(spacingClassesAt(screen.getByText('Bubble').parentElement)).toEqual([
      'px-inset-md',
      'py-inset-sm',
    ])
    expect(resolveAll(['px-inset-md', 'py-inset-sm'])).toEqual(['12px', '8px'])
  })
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

  it('opens on press, for touch', () => {
    renderTip()

    fireEvent.click(screen.getByTestId('tip'))

    expect(screen.getByText('Under the band')).toBeInTheDocument()
  })

  // A tap focuses the trigger and then presses it; the press used to toggle the tip shut again.
  it('stays open when one tap both focuses and presses the trigger', () => {
    renderTip()
    const trigger = screen.getByTestId('tip')

    fireEvent.focus(trigger)
    fireEvent.click(trigger)

    expect(screen.getByText('Under the band')).toBeInTheDocument()
  })

  it('stays open when a hovered trigger is clicked', () => {
    renderTip()
    const trigger = screen.getByTestId('tip')

    fireEvent.mouseEnter(trigger)
    fireEvent.click(trigger)

    expect(screen.getByText('Under the band')).toBeInTheDocument()
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

  it('gives the open tip the tooltip role', () => {
    renderTip()
    fireEvent.focus(screen.getByTestId('tip'))
    expect(screen.getByRole('tooltip')).toHaveTextContent('Under the band')
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

  it('is not exported from the tooltip barrel', () => {
    expect(Object.keys(tooltipBarrel)).not.toContain('PinnedTipContext')
  })

  // Cold import of every published entry: median 1365 ms, max 2588 ms locally, 5022 ms on CI at the 5000 ms default.
  it('is not exported from any published entry', { timeout: 30_000 }, async () => {
    const entries = {
      index: await import('../../../index'),
      bodymap: await import('../../../bodymap'),
      pages: await import('../../../pages'),
      theme: await import('../../../theme/index'),
      tokens: await import('../../../theme/tokens/index'),
      tokensCss: await import('../../../theme/tokens-css'),
    }
    for (const [name, entry] of Object.entries(entries)) {
      expect(Object.keys(entry), name).not.toContain('PinnedTipContext')
    }
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
