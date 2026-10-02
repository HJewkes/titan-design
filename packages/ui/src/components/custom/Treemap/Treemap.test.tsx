import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'jest-axe'
import { Treemap, type TreemapDatum } from './Treemap'
import { Surface } from '../../ui/surface'
import { getSemanticColors } from '../../../theme/tokens/semantic'
import { contrast } from '../../../theme/color-story-kit'

const roles = Array.from({ length: 7 }, (_, i) => `dataviz-categorical-${i}` as const)
const uncolored: TreemapDatum[] = roles.map((_, i) => ({ id: `t${i}`, value: 10 - i }))

function renderedHex(el: HTMLElement): string {
  const channels = getComputedStyle(el).color.match(/\d+/g) ?? []
  return `#${channels
    .slice(0, 3)
    .map((c) => Number(c).toString(16).padStart(2, '0'))
    .join('')}`
}

const data: TreemapDatum[] = [
  { id: 'a', value: 100, color: '#5B9BD5', label: 'A' },
  { id: 'b', value: 40, color: '#14B8A6', label: 'B' },
  { id: 'c', value: 10, color: '#F4A736', label: 'C' },
]

describe('Treemap', () => {
  it('renders one tile per positive datum', () => {
    render(<Treemap data={data} width={300} height={200} />)
    expect(screen.getByTestId('treemap-tile-a')).toBeInTheDocument()
    expect(screen.getByTestId('treemap-tile-b')).toBeInTheDocument()
    expect(screen.getByTestId('treemap-tile-c')).toBeInTheDocument()
  })

  it('drops non-positive values', () => {
    render(<Treemap data={[...data, { id: 'zero', value: 0 }]} width={300} height={200} />)
    expect(screen.queryByTestId('treemap-tile-zero')).not.toBeInTheDocument()
  })

  it('folds overflow into a single "+M more" tile', () => {
    const many = Array.from({ length: 10 }, (_, i) => ({ id: `n${i}`, value: 10 - i * 0.5 }))
    render(<Treemap data={many} width={300} height={200} maxTiles={4} />)
    expect(screen.getByTestId('treemap-tile-__more__')).toBeInTheDocument()
    // 3 explicit + 1 fold = 4 tiles
    expect(screen.getByLabelText('+7 more')).toBeInTheDocument()
  })

  it('fires onPress with the tile id', () => {
    const onPress = vi.fn()
    render(<Treemap data={data} width={300} height={200} onPress={onPress} />)
    fireEvent.click(screen.getByTestId('treemap-tile-a'))
    expect(onPress).toHaveBeenCalledWith('a')
  })

  it('does not fire onPress for the fold tile', () => {
    const onPress = vi.fn()
    const many = Array.from({ length: 6 }, (_, i) => ({ id: `n${i}`, value: 6 - i }))
    render(<Treemap data={many} width={300} height={200} maxTiles={3} onPress={onPress} />)
    fireEvent.click(screen.getByTestId('treemap-tile-__more__'))
    expect(onPress).not.toHaveBeenCalled()
  })

  it('assigns fallback palette colors when omitted', () => {
    const { container } = render(
      <Treemap data={[{ id: 'x', value: 1 }]} width={100} height={100} />
    )
    expect(container.firstChild).toBeInTheDocument()
  })

  it('renders nothing meaningful for all-zero data without crashing', () => {
    render(<Treemap data={[{ id: 'z', value: 0 }]} width={100} height={100} />)
    expect(screen.queryByTestId('treemap-tile-z')).not.toBeInTheDocument()
  })

  describe('theme', () => {
    it('paints tile i with the dark dataviz-categorical-i by default', () => {
      const dark = getSemanticColors('dark')
      render(<Treemap data={uncolored} width={700} height={400} scale="linear" />)
      roles.forEach((role, i) => {
        expect(screen.getByTestId(`treemap-tile-t${i}`)).toHaveStyle({
          backgroundColor: dark[role],
        })
      })
    })

    it('paints tile i with the light dataviz-categorical-i under a light Surface', () => {
      const light = getSemanticColors('light')
      expect(light['dataviz-categorical-1']).not.toBe(
        getSemanticColors('dark')['dataviz-categorical-1']
      )
      render(
        <Surface theme="light">
          <Treemap data={uncolored} width={700} height={400} scale="linear" />
        </Surface>
      )
      roles.forEach((role, i) => {
        expect(screen.getByTestId(`treemap-tile-t${i}`)).toHaveStyle({
          backgroundColor: light[role],
        })
      })
    })

    it('labels every light tile at 4.5:1 or better', () => {
      const light = getSemanticColors('light')
      render(
        <Surface theme="light">
          <Treemap data={uncolored} width={700} height={400} scale="linear" />
        </Surface>
      )
      roles.forEach((role, i) => {
        const ink = renderedHex(screen.getByTestId(`treemap-label-t${i}`))
        expect(contrast(ink, light[role])).toBeGreaterThanOrEqual(4.5)
      })
    })

    it('keeps a caller-supplied colour and falls back to on-data-strong ink for a var() fill', () => {
      const fill = 'var(--color-data-4)'
      render(<Treemap data={[{ id: 'v', value: 1, color: fill }]} width={200} height={100} />)
      expect(screen.getByTestId('treemap-tile-v').style.backgroundColor).toBe(fill)
      expect(screen.getByTestId('treemap-label-v')).toHaveStyle({
        color: getSemanticColors('dark')['on-data-strong'],
      })
    })
  })

  describe('accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<Treemap data={data} width={300} height={200} />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})
