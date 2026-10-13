import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { ProgressSteps } from './ProgressSteps'
import { progressColor } from './progressColor'
import { chipTint } from './railTimeline'
import { interpolateColor, interpolateColorOklch } from '../motion/color'

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

function halfFill(segment: number, half: 'start' | 'end') {
  return parseFloat(screen.getByTestId(`progress-steps-segment-${segment}-${half}`).style.width)
}

/** Each connector is drawn as two halves, one in each step's column; report the whole. */
function connectorFills() {
  return [0, 1, 2].map((segment) => (halfFill(segment, 'start') + halfFill(segment, 'end')) / 2)
}

function cssColor(hex: string) {
  const probe = document.createElement('div')
  probe.style.backgroundColor = hex
  return probe.style.backgroundColor
}

function chipLook(index: number) {
  const core = screen.queryByTestId(`progress-steps-core-${index}`)
  return {
    core: core ? core.style.width : null,
    colour: core?.style.backgroundColor || null,
    done: screen.queryByTestId(`progress-steps-done-${index}`) != null,
  }
}

const [BRAND, DONE] = [progressColor('primary', 'dark'), progressColor('success', 'dark')]

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
    renderRail(1.5)

    expect(connectorFills()).toEqual([100, 50, 0])
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
    render(<ProgressSteps variant="rail" currentStep={2} totalSteps={4} />)

    expect(chipStates()).toEqual([
      'Step 1: done',
      'Step 2: done',
      'Step 3: active',
      'Step 4: pending',
    ])
    expect(connectorFills()).toEqual([100, 100, 0])
  })

  it('clamps a position past the last step to the end, where every step is done', () => {
    renderRail(9)

    expect(chipStates()).toEqual([
      'Step 1, Plan: done',
      'Step 2, Build: done',
      'Step 3, Ship: done',
      'Step 4, Learn: done',
    ])
    expect(chipLook(3)).toEqual({ core: null, colour: null, done: true })
    expect(connectorFills()).toEqual([100, 100, 100])
  })

  it('turns a chip from the brand colour to the done colour in OKLCH as it fills', () => {
    const at = (position: number) => {
      const { unmount } = renderRail(position)
      const look = chipLook(1)
      unmount()
      return look
    }

    expect(at(1)).toEqual({ core: '50%', colour: null, done: false })
    expect(at(1.25)).toEqual({
      core: '87.5%',
      colour: cssColor(chipTint(0.5, [BRAND, DONE])),
      done: false,
    })
    expect(chipTint(0.5, [BRAND, DONE])).not.toBe(interpolateColor(0.5, [0, 1], [BRAND, DONE]))
    expect(at(1.5)).toEqual({ core: null, colour: null, done: true })
  })

  it('holds lightness through the turn so the light theme passes gold, not olive', () => {
    const light = [progressColor('primary', 'light'), progressColor('success', 'light')] as const
    const brightness = (hex: string) =>
      [1, 3, 5].reduce((sum, i) => sum + parseInt(hex.slice(i, i + 2), 16), 0)

    expect(brightness(chipTint(0.5, light))).toBeGreaterThan(
      brightness(interpolateColorOklch(0.5, [0, 1], light))
    )
  })

  it('runs the last chip through the same turn before the end', () => {
    renderRail(2.75)

    expect(chipStates()[3]).toBe('Step 4, Learn: active')
    expect(chipLook(3)).toEqual({
      core: '87.5%',
      colour: cssColor(chipTint(0.5, [BRAND, DONE])),
      done: false,
    })
  })

  it('centres each label under its own chip', () => {
    renderRail(1.5)

    LABELS.forEach((label) => {
      const column = screen.getByText(label).parentElement
      expect(column).toContainElement(screen.getByRole('img', { name: new RegExp(label) }))
      expect(column?.querySelectorAll('[role="img"]')).toHaveLength(1)
    })
  })

  it('shows the integer-step state under reduced motion', () => {
    reducedMotion.value = true
    renderRail(1.5)

    expect(chipStates()[2]).toBe('Step 3, Ship: active')
    expect(chipLook(1)).toEqual({ core: null, colour: null, done: true })
    expect(chipLook(2)).toEqual({ core: '50%', colour: null, done: false })
    expect(connectorFills()).toEqual([100, 100, 0])
  })

  it('has no accessibility violations', async () => {
    const { container } = renderRail(1.5)

    expect(await axe(container)).toHaveNoViolations()
  })
})
