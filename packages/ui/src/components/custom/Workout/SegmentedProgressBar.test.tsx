import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { SegmentedProgressBar, type SegmentedProgressBarSegment } from './SegmentedProgressBar'
import { paceTone, paceToneColor } from './paceTone'
import { getSemanticColors } from '../../../theme/tokens/semantic'
import { Surface } from '../../ui/surface'

// Light status-live-muted equals dark, so light is swapped for another token to prove the mode is read.
vi.mock('../../../theme/tokens/semantic', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../theme/tokens/semantic')>()
  const light = actual.getSemanticColors('light')
  const probeLight = { ...light, 'status-live-muted': light['status-info'] }
  return {
    ...actual,
    getSemanticColors: (mode: 'dark' | 'light') =>
      mode === 'light' ? probeLight : actual.getSemanticColors(mode),
  }
})

const PLAN: SegmentedProgressBarSegment[] = [
  { weight: 3 },
  { weight: 3 },
  { weight: 2 },
  { weight: 2 },
  { weight: 2 },
] // total = 12

describe('SegmentedProgressBar', () => {
  it('renders one segment fill per weighted slot', () => {
    render(<SegmentedProgressBar segments={PLAN} value={0} />)
    expect(screen.getAllByTestId('segmented-bar-segment')).toHaveLength(5)
  })

  it('fills each chunk by its clamped share of the cumulative value', () => {
    // value 7 over weights [3,3,2,2,2]: 100%,100%,50%,0%,0%
    render(<SegmentedProgressBar segments={PLAN} value={7} target={0.7} />)
    const fills = screen.getAllByTestId('segmented-bar-segment')
    expect(fills[0]).toHaveStyle({ width: '100%' })
    expect(fills[1]).toHaveStyle({ width: '100%' })
    expect(fills[2]).toHaveStyle({ width: '50%' })
    expect(fills[3]).toHaveStyle({ width: '0%' })
    expect(fills[4]).toHaveStyle({ width: '0%' })
  })

  it('uses the behind (warning) pace colour when fill trails the target', () => {
    render(<SegmentedProgressBar segments={PLAN} value={7.2} target={0.7} />)
    const behind = paceToneColor(paceTone(7.2 / 12, 0.7), 'dark')
    expect(screen.getAllByTestId('segmented-bar-segment')[0]).toHaveStyle({
      backgroundColor: behind,
    })
  })

  it('uses the ahead (success) pace colour when fill is at or past the target', () => {
    render(<SegmentedProgressBar segments={PLAN} value={9.5} target={0.7} />)
    const ahead = paceToneColor(paceTone(9.5 / 12, 0.7), 'dark')
    expect(screen.getAllByTestId('segmented-bar-segment')[0]).toHaveStyle({
      backgroundColor: ahead,
    })
  })

  it('is neutral (steel) with no marker when no target is given', () => {
    render(<SegmentedProgressBar segments={PLAN} value={7} />)
    expect(screen.queryByTestId('segmented-bar-marker')).not.toBeInTheDocument()
    const neutral = paceToneColor('neutral', 'dark')
    expect(screen.getAllByTestId('segmented-bar-segment')[0]).toHaveStyle({
      backgroundColor: neutral,
    })
  })

  it('drops the overlay marker at the target position when target is given', () => {
    render(<SegmentedProgressBar segments={PLAN} value={7.2} target={0.7} />)
    const marker = screen.getByTestId('segmented-bar-marker')
    expect(marker).toBeInTheDocument()
    expect(marker).toHaveStyle({ left: '70%' })
  })

  it('lets an explicit colour override the pace tone', () => {
    render(<SegmentedProgressBar segments={PLAN} value={7.2} target={0.7} color="#123456" />)
    expect(screen.getAllByTestId('segmented-bar-segment')[0]).toHaveStyle({
      backgroundColor: '#123456',
    })
  })

  describe('accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(
        <SegmentedProgressBar segments={PLAN} value={7.2} target={0.7} />
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  it('paints the default marker with the light status-live-muted token on a light surface', () => {
    const lightLive = getSemanticColors('light')['status-live-muted']
    expect(lightLive).not.toBe(getSemanticColors('dark')['status-live-muted'])
    render(
      <Surface theme="light">
        <SegmentedProgressBar segments={PLAN} value={6} target={0.5} />
      </Surface>
    )
    expect(screen.getByTestId('segmented-bar-marker')).toHaveStyle({ backgroundColor: lightLive })
  })
})
