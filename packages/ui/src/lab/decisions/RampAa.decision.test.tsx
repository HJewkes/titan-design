import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { contrast } from '../../theme/color-checks'
import { getSemanticColors } from '../../theme/tokens/semantic'
import {
  MONOTONIC,
  OPTIONS,
  PLANE_KEYS,
  ROLES,
  optionColours,
  readRole,
  solveRecolours,
  stepName,
  type OptionKey,
} from './ramp-aa'
import { DarkReferenceUnit, OptionUnit } from './RampAaView'

expect.extend(toHaveNoViolations)

const option = (key: OptionKey) => OPTIONS.find((o) => o.key === key)!
const misses = (key: OptionKey) => {
  const o = option(key)
  const colours = optionColours(o)
  return ROLES.flatMap((r) =>
    readRole(r, colours[r.id], o.planes, colours)
      .filter((x) => !x.passes)
      .map((x) => `${r.id}@${x.plane}`)
  )
}

describe('Elevation ramp AA decision', () => {
  it('measures option 1 on the planes #800 ships', () => {
    const light = getSemanticColors('light')
    expect(MONOTONIC.base).toBe(light['surface-base'])
    expect(MONOTONIC.background).toBe(light['background-base'])
    expect(MONOTONIC.elevated).toBe(light['surface-elevated'])
  })

  it('reports the regressions #800 lists for option 1', () => {
    const found = misses('asPicked')
    for (const miss of [
      'text-tertiary@base',
      'text-secondary@background',
      'text-link@background',
      'border-input@base',
      'hairline-default@background',
    ]) {
      expect(found).toContain(miss)
    }
  })

  it.each(['recoloured', 'q5cInsets', 'hybrid'] as const)(
    'leaves only the pinned brand accent missing in %s',
    (key) => {
      expect(misses(key).every((m) => m.startsWith('voltras: brand-primary@'))).toBe(true)
    }
  )

  it('keeps the text tiers distinct in every re-colour set', () => {
    for (const o of OPTIONS.filter((x) => x.recolours)) {
      const c = optionColours(o)
      expect(c['text-secondary']).not.toBe(c['text-tertiary'])
      expect(contrast(c['text-secondary'], c['text-tertiary'])).toBeGreaterThan(1)
    }
  })

  it('needs fewer re-colours the lighter the content planes are', () => {
    const count = (key: OptionKey) => Object.keys(solveRecolours(option(key).planes)).length
    expect(count('recoloured')).toBeGreaterThan(count('q5cInsets'))
    expect(count('q5cInsets')).toBeGreaterThan(count('hybrid'))
  })

  it('labels colours by ramp step', () => {
    expect(stepName(MONOTONIC.base)).toBe('grey 200')
    expect(stepName('rgba(0, 0, 0, 0.15)')).toBe('black 15%')
    expect(stepName('rgba(255, 255, 255, 0.1)')).toBe('white 10%')
  })

  it.each(OPTIONS.map((o) => [o.key, o] as const))(
    'renders every light plane of %s in its own colour, whatever the theme',
    (key, o) => {
      document.documentElement.classList.add('light')
      render(<OptionUnit option={o} />)
      document.documentElement.classList.remove('light')
      const unit = screen.getByTestId(`aa-${key}`)
      expect(within(unit).getByRole('heading', { name: o.title })).toBeInTheDocument()
      for (const plane of PLANE_KEYS) {
        expect(within(unit).getByTestId(`plane-${plane}`)).toHaveStyle({
          backgroundColor: o.planes[plane],
        })
      }
    }
  )

  it('draws a failing text role as a swatch, never as live text in that colour', () => {
    render(<OptionUnit option={option('asPicked')} />)
    const tertiary = getSemanticColors('light')['text-tertiary']
    const page = screen.getByTestId('plane-base')
    const row = within(page).getByText(/^text-tertiary · grey 600/).parentElement!
    expect(row).toHaveAttribute('data-testid', 'aa-miss')
    expect(within(page).getByText(/^text-tertiary/)).not.toHaveStyle({ color: tertiary })
  })

  it('shows the dark reference once', () => {
    render(<DarkReferenceUnit />)
    expect(screen.getAllByRole('heading')).toHaveLength(1)
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<OptionUnit option={option('recoloured')} />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
