import { describe, it, expect } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { InitiativeBrief, splitBriefSections } from './InitiativeBrief'
import { INITIATIVE_BRIEF_FIXTURE } from './initiative-fixture'

describe('splitBriefSections', () => {
  it('drops the leading # title and splits on ## headings', () => {
    const sections = splitBriefSections('# Title\n\n## One\na\n\n## Two\nb')
    expect(sections).toEqual([
      { heading: 'One', body: 'a' },
      { heading: 'Two', body: 'b' },
    ])
  })

  it('keeps prose before the first ## as a lead section with no heading', () => {
    const sections = splitBriefSections('# Title\nintro line\n\n## One\na')
    expect(sections[0]).toEqual({ heading: '', body: 'intro line' })
    expect(sections[1]!.heading).toBe('One')
  })
})

describe('InitiativeBrief', () => {
  it('opens only the first section, showing its body and the others as headings', () => {
    render(<InitiativeBrief brief={INITIATIVE_BRIEF_FIXTURE} />)
    expect(screen.getByText('Why this exists')).toBeInTheDocument()
    expect(screen.getByText(/Engineering work spans days/)).toBeInTheDocument()
    expect(screen.getByText('Stakeholders')).toBeInTheDocument()
    expect(screen.queryByText(/@hjewkes/)).not.toBeInTheDocument()
  })

  it('opens a section on its heading and closes the previously open one', () => {
    render(<InitiativeBrief brief={INITIATIVE_BRIEF_FIXTURE} />)
    fireEvent.click(screen.getByText('Stakeholders'))
    expect(screen.getByText(/@hjewkes/)).toBeInTheDocument()
    expect(screen.queryByText(/Engineering work spans days/)).not.toBeInTheDocument()
  })

  it('steps through the sections with the prev/next controls', () => {
    render(<InitiativeBrief brief={INITIATIVE_BRIEF_FIXTURE} />)
    expect(screen.getByText(/1 \//)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Next section' }))
    // The second section is now open; the first's body is gone.
    expect(screen.queryByText(/Engineering work spans days/)).not.toBeInTheDocument()
    expect(screen.getByText(/2 \//)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Previous section' }))
    expect(screen.getByText(/Engineering work spans days/)).toBeInTheDocument()
  })

  it('disables prev on the first section', () => {
    render(<InitiativeBrief brief={INITIATIVE_BRIEF_FIXTURE} />)
    expect(screen.getByRole('button', { name: 'Previous section' })).toHaveAttribute(
      'aria-disabled',
      'true'
    )
  })

  it('has no a11y violations', async () => {
    const { container } = render(<InitiativeBrief brief={INITIATIVE_BRIEF_FIXTURE} />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
