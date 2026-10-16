import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { ChapterCard } from './ChapterCard'
import { CHAPTER_CARD_ENTER, CHAPTER_CARD_EXIT, chapterCardFrame } from './chapter-card-motion'

function mockReducedMotion(matches: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockReturnValue({ matches, addEventListener: vi.fn(), removeEventListener: vi.fn() })
  )
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('chapterCardFrame', () => {
  it('starts and ends invisible', () => {
    expect(chapterCardFrame(0).opacity).toBe(0)
    expect(chapterCardFrame(1).opacity).toBe(0)
  })

  it('holds fully visible and in place between entrance and exit', () => {
    expect(chapterCardFrame(0.5)).toEqual({ opacity: 1, translateY: 0 })
  })

  it('exits in 0.85 of the entrance time', () => {
    expect(CHAPTER_CARD_EXIT / CHAPTER_CARD_ENTER).toBeCloseTo(0.85)
  })

  it('rises in from below and lifts out above', () => {
    expect(chapterCardFrame(0.05).translateY).toBeGreaterThan(0)
    expect(chapterCardFrame(0.95).translateY).toBeLessThan(0)
  })
})

describe('ChapterCard', () => {
  it('shows the zero-padded number, kicker and title', () => {
    render(<ChapterCard index={3} kicker="Chapter" title="Wiring the playhead" />)
    expect(screen.getByText('03')).toBeInTheDocument()
    expect(screen.getByText('Chapter')).toBeInTheDocument()
    expect(screen.getByText('Wiring the playhead')).toBeInTheDocument()
  })

  it('is fully visible halfway through', () => {
    render(<ChapterCard index={1} title="Intro" progress={0.5} />)
    expect(screen.getByTestId('chapter-card')).toHaveStyle({ opacity: '1' })
  })

  it('hides from assistive tech before it enters', () => {
    render(<ChapterCard index={1} title="Intro" progress={0} />)
    expect(screen.getByTestId('chapter-card')).toHaveAttribute('aria-hidden', 'true')
  })

  it('holds still and visible with reduced motion', () => {
    mockReducedMotion(true)
    render(<ChapterCard index={1} title="Intro" progress={0.98} />)
    expect(screen.getByTestId('chapter-card')).toHaveStyle({ opacity: '1' })
  })

  it('has no accessibility violations', async () => {
    const { container } = render(
      <ChapterCard index={2} kicker="Chapter" title="Building the scale" progress={0.5} />
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})
