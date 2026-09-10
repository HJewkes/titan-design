import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { Sparkline } from './Sparkline'
import { resolveColor } from '../../../theme/resolve-color'

const sampleData = [10, 25, 15, 30, 20]

describe('Sparkline', () => {
  it('renders with data points', () => {
    render(<Sparkline data={sampleData} />)
    expect(screen.getByTestId('sparkline')).toBeInTheDocument()
  })

  it('renders empty state for no data', () => {
    render(<Sparkline data={[]} />)
    expect(screen.getByTestId('sparkline-empty')).toBeInTheDocument()
  })

  it('renders line segments between points', () => {
    render(<Sparkline data={sampleData} />)
    for (let i = 1; i < sampleData.length; i++) {
      expect(screen.getByTestId(`sparkline-segment-${i}`)).toBeInTheDocument()
    }
  })

  it('renders dots when showDots is true', () => {
    render(<Sparkline data={sampleData} showDots />)
    for (let i = 0; i < sampleData.length; i++) {
      expect(screen.getByTestId(`sparkline-dot-${i}`)).toBeInTheDocument()
    }
  })

  it('does not render dots when showDots is false', () => {
    render(<Sparkline data={sampleData} />)
    expect(screen.queryByTestId('sparkline-dot-0')).not.toBeInTheDocument()
  })

  it('highlights last dot when highlightLast is true', () => {
    render(<Sparkline data={sampleData} highlightLast />)
    const lastIndex = sampleData.length - 1
    expect(screen.getByTestId(`sparkline-dot-${lastIndex}`)).toBeInTheDocument()
    // Other dots should not be present (showDots is false)
    expect(screen.queryByTestId('sparkline-dot-0')).not.toBeInTheDocument()
  })

  it('renders both regular dots and highlighted last', () => {
    render(<Sparkline data={sampleData} showDots highlightLast />)
    for (let i = 0; i < sampleData.length; i++) {
      expect(screen.getByTestId(`sparkline-dot-${i}`)).toBeInTheDocument()
    }
  })

  it('renders reference lines', () => {
    render(
      <Sparkline
        data={sampleData}
        referenceLines={[
          { value: 20, color: '#ff0000' },
          { value: 25, color: '#00ff00', dashed: true },
        ]}
      />
    )
    expect(screen.getByTestId('sparkline-reference-0')).toBeInTheDocument()
    expect(screen.getByTestId('sparkline-reference-1')).toBeInTheDocument()
  })

  it('does not render reference lines when not provided', () => {
    render(<Sparkline data={sampleData} />)
    expect(screen.queryByTestId('sparkline-reference-0')).not.toBeInTheDocument()
  })

  it('defaults the trace to the brand-primary token', () => {
    render(<Sparkline data={sampleData} highlightLast />)
    expect(screen.getByTestId('sparkline-segment-1')).toHaveStyle({
      backgroundColor: resolveColor('brand-primary'),
    })
    expect(screen.getByTestId('sparkline-dot-4')).toHaveStyle({
      backgroundColor: resolveColor('brand-primary'),
    })
  })

  it('lets a caller override the trace colour', () => {
    render(<Sparkline data={sampleData} color="#00ff00" />)
    expect(screen.getByTestId('sparkline-segment-1')).toHaveStyle({
      backgroundColor: '#00ff00',
    })
  })

  it('renders a reference-line label in the caller colour', () => {
    render(
      <Sparkline
        data={sampleData}
        referenceLines={[{ value: 20, color: '#ff0000', label: 'MAV' }]}
      />
    )
    const label = screen.getByTestId('sparkline-reference-label-0')
    expect(label).toHaveTextContent('MAV')
    expect(label).toHaveStyle({ color: '#ff0000' })
  })

  it('uses default dimensions', () => {
    render(<Sparkline data={sampleData} />)
    const sparkline = screen.getByTestId('sparkline')
    expect(sparkline).toHaveStyle({ width: '80px', height: '30px' })
  })

  it('accepts custom dimensions', () => {
    render(<Sparkline data={sampleData} width={120} height={50} />)
    const sparkline = screen.getByTestId('sparkline')
    expect(sparkline).toHaveStyle({ width: '120px', height: '50px' })
  })

  it('sets accessibility label', () => {
    render(<Sparkline data={sampleData} />)
    expect(screen.getByLabelText('Sparkline chart with 5 data points')).toBeInTheDocument()
  })

  it('sets empty accessibility label for no data', () => {
    render(<Sparkline data={[]} />)
    expect(screen.getByLabelText('Sparkline chart, no data')).toBeInTheDocument()
  })

  describe('accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<Sparkline data={sampleData} showDots highlightLast />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})
