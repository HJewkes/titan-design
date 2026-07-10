import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { SegmentedBar, type SegmentedBarSegment } from './SegmentedBar'

const threeSegments: SegmentedBarSegment[] = [
  { color: '#D14343' },
  { color: '#FF7900' },
  { color: '#2ED573' },
]

describe('SegmentedBar', () => {
  it('renders one fill per segment', () => {
    render(<SegmentedBar segments={threeSegments} />)
    expect(screen.getAllByTestId('segmented-bar-segment')).toHaveLength(3)
  })

  it('honours the fill fraction as the fill width', () => {
    render(<SegmentedBar segments={[{ color: '#2ED573', fill: 0.5 }]} />)
    expect(screen.getByTestId('segmented-bar-segment')).toHaveStyle({ width: '50%' })
  })

  it('lets a composer override each segment testID', () => {
    render(<SegmentedBar segments={threeSegments} segmentTestID={(_, i) => `seg-${i}`} />)
    expect(screen.getByTestId('seg-0')).toBeInTheDocument()
    expect(screen.getByTestId('seg-2')).toBeInTheDocument()
  })

  it('defaults to an 8px height and honours the height prop', () => {
    const { rerender } = render(<SegmentedBar segments={threeSegments} testID="segmented-bar" />)
    expect(screen.getByTestId('segmented-bar')).toHaveStyle({ height: '8px' })
    rerender(<SegmentedBar segments={threeSegments} height={4} testID="segmented-bar" />)
    expect(screen.getByTestId('segmented-bar')).toHaveStyle({ height: '4px' })
  })

  it('carves a leading gap before a segment as a fixed left margin on its slot', () => {
    render(
      <SegmentedBar
        segments={[{ color: '#D14343' }, { color: '#FF7900', leadingGap: 3 }]}
        gap={0}
        segmentTestID={(_, i) => `seg-${i}`}
      />
    )
    const slot = (fill: string) => screen.getByTestId(fill).parentElement as HTMLElement
    expect(slot('seg-0')).not.toHaveStyle({ marginLeft: '3px' })
    expect(slot('seg-1')).toHaveStyle({ marginLeft: '3px' })
  })

  it('applies a static fill opacity to a non-pulsing segment', () => {
    render(<SegmentedBar segments={[{ color: '#0B3149', opacity: 0.36 }]} />)
    expect(screen.getByTestId('segmented-bar-segment')).toHaveStyle({ opacity: 0.36 })
  })

  it('draws a marker line only when a marker is supplied', () => {
    const { rerender } = render(<SegmentedBar segments={threeSegments} />)
    expect(screen.queryByTestId('segmented-bar-marker')).not.toBeInTheDocument()
    rerender(<SegmentedBar segments={threeSegments} marker={{ position: 0.5, color: '#01B5D1' }} />)
    expect(screen.getByTestId('segmented-bar-marker')).toBeInTheDocument()
  })

  describe('accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(
        <SegmentedBar
          segments={[
            { color: '#2ED573' },
            { color: '#FF7900', pulse: true },
            { color: '#3A3A3A', fill: 0.4 },
          ]}
          marker={{ position: 0.75, color: '#01B5D1' }}
        />
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})
