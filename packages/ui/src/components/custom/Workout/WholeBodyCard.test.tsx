import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'

import { WholeBodyCard } from './WholeBodyCard'
import { WHOLE_BODY_SESSIONS as S, WHOLE_BODY_WEIGHT as W } from './wholeBody-fixture'

describe('WholeBodyCard', () => {
  it('renders nothing with no whole-body goal (F1)', () => {
    const { container } = render(<WholeBodyCard />)
    expect(container).toBeEmptyDOMElement()
  })

  it('draws only the bodyweight row with only a bodyweight goal', () => {
    render(<WholeBodyCard bodyweight={W.cut} />)
    expect(screen.getByTestId('whole-body-weight')).toBeInTheDocument()
    expect(screen.queryByTestId('whole-body-sessions')).toBeNull()
  })

  it('draws only the sessions row with only a sessions goal', () => {
    render(<WholeBodyCard sessions={S.underPace} />)
    expect(screen.getByTestId('whole-body-sessions')).toBeInTheDocument()
    expect(screen.queryByTestId('whole-body-weight')).toBeNull()
  })

  it('leads the bodyweight row with the weight, then the band, then the rate', () => {
    render(<WholeBodyCard bodyweight={W.cut} scale="wall" />)
    expect(screen.getByTestId('whole-body-weight-value')).toHaveTextContent('196.8')
    expect(screen.getByTestId('whole-body-weight-captions')).toHaveTextContent(
      'Week 3 of 8: 194.0 to 197.0 lb-0.6 %/wk against -0.5 to -1.0 for a cut'
    )
  })

  it('tags the phase and never the priority level', () => {
    render(<WholeBodyCard bodyweight={W.cut} />)
    expect(screen.getByText('Cut · week 3')).toBeInTheDocument()
    expect(screen.queryByText(/specialize/i)).toBeNull()
  })

  it('says "No weigh-in yet" for an accepted goal with no reading (F12)', () => {
    render(<WholeBodyCard bodyweight={W.noReadings} />)
    expect(screen.getByTestId('whole-body-weight-empty')).toHaveTextContent('No weigh-in yet')
    expect(screen.queryByTestId('zone-track')).toBeNull()
  })

  it('draws one emphasised line for a zero-width slow-loss band (F10)', () => {
    render(<WholeBodyCard bodyweight={W.slowLoss} />)
    expect(screen.getAllByTestId('zone-track-tick-line')).toHaveLength(1)
  })

  describe('the sessions render', () => {
    it('draws one segment per committed day by default', () => {
      render(<WholeBodyCard sessions={S.underPace} />)
      expect(screen.getAllByTestId('segmented-bar-segment')).toHaveLength(12)
    })

    it('falls back to a plain bar past the segment limit (F5)', () => {
      render(<WholeBodyCard sessions={S.largeCommitment} />)
      expect(screen.queryByTestId('whole-body-sessions-segments')).toBeNull()
      expect(screen.getByTestId('whole-body-sessions-progress')).toBeInTheDocument()
    })

    it('draws a plain bar when asked', () => {
      render(<WholeBodyCard sessions={S.underPace} sessionsVisual="progress" />)
      expect(screen.getByTestId('whole-body-sessions-progress')).toBeInTheDocument()
    })

    it('draws only the numbers when asked', () => {
      render(<WholeBodyCard sessions={S.underPace} sessionsVisual="number" />)
      expect(screen.queryByTestId('whole-body-sessions-segments')).toBeNull()
      expect(screen.queryByTestId('whole-body-sessions-progress')).toBeNull()
      expect(screen.getByTestId('whole-body-sessions-value')).toHaveTextContent('9of 12')
    })

    it('counts the owner’s real history as one training day (F2)', () => {
      render(<WholeBodyCard sessions={S.realHistory} />)
      expect(screen.getByTestId('whole-body-sessions-value')).toHaveTextContent('1of 1')
    })
  })

  it('has no accessibility violations with both rows (F14)', async () => {
    const { container } = render(
      <WholeBodyCard bodyweight={W.cut} sessions={S.underPace} scale="wall" />
    )
    expect(await axe(container)).toHaveNoViolations()
  })

  it('has no accessibility violations with no weigh-in yet', async () => {
    const { container } = render(<WholeBodyCard bodyweight={W.noReadings} scale="phone" />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
