import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { VolumeLandmarkBar, type VolumeLandmarks } from './VolumeLandmarkBar'

// Clean-number geometry: pos(v) = v / scaleMax * width = v * 8.
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
  it('renders the bar, track, and fill', () => {
    renderBar(10)
    expect(screen.getByTestId('volume-landmark-bar')).toBeInTheDocument()
    expect(screen.getByTestId('volume-landmark-track')).toBeInTheDocument()
    expect(screen.getByTestId('zone-track-fill')).toBeInTheDocument()
  })

  it('renders the muscle label', () => {
    renderBar(10, 'Hamstrings')
    expect(screen.getByTestId('volume-landmark-muscle')).toHaveTextContent('Hamstrings')
  })

  it('has the progressbar accessibility role', () => {
    renderBar(10)
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  describe('percentage readout (relative to MAV target)', () => {
    it('renders current sets as a percentage of MAV', () => {
      // 15 sets / 15 MAV = 100%
      renderBar(15)
      expect(screen.getByTestId('volume-landmark-pct')).toHaveTextContent('100%')
    })

    it('renders below-target percentages under 100', () => {
      // 3 / 15 = 20%
      renderBar(3)
      expect(screen.getByTestId('volume-landmark-pct')).toHaveTextContent('20%')
    })

    it('renders over-target percentages above 100', () => {
      // 24 / 15 = 160%
      renderBar(24)
      expect(screen.getByTestId('volume-landmark-pct')).toHaveTextContent('160%')
    })
  })

  describe('landmark ticks and labels', () => {
    it('renders MEV, MAV, and MRV ticks', () => {
      renderBar(10)
      expect(screen.getByTestId('volume-landmark-tick-mev')).toBeInTheDocument()
      expect(screen.getByTestId('volume-landmark-tick-mav')).toBeInTheDocument()
      expect(screen.getByTestId('volume-landmark-tick-mrv')).toBeInTheDocument()
    })

    it('renders the landmark set-count labels', () => {
      renderBar(10)
      expect(screen.getByTestId('volume-landmark-label-mev')).toHaveTextContent('MEV')
      expect(screen.getByTestId('volume-landmark-label-mev')).toHaveTextContent('5')
      expect(screen.getByTestId('volume-landmark-label-mav')).toHaveTextContent('MAV')
      expect(screen.getByTestId('volume-landmark-label-mav')).toHaveTextContent('15')
      expect(screen.getByTestId('volume-landmark-label-mrv')).toHaveTextContent('MRV')
      expect(screen.getByTestId('volume-landmark-label-mrv')).toHaveTextContent('20')
    })

    it('positions ticks proportionally: MEV left of MAV left of MRV', () => {
      renderBar(10)
      const mev = parseFloat(screen.getByTestId('volume-landmark-tick-mev').style.left)
      const mav = parseFloat(screen.getByTestId('volume-landmark-tick-mav').style.left)
      const mrv = parseFloat(screen.getByTestId('volume-landmark-tick-mrv').style.left)
      expect(mev).toBeLessThan(mav)
      expect(mav).toBeLessThan(mrv)
    })

    it('positions each tick at value / scaleMax * width', () => {
      renderBar(10)
      // MEV 5 -> 40px, MAV 15 -> 120px, MRV 20 -> 160px
      expect(screen.getByTestId('volume-landmark-tick-mev')).toHaveStyle({ left: '40px' })
      expect(screen.getByTestId('volume-landmark-tick-mav')).toHaveStyle({ left: '120px' })
      expect(screen.getByTestId('volume-landmark-tick-mrv')).toHaveStyle({ left: '160px' })
    })
  })

  describe('HEAT zone fill color by landmark position', () => {
    it('is under (blue) below MEV', () => {
      renderBar(3)
      expect(screen.getByTestId('zone-track-fill')).toHaveStyle({
        backgroundColor: HEAT.under,
      })
    })

    it('is maintenance (cyan) between MEV and MAV', () => {
      renderBar(10)
      expect(screen.getByTestId('zone-track-fill')).toHaveStyle({
        backgroundColor: HEAT.maintenance,
      })
    })

    it('is productive (green) just above MAV', () => {
      renderBar(16)
      expect(screen.getByTestId('zone-track-fill')).toHaveStyle({
        backgroundColor: HEAT.productive,
      })
    })

    it('is approaching (amber) in the upper MAV-MRV band', () => {
      renderBar(18)
      expect(screen.getByTestId('zone-track-fill')).toHaveStyle({
        backgroundColor: HEAT.approaching,
      })
    })

    it('is over (red) at or beyond MRV', () => {
      renderBar(25)
      expect(screen.getByTestId('zone-track-fill')).toHaveStyle({ backgroundColor: HEAT.over })
    })

    it('mirrors the fill color in the percentage headline', () => {
      renderBar(3)
      expect(screen.getByTestId('volume-landmark-pct')).toHaveStyle({ color: HEAT.under })
    })
  })

  describe('fill geometry (delegated to ZoneTrack, expressed as a track fraction)', () => {
    it('sizes the fill proportionally to current sets', () => {
      // 10 / 25 = 40% of the track
      renderBar(10)
      expect(screen.getByTestId('zone-track-fill')).toHaveStyle({ width: '40%' })
    })

    it('clamps the fill to the track for extreme over-volume', () => {
      renderBar(100)
      expect(screen.getByTestId('zone-track-fill')).toHaveStyle({ width: '100%' })
    })
  })

  describe('accessibility', () => {
    it('describes the muscle, sets, and zone in the label', () => {
      renderBar(3, 'Calves')
      expect(
        screen.getByLabelText('Calves weekly volume: 3 sets, 20% of MAV target, below MEV')
      ).toBeInTheDocument()
    })

    it('describes the over-MRV state', () => {
      renderBar(25, 'Quads')
      expect(
        screen.getByLabelText('Quads weekly volume: 25 sets, 167% of MAV target, over MRV')
      ).toBeInTheDocument()
    })

    it('has no accessibility violations', async () => {
      const { container } = renderBar(16)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})
