import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'

import { capturedClassNames } from '../../../test/classname-capture'
import { BodyweightGoalCard } from './BodyweightGoalCard'
import { WHOLE_BODY_WEIGHT as W } from './wholeBody-fixture'

describe('BodyweightGoalCard', () => {
  it('leads with the weight', () => {
    render(<BodyweightGoalCard goal={W.cut} />)
    expect(screen.getByTestId('bodyweight-goal-value')).toHaveTextContent('196.8')
  })

  it('tags the phase and never the priority level', () => {
    render(<BodyweightGoalCard goal={W.cut} />)
    expect(screen.getByText('Cut · week 3')).toBeInTheDocument()
    expect(screen.queryByText(/specialize/i)).toBeNull()
  })

  describe('the caption beside the weight', () => {
    it('leads with the rate at its shortest by default', () => {
      render(<BodyweightGoalCard goal={W.cut} />)
      expect(screen.getByTestId('bodyweight-goal-value-caption')).toHaveTextContent('-0.6 %/wk')
    })

    it('leads with the longer rate line when asked', () => {
      render(<BodyweightGoalCard goal={W.cut} rateLength="full" />)
      expect(screen.getByTestId('bodyweight-goal-value-caption')).toHaveTextContent(
        '-0.6 %/wk against -0.5 to -1.0 for a cut'
      )
    })

    it('leads with this week’s band when asked', () => {
      render(<BodyweightGoalCard goal={W.cut} lead="band" />)
      expect(screen.getByTestId('bodyweight-goal-value-caption')).toHaveTextContent(
        'Week 3 of 8: 194.0 to 197.0 lb'
      )
    })

    it('sets the caption on normal leading', () => {
      render(<BodyweightGoalCard goal={W.cut} />)
      expect(capturedClassNames.get('bodyweight-goal-value-caption')).toContain('leading-normal')
    })

    it('holds the band and the phase band in a pinned-open tip', () => {
      render(<BodyweightGoalCard goal={W.cut} isTipOpen />)
      expect(screen.getByText('Week 3 of 8: 194.0 to 197.0 lb')).toBeInTheDocument()
      expect(screen.getByText('Cut band -0.5 to -1.0 %/wk')).toBeInTheDocument()
    })
  })

  describe('the track row', () => {
    it('labels the band edges under the track, not inside it', () => {
      render(<BodyweightGoalCard goal={W.cut} />)
      const row = screen.getByTestId('bodyweight-goal-track')
      expect(row).toHaveTextContent('194.0')
      expect(row).toHaveTextContent('197.0')
      expect(screen.queryByTestId('zone-track-tick-label')).toBeNull()
    })

    it('labels a zero-width band once', () => {
      render(<BodyweightGoalCard goal={W.slowLossOneLine} />)
      expect(screen.getByTestId('bodyweight-goal-track')).toHaveTextContent('186.2')
    })
  })

  it('draws a slow-loss band as a band, not a line (F10)', () => {
    render(<BodyweightGoalCard goal={W.slowLoss} />)
    expect(screen.getAllByTestId('zone-track-tick-line')).toHaveLength(2)
  })

  it('draws the server’s zero-width slow-loss line as one emphasised tick', () => {
    render(<BodyweightGoalCard goal={W.slowLossOneLine} />)
    expect(screen.getAllByTestId('zone-track-tick-line')).toHaveLength(1)
  })

  it('says "No weigh-in yet" and draws no track before the first weigh-in (F12)', () => {
    render(<BodyweightGoalCard goal={W.noReadings} />)
    expect(screen.getByTestId('bodyweight-goal-empty')).toHaveTextContent('No weigh-in yet')
    expect(screen.queryByTestId('zone-track')).toBeNull()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<BodyweightGoalCard goal={W.cut} scale="wall" />)
    expect(await axe(container)).toHaveNoViolations()
  })

  it('has no accessibility violations with no weigh-in yet', async () => {
    const { container } = render(<BodyweightGoalCard goal={W.noReadings} scale="phone" />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
