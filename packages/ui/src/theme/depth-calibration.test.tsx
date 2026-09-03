import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { composeStories } from '@storybook/react'
import * as stories from './DepthCalibration.stories'

/**
 * The calibration rig is the gate on a release tag, and its whole value rests on
 * one property: the answer key is NOT on screen until the operator asks for it.
 * A leaked key does not make the panels look broken — it makes them look fine,
 * and silently converts a measurement into a confirmation.
 *
 * The theme stories are outside `stories-smoke.test.tsx`'s
 * `../components/**` glob, so this file also carries the render smoke for them.
 */
const { Hairlines, ToneSteps, PaperMaterial, Banding } = composeStories(stories)
const ALL = { Hairlines, ToneSteps, PaperMaterial, Banding }

describe('depth calibration rig', () => {
  for (const [name, Story] of Object.entries(ALL)) {
    it(`${name} renders`, () => {
      const result = render(<Story />)
      expect(result.container.firstChild).toBeTruthy()
      result.unmount()
    })
  }

  it('hides every answer until Reveal is pressed, then shows them', () => {
    render(<Hairlines />)

    // grey-975 is the ground of row 1; naming a ground names an answer.
    expect(screen.queryByText(/grey-975/)).toBeNull()
    expect(screen.queryByText(/decoy/)).toBeNull()

    fireEvent.click(screen.getByText('Reveal key'))

    expect(screen.getAllByText(/grey-975/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/decoy/).length).toBe(4)
  })

  it('seeds exactly four blank cells across four distinct grounds', () => {
    render(<Hairlines />)
    fireEvent.click(screen.getByText('Reveal key'))

    // One decoy per row, so no row can be answered by "the blank one is here again".
    const decoys = screen.getAllByText(/NONE \(decoy\)/)
    expect(decoys).toHaveLength(4)

    const rows = decoys.map((n) => n.textContent?.match(/^[A-D](\d)/)?.[1])
    expect(new Set(rows).size).toBe(4)
  })

  it('seeds an identical pair among the paper sheets', () => {
    render(<PaperMaterial />)
    expect(screen.queryByText(/FLAT \(decoy\)/)).toBeNull()

    // Two byte-identical flats, so "all three look the same" stays an available
    // answer rather than an admission — the material has to be picked OUT.
    fireEvent.click(screen.getByText('Reveal key'))
    expect(screen.getAllByText(/FLAT \(decoy\)/)).toHaveLength(2)
  })

  it('pairs the smooth banding control with a hand-quantised reference', () => {
    // Run 1 was VOID because nothing could band. Run 2 then found the smooth
    // control ALSO reading clean, which is ambiguous: a blind panel and a render
    // path that simply does not band both look like "no steps". The hard-edged
    // reference disambiguates them, so the panel needs BOTH gradients — and
    // neither may be one of the shipped-material fields.
    const { container } = render(<Banding />)
    expect(container.querySelectorAll('[style*="linear-gradient"]')).toHaveLength(2)
  })

  it('labels the control and the reference distinctly, and only on reveal', () => {
    render(<Banding />)
    expect(screen.queryByText(/CONTROL/)).toBeNull()
    expect(screen.queryByText(/REFERENCE/)).toBeNull()

    fireEvent.click(screen.getByText('Reveal key'))
    expect(screen.getAllByText(/CONTROL/)).toHaveLength(1)
    expect(screen.getAllByText(/REFERENCE/)).toHaveLength(1)
  })

  it('seeds a no-floor-line decoy among the inset wells', () => {
    render(<PaperMaterial />)
    expect(screen.queryByText(/NONE \(decoy\)/)).toBeNull()

    fireEvent.click(screen.getByText('Reveal key'))
    expect(screen.getAllByText(/NONE \(decoy\)/)).toHaveLength(1)
  })

  it('seeds an identical pair among the tone-step pairs', () => {
    render(<ToneSteps />)
    expect(screen.queryByText(/SAME \(decoy\)/)).toBeNull()

    fireEvent.click(screen.getByText('Reveal key'))
    expect(screen.getAllByText(/SAME \(decoy\)/)).toHaveLength(1)
  })
})
