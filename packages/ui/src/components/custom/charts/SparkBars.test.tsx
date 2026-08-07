import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { SparkBars } from './SparkBars'
import { getSemanticColors } from '../../../theme/tokens/semantic'

const t = getSemanticColors('dark')

/** rgb() is what jsdom reports back for a hex backgroundColor. */
function hexToRgb(hex: string): string {
  const n = parseInt(hex.replace('#', ''), 16)
  return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`
}

describe('SparkBars', () => {
  it('renders one bar per value', () => {
    render(<SparkBars values={[1, 2, 3, 4]} />)
    expect(screen.getAllByTestId(/^spark-bars-bar-/)).toHaveLength(4)
  })

  it('keeps only the last maxBars values', () => {
    render(<SparkBars values={[1, 2, 3, 4, 5, 6]} maxBars={2} />)
    expect(screen.getAllByTestId(/^spark-bars-bar-/)).toHaveLength(2)
  })

  it('renders no bars for an empty series but keeps the field', () => {
    render(<SparkBars values={[]} />)
    expect(screen.queryByTestId(/^spark-bars-bar-/)).not.toBeInTheDocument()
    expect(screen.getByTestId('spark-bars')).toBeInTheDocument()
  })

  it('tints negative bars with the error token and positive with brand', () => {
    render(<SparkBars values={[10, -10]} />)
    expect(screen.getByTestId('spark-bars-bar-0')).toHaveStyle({
      backgroundColor: hexToRgb(t['brand-primary']),
    })
    expect(screen.getByTestId('spark-bars-bar-1')).toHaveStyle({
      backgroundColor: hexToRgb(t['status-error']),
    })
  })

  it('honours explicit color overrides', () => {
    render(<SparkBars values={[10, -10]} color="#00ff00" negativeColor="#ff00ff" />)
    expect(screen.getByTestId('spark-bars-bar-0')).toHaveStyle({
      backgroundColor: 'rgb(0, 255, 0)',
    })
    expect(screen.getByTestId('spark-bars-bar-1')).toHaveStyle({
      backgroundColor: 'rgb(255, 0, 255)',
    })
  })

  it('scales bars on magnitude, so equal-magnitude values are equally tall', () => {
    render(<SparkBars values={[100, -100, 50]} height={40} />)
    const [a, b, c] = ['0', '1', '2'].map((i) => screen.getByTestId(`spark-bars-bar-${i}`))
    expect(a).toHaveStyle({ height: '40px' })
    expect(b).toHaveStyle({ height: '40px' })
    expect(c).toHaveStyle({ height: '20px' })
  })

  it('gives a zero value the minimum bar height rather than collapsing it', () => {
    render(<SparkBars values={[100, 0]} height={40} />)
    expect(screen.getByTestId('spark-bars-bar-1')).toHaveStyle({ height: '2px' })
  })

  it('exposes a default accessible label and accepts an override', () => {
    const { rerender } = render(<SparkBars values={[1, 2]} />)
    expect(screen.getByLabelText('Bar sparkline with 2 values')).toBeInTheDocument()
    rerender(<SparkBars values={[1, 2]} label="Growth for open.ts" />)
    expect(screen.getByLabelText('Growth for open.ts')).toBeInTheDocument()
  })

  it('has no a11y violations', async () => {
    const { container } = render(<SparkBars values={[3, -1, 4]} />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
