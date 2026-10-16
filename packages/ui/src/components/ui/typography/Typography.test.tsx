import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { capturedClassNames } from '../../../test/classname-capture'
import {
  Typography,
  Heading,
  Paragraph,
  Caption,
  Label,
  Overline,
  type TypographyVariant,
} from './Typography'

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

  it('error text uses the text-error token, not the status-error class', () => {
    render(
      <Typography color="error" testID="error-text">
        Something went wrong
      </Typography>
    )

    const classes = capturedClassNames.get('error-text')?.split(' ') ?? []
    expect(classes).toContain('text-text-error')
    expect(classes).not.toContain('text-status-error')
  })

  // TD-789 3b: the status tones as text missed 4.5:1 on the grey 100 and 200 planes.
  it.each([
    ['success', 'text-text-success', 'text-status-success'],
    ['warning', 'text-text-warning', 'text-status-warning'],
    ['info', 'text-text-info', 'text-status-info'],
  ] as const)('%s text uses %s, not %s', (color, textRole, fillTone) => {
    render(
      <Typography color={color} testID="tone-text">
        Status
      </Typography>
    )
    const classes = capturedClassNames.get('tone-text')?.split(' ') ?? []
    expect(classes).toContain(textRole)
    expect(classes).not.toContain(fillTone)
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
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()

      rerender(<Heading level={3}>H3</Heading>)
      expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument()
    })
  })

  describe('heading levels', () => {
    it.each([1, 2, 3, 4, 5, 6])('renders variant h%i at its own heading level', (level) => {
      render(<Typography variant={`h${level}` as TypographyVariant}>Title</Typography>)
      expect(screen.getByRole('heading', { level })).toHaveAttribute('aria-level', String(level))
    })

    it('renders h2 and h3 variants as h2 and h3 elements on web', () => {
      render(
        <>
          <Typography variant="h2">Section</Typography>
          <Typography variant="h3">Subsection</Typography>
        </>
      )
      expect(screen.getByRole('heading', { level: 2 }).tagName).toBe('H2')
      expect(screen.getByRole('heading', { level: 3 }).tagName).toBe('H3')
    })

    it('lets an explicit aria-level override the variant level', () => {
      render(
        <Typography variant="h5" aria-level={1}>
          Page title
        </Typography>
      )
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Page title')
    })

    it('puts no aria-level on non-heading variants', () => {
      render(<Typography variant="body1">Body</Typography>)
      expect(screen.getByText('Body')).not.toHaveAttribute('aria-level')
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

  describe('mono variants', () => {
    it('renders the mono variant', () => {
      render(<Typography variant="mono">16:12</Typography>)
      expect(screen.getByText('16:12')).toBeInTheDocument()
    })

    it('renders the monoLabel variant', () => {
      render(<Typography variant="monoLabel">live</Typography>)
      expect(screen.getByText('live')).toBeInTheDocument()
    })
  })

  describe('label variants', () => {
    it('renders the microLabel variant', () => {
      render(<Typography variant="microLabel">SET</Typography>)
      expect(screen.getByText('SET')).toBeInTheDocument()
    })

    it('renders the boldLabel variant', () => {
      render(<Typography variant="boldLabel">PR e1RM</Typography>)
      expect(screen.getByText('PR e1RM')).toBeInTheDocument()
    })

    it('keeps both label variants out of the heading tree', () => {
      render(
        <>
          <Typography variant="microLabel">REPS</Typography>
          <Typography variant="boldLabel">PR Weight</Typography>
        </>
      )
      expect(screen.queryByRole('heading')).not.toBeInTheDocument()
    })

    it('label variants have no accessibility violations', async () => {
      const { container } = render(
        <div>
          <Typography variant="microLabel">RPE</Typography>
          <Typography variant="boldLabel">PR Volume</Typography>
        </div>
      )

      const results = await axe(container)
      expect(results).toHaveNoViolations()
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
      const { container } = render(<Typography variant="body1">Body text content</Typography>)

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('headings have correct accessibility role', () => {
      render(<Typography variant="h2">Section Heading</Typography>)
      expect(screen.getByRole('heading')).toBeInTheDocument()
    })
  })
})
