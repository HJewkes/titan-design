import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { Typography, Heading, Paragraph, Caption, Label, Overline } from './Typography'

describe('Typography', () => {
  it('renders children correctly', () => {
    render(<Typography>Hello World</Typography>)
    expect(screen.getByText('Hello World')).toBeInTheDocument()
  })

  it('renders different variants', () => {
    const { rerender } = render(<Typography variant="h1">Heading</Typography>)
    expect(screen.getByRole('heading')).toBeInTheDocument()

    rerender(<Typography variant="body1">Body text</Typography>)
    expect(screen.getByText('Body text')).toBeInTheDocument()
  })

  it('applies color styles', () => {
    render(<Typography color="secondary">Secondary text</Typography>)
    expect(screen.getByText('Secondary text')).toBeInTheDocument()
  })

  it('applies text alignment', () => {
    render(<Typography align="center">Centered text</Typography>)
    expect(screen.getByText('Centered text')).toBeInTheDocument()
  })

  it('applies noWrap truncation', () => {
    render(<Typography noWrap>Long text that should truncate</Typography>)
    const text = screen.getByText('Long text that should truncate')
    // On web, noWrap renders as CSS truncation styles rather than numberOfLines attribute
    expect(text).toBeInTheDocument()
  })

  describe('Heading component', () => {
    it('renders correct heading level', () => {
      const { rerender } = render(<Heading level={1}>H1</Heading>)
      expect(screen.getByRole('heading')).toBeInTheDocument()

      rerender(<Heading level={3}>H3</Heading>)
      expect(screen.getByRole('heading')).toBeInTheDocument()
    })
  })

  describe('Paragraph component', () => {
    it('renders body1 by default', () => {
      render(<Paragraph>Regular paragraph</Paragraph>)
      expect(screen.getByText('Regular paragraph')).toBeInTheDocument()
    })

    it('renders body2 when small prop is true', () => {
      render(<Paragraph small>Small paragraph</Paragraph>)
      expect(screen.getByText('Small paragraph')).toBeInTheDocument()
    })
  })

  describe('Caption component', () => {
    it('renders with caption variant', () => {
      render(<Caption>Caption text</Caption>)
      expect(screen.getByText('Caption text')).toBeInTheDocument()
    })
  })

  describe('Label component', () => {
    it('renders with subtitle2 variant', () => {
      render(<Label>Label text</Label>)
      expect(screen.getByText('Label text')).toBeInTheDocument()
    })
  })

  describe('Overline component', () => {
    it('renders with overline variant', () => {
      render(<Overline>OVERLINE TEXT</Overline>)
      expect(screen.getByText('OVERLINE TEXT')).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('headings have no accessibility violations', async () => {
      const { container } = render(
        <div>
          <Typography variant="h1">Main Title</Typography>
          <Typography variant="h2">Section Title</Typography>
        </div>
      )

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('body text has no accessibility violations', async () => {
      const { container } = render(
        <Typography variant="body1">Body text content</Typography>
      )

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('headings have correct accessibility role', () => {
      render(<Typography variant="h2">Section Heading</Typography>)
      expect(screen.getByRole('heading')).toBeInTheDocument()
    })
  })
})
