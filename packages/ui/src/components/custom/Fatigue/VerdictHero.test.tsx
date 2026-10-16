import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { CircleDashedIcon, OctagonXIcon } from '../../icons'
import { contrast } from '../../../theme/color-checks'
import { getSemanticColors, type ThemeMode } from '../../../theme/tokens/semantic'
import { VerdictHero } from './VerdictHero'
import { TONE_TOKEN } from './fatigue-tokens'
import type { DimensionTone, FatigueVerdict } from './fatigue-model'
import {
  resolveAll,
  siblingSource,
  spacingClassesAt,
  spacingClassesOf,
} from '../../../test/spacing-resolver'

const goodVerdict: FatigueVerdict = {
  state: 'good',
  tone: 'ok',
  dimensions: { velocityLoss: 'ok', rom: 'ok', tempo: 'ok' },
}
const breakdown: FatigueVerdict = {
  state: 'form-breakdown',
  tone: 'alarm',
  dimensions: { velocityLoss: 'alarm', rom: 'alarm', tempo: 'alarm' },
}

describe('VerdictHero', () => {
  it('rounds the RPE to the conventional 0.5 step', () => {
    render(<VerdictHero rpe={7.4} verdict={goodVerdict} />)
    expect(screen.getByText('7.5')).toBeInTheDocument()
  })

  it('renders the verdict word for the state', () => {
    render(<VerdictHero rpe={10} verdict={breakdown} />)
    expect(screen.getByText('Form breaking down')).toBeInTheDocument()
  })

  it('shows an em-dash and "Warming up" when the verdict is null', () => {
    render(<VerdictHero rpe={null} verdict={null} />)
    expect(screen.getByText('—')).toBeInTheDocument()
    expect(screen.getByText('Warming up')).toBeInTheDocument()
  })

  it('does not render a reps-in-reserve line (RPE-led only)', () => {
    render(<VerdictHero rpe={8} verdict={goodVerdict} />)
    expect(screen.queryByText(/in reserve/i)).not.toBeInTheDocument()
  })

  it('labels the RPE number for assistive tech', () => {
    render(<VerdictHero rpe={9} verdict={goodVerdict} />)
    expect(screen.getByLabelText('RPE 9.0')).toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<VerdictHero rpe={8} verdict={goodVerdict} />)
    expect(await axe(container)).toHaveNoViolations()
  })
})

function iconMarkup(Icon: typeof CircleDashedIcon) {
  const { container, unmount } = render(<Icon />)
  const markup = container.querySelector('svg')!.innerHTML
  unmount()
  return markup
}

const notScored = { title: 'Not scored', reason: 'No bar-speed data for this set' }

describe('VerdictHero lead="word"', () => {
  it('renders no RPE row', () => {
    const { container } = render(<VerdictHero lead="word" verdict={breakdown} />)

    expect(container.textContent).not.toMatch(/RPE/)
    expect(screen.queryByText('FATIGUE')).not.toBeInTheDocument()
  })

  it('leads the verdict word with its tone glyph', () => {
    const glyph = iconMarkup(OctagonXIcon)
    const { container } = render(<VerdictHero lead="word" verdict={breakdown} scale="wall" />)

    expect(screen.getByText('Form breaking down')).toBeInTheDocument()
    expect(container.querySelector('svg')!.innerHTML).toBe(glyph)
  })

  it('keeps the word out of the heading outline', () => {
    render(<VerdictHero lead="word" verdict={goodVerdict} />)

    expect(screen.queryByRole('heading')).not.toBeInTheDocument()
  })

  it('renders a string kicker as the label above the word', () => {
    render(<VerdictHero lead="word" verdict={goodVerdict} kicker="HOW IT MOVED · WORST SET #2" />)

    expect(screen.getByText('HOW IT MOVED · WORST SET #2')).toBeInTheDocument()
  })

  it('shows the noVerdict title and neutral glyph, with the reason spoken but not shown', () => {
    const neutral = iconMarkup(CircleDashedIcon)
    const { container } = render(
      <VerdictHero lead="word" verdict={goodVerdict} noVerdict={notScored} />
    )

    expect(screen.getByText('Not scored')).toBeInTheDocument()
    expect(screen.queryByText('Good')).not.toBeInTheDocument()
    expect(container.querySelector('svg')!.innerHTML).toBe(neutral)
    expect(screen.getByRole('img', { name: notScored.reason })).toBeInTheDocument()
    expect(screen.queryByText(notScored.reason)).not.toBeInTheDocument()
  })

  it.each([
    ['verdict', { lead: 'word', verdict: breakdown, kicker: 'WORST SET #2' }],
    ['noVerdict', { lead: 'word', verdict: null, noVerdict: notScored }],
  ] as const)('has no accessibility violations with a %s', async (_case, props) => {
    const { container } = render(<VerdictHero {...props} />)
    expect(await axe(container)).toHaveNoViolations()
  })
})

