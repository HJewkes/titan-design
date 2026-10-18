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

  // Mutation caught: the card reading riseIn at the video tier (40 px), or riseIn's out curve
  // replacing its own, moves these frames from the ones it rendered before TD-909.
  it.each([
    [0, { opacity: 0, translateY: 8 }],
    [0.05, { opacity: 0.578125, translateY: 3.375 }],
    [0.1, { opacity: 0.875, translateY: 1 }],
    [0.9, { opacity: 0.8304498269896192, translateY: -1.3564013840830467 }],
    [0.95, { opacity: 0.5017301038062286, translateY: -3.986159169550171 }],
  ])('keeps its pre-preset frame at progress %f', (progress, frame) => {
    expect(chapterCardFrame(progress)).toStrictEqual(frame)
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
