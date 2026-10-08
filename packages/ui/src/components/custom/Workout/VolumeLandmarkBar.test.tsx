import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { VolumeLandmarkBar, type VolumeLandmarks } from './VolumeLandmarkBar'
import { getSemanticColors, type ThemeMode } from '../../../theme/tokens/semantic'
import { Surface } from '../../ui/surface'

// Clean-number geometry: fraction(v) = v / scaleMax.
const LANDMARKS: VolumeLandmarks = { mev: 5, mav: 15, mrv: 20 }
const WIDTH = 200
const SCALE_MAX = 25

// HEAT scale hexes (WORKOUT_TOKENS.heatmap = divergingScale).
const HEAT = {
  under: '#2196F3',
  maintenance: '#22D3EE',
  productive: '#58F69E',
  approaching: '#F9B415',
  over: '#D14343',
} as const

function renderBar(currentSets: number, muscle = 'Quads') {
  return render(
    <VolumeLandmarkBar
      muscle={muscle}
      currentSets={currentSets}
      landmarks={LANDMARKS}
      width={WIDTH}
      scaleMax={SCALE_MAX}
    />
  )
}

describe('VolumeLandmarkBar', () => {
  it('renders the bar, track (ZoneTrack), and fill', () => {
    renderBar(10)
    expect(screen.getByTestId('volume-landmark-bar')).toBeInTheDocument()
    expect(screen.getByTestId('volume-landmark-track')).toBeInTheDocument()
    expect(screen.getByTestId('zone-track-fill')).toBeInTheDocument()
  })

  it('shows the muscle title and % value in the header lockup', () => {
    renderBar(15, 'Hamstrings')
    expect(screen.getByText('Hamstrings')).toBeInTheDocument()
    // 15 sets / 15 MAV = 100%
    expect(screen.getByTestId('volume-landmark-pct')).toHaveTextContent('100%')
  })

  it('has the progressbar accessibility role', () => {
    renderBar(10)
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  describe('percentage readout (relative to MAV target)', () => {
    it('renders below-target percentages under 100', () => {
      renderBar(3) // 3 / 15 = 20%
      expect(screen.getByTestId('volume-landmark-pct')).toHaveTextContent('20%')
    })
    it('renders over-target percentages above 100', () => {
      renderBar(24) // 24 / 15 = 160%
      expect(screen.getByTestId('volume-landmark-pct')).toHaveTextContent('160%')
    })
  })

  it('renders the MEV / MAV / MRV landmark tick labels', () => {
    renderBar(10)
    const labels = screen.getAllByTestId('zone-track-tick-label').map((el) => el.textContent)
    expect(labels).toEqual(['MEV', 'MAV', 'MRV'])
  })

  describe('HEAT zone fill color by landmark position', () => {
    const cases: Array<[number, keyof typeof HEAT]> = [
      [3, 'under'],
      [10, 'maintenance'],
      [16, 'productive'],
      [18, 'approaching'],
      [25, 'over'],
    ]
    cases.forEach(([sets, zone]) => {
      it(`is ${zone} at ${sets} sets`, () => {
        renderBar(sets)
        expect(screen.getByTestId('zone-track-fill')).toHaveStyle({ backgroundColor: HEAT[zone] })
      })
    })

    cases.forEach(([sets, zone]) => {
      it(`keeps the percentage headline out of the ${zone} fill colour`, () => {
        renderBar(sets)
        expect(screen.getByTestId('volume-landmark-pct')).not.toHaveStyle({ color: HEAT[zone] })
      })
    })
  })

  it('sizes the fill proportionally (delegated to ZoneTrack)', () => {
    renderBar(10) // 10 / 25 = 40% of the track
    expect(screen.getByTestId('zone-track-fill')).toHaveStyle({ width: '40%' })
  })

  // Normalise through the DOM so hex, rgb() and rgba() compare as one form.
  function cssColor(color: string) {
    const probe = document.createElement('div')
    probe.style.backgroundColor = color
    return probe.style.backgroundColor
  }

  // react-native-web writes `transparent` as rgba(0, 0, 0, 0).
  const isPainted = (color: string) => color !== '' && !/^rgba\(.*,\s*0\)$/.test(color)

  it.each(['dark', 'light'] as ThemeMode[])(
    'paints the un-reached track with exactly one %s border-prominent layer',
    (mode) => {
      render(
        <Surface theme={mode}>
          <VolumeLandmarkBar
            muscle="Quads"
            currentSets={10}
            landmarks={LANDMARKS}
            width={WIDTH}
            scaleMax={SCALE_MAX}
          />
        </Surface>
      )
      const layersUnderUnfilled = ['zone-track-track', 'zone-track-band', 'zone-track-unfilled']
        .map((id) => (screen.getByTestId(id) as HTMLElement).style.backgroundColor)
        .filter(isPainted)
      expect(layersUnderUnfilled).toEqual([cssColor(getSemanticColors(mode)['border-prominent'])])
    }
  )

  describe('productive-zone glow', () => {
    it('glows the track in the productive zone', () => {
      renderBar(16)
      expect((screen.getByTestId('zone-track-track') as HTMLElement).style.boxShadow).not.toBe('')
    })
    it('does not glow outside the productive zone', () => {
      renderBar(3)
      expect((screen.getByTestId('zone-track-track') as HTMLElement).style.boxShadow).toBe('')
    })
  })

  describe('accessibility', () => {
    it('describes the muscle, sets, and zone in the label', () => {
      renderBar(3, 'Calves')
      expect(
        screen.getByLabelText('Calves weekly volume: 3 sets, 20% of MAV target, below MEV')
      ).toBeInTheDocument()
    })

    it('has no accessibility violations', async () => {
      const { container } = renderBar(16)
      expect(await axe(container)).toHaveNoViolations()
    })
  })
})