describe('VerdictHero default lead', () => {
  it('renders exactly what lead="rpe" renders when lead is omitted', () => {
    const { container: implicit } = render(<VerdictHero rpe={9} verdict={breakdown} />)
    const { container: explicit } = render(<VerdictHero lead="rpe" rpe={9} verdict={breakdown} />)

    expect(implicit.innerHTML).toBe(explicit.innerHTML)
    expect(implicit.textContent).toBe('FATIGUE9.0RPEForm breaking down')
  })
})

describe('VerdictHero tone colour', () => {
  const surfaces = ['surface-base', 'surface-raised'] as const

  it.each(
    (['dark', 'light'] as ThemeMode[]).flatMap((mode) =>
      (Object.keys(TONE_TOKEN) as DimensionTone[]).flatMap((tone) =>
        surfaces.map((surface) => [mode, tone, surface] as const)
      )
    )
  )('%s %s word clears 3:1 large-text contrast on %s', (mode, tone, surface) => {
    const t = getSemanticColors(mode)

    expect(contrast(t[TONE_TOKEN[tone]], t[surface])).toBeGreaterThanOrEqual(3)
  })
})

/**
 * The hero's spacing, pinned (AW-142 wave three).
 *
 * Two gaps are numeric rungs (6 and 2, neither on the stack ramp). Two values are genuinely
 * optical and stay, with their reason: the 7px between the numeral and its suffix, and the
 * 9px that lifts the suffix onto the numeral's baseline. The comment is asserted alongside
 * the value so a later pass cannot keep the nudge and drop the justification.
 */
describe('VerdictHero geometry resolves to the spacing tokens', () => {
  const source = siblingSource(import.meta.url, 'VerdictHero.tsx')

  it('spaces the eyebrow from the lockup by gap-1.5', () => {
    render(<VerdictHero rpe={8} verdict={goodVerdict} />)
    const lockupRow = screen.getByLabelText('RPE 8.0').parentElement
    expect(spacingClassesOf('verdict-hero')).toEqual(['gap-1.5'])
    expect(spacingClassesAt(lockupRow?.parentElement ?? null)).toEqual(['gap-0.5'])
    expect(resolveAll(['gap-1.5', 'gap-0.5'])).toEqual(['6px', '2px'])
  })

  it.each([
    [
      'gap: 7',
      () => screen.getByLabelText('RPE 8.0').parentElement,
      { gap: '7px' },
      /\/\/ optical: 7px between the numeral and its RPE suffix/,
    ],
    [
      'marginBottom: 9',
      () => screen.getByText('RPE'),
      { marginBottom: '9px' },
      /\/\/ optical: 9px lifts the suffix onto the numeral's baseline/,
    ],
  ])('keeps %s with its reason beside it', (_value, find, style, reason) => {
    render(<VerdictHero rpe={8} verdict={goodVerdict} />)
    expect(find()).toHaveStyle(style)
    expect(source).toMatch(reason)
  })
})
