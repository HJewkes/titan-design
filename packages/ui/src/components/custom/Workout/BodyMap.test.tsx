import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'jest-axe'
import { BodyMap, type BodyMapData } from './BodyMap'
import { MuscleGroup } from './muscleTaxonomy'
import { getSemanticColors } from '../../../theme/tokens/semantic'

const data: BodyMapData[] = [
  { muscleGroup: MuscleGroup.CHEST, intensity: 0.7, volumeStatus: 'target', weeklySets: 12 },
  { muscleGroup: MuscleGroup.LATS, intensity: 0.4, volumeStatus: 'behind', weeklySets: 6 },
  { muscleGroup: MuscleGroup.QUADS, intensity: 0.9, volumeStatus: 'over', weeklySets: 20 },
]

describe('BodyMap', () => {
  describe('rendering', () => {
    it('renders the container, SVG, and view toggle', () => {
      render(<BodyMap data={data} view="front" />)
      expect(screen.getByTestId('body-map')).toBeInTheDocument()
      expect(screen.getByTestId('body-map-svg')).toBeInTheDocument()
      expect(screen.getByTestId('body-map-view-toggle')).toBeInTheDocument()
    })

    it('renders the SVG body for both front and back views', () => {
      const { rerender, container } = render(<BodyMap data={data} view="front" />)
      expect(container.querySelector('svg')).toBeInTheDocument()
      rerender(<BodyMap data={data} view="back" />)
      expect(container.querySelector('svg')).toBeInTheDocument()
    })

    it('renders one legend button per muscle in detailed mode', () => {
      render(<BodyMap data={data} view="front" mode="detailed" />)
      expect(screen.getByTestId('body-map-muscle-chest')).toBeInTheDocument()
      expect(screen.getByTestId('body-map-muscle-lats')).toBeInTheDocument()
      expect(screen.getByTestId('body-map-muscle-quads')).toBeInTheDocument()
    })

    it('aggregates muscles into simple groups in simple mode', () => {
      render(<BodyMap data={data} view="front" mode="simple" />)
      // chest -> chest, lats -> back, quads -> legs
      expect(screen.getByTestId('body-map-muscle-chest')).toBeInTheDocument()
      expect(screen.getByTestId('body-map-muscle-back')).toBeInTheDocument()
      expect(screen.getByTestId('body-map-muscle-legs')).toBeInTheDocument()
      expect(screen.queryByTestId('body-map-muscle-lats')).not.toBeInTheDocument()
    })

    it('renders an empty hint when there is no data', () => {
      render(<BodyMap data={[]} view="front" />)
      expect(screen.getByTestId('body-map-empty')).toBeInTheDocument()
      expect(screen.queryByTestId('body-map-legend')).not.toBeInTheDocument()
    })
  })

  describe('interaction', () => {
    it('calls onMusclePress with the tapped muscle group', () => {
      const onMusclePress = vi.fn()
      render(<BodyMap data={data} view="front" onMusclePress={onMusclePress} />)
      fireEvent.click(screen.getByTestId('body-map-muscle-chest'))
      expect(onMusclePress).toHaveBeenCalledWith(MuscleGroup.CHEST)
    })

    it('reports a representative detailed muscle from a simple group tap', () => {
      const onMusclePress = vi.fn()
      render(<BodyMap data={data} view="front" mode="simple" onMusclePress={onMusclePress} />)
      fireEvent.click(screen.getByTestId('body-map-muscle-back'))
      expect(onMusclePress).toHaveBeenCalledWith(MuscleGroup.LATS)
    })

    it('calls onViewChange from the front/back toggle', () => {
      const onViewChange = vi.fn()
      render(<BodyMap data={data} view="front" onViewChange={onViewChange} />)
      fireEvent.click(screen.getByTestId('body-map-toggle-back'))
      expect(onViewChange).toHaveBeenCalledWith('back')
      fireEvent.click(screen.getByTestId('body-map-toggle-front'))
      expect(onViewChange).toHaveBeenCalledWith('front')
    })
  })

  describe('highlighted muscle', () => {
    it('marks the highlighted muscle button as pressed', () => {
      render(<BodyMap data={data} view="front" highlightedMuscle={MuscleGroup.CHEST} />)
      expect(screen.getByTestId('body-map-muscle-chest')).toHaveAttribute('aria-pressed', 'true')
      expect(screen.getByTestId('body-map-muscle-lats')).toHaveAttribute('aria-pressed', 'false')
    })

    it('applies an edge glow when a muscle is highlighted', () => {
      render(<BodyMap data={data} view="front" highlightedMuscle={MuscleGroup.QUADS} />)
      const svg = screen.getByTestId('body-map-svg')
      expect(svg.getAttribute('style') ?? '').toContain('box-shadow')
    })
  })

  describe('size variants', () => {
    it('renders identical figure geometry for size unset and size="phone"', () => {
      const { unmount } = render(<BodyMap data={data} view="front" />)
      const defaultStyle = screen.getByTestId('body-map-svg').getAttribute('style')
      expect(defaultStyle).toContain('width: 160px')
      unmount()

      render(<BodyMap data={data} view="front" size="phone" />)
      const phoneStyle = screen.getByTestId('body-map-svg').getAttribute('style')
      expect(phoneStyle).toBe(defaultStyle)
    })

    it('renders a larger figure and type ramp for size="wall"', () => {
      render(<BodyMap data={data} view="front" size="wall" />)
      expect(screen.getByTestId('body-map-svg').getAttribute('style')).toContain('width: 480px')
      expect(screen.getByTestId('body-map-muscle-dot-chest').getAttribute('style')).toContain(
        'width: 14px'
      )
    })
  })

  describe('accessibility', () => {
    it('labels each muscle button with name, status, and weekly sets', () => {
      render(<BodyMap data={data} view="front" />)
      expect(screen.getByLabelText('Chest, target met, 12 sets this week')).toBeInTheDocument()
      expect(screen.getByLabelText('Lats, behind plan, 6 sets this week')).toBeInTheDocument()
    })

    it('labels the view toggle buttons', () => {
      render(<BodyMap data={data} view="front" onViewChange={vi.fn()} />)
      expect(screen.getByLabelText('Show front view')).toBeInTheDocument()
      expect(screen.getByLabelText('Show back view')).toBeInTheDocument()
    })

    it('has no accessibility violations with data', async () => {
      const { container } = render(
        <BodyMap
          data={data}
          view="front"
          onViewChange={vi.fn()}
          onMusclePress={vi.fn()}
          highlightedMuscle={MuscleGroup.CHEST}
        />
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('has no accessibility violations when empty', async () => {
      const { container } = render(<BodyMap data={[]} view="back" />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('slug collision severity', () => {
    // LATS and UPPER_BACK both map to the `upper-back` SVG slug (MUSCLE_TO_SVG_SLUGS).
    const colors = getSemanticColors('dark')

    it('paints a shared slug with its more severe status (approaching beats target)', () => {
      const collisionData: BodyMapData[] = [
        { muscleGroup: MuscleGroup.LATS, intensity: 0.6, volumeStatus: 'target', weeklySets: 12 },
        {
          muscleGroup: MuscleGroup.UPPER_BACK,
          intensity: 0.9,
          volumeStatus: 'approaching',
          weeklySets: 14,
        },
      ]
      const { container } = render(<BodyMap data={collisionData} view="back" />)
      const slug = container.querySelector('[id="upper-back"]')
      expect(slug).toHaveAttribute('fill', colors['dataviz-diverging-3'])
    })

    it('paints a shared slug as over when over outranks both target and approaching', () => {
      // FRONT_DELTS, SIDE_DELTS, REAR_DELTS all map to the `deltoids` slug.
      const collisionData: BodyMapData[] = [
        {
          muscleGroup: MuscleGroup.FRONT_DELTS,
          intensity: 0.5,
          volumeStatus: 'target',
          weeklySets: 6,
        },
        {
          muscleGroup: MuscleGroup.SIDE_DELTS,
          intensity: 0.9,
          volumeStatus: 'approaching',
          weeklySets: 14,
        },
        {
          muscleGroup: MuscleGroup.REAR_DELTS,
          intensity: 1.0,
          volumeStatus: 'over',
          weeklySets: 22,
        },
      ]
      const { container } = render(<BodyMap data={collisionData} view="front" />)
      const slug = container.querySelector('[id="deltoids"]')
      expect(slug).toHaveAttribute('fill', colors['dataviz-diverging-4'])
    })
  })
})
