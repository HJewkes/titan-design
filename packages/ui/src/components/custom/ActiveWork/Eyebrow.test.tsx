import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { Eyebrow } from './Eyebrow'

describe('Eyebrow', () => {
  it('renders its children', () => {
    render(<Eyebrow>Focused · by rank</Eyebrow>)
    expect(screen.getByText('Focused · by rank')).toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<Eyebrow>Backburner</Eyebrow>)
    expect(await axe(container)).toHaveNoViolations()
  })
})
