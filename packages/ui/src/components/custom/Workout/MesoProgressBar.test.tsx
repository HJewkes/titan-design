import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'jest-axe'
import { MesoProgressBar, type Meso } from './MesoProgressBar'
import { resolveColor } from '../../../theme/resolve-color'

const mesos: Meso[] = [
  { id: 'm1', name: 'Accumulation', weekCount: 4, status: 'completed' },
  { id: 'm2', name: 'Intensification', weekCount: 3, status: 'current', currentWeek: 2 },
  { id: 'm3', name: 'Peak', weekCount: 2, status: 'upcoming' },
]

describe('MesoProgressBar', () => {
  describe('rendering', () => {
    it('renders the container', () => {
      render(<MesoProgressBar mesos={mesos} activeMesoId={null} onMesoPress={vi.fn()} />)
      expect(screen.getByTestId('meso-progress-bar')).toBeInTheDocument()
    })

    it('renders one segment per meso', () => {
      render(<MesoProgressBar mesos={mesos} activeMesoId={null} onMesoPress={vi.fn()} />)
      expect(screen.getByTestId('meso-segment-m1')).toBeInTheDocument()
      expect(screen.getByTestId('meso-segment-m2')).toBeInTheDocument()
      expect(screen.getByTestId('meso-segment-m3')).toBeInTheDocument()
    })

    it('sets flex proportional to weekCount', () => {
      render(<MesoProgressBar mesos={mesos} activeMesoId={null} onMesoPress={vi.fn()} />)
      expect(screen.getByTestId('meso-segment-m1')).toHaveStyle({ flex: 4 })
      expect(screen.getByTestId('meso-segment-m2')).toHaveStyle({ flex: 3 })
      expect(screen.getByTestId('meso-segment-m3')).toHaveStyle({ flex: 2 })
    })

    it('renders no segments for an empty mesos array', () => {
      render(<MesoProgressBar mesos={[]} activeMesoId={null} onMesoPress={vi.fn()} />)
      expect(screen.getByTestId('meso-progress-bar')).toBeEmptyDOMElement()
    })
  })

  describe('status colors', () => {
    it('tracks the completed segment on the success wash', () => {
      render(<MesoProgressBar mesos={mesos} activeMesoId={null} onMesoPress={vi.fn()} />)
      expect(screen.getByTestId('meso-segment-inner-m1')).toHaveStyle({
        backgroundColor: resolveColor('status-success-muted'),
      })
    })

    it('tracks the current segment on the brand wash', () => {
      render(<MesoProgressBar mesos={mesos} activeMesoId={null} onMesoPress={vi.fn()} />)
      expect(screen.getByTestId('meso-segment-inner-m2')).toHaveStyle({
        backgroundColor: resolveColor('brand-primary-strong'),
      })
    })

    it('tracks the upcoming segment on the neutral hairline wash', () => {
      render(<MesoProgressBar mesos={mesos} activeMesoId={null} onMesoPress={vi.fn()} />)
      expect(screen.getByTestId('meso-segment-inner-m3')).toHaveStyle({
        backgroundColor: resolveColor('hairline-subtle'),
      })
    })

    it('gives each status a distinct track, so the three never collapse', () => {
      render(<MesoProgressBar mesos={mesos} activeMesoId={null} onMesoPress={vi.fn()} />)
      const tracks = ['m1', 'm2', 'm3'].map(
        (id) => screen.getByTestId(`meso-segment-inner-${id}`).style.backgroundColor
      )
      expect(new Set(tracks).size).toBe(3)
    })
  })

  describe('current week progress fill', () => {
    it('renders a solid fill for the current meso when progress > 0', () => {
      render(<MesoProgressBar mesos={mesos} activeMesoId={null} onMesoPress={vi.fn()} />)
      const fill = screen.getByTestId('meso-segment-fill-m2')
      expect(fill).toBeInTheDocument()
      expect(fill).toHaveStyle({ width: '66.66666666666666%' })
    })

    it('does not render a fill for completed or upcoming mesos', () => {
      render(<MesoProgressBar mesos={mesos} activeMesoId={null} onMesoPress={vi.fn()} />)
      expect(screen.queryByTestId('meso-segment-fill-m1')).not.toBeInTheDocument()
      expect(screen.queryByTestId('meso-segment-fill-m3')).not.toBeInTheDocument()
    })

    it('does not render a fill when current meso has no currentWeek', () => {
      const noProgress: Meso[] = [{ id: 'c', name: 'Current', weekCount: 3, status: 'current' }]
      render(<MesoProgressBar mesos={noProgress} activeMesoId={null} onMesoPress={vi.fn()} />)
      expect(screen.queryByTestId('meso-segment-fill-c')).not.toBeInTheDocument()
    })

    it('clamps progress to 100% when currentWeek exceeds weekCount', () => {
      const overflow: Meso[] = [
        { id: 'c', name: 'Current', weekCount: 3, status: 'current', currentWeek: 5 },
      ]
      render(<MesoProgressBar mesos={overflow} activeMesoId={null} onMesoPress={vi.fn()} />)
      expect(screen.getByTestId('meso-segment-fill-c')).toHaveStyle({ width: '100%' })
    })
  })

  describe('active highlighting', () => {
    it('applies a brand border to the active segment', () => {
      render(<MesoProgressBar mesos={mesos} activeMesoId="m2" onMesoPress={vi.fn()} />)
      const style = screen.getByTestId('meso-segment-inner-m2').getAttribute('style') ?? ''
      expect(style).toContain('border-top-width: 2px')
      expect(style).toContain(`border-top-color: ${resolveColor('brand-primary')}`)
    })

    it('does not apply a border to inactive segments', () => {
      render(<MesoProgressBar mesos={mesos} activeMesoId="m2" onMesoPress={vi.fn()} />)
      const inner = screen.getByTestId('meso-segment-inner-m1')
      const style = inner.getAttribute('style') ?? ''
      expect(style).not.toContain('border-top-width: 2px')
    })

    it('highlights nothing when activeMesoId is null', () => {
      render(<MesoProgressBar mesos={mesos} activeMesoId={null} onMesoPress={vi.fn()} />)
      const inner = screen.getByTestId('meso-segment-inner-m2')
      const style = inner.getAttribute('style') ?? ''
      expect(style).not.toContain('border-top-width: 2px')
    })
  })

  describe('interaction', () => {
    it('calls onMesoPress with the meso id when a segment is pressed', () => {
      const onMesoPress = vi.fn()
      render(<MesoProgressBar mesos={mesos} activeMesoId={null} onMesoPress={onMesoPress} />)
      fireEvent.click(screen.getByTestId('meso-segment-m3'))
      expect(onMesoPress).toHaveBeenCalledWith('m3')
    })
  })

  describe('accessibility', () => {
    it('exposes each segment as a button with name and status', () => {
      render(<MesoProgressBar mesos={mesos} activeMesoId={null} onMesoPress={vi.fn()} />)
      expect(screen.getByLabelText('Accumulation, completed')).toBeInTheDocument()
      expect(screen.getByLabelText('Intensification, current')).toBeInTheDocument()
      expect(screen.getByLabelText('Peak, upcoming')).toBeInTheDocument()
    })

    it('has no accessibility violations', async () => {
      const { container } = render(
        <MesoProgressBar mesos={mesos} activeMesoId="m2" onMesoPress={vi.fn()} />
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})

describe('MesoProgressBar invalid weekCount (flex guard)', () => {
  it('clamps zero and negative weekCount to a valid flex of 1', () => {
    const edgeMesos: Meso[] = [
      { id: 'z', name: 'Zero', weekCount: 0, status: 'upcoming' },
      { id: 'n', name: 'Neg', weekCount: -3, status: 'upcoming' },
    ]
    render(<MesoProgressBar mesos={edgeMesos} activeMesoId={null} onMesoPress={vi.fn()} />)
    expect(screen.getByTestId('meso-segment-z')).toHaveStyle({ flex: 1 })
    expect(screen.getByTestId('meso-segment-n')).toHaveStyle({ flex: 1 })
  })
})
