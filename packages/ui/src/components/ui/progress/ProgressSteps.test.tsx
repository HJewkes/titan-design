import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { ProgressSteps } from './ProgressSteps'

const reducedMotion = vi.hoisted(() => ({ value: false }))
vi.mock('../../../hooks/usePrefersReducedMotion', () => ({
  usePrefersReducedMotion: () => reducedMotion.value,
}))

const LABELS = ['Plan', 'Build', 'Ship', 'Learn']

function renderRail(progress: number) {
  return render(
    <ProgressSteps
      variant="rail"
      currentStep={0}
      progress={progress}
      totalSteps={4}
      labels={LABELS}
    />
  )
}

function chipStates() {
  return screen.getAllByRole('img').map((chip) => chip.getAttribute('aria-label'))
}

function connectorFills(container: HTMLElement) {
  const rail = container.querySelector('[role="progressbar"]')
  return Array.from(rail?.children ?? [])
    .filter((child) => child.getAttribute('role') !== 'img')
    .map((connector) => (connector.firstElementChild as HTMLElement).style.width)
}

describe('ProgressSteps rail', () => {
  beforeEach(() => {
    reducedMotion.value = false
  })

  it('marks passed steps done, the approached step active and the rest pending', () => {
    renderRail(1.5)

    expect(chipStates()).toEqual([
      'Step 1, Plan: done',
      'Step 2, Build: done',
      'Step 3, Ship: active',
      'Step 4, Learn: pending',
    ])
  })

  it('targets the next step as soon as the position leaves a step', () => {
    renderRail(1.25)

    expect(chipStates()[1]).toBe('Step 2, Build: done')
    expect(chipStates()[2]).toBe('Step 3, Ship: active')
  })

  it('fills the connector into the active step by the fractional position', () => {
    const { container } = renderRail(1.5)

    expect(connectorFills(container)).toEqual(['100%', '50%', '0%'])
  })

  it('reports the active step as the progressbar value', () => {
    renderRail(1.5)

    const bar = screen.getByRole('progressbar', { name: 'Step 3 of 4' })
    expect(bar).toHaveAttribute('aria-valuenow', '3')
    expect(bar).toHaveAttribute('aria-valuemax', '4')
  })

  it('renders the same tree for the same position', () => {
    const first = renderRail(1.5).container.innerHTML
    const second = renderRail(1.5).container.innerHTML

    expect(second).toBe(first)
  })

  it('takes currentStep as the position when progress is absent', () => {
    const { container } = render(<ProgressSteps variant="rail" currentStep={2} totalSteps={4} />)

    expect(chipStates()).toEqual(['Step 1: done', 'Step 2: done', 'Step 3: active', 'Step 4: pending'])
    expect(connectorFills(container)).toEqual(['100%', '100%', '0%'])
  })

  it('clamps a position past the last step to the end', () => {
    const { container } = renderRail(9)

    expect(chipStates().at(-1)).toBe('Step 4, Learn: active')
    expect(connectorFills(container)).toEqual(['100%', '100%', '100%'])
  })

  it('shows the integer-step state under reduced motion', () => {
    reducedMotion.value = true
    const { container } = renderRail(1.5)

    expect(chipStates()[2]).toBe('Step 3, Ship: active')
    expect(connectorFills(container)).toEqual(['100%', '100%', '0%'])
  })

  it('has no accessibility violations', async () => {
    const { container } = renderRail(1.5)

    expect(await axe(container)).toHaveNoViolations()
  })
})
