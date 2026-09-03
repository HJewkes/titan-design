import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { SetBar, velocityZoneColor, SET_STRIP_ZONES, SET_STRIP_VARIABLE_COLOR } from './SetBar'

/** The slot wrapper (carrier of the leading-gap margin) is a fill segment's parent. */
const slotOf = (fill: HTMLElement) => fill.parentElement as HTMLElement

describe('SetBar', () => {
  describe('velocityZoneColor', () => {
    it('maps velocity ratios to their zone pins', () => {
      expect(velocityZoneColor(0.4)).toBe(SET_STRIP_ZONES.slow)
      expect(velocityZoneColor(0.6)).toBe(SET_STRIP_ZONES.moderate)
      expect(velocityZoneColor(0.85)).toBe(SET_STRIP_ZONES.fast)
      expect(velocityZoneColor(1.2)).toBe(SET_STRIP_ZONES.fastest)
    })
  })

  it('done: one colored fill segment per rep, no empties, no pulse', () => {
    render(<SetBar set={{ status: 'done', velocities: [1, 0.8, 0.6, 0.4] }} />)
    expect(screen.getAllByTestId('set-strip-fill')).toHaveLength(4)
    expect(screen.queryByTestId('set-strip-empty')).not.toBeInTheDocument()
    expect(screen.queryByTestId('set-strip-pulse')).not.toBeInTheDocument()
  })

  it('active: performed reps pulse, the remainder is greyed', () => {
    render(<SetBar set={{ status: 'active', velocities: [0.9, 0.7, 0.5], planned: 8 }} />)
    expect(screen.getAllByTestId('set-strip-pulse')).toHaveLength(3)
    expect(screen.getAllByTestId('set-strip-empty')).toHaveLength(5)
  })

  it('todo: a single grey bar, no fills or pulses', () => {
    render(<SetBar set={{ status: 'todo', planned: 10 }} />)
    expect(screen.getAllByTestId('set-strip-empty')).toHaveLength(1)
    expect(screen.queryByTestId('set-strip-fill')).not.toBeInTheDocument()
    expect(screen.queryByTestId('set-strip-pulse')).not.toBeInTheDocument()
  })

  describe('range (variable rep-range)', () => {
    it('renders range-max segments; committed-todo grey, variable-todo cyan', () => {
      // floor 15, max 20, 12 done → 12 velocity fills · 3 grey (committed) · 5 cyan (variable)
      render(
        <SetBar set={{ status: 'range', floor: 15, max: 20, doneVels: Array(12).fill(0.9) }} />
      )
      expect(screen.getAllByTestId('set-strip-fill')).toHaveLength(12)
      expect(screen.getAllByTestId('set-strip-empty')).toHaveLength(3)
      expect(screen.getAllByTestId('set-strip-variable')).toHaveLength(5)
    })

    it('counts a done rep past the floor as a real velocity rep (not variable)', () => {
      // 17 done into the variable zone → 17 velocity fills, 3 cyan, 0 grey
      render(
        <SetBar set={{ status: 'range', floor: 15, max: 20, doneVels: Array(17).fill(0.8) }} />
      )
      expect(screen.getAllByTestId('set-strip-fill')).toHaveLength(17)
      expect(screen.getAllByTestId('set-strip-variable')).toHaveLength(3)
      expect(screen.queryByTestId('set-strip-empty')).not.toBeInTheDocument()
    })

    it('uses the variable/opportunity cyan pin for the variable-todo zone', () => {
      render(<SetBar set={{ status: 'range', floor: 3, max: 4, doneVels: [] }} />)
      expect(SET_STRIP_VARIABLE_COLOR).toBe('#0B3149') // cyan 900
      expect(screen.getByTestId('set-strip-variable')).toHaveStyle({
        backgroundColor: SET_STRIP_VARIABLE_COLOR,
      })
    })
  })

  describe('drop set', () => {
    it('renders one fill per rep across sub-loads, split by 2px notches', () => {
      render(
        <SetBar
          set={{
            status: 'drop',
            subloads: [
              [0.85, 0.8, 0.7],
              [0.7, 0.6],
            ],
          }}
        />
      )
      const fills = screen.getAllByTestId('set-strip-fill')
      expect(fills).toHaveLength(5)
      expect(slotOf(fills[0])).not.toHaveStyle({ marginLeft: '2px' }) // first sub-load butts the edge
      expect(slotOf(fills[3])).toHaveStyle({ marginLeft: '2px' }) // second sub-load opens with a notch
    })
  })

  describe('myo-rep / rest-pause (done)', () => {
    it('renders activation + clusters, split by 3px cluster gaps', () => {
      render(
        <SetBar
          set={{
            status: 'myo',
            activation: [0.75, 0.7, 0.65],
            clusters: [
              [0.6, 0.55],
              [0.5, 0.45],
            ],
          }}
        />
      )
      const fills = screen.getAllByTestId('set-strip-fill')
      expect(fills).toHaveLength(7)
      expect(slotOf(fills[3])).toHaveStyle({ marginLeft: '3px' }) // first cluster
      expect(slotOf(fills[5])).toHaveStyle({ marginLeft: '3px' }) // second cluster
    })
  })

  describe('myo-upcoming (planned, length unknown)', () => {
    it('renders a grey activation chunk + a fading cyan clusters-to-failure trail', () => {
      render(<SetBar set={{ status: 'myo-upcoming', activationLen: 4, clusterCount: 2 }} />)
      expect(screen.getAllByTestId('set-strip-empty')).toHaveLength(4) // grey activation
      const trail = screen.getAllByTestId('set-strip-variable')
      expect(trail).toHaveLength(10) // 2 clusters × 5
    })

    it('fades each expected cluster and opens the right edge with a cluster gap', () => {
      render(<SetBar set={{ status: 'myo-upcoming', activationLen: 4, clusterCount: 2 }} />)
      const trail = screen.getAllByTestId('set-strip-variable')
      expect(trail[5]).toHaveStyle({ opacity: 0.6 }) // second cluster is recessive
      expect(slotOf(trail[0])).toHaveStyle({ marginLeft: '3px' }) // trail opens after activation
      expect(slotOf(trail[5])).toHaveStyle({ marginLeft: '3px' }) // each cluster is gapped
    })

    it('defaults to three expected clusters when clusterCount is omitted', () => {
      render(<SetBar set={{ status: 'myo-upcoming', activationLen: 3 }} />)
      expect(screen.getAllByTestId('set-strip-variable')).toHaveLength(15) // 3 × 5
    })
  })

  it('defaults to an 8px height and honors the height prop', () => {
    const { rerender } = render(<SetBar set={{ status: 'todo', planned: 3 }} />)
    expect(screen.getByTestId('set-strip-set')).toHaveStyle({ height: '8px' })
    rerender(<SetBar set={{ status: 'todo', planned: 3 }} height={4} />)
    expect(screen.getByTestId('set-strip-set')).toHaveStyle({ height: '4px' })
  })

  describe('accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(
        <SetBar set={{ status: 'active', velocities: [0.9, 0.7], planned: 4 }} />
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})
