import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { PlaceholderStrip } from './PlaceholderStrip'

describe('PlaceholderStrip', () => {
  it('renders a strip element', () => {
    render(<PlaceholderStrip />)
    expect(screen.getByTestId('placeholder-strip')).toBeInTheDocument()
  })

  it('sets accessibility label', () => {
    render(<PlaceholderStrip />)
    expect(
      screen.getByLabelText('Planned set, not yet completed'),
    ).toBeInTheDocument()
  })

  it('applies fixed width when provided', () => {
    render(<PlaceholderStrip width={200} />)
    const strip = screen.getByTestId('placeholder-strip')
    expect(strip).toBeInTheDocument()
  })

  it('renders multiple strips', () => {
    render(
      <>
        <PlaceholderStrip />
        <PlaceholderStrip />
        <PlaceholderStrip />
      </>,
    )
    const strips = screen.getAllByTestId('placeholder-strip')
    expect(strips).toHaveLength(3)
  })

  it('defaults to single mode', () => {
    render(<PlaceholderStrip />)
    expect(screen.queryAllByTestId('placeholder-segment')).toHaveLength(0)
  })

  describe('segmented mode', () => {
    it('renders segments when mode is segmented', () => {
      render(<PlaceholderStrip mode="segmented" segments={5} />)
      const segments = screen.getAllByTestId('placeholder-segment')
      expect(segments).toHaveLength(5)
    })

    it('defaults to 3 segments when segments prop is omitted', () => {
      render(<PlaceholderStrip mode="segmented" />)
      const segments = screen.getAllByTestId('placeholder-segment')
      expect(segments).toHaveLength(3)
    })

    it('still has the strip container testID', () => {
      render(<PlaceholderStrip mode="segmented" segments={4} />)
      expect(screen.getByTestId('placeholder-strip')).toBeInTheDocument()
    })

    it('sets accessibility label in segmented mode', () => {
      render(<PlaceholderStrip mode="segmented" segments={3} />)
      expect(
        screen.getByLabelText('Planned set, not yet completed'),
      ).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('has no accessibility violations in single mode', async () => {
      const { container } = render(<PlaceholderStrip />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('has no accessibility violations in segmented mode', async () => {
      const { container } = render(
        <PlaceholderStrip mode="segmented" segments={4} />,
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})
