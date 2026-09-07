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
  it('renders each section heading and opens the first', () => {
    render(<InitiativeBrief brief={INITIATIVE_BRIEF_FIXTURE} />)
    // The first section's heading is "Why this exists"; its body is visible.
    expect(screen.getByText('Why this exists')).toBeInTheDocument()
    expect(screen.getByText(/Engineering work spans days/)).toBeInTheDocument()
    // A later section is collapsed: its heading shows, its body does not.
    expect(screen.getByText('Stakeholders')).toBeInTheDocument()
    expect(screen.queryByText(/@hjewkes/)).not.toBeInTheDocument()
  })

  it('expands a collapsed section when its heading is pressed', () => {
    render(<InitiativeBrief brief={INITIATIVE_BRIEF_FIXTURE} />)
    fireEvent.click(screen.getByText('Stakeholders'))
    expect(screen.getByText(/@hjewkes/)).toBeInTheDocument()
  })

  it('has no a11y violations', async () => {
    const { container } = render(<InitiativeBrief brief={INITIATIVE_BRIEF_FIXTURE} />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
