import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'jest-axe'
import { Scatter, type ScatterDatum } from './Scatter'

const data: ScatterDatum[] = [
  { id: 'a', x: 0.1, y: 0.9, label: 'core' },
  { id: 'b', x: 0.5, y: 0.5, label: 'mid' },
  { id: 'c', x: 0.9, y: 0.1, label: 'leaf' },
]

const base = { data, width: 320, height: 240 }

describe('Scatter', () => {
  it('renders one point per datum', () => {
    render(<Scatter {...base} />)
    expect(screen.getByTestId('scatter-point-a')).toBeInTheDocument()
    expect(screen.getByTestId('scatter-point-b')).toBeInTheDocument()
    expect(screen.getByTestId('scatter-point-c')).toBeInTheDocument()
  })

  it('renders gridlines on both axes', () => {
    render(<Scatter {...base} />)
    expect(screen.getAllByTestId('scatter-gridline-x').length).toBeGreaterThanOrEqual(2)
    expect(screen.getAllByTestId('scatter-gridline-y').length).toBeGreaterThanOrEqual(2)
  })

  it('fires onPress with the point id', () => {
    const onPress = vi.fn()
    render(<Scatter {...base} onPress={onPress} />)
    fireEvent.click(screen.getByTestId('scatter-point-b'))
    expect(onPress).toHaveBeenCalledWith('b')
  })

  it('draws the main-sequence diagonal only when requested', () => {
    const { rerender } = render(<Scatter {...base} />)
    expect(screen.queryByTestId('scatter-diagonal')).not.toBeInTheDocument()
    rerender(<Scatter {...base} diagonal />)
    expect(screen.getByTestId('scatter-diagonal')).toBeInTheDocument()
  })

  it('renders axis labels when provided', () => {
    render(<Scatter {...base} axis={{ xLabel: 'Instability', yLabel: 'Abstractness' }} />)
    expect(screen.getByTestId('scatter-x-label')).toHaveTextContent('Instability')
    expect(screen.getByTestId('scatter-y-label')).toHaveTextContent('Abstractness')
  })

  it('labels a point by its label, falling back to id', () => {
    render(<Scatter data={[{ id: 'solo', x: 0.2, y: 0.4 }]} width={200} height={200} />)
    expect(screen.getByLabelText('solo')).toBeInTheDocument()
  })

  it('renders a single point without crashing', () => {
    render(<Scatter data={[{ id: 'one', x: 5, y: 5 }]} width={200} height={200} />)
    expect(screen.getByTestId('scatter-point-one')).toBeInTheDocument()
  })

  it('renders an empty plot frame with no points', () => {
    render(<Scatter data={[]} width={200} height={200} />)
    expect(screen.getByTestId('scatter-canvas')).toBeInTheDocument()
    expect(screen.queryByTestId('scatter-points')?.childNodes.length ?? 0).toBe(0)
  })

  it('places an outlier inside the plot when domains are overridden', () => {
    render(
      <Scatter
        data={[{ id: 'big', x: 999, y: 999 }]}
        width={200}
        height={200}
        axis={{ xMin: 0, xMax: 1000, yMin: 0, yMax: 1000 }}
      />
    )
    expect(screen.getByTestId('scatter-point-big')).toBeInTheDocument()
  })

  describe('accessibility', () => {
    it('labels the canvas as an image', () => {
      render(<Scatter {...base} axis={{ xLabel: 'I', yLabel: 'A' }} />)
      const canvas = screen.getByTestId('scatter-canvas')
      expect(canvas).toHaveAttribute('role', 'img')
      expect(canvas.getAttribute('aria-label')).toContain('3 points')
    })

    it('has no accessibility violations', async () => {
      const { container } = render(
        <Scatter {...base} diagonal axis={{ xLabel: 'I', yLabel: 'A' }} selectedId="b" />
      )
      expect(await axe(container)).toHaveNoViolations()
    })

    it('has no accessibility violations when empty', async () => {
      const { container } = render(<Scatter data={[]} width={200} height={200} />)
      expect(await axe(container)).toHaveNoViolations()
    })
  })
})
