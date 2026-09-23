import { describe, it, expect } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'

import { capturedClassNames } from '../../../test/classname-capture'
import { BodyweightGoalCard } from './BodyweightGoalCard'
import { FIGURE_LINE_TEXT } from './wholeBodyCardParts'
import { WHOLE_BODY_WEIGHT as W } from './wholeBody-fixture'

describe('BodyweightGoalCard', () => {
  it('leads with the weight', () => {
    render(<BodyweightGoalCard goal={W.cut} />)
    expect(screen.getByTestId('bodyweight-goal-value')).toHaveTextContent('196.8')
  })

  it('tags the phase without its week, and never the priority level', () => {
    render(<BodyweightGoalCard goal={W.cut} />)
    expect(screen.getByTestId('phase-tag')).toHaveTextContent('Cut')
    expect(screen.getByTestId('phase-tag')).not.toHaveTextContent('week')
    expect(screen.queryByText(/specialize/i)).toBeNull()
  })

  describe('the phase tag', () => {
    it('keeps its words at a wide container', () => {
      render(<BodyweightGoalCard goal={W.cut} />)
      expect(screen.getByTestId('phase-tag')).toHaveTextContent('Cut')
      expect(screen.queryByTestId('phase-tag-tip')).toBeNull()
    })

    // Gate S4: an undeclared phase collapsed to the Hold glyph while the band read as a cut.
    it('keeps "No phase declared" in words on a narrow card, with no glyph', () => {
      const goal = { ...W.cut, phase: { name: 'unknown' as const, weeksInPhase: 0 } }
      render(<BodyweightGoalCard goal={goal} tagCollapsed />)
      const tag = screen.getByTestId('phase-tag')
      expect(tag).toHaveTextContent('No phase declared')
      expect(tag.querySelector('svg')).toBeNull()
      expect(screen.queryByTestId('phase-tag-tip')).toBeNull()
    })

    it('puts the phase alone in a pinned-open tip when it has collapsed, no week (owner, round 5)', () => {
      render(<BodyweightGoalCard goal={W.cut} tagCollapsed isTagTipOpen />)
      expect(screen.getByText('Cut')).toBeInTheDocument()
      expect(screen.queryByText(/week/)).toBeNull()
    })
  })

  describe('the caption beside the weight', () => {
    it('leads with the rate at its shortest, as a muted word and a bold figure', () => {
      render(<BodyweightGoalCard goal={W.cut} />)
      expect(screen.getByTestId('bodyweight-goal-value-caption')).toHaveTextContent(
        'Rate: -0.6%/wk'
      )
    })

    it('reads Rate: N/A with the colon (owner, round 5)', () => {
      render(<BodyweightGoalCard goal={W.oneReading} />)
      expect(screen.getByTestId('bodyweight-goal-value-caption')).toHaveTextContent('Rate: N/A')
    })

    it('sets the label and the lead on one text size, whatever the figure size (owner, round 5)', () => {
      for (const scale of ['wall', 'phone'] as const) {
        const { unmount } = render(<BodyweightGoalCard goal={W.cut} scale={scale} />)
        expect(capturedClassNames.get('bodyweight-goal-value-label')).toContain(FIGURE_LINE_TEXT)
        expect(capturedClassNames.get('bodyweight-goal-value-caption')).toContain(FIGURE_LINE_TEXT)
        unmount()
      }
    })

    it('sets the caption on normal leading', () => {
      render(<BodyweightGoalCard goal={W.cut} />)
      expect(capturedClassNames.get('bodyweight-goal-value-caption')).toContain('leading-normal')
    })

    it('says N/A with the reason in the tip when no rate can be computed (F11)', () => {
      render(<BodyweightGoalCard goal={W.oneReading} isTipOpen />)
      expect(screen.getByTestId('bodyweight-goal-value-caption')).toHaveTextContent('Rate: N/A')
      expect(screen.getByText('Rate shows after a second week of weigh-ins')).toBeInTheDocument()
    })

    it('holds the band and the phase band in a pinned-open tip', () => {
      render(<BodyweightGoalCard goal={W.cut} isTipOpen />)
      expect(screen.getByText('Week 3 of 8: 194.0 to 197.0 lb')).toBeInTheDocument()
      expect(screen.getByText('Cut band -0.5 to -1.0%/wk')).toBeInTheDocument()
    })
  })

  // Gate S3: the page's lift cards explain their status; these did not.
  it('tips the status pill with the basis', () => {
    render(<BodyweightGoalCard goal={W.rateVetoed} />)
    fireEvent.focus(screen.getByRole('button', { name: 'Goal status: Tolerated' }))
    expect(
      screen.getByText('Tolerated: inside the settling window after a phase change.')
    ).toBeInTheDocument()
  })

  it('names the detail button once, with no second named image inside it', () => {
    render(<BodyweightGoalCard goal={W.cut} />)
    const button = screen.getByRole('button', { name: 'Bodyweight details' })
    expect(button.querySelector('[role="img"]')).toBeNull()
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
