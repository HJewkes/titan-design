import { render, screen } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { describe, expect, it } from 'vitest'

import { MesoHeader } from './MesoHeader'
import {
  MESO_HEADER_FIXTURES,
  mesoHeaderPropsFrom,
  type MesoHeaderFixtureKey,
} from './mesoHeader-fixture'

expect.extend(toHaveNoViolations)

function renderCase(key: MesoHeaderFixtureKey, layout: 'wall' | 'phone' = 'wall') {
  return render(<MesoHeader {...mesoHeaderPropsFrom(MESO_HEADER_FIXTURES[key])} layout={layout} />)
}

describe('MesoHeader specimen (shape A)', () => {
  it('shows the block, its dates, the week and the priorities on the wall', () => {
    renderCase('m3Current')
    expect(screen.getByText('Block 2 of 3 · Foundation')).toBeTruthy()
    expect(screen.getByText('Mon 21 Sep - Sun 4 Oct')).toBeTruthy()
    expect(screen.getByTestId('meso-header-position').textContent).toBe('Week 2 of 2 · Confirm')
    expect(screen.getByTestId('goal-priority-index')).toBeTruthy()
  })

  it('puts the priorities behind a counted trigger on the phone', () => {
    renderCase('m3Current', 'phone')
    expect(screen.getByTestId('meso-header-position').textContent).toBe('Wk 2 of 2')
    expect(screen.getByText('Priorities · 3')).toBeTruthy()
    expect(screen.queryByTestId('goal-priority-index')).toBeNull()
  })

  it('opens the priorities when the popover is pinned open', () => {
    render(
      <MesoHeader
        {...mesoHeaderPropsFrom(MESO_HEADER_FIXTURES.m13NinePriorities)}
        layout="phone"
        isPrioritiesOpen
      />
    )
    expect(screen.getByTestId('goal-priority-index')).toBeTruthy()
  })

  it('counts down to an upcoming block against the pinned day', () => {
    renderCase('m2Upcoming')
    expect(screen.getByTestId('meso-header-position').textContent).toBe(
      'Starts Mon 21 Sep · in 2 days'
    )
    expect(screen.getByText('Upcoming')).toBeTruthy()
  })

  it('names the next block once a block has ended', () => {
    renderCase('m10EndedNextDated')
    expect(screen.getByTestId('meso-header-position').textContent).toBe(
      'Ended Sun 4 Oct · Next: Intensification, Mon 12 Oct'
    )
  })

  it('says when no next block is planned', () => {
    renderCase('m9EndedNoNext')
    expect(screen.getByText('Ended Sun 4 Oct · next block not planned')).toBeTruthy()
  })

  it('marks a deload week with a pill', () => {
    renderCase('m8Deload')
    expect(screen.getByText('Deload')).toBeTruthy()
  })

  it('names held and extended weeks in the week bar label', () => {
    renderCase('m16SkippedWeeks')
    const label = screen.getByTestId('meso-header-weeks').getAttribute('aria-label')
    expect(label).toContain('Week 3, held')
    expect(label).toContain('Week 4, extended, time off')
    expect(label).toContain('Week 5 (current)')
  })

  it('says no priorities are declared on the wall and hides the phone trigger', () => {
    renderCase('m15NoPriorities')
    expect(screen.getByTestId('meso-header-no-priorities')).toBeTruthy()
    renderCase('m15NoPriorities', 'phone')
    expect(screen.queryByTestId('meso-header-priorities-trigger')).toBeNull()
  })

  it('has no accessibility violations in either form', async () => {
    const wall = renderCase('m3Current')
    expect(await axe(wall.container)).toHaveNoViolations()
    const phone = renderCase('m3Current', 'phone')
    expect(await axe(phone.container)).toHaveNoViolations()
  })
})
