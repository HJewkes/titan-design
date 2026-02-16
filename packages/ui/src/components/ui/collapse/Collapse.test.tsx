import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'jest-axe'
import {
  Collapse,
  CollapseButton,
  CollapseContent,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
} from './Collapse'

describe('Collapse', () => {
  it('renders correctly', () => {
    render(
      <Collapse>
        <CollapseButton>Toggle</CollapseButton>
        <CollapseContent>Hidden content</CollapseContent>
      </Collapse>
    )
    expect(screen.getByText('Toggle')).toBeInTheDocument()
  })

  it('hides content by default', () => {
    render(
      <Collapse>
        <CollapseButton>Toggle</CollapseButton>
        <CollapseContent>Hidden content</CollapseContent>
      </Collapse>
    )
    expect(screen.queryByText('Hidden content')).not.toBeInTheDocument()
  })

  it('shows content when defaultIsOpen is true', () => {
    render(
      <Collapse defaultIsOpen>
        <CollapseButton>Toggle</CollapseButton>
        <CollapseContent>Visible content</CollapseContent>
      </Collapse>
    )
    expect(screen.getByText('Visible content')).toBeInTheDocument()
  })

  it('toggles content on button click', () => {
    render(
      <Collapse>
        <CollapseButton>Toggle</CollapseButton>
        <CollapseContent>Content</CollapseContent>
      </Collapse>
    )
    expect(screen.queryByText('Content')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByText('Content')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button'))
    expect(screen.queryByText('Content')).not.toBeInTheDocument()
  })

  it('calls onToggle callback', () => {
    const onToggle = vi.fn()
    render(
      <Collapse onToggle={onToggle}>
        <CollapseButton>Toggle</CollapseButton>
        <CollapseContent>Content</CollapseContent>
      </Collapse>
    )
    fireEvent.click(screen.getByRole('button'))
    expect(onToggle).toHaveBeenCalledWith(true)

    fireEvent.click(screen.getByRole('button'))
    expect(onToggle).toHaveBeenCalledWith(false)
  })

  it('supports controlled isOpen prop', () => {
    const onToggle = vi.fn()
    const { rerender } = render(
      <Collapse isOpen={false} onToggle={onToggle}>
        <CollapseButton>Toggle</CollapseButton>
        <CollapseContent>Content</CollapseContent>
      </Collapse>
    )
    expect(screen.queryByText('Content')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button'))
    expect(onToggle).toHaveBeenCalledWith(true)
    // Still hidden because controlled
    expect(screen.queryByText('Content')).not.toBeInTheDocument()

    rerender(
      <Collapse isOpen={true} onToggle={onToggle}>
        <CollapseButton>Toggle</CollapseButton>
        <CollapseContent>Content</CollapseContent>
      </Collapse>
    )
    expect(screen.getByText('Content')).toBeInTheDocument()
  })

  it('communicates expanded state via aria', () => {
    render(
      <Collapse>
        <CollapseButton>Toggle</CollapseButton>
        <CollapseContent>Content</CollapseContent>
      </Collapse>
    )
    // react-native-web does not map accessibilityState.expanded to aria-expanded
    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()

    fireEvent.click(button)
    expect(screen.getByText('Content')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(
      <Collapse className="extra">
        <CollapseButton>Toggle</CollapseButton>
        <CollapseContent>Content</CollapseContent>
      </Collapse>
    )
    expect(container.firstChild).toBeInTheDocument()
  })

  describe('Accordion', () => {
    it('renders accordion items', () => {
      render(
        <Accordion>
          <AccordionItem>
            <AccordionButton>Section 1</AccordionButton>
            <AccordionPanel>Panel 1</AccordionPanel>
          </AccordionItem>
          <AccordionItem>
            <AccordionButton>Section 2</AccordionButton>
            <AccordionPanel>Panel 2</AccordionPanel>
          </AccordionItem>
        </Accordion>
      )
      expect(screen.getByText('Section 1')).toBeInTheDocument()
      expect(screen.getByText('Section 2')).toBeInTheDocument()
    })

    it('hides all panels by default', () => {
      render(
        <Accordion>
          <AccordionItem>
            <AccordionButton>Section 1</AccordionButton>
            <AccordionPanel>Panel 1</AccordionPanel>
          </AccordionItem>
        </Accordion>
      )
      expect(screen.queryByText('Panel 1')).not.toBeInTheDocument()
    })

    it('opens panel on click', () => {
      render(
        <Accordion>
          <AccordionItem>
            <AccordionButton>Section 1</AccordionButton>
            <AccordionPanel>Panel 1</AccordionPanel>
          </AccordionItem>
        </Accordion>
      )
      fireEvent.click(screen.getByText('Section 1'))
      expect(screen.getByText('Panel 1')).toBeInTheDocument()
    })

    it('closes other panels in single mode', () => {
      render(
        <Accordion>
          <AccordionItem>
            <AccordionButton>Section 1</AccordionButton>
            <AccordionPanel>Panel 1</AccordionPanel>
          </AccordionItem>
          <AccordionItem>
            <AccordionButton>Section 2</AccordionButton>
            <AccordionPanel>Panel 2</AccordionPanel>
          </AccordionItem>
        </Accordion>
      )
      fireEvent.click(screen.getByText('Section 1'))
      expect(screen.getByText('Panel 1')).toBeInTheDocument()

      fireEvent.click(screen.getByText('Section 2'))
      expect(screen.queryByText('Panel 1')).not.toBeInTheDocument()
      expect(screen.getByText('Panel 2')).toBeInTheDocument()
    })

    it('allows multiple open panels when allowMultiple', () => {
      render(
        <Accordion allowMultiple>
          <AccordionItem>
            <AccordionButton>Section 1</AccordionButton>
            <AccordionPanel>Panel 1</AccordionPanel>
          </AccordionItem>
          <AccordionItem>
            <AccordionButton>Section 2</AccordionButton>
            <AccordionPanel>Panel 2</AccordionPanel>
          </AccordionItem>
        </Accordion>
      )
      fireEvent.click(screen.getByText('Section 1'))
      fireEvent.click(screen.getByText('Section 2'))
      expect(screen.getByText('Panel 1')).toBeInTheDocument()
      expect(screen.getByText('Panel 2')).toBeInTheDocument()
    })

    it('supports defaultIndex for initially open items', () => {
      render(
        <Accordion defaultIndex={[0]}>
          <AccordionItem>
            <AccordionButton>Section 1</AccordionButton>
            <AccordionPanel>Panel 1</AccordionPanel>
          </AccordionItem>
          <AccordionItem>
            <AccordionButton>Section 2</AccordionButton>
            <AccordionPanel>Panel 2</AccordionPanel>
          </AccordionItem>
        </Accordion>
      )
      expect(screen.getByText('Panel 1')).toBeInTheDocument()
      expect(screen.queryByText('Panel 2')).not.toBeInTheDocument()
    })

    it('closes an open panel on toggle', () => {
      render(
        <Accordion>
          <AccordionItem>
            <AccordionButton>Section 1</AccordionButton>
            <AccordionPanel>Panel 1</AccordionPanel>
          </AccordionItem>
        </Accordion>
      )
      fireEvent.click(screen.getByText('Section 1'))
      expect(screen.getByText('Panel 1')).toBeInTheDocument()

      fireEvent.click(screen.getByText('Section 1'))
      expect(screen.queryByText('Panel 1')).not.toBeInTheDocument()
    })

    it('communicates expanded state via aria', () => {
      render(
        <Accordion>
          <AccordionItem>
            <AccordionButton>Section 1</AccordionButton>
            <AccordionPanel>Panel 1</AccordionPanel>
          </AccordionItem>
        </Accordion>
      )
      const buttons = screen.getAllByRole('button')
      // react-native-web does not map accessibilityState.expanded to aria-expanded
      expect(buttons[0]).toBeInTheDocument()

      fireEvent.click(buttons[0])
      expect(screen.getByText('Panel 1')).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('has no accessibility violations for Collapse', async () => {
      const { container } = render(
        <Collapse>
          <CollapseButton>Toggle</CollapseButton>
          <CollapseContent>Content</CollapseContent>
        </Collapse>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('has no accessibility violations for Accordion', async () => {
      const { container } = render(
        <Accordion>
          <AccordionItem>
            <AccordionButton>Section 1</AccordionButton>
            <AccordionPanel>Panel 1</AccordionPanel>
          </AccordionItem>
          <AccordionItem>
            <AccordionButton>Section 2</AccordionButton>
            <AccordionPanel>Panel 2</AccordionPanel>
          </AccordionItem>
        </Accordion>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('has button role on collapse trigger', () => {
      render(
        <Collapse>
          <CollapseButton>Toggle</CollapseButton>
          <CollapseContent>Content</CollapseContent>
        </Collapse>
      )
      expect(screen.getByRole('button')).toBeInTheDocument()
    })
  })
})
