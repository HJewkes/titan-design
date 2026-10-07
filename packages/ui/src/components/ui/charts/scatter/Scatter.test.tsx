import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Text } from 'react-native'
import { axe } from 'jest-axe'
import { Scatter, type ScatterDatum } from './Scatter'
import { Surface } from '../../surface'
import { getSemanticColors } from '../../../../theme/tokens/semantic'

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

  it('labels sub-1 tick values to 2 decimal places', () => {
    render(<Scatter {...base} />)
    const labels = screen.getAllByTestId('scatter-gridline-y').map((el) => el.textContent)
    expect(labels).toContain('0.40')
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

  it('draws diagonal and the equivalent referenceLines as the same segment', () => {
    const style = (el: HTMLElement) => el.getAttribute('style')
    const { unmount } = render(<Scatter {...base} diagonal />)
    const fromDiagonal = style(screen.getByTestId('scatter-diagonal'))
    unmount()
    render(<Scatter {...base} referenceLines={[{ slope: -1, intercept: 1, id: 'd' }]} />)
    expect(style(screen.getByTestId('scatter-reference-d'))).toBe(fromDiagonal)
  })

  it('draws horizontal and vertical reference lines and skips ones outside the domain', () => {
    render(
      <Scatter
        {...base}
        referenceLines={[
          { y: 0.5, id: 'h' },
          { x: 0.5, id: 'v' },
          { y: 9, id: 'out' },
        ]}
      />
    )
    expect(screen.getByTestId('scatter-reference-h')).toBeInTheDocument()
    expect(screen.getByTestId('scatter-reference-v')).toBeInTheDocument()
    expect(screen.queryByTestId('scatter-reference-out')).not.toBeInTheDocument()
  })

  it('renders reference lines that share an id without duplicate-key warnings', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(
      <Scatter
        {...base}
        referenceLines={[
          { y: 0.3, id: 'dup' },
          { y: 0.6, id: 'dup' },
        ]}
      />
    )
    expect(screen.getAllByTestId('scatter-reference-dup')).toHaveLength(2)
    expect(error).not.toHaveBeenCalled()
    error.mockRestore()
  })

  it('adds a reference line label to the accessible name without painting it', () => {
    render(<Scatter {...base} referenceLines={[{ y: 0.5, label: 'Target' }]} />)
    expect(screen.getByTestId('scatter-canvas').getAttribute('aria-label')).toContain(
      'reference lines: Target'
    )
    expect(screen.queryByText('Target')).not.toBeInTheDocument()
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

  describe('empty state', () => {
    it('shows a "No data" placeholder in place of the plot when there is no data', () => {
      render(<Scatter data={[]} width={200} height={200} />)

      expect(screen.getByTestId('scatter-empty')).toHaveTextContent('No data')
      expect(screen.queryByTestId('scatter-canvas')).not.toBeInTheDocument()
    })

    it('shows the consumer emptyState instead of the default', () => {
      render(<Scatter data={[]} width={200} height={200} emptyState={<Text>Nothing yet</Text>} />)

      expect(screen.getByTestId('scatter-empty')).toHaveTextContent('Nothing yet')
      expect(screen.queryByText('No data')).not.toBeInTheDocument()
    })
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

  describe('theme', () => {
    it('paints the default series with the dark categorical role by default', () => {
      render(<Scatter {...base} />)
      expect(screen.getByTestId('scatter-point-b')).toHaveStyle({
        backgroundColor: getSemanticColors('dark')['dataviz-categorical-1'],
      })
    })

    it('paints the default series with the light categorical role under a light Surface', () => {
      const light = getSemanticColors('light')
      render(
        <Surface theme="light">
          <Scatter {...base} />
        </Surface>
      )
      data.forEach((d, i) => {
        expect(screen.getByTestId(`scatter-point-${d.id}`)).toHaveStyle({
          backgroundColor: light[`dataviz-categorical-${i}` as const],
        })
      })
    })
  })

  describe('reference lines', () => {
    const strokes = (theme: 'dark' | 'light') => {
      const { unmount } = render(
        <Surface theme={theme}>
          <Scatter {...base} diagonal />
        </Surface>
      )
      const bg = (id: string) => getComputedStyle(screen.getAllByTestId(id)[0]).backgroundColor
      const result = {
        grid: bg('scatter-gridline-y'),
        axis: bg('scatter-axis-x'),
        diagonal: getComputedStyle(screen.getByTestId('scatter-diagonal')).borderTopColor,
      }
      unmount()
      return result
    }

    it('resolves grid, axis and diagonal strokes from the hairline tokens per mode', () => {
      const light = getSemanticColors('light')
      const probe = document.createElement('div')
      const resolve = (c: string) => {
        probe.style.backgroundColor = c
        return probe.style.backgroundColor
      }
      expect(strokes('light')).toEqual({
        grid: resolve(light['hairline-subtle']),
        axis: resolve(light['hairline-default']),
        diagonal: resolve(light['hairline-strong']),
      })
    })

    it('draws different strokes on a light surface than on a dark one', () => {
      const dark = strokes('dark')
      const light = strokes('light')
      expect(light.grid).not.toBe(dark.grid)
      expect(light.axis).not.toBe(dark.axis)
      expect(light.diagonal).not.toBe(dark.diagonal)
    })
  })

  describe('selected ring', () => {
    const ring = (theme: 'dark' | 'light') => {
      const { unmount } = render(
        <Surface theme={theme}>
          <Scatter {...base} selectedId="b" />
        </Surface>
      )
      const color = getComputedStyle(screen.getByTestId('scatter-point-b')).borderTopColor
      unmount()
      return color
    }

    /** WCAG 2.1 contrast ratio between two opaque hex colours. */
    const contrastRatio = (a: string, b: string): number => {
      const lum = (hex: string): number => {
        const h = hex.replace('#', '')
        const [r, g, bl] = [0, 2, 4].map((i) => {
          const c = parseInt(h.slice(i, i + 2), 16) / 255
          return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
        })
        return 0.2126 * r + 0.7152 * g + 0.0722 * bl
      }
      const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x)
      return (hi + 0.05) / (lo + 0.05)
    }

    it('draws a different ring on a light surface than on a dark one', () => {
      expect(ring('light')).not.toBe(ring('dark'))
    })

    it('resolves the ring from the text-primary token per mode', () => {
      const probe = document.createElement('div')
      const resolve = (c: string) => {
        probe.style.borderTopColor = c
        return probe.style.borderTopColor
      }
      expect(ring('light')).toBe(resolve(getSemanticColors('light')['text-primary']))
      expect(ring('dark')).toBe(resolve(getSemanticColors('dark')['text-primary']))
    })

    it.each(['light', 'dark'] as const)('keeps the %s ring at 3:1 against its surface', (mode) => {
      const t = getSemanticColors(mode)
      expect(contrastRatio(t['text-primary'], t['surface-base'])).toBeGreaterThanOrEqual(3)
    })

    it('clears 3:1 against the light surface with the colour actually painted', () => {
      const light = getSemanticColors('light')
      const probe = document.createElement('div')
      probe.style.borderTopColor = ring('light')
      const [r, g, b] = probe.style.borderTopColor.match(/\d+/g)!.map(Number)
      const hex = '#' + [r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('')
      expect(contrastRatio(hex, light['surface-base'])).toBeGreaterThanOrEqual(3)
    })
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
        <Scatter
          {...base}
          referenceLines={[{ slope: -1, intercept: 1, label: 'Main sequence' }]}
          axis={{ xLabel: 'I', yLabel: 'A' }}
          selectedId="b"
        />
      )
      expect(await axe(container)).toHaveNoViolations()
    })

    it('has no accessibility violations when empty', async () => {
      const { container } = render(<Scatter data={[]} width={200} height={200} />)
      expect(await axe(container)).toHaveNoViolations()
    })
  })
})
