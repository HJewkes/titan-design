import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'jest-axe'
import { Tooltip } from './Tooltip'

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
      expect(screen.getByTestId('tooltip-portal').parentElement).toBe(
        document.body
      )
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
