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

  it('keeps a real gradient in the banding panel for the control to work', () => {
    // Run 1 was VOID because nothing on the panel could band once the tonal fill
    // turned out to be invisible. The control is the fix, and this is the
    // property that makes it one: exactly one field carries a gradient, and it
    // is not any of the shipped-material fields.
    const { container } = render(<Banding />)
    const gradients = container.querySelectorAll('[style*="linear-gradient"]')
    expect(gradients).toHaveLength(1)
  })

  it('seeds a positive control among the banding fields', () => {
    render(<Banding />)
    expect(screen.queryByText(/CONTROL \(decoy\)/)).toBeNull()

    fireEvent.click(screen.getByText('Reveal key'))
    expect(screen.getAllByText(/CONTROL \(decoy\)/)).toHaveLength(1)
  })

  it('seeds an identical pair among the tone-step pairs', () => {
    render(<ToneSteps />)
    expect(screen.queryByText(/SAME \(decoy\)/)).toBeNull()

    fireEvent.click(screen.getByText('Reveal key'))
    expect(screen.getAllByText(/SAME \(decoy\)/)).toHaveLength(1)
  })
})
